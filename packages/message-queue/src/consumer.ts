import { Worker, type Job, type Processor, type WorkerOptions } from "bullmq";
import type { JobResult, QueueJobData, QueueName } from "./types";

// ============================================================================
// Worker Registry
// ============================================================================

const workers = new Map<string, Worker<QueueJobData, JobResult>>();

// ============================================================================
// Worker Factory
// ============================================================================

export interface CreateWorkerOptions {
  queueName: QueueName;
  redisUrl: string;
  processor: Processor<QueueJobData, JobResult>;
  concurrency?: number;
  workerOptions?: Partial<WorkerOptions>;
}

export function createWorker(options: CreateWorkerOptions): Worker<QueueJobData, JobResult> {
  const workerId = `${options.queueName}-${Date.now()}`;
  const url = new URL(options.redisUrl);

  const worker = new Worker<QueueJobData, JobResult>(
    options.queueName,
    options.processor,
    {
      connection: {
        host: url.hostname,
        port: Number.parseInt(url.port || "6379"),
      },
      concurrency: options.concurrency ?? 5,
      ...options.workerOptions,
    }
  );

  // Set up event handlers
  worker.on("completed", (job: Job<QueueJobData, JobResult>) => {
    console.log(
      `✅ Job ${job.id} completed for user ${job.data.metadata.userId}`
    );
  });

  worker.on("failed", (job: Job<QueueJobData, JobResult> | undefined, err: Error) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err: Error) => {
    console.error("Worker error:", err);
  });

  workers.set(workerId, worker);

  return worker;
}

// ============================================================================
// Job Handler Types
// ============================================================================

export type JobHandler<TPayload, TResult> = (
  job: Job<QueueJobData>,
  payload: TPayload
) => Promise<TResult>;

// ============================================================================
// Create Type-Safe Job Processor
// ============================================================================

export interface JobHandlers {
  "fetch-data": JobHandler<
    { userId: string; endpoint: string; params: Record<string, string> },
    JobResult
  >;
  "process-data": JobHandler<
    { userId: string; jobId: string; data: unknown },
    JobResult
  >;
  "send-notification": JobHandler<
    {
      userId: string;
      type: string;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    },
    JobResult
  >;
}

export function createJobProcessor(
  handlers: Partial<JobHandlers>
): Processor<QueueJobData, JobResult> {
  return async (job: Job<QueueJobData>): Promise<JobResult> => {
    const { type, payload } = job.data;
    const handler = handlers[type as keyof JobHandlers];

    if (!handler) {
      console.warn(`No handler registered for job type: ${type}`);
      return { success: false, error: `Unknown job type: ${type}` };
    }

    try {
      // Type assertion here is safe because we're matching type to handler
      return await (handler as JobHandler<typeof payload, JobResult>)(job, payload);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Error processing job ${job.id}:`, errorMessage);
      throw error;
    }
  };
}

// ============================================================================
// Progress Reporting
// ============================================================================

export async function updateJobProgress(
  job: Job<QueueJobData>,
  progress: number
): Promise<void> {
  await job.updateProgress(progress);
}

// ============================================================================
// Cleanup
// ============================================================================

export async function closeAllWorkers(): Promise<void> {
  const closePromises = Array.from(workers.values()).map((worker) =>
    worker.close()
  );
  await Promise.all(closePromises);
  workers.clear();
}

import { Queue, type JobsOptions } from "bullmq";
import {
  DEFAULT_JOB_OPTIONS,
  QUEUE_NAMES,
  type JobPayloadMap,
  type JobType,
  type QueueJobData,
  type QueueName,
} from "./types";

// ============================================================================
// Queue Registry
// ============================================================================

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName, redisUrl: string): Queue {
  let queue = queues.get(name);

  if (!queue) {
    queue = new Queue(name, {
      connection: {
        host: new URL(redisUrl).hostname,
        port: Number.parseInt(new URL(redisUrl).port || "6379"),
      },
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
    queues.set(name, queue);
  }

  return queue;
}

// ============================================================================
// Job Producer Functions
// ============================================================================

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export interface AddJobOptions<T extends JobType> {
  type: T;
  payload: JobPayloadMap[T];
  userId: string;
  dbJobId?: string;
  priority?: number;
  delay?: number;
  jobOptions?: JobsOptions;
}

export async function addJob<T extends JobType>(
  queueName: QueueName,
  redisUrl: string,
  options: AddJobOptions<T>
): Promise<{ jobId: string | undefined; correlationId: string }> {
  const queue = getQueue(queueName, redisUrl);

  const jobData: QueueJobData<T> = {
    type: options.type,
    payload: options.payload,
    metadata: {
      userId: options.userId,
      dbJobId: options.dbJobId,
      correlationId: generateCorrelationId(),
      timestamp: Date.now(),
    },
  };

  const job = await queue.add(options.type, jobData, {
    ...DEFAULT_JOB_OPTIONS,
    ...options.jobOptions,
    priority: options.priority,
    delay: options.delay,
  });

  return {
    jobId: job.id,
    correlationId: jobData.metadata.correlationId,
  };
}

// ============================================================================
// Convenience Functions for Specific Queues
// ============================================================================

export function createExternalApiJobProducer(redisUrl: string) {
  return {
    addFetchDataJob: (
      payload: JobPayloadMap["fetch-data"],
      userId: string,
      dbJobId?: string,
      options?: JobsOptions
    ) =>
      addJob(QUEUE_NAMES.EXTERNAL_API, redisUrl, {
        type: "fetch-data",
        payload,
        userId,
        dbJobId,
        jobOptions: options,
      }),

    addProcessDataJob: (
      payload: JobPayloadMap["process-data"],
      userId: string,
      dbJobId?: string,
      options?: JobsOptions
    ) =>
      addJob(QUEUE_NAMES.EXTERNAL_API, redisUrl, {
        type: "process-data",
        payload,
        userId,
        dbJobId,
        jobOptions: options,
      }),
  };
}

export function createNotificationJobProducer(redisUrl: string) {
  return {
    addSendNotificationJob: (
      payload: JobPayloadMap["send-notification"],
      userId: string,
      options?: JobsOptions
    ) =>
      addJob(QUEUE_NAMES.NOTIFICATIONS, redisUrl, {
        type: "send-notification",
        payload,
        userId,
        jobOptions: options,
      }),
  };
}

// ============================================================================
// Cleanup
// ============================================================================

export async function closeAllQueues(): Promise<void> {
  const closePromises = Array.from(queues.values()).map((queue) =>
    queue.close()
  );
  await Promise.all(closePromises);
  queues.clear();
}

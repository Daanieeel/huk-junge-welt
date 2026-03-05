import { env } from "@repo/env/server";
import { prisma, JobStatus, type Prisma } from "@repo/database";
import {
  createWorker,
  createJobProcessor,
  updateJobProgress,
  closeAllWorkers,
  QUEUE_NAMES,
  type Job,
  type QueueJobData,
  type JobResult,
} from "@repo/message-queue";
import { getPublisher, closePublisher } from "@repo/pub-sub";

// ============================================================================
// Initialize Services
// ============================================================================

const publisher = getPublisher(env.PUBSUB_REDIS_URL);

// ============================================================================
// Job Handlers
// ============================================================================

/**
 * Handler for fetch-data jobs
 * This is where you would implement your external API calls
 */
async function handleFetchData(
  job: Job<QueueJobData>,
  payload: { userId: string; endpoint: string; params: Record<string, string> }
): Promise<JobResult> {
  const { userId, endpoint, params } = payload;
  const dbJobId = job.data.metadata.dbJobId;

  console.log(`🔄 Processing fetch-data job ${job.id} for user ${userId}`);

  try {
    // Update DB job status to processing
    if (dbJobId) {
      await prisma.job.update({
        where: { id: dbJobId },
        data: {
          status: JobStatus.PROCESSING,
          startedAt: new Date(),
        },
      });
    }

    // Notify via pub/sub that job started
    await publisher.publishJobStarted(job.id ?? "unknown", userId);

    // Simulate progress updates
    for (let progress = 0; progress <= 100; progress += 20) {
      await updateJobProgress(job, progress);

      // Update DB progress
      if (dbJobId) {
        await prisma.job.update({
          where: { id: dbJobId },
          data: { progress },
        });
      }

      // Notify via pub/sub
      await publisher.publishJobProgress(job.id ?? "unknown", userId, progress);

      // Simulate work (remove in production)
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // =========================================================================
    // TODO: Implement your actual external API call here
    // Example:
    // const response = await fetch(`https://api.example.com${endpoint}`, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json' },
    // });
    // const data = await response.json();
    // =========================================================================

    const result = {
      message: "Data fetched successfully",
      endpoint,
      params,
      fetchedAt: new Date().toISOString(),
    };

    // Update DB job as completed
    if (dbJobId) {
      await prisma.job.update({
        where: { id: dbJobId },
        data: {
          status: JobStatus.COMPLETED,
          result,
          progress: 100,
          completedAt: new Date(),
        },
      });

      // Create notification for user
      const notification = await prisma.notification.create({
        data: {
          type: "JOB_COMPLETED",
          title: "Job Completed",
          message: "Your job has been completed successfully.",
          data: { jobId: dbJobId },
          userId,
        },
      });

      // Notify via pub/sub
      await publisher.publishNotification(userId, {
        notificationId: notification.id,
        notificationType: "JOB_COMPLETED",
        title: notification.title,
        message: notification.message,
        data: notification.data as Record<string, unknown> | undefined,
      });
    }

    // Notify job completed
    await publisher.publishJobCompleted(job.id ?? "unknown", userId, result);

    console.log(`✅ Job ${job.id} completed successfully`);

    return { success: true, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update DB job as failed
    if (dbJobId) {
      await prisma.job.update({
        where: { id: dbJobId },
        data: {
          status: JobStatus.FAILED,
          error: errorMessage,
          completedAt: new Date(),
        },
      });

      // Create failure notification
      const notification = await prisma.notification.create({
        data: {
          type: "JOB_FAILED",
          title: "Job Failed",
          message: `Your job failed: ${errorMessage}`,
          data: { jobId: dbJobId, error: errorMessage },
          userId,
        },
      });

      // Notify via pub/sub
      await publisher.publishNotification(userId, {
        notificationId: notification.id,
        notificationType: "JOB_FAILED",
        title: notification.title,
        message: notification.message,
        data: notification.data as Record<string, unknown> | undefined,
      });
    }

    // Notify job failed
    await publisher.publishJobFailed(job.id ?? "unknown", userId, errorMessage);

    console.error(`❌ Job ${job.id} failed:`, errorMessage);

    throw error;
  }
}

/**
 * Handler for process-data jobs
 * Implement your data processing logic here
 */
async function handleProcessData(
  _job: Job<QueueJobData>,
  payload: { userId: string; jobId: string; data: unknown }
): Promise<JobResult> {
  const { userId } = payload;

  console.log(`🔄 Processing process-data job for user ${userId}`);

  // TODO: Implement your data processing logic here

  return {
    success: true,
    data: {
      message: "Data processed successfully",
      processedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handler for send-notification jobs
 */
async function handleSendNotification(
  _job: Job<QueueJobData>,
  payload: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
): Promise<JobResult> {
  const { userId, type, title, message, data } = payload;

  console.log(`📬 Sending notification to user ${userId}`);

  // Create notification in database
  const notification = await prisma.notification.create({
    data: {
      type: type as "JOB_STARTED" | "JOB_PROGRESS" | "JOB_COMPLETED" | "JOB_FAILED" | "SYSTEM",
      title,
      message,
      data: data as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined,
      userId,
    },
  });

  // Publish to pub/sub for real-time delivery
  await publisher.publishNotification(userId, {
    notificationId: notification.id,
    notificationType: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data as Record<string, unknown> | undefined,
  });

  return { success: true, data: { notificationId: notification.id } };
}

// ============================================================================
// Create Job Processor
// ============================================================================

const processor = createJobProcessor({
  "fetch-data": handleFetchData,
  "process-data": handleProcessData,
  "send-notification": handleSendNotification,
});

// ============================================================================
// Start Workers
// ============================================================================

console.log("🚀 Starting workers...");

// External API worker
createWorker({
  queueName: QUEUE_NAMES.EXTERNAL_API,
  redisUrl: env.BULLMQ_REDIS_URL,
  processor,
  concurrency: 5,
});

// Notifications worker
createWorker({
  queueName: QUEUE_NAMES.NOTIFICATIONS,
  redisUrl: env.BULLMQ_REDIS_URL,
  processor,
  concurrency: 10,
});

console.log("✅ Workers started:");
console.log(`   - External API worker (queue: ${QUEUE_NAMES.EXTERNAL_API})`);
console.log(`   - Notifications worker (queue: ${QUEUE_NAMES.NOTIFICATIONS})`);

// ============================================================================
// Graceful Shutdown
// ============================================================================

async function shutdown(): Promise<void> {
  console.log("\n🛑 Shutting down workers...");

  try {
    await closeAllWorkers();
    await closePublisher();
    await prisma.$disconnect();
    console.log("✅ Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Keep the process running
console.log("👷 Worker is running and waiting for jobs...");

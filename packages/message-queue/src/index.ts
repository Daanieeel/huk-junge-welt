// Types
export {
  DEFAULT_JOB_OPTIONS,
  JOB_TYPES,
  PUBSUB_CHANNELS,
  QUEUE_NAMES,
  type FetchDataPayload,
  type JobEvent,
  type JobPayloadMap,
  type JobResult,
  type JobType,
  type ProcessDataPayload,
  type PubSubChannel,
  type QueueJobData,
  type QueueName,
  type SendNotificationPayload,
  type UserNotificationEvent,
} from "./types";

// Producer
export {
  addJob,
  closeAllQueues,
  createExternalApiJobProducer,
  createNotificationJobProducer,
  getQueue,
  type AddJobOptions,
} from "./producer";

// Consumer
export {
  closeAllWorkers,
  createJobProcessor,
  createWorker,
  updateJobProgress,
  type CreateWorkerOptions,
  type JobHandler,
  type JobHandlers,
} from "./consumer";

// Re-export useful BullMQ types
export type { Job, Queue, Worker } from "bullmq";

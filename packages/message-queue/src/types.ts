import type { JobsOptions } from "bullmq";

// ============================================================================
// Queue Names
// ============================================================================

export const QUEUE_NAMES = {
  EXTERNAL_API: "external-api",
  NOTIFICATIONS: "notifications",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ============================================================================
// Job Types
// ============================================================================

export const JOB_TYPES = {
  // External API Jobs
  FETCH_DATA: "fetch-data",
  PROCESS_DATA: "process-data",

  // Notification Jobs
  SEND_NOTIFICATION: "send-notification",
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

// ============================================================================
// Job Payloads
// ============================================================================

export interface FetchDataPayload {
  userId: string;
  endpoint: string;
  params: Record<string, string>;
}

export interface ProcessDataPayload {
  userId: string;
  jobId: string;
  data: unknown;
}

export interface SendNotificationPayload {
  userId: string;
  type: "JOB_STARTED" | "JOB_PROGRESS" | "JOB_COMPLETED" | "JOB_FAILED" | "SYSTEM";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// Job Data Union Type
// ============================================================================

export type JobPayloadMap = {
  [JOB_TYPES.FETCH_DATA]: FetchDataPayload;
  [JOB_TYPES.PROCESS_DATA]: ProcessDataPayload;
  [JOB_TYPES.SEND_NOTIFICATION]: SendNotificationPayload;
};

export interface QueueJobData<T extends JobType = JobType> {
  type: T;
  payload: JobPayloadMap[T];
  metadata: {
    userId: string;
    dbJobId?: string;
    correlationId: string;
    timestamp: number;
  };
}

// ============================================================================
// Job Result Types
// ============================================================================

export interface JobResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Default Job Options
// ============================================================================

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: {
    count: 1000,
    age: 24 * 60 * 60, // 24 hours
  },
  removeOnFail: {
    count: 5000,
    age: 7 * 24 * 60 * 60, // 7 days
  },
};

// ============================================================================
// Event Types for Pub/Sub
// ============================================================================

export const PUBSUB_CHANNELS = {
  JOB_EVENTS: "job:events",
  USER_NOTIFICATIONS: "user:notifications",
} as const;

export type PubSubChannel =
  (typeof PUBSUB_CHANNELS)[keyof typeof PUBSUB_CHANNELS];

export interface JobEvent {
  type: "started" | "progress" | "completed" | "failed";
  jobId: string;
  userId: string;
  data?: unknown;
  timestamp: number;
}

export interface UserNotificationEvent {
  userId: string;
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  };
  timestamp: number;
}

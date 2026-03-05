// ============================================================================
// Channel Definitions
// ============================================================================

/**
 * Static channel names for global events
 */
export const CHANNELS = {
  // Global job events
  JOB_EVENTS: "job:events",

  // System-wide notifications
  SYSTEM_NOTIFICATIONS: "system:notifications",
} as const;

export type StaticChannel = (typeof CHANNELS)[keyof typeof CHANNELS];

/**
 * Dynamic channel patterns (for user-specific subscriptions)
 */
export const CHANNEL_PATTERNS = {
  // User-specific channels: user:{userId}:*
  USER_ALL: (userId: string) => `user:${userId}:*` as const,
  USER_NOTIFICATIONS: (userId: string) => `user:${userId}:notifications` as const,
  USER_JOB_UPDATES: (userId: string) => `user:${userId}:jobs` as const,
} as const;

export type DynamicChannel = ReturnType<
  (typeof CHANNEL_PATTERNS)[keyof typeof CHANNEL_PATTERNS]
>;

// ============================================================================
// Message Types
// ============================================================================

export interface BaseMessage {
  id: string;
  timestamp: number;
}

export interface JobEventMessage extends BaseMessage {
  type: "job:started" | "job:progress" | "job:completed" | "job:failed";
  jobId: string;
  userId: string;
  progress?: number;
  result?: unknown;
  error?: string;
}

export interface NotificationMessage extends BaseMessage {
  type: "notification";
  userId: string;
  notificationId: string;
  notificationType:
    | "JOB_STARTED"
    | "JOB_PROGRESS"
    | "JOB_COMPLETED"
    | "JOB_FAILED"
    | "SYSTEM";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface SystemMessage extends BaseMessage {
  type: "system";
  action: "maintenance" | "update" | "broadcast";
  message: string;
  data?: Record<string, unknown>;
}

export type PubSubMessage = JobEventMessage | NotificationMessage | SystemMessage;

// ============================================================================
// Message Type Guards
// ============================================================================

export function isJobEventMessage(msg: PubSubMessage): msg is JobEventMessage {
  return msg.type.startsWith("job:");
}

export function isNotificationMessage(
  msg: PubSubMessage
): msg is NotificationMessage {
  return msg.type === "notification";
}

export function isSystemMessage(msg: PubSubMessage): msg is SystemMessage {
  return msg.type === "system";
}

// ============================================================================
// Serialization Helpers
// ============================================================================

export function serializeMessage<T extends PubSubMessage>(message: T): string {
  return JSON.stringify(message);
}

export function deserializeMessage(data: string): PubSubMessage {
  return JSON.parse(data) as PubSubMessage;
}

// ============================================================================
// Message ID Generator
// ============================================================================

export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

import { Redis } from "ioredis";
import {
  CHANNEL_PATTERNS,
  CHANNELS,
  generateMessageId,
  serializeMessage,
  type JobEventMessage,
  type NotificationMessage,
  type PubSubMessage,
  type SystemMessage,
} from "./types";

// ============================================================================
// Publisher Class
// ============================================================================

export class PubSubPublisher {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  /**
   * Publish a raw message to a channel
   */
  async publish<T extends PubSubMessage>(
    channel: string,
    message: Omit<T, "id" | "timestamp">
  ): Promise<number> {
    const fullMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: Date.now(),
    } as T;

    const serialized = serializeMessage(fullMessage);
    return this.redis.publish(channel, serialized);
  }

  // ==========================================================================
  // Convenience Methods for Job Events
  // ==========================================================================

  async publishJobStarted(jobId: string, userId: string): Promise<number> {
    // Publish to both global and user-specific channels
    const message: Omit<JobEventMessage, "id" | "timestamp"> = {
      type: "job:started",
      jobId,
      userId,
    };

    await this.publish(CHANNELS.JOB_EVENTS, message);
    return this.publish(CHANNEL_PATTERNS.USER_JOB_UPDATES(userId), message);
  }

  async publishJobProgress(
    jobId: string,
    userId: string,
    progress: number
  ): Promise<number> {
    const message: Omit<JobEventMessage, "id" | "timestamp"> = {
      type: "job:progress",
      jobId,
      userId,
      progress,
    };

    return this.publish(CHANNEL_PATTERNS.USER_JOB_UPDATES(userId), message);
  }

  async publishJobCompleted(
    jobId: string,
    userId: string,
    result?: unknown
  ): Promise<number> {
    const message: Omit<JobEventMessage, "id" | "timestamp"> = {
      type: "job:completed",
      jobId,
      userId,
      result,
    };

    await this.publish(CHANNELS.JOB_EVENTS, message);
    return this.publish(CHANNEL_PATTERNS.USER_JOB_UPDATES(userId), message);
  }

  async publishJobFailed(
    jobId: string,
    userId: string,
    error: string
  ): Promise<number> {
    const message: Omit<JobEventMessage, "id" | "timestamp"> = {
      type: "job:failed",
      jobId,
      userId,
      error,
    };

    await this.publish(CHANNELS.JOB_EVENTS, message);
    return this.publish(CHANNEL_PATTERNS.USER_JOB_UPDATES(userId), message);
  }

  // ==========================================================================
  // Convenience Methods for Notifications
  // ==========================================================================

  async publishNotification(
    userId: string,
    notification: {
      notificationId: string;
      notificationType: NotificationMessage["notificationType"];
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ): Promise<number> {
    const message: Omit<NotificationMessage, "id" | "timestamp"> = {
      type: "notification",
      userId,
      ...notification,
    };

    return this.publish(CHANNEL_PATTERNS.USER_NOTIFICATIONS(userId), message);
  }

  // ==========================================================================
  // Convenience Methods for System Messages
  // ==========================================================================

  async publishSystemBroadcast(
    action: SystemMessage["action"],
    message: string,
    data?: Record<string, unknown>
  ): Promise<number> {
    const sysMessage: Omit<SystemMessage, "id" | "timestamp"> = {
      type: "system",
      action,
      message,
      data,
    };

    return this.publish(CHANNELS.SYSTEM_NOTIFICATIONS, sysMessage);
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let publisherInstance: PubSubPublisher | null = null;

export function getPublisher(redisUrl: string): PubSubPublisher {
  if (!publisherInstance) {
    publisherInstance = new PubSubPublisher(redisUrl);
  }
  return publisherInstance;
}

export async function closePublisher(): Promise<void> {
  if (publisherInstance) {
    await publisherInstance.disconnect();
    publisherInstance = null;
  }
}

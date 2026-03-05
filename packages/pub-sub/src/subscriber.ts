import { Redis } from "ioredis";
import {
  CHANNEL_PATTERNS,
  CHANNELS,
  deserializeMessage,
  type PubSubMessage,
} from "./types";

// ============================================================================
// Message Handler Type
// ============================================================================

export type MessageHandler = (
  channel: string,
  message: PubSubMessage
) => void | Promise<void>;

// ============================================================================
// Subscriber Class
// ============================================================================

export class PubSubSubscriber {
  private redis: Redis;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private patternHandlers: Map<string, Set<MessageHandler>> = new Map();
  private isListening = false;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.setupListeners();
  }

  private setupListeners(): void {
    // Handle regular channel messages
    this.redis.on("message", (channel: string, data: string) => {
      this.handleMessage(channel, data);
    });

    // Handle pattern-matched messages
    this.redis.on("pmessage", (pattern: string, channel: string, data: string) => {
      this.handlePatternMessage(pattern, channel, data);
    });

    this.redis.on("error", (err: Error) => {
      console.error("Redis subscriber error:", err);
    });

    this.isListening = true;
  }

  private handleMessage(channel: string, data: string): void {
    const handlers = this.handlers.get(channel);
    if (!handlers || handlers.size === 0) return;

    try {
      const message = deserializeMessage(data);
      for (const handler of handlers) {
        Promise.resolve(handler(channel, message)).catch((err: Error) => {
          console.error(`Error in message handler for channel ${channel}:`, err);
        });
      }
    } catch (err) {
      console.error(`Error deserializing message from ${channel}:`, err);
    }
  }

  private handlePatternMessage(
    pattern: string,
    channel: string,
    data: string
  ): void {
    const handlers = this.patternHandlers.get(pattern);
    if (!handlers || handlers.size === 0) return;

    try {
      const message = deserializeMessage(data);
      for (const handler of handlers) {
        Promise.resolve(handler(channel, message)).catch((err: Error) => {
          console.error(
            `Error in pattern handler for ${pattern} (channel: ${channel}):`,
            err
          );
        });
      }
    } catch (err) {
      console.error(`Error deserializing message from ${channel}:`, err);
    }
  }

  // ==========================================================================
  // Subscribe Methods
  // ==========================================================================

  /**
   * Subscribe to a specific channel
   */
  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await this.redis.subscribe(channel);
    }
    this.handlers.get(channel)?.add(handler);
  }

  /**
   * Subscribe to a pattern (e.g., user:*:notifications)
   */
  async psubscribe(pattern: string, handler: MessageHandler): Promise<void> {
    if (!this.patternHandlers.has(pattern)) {
      this.patternHandlers.set(pattern, new Set());
      await this.redis.psubscribe(pattern);
    }
    this.patternHandlers.get(pattern)?.add(handler);
  }

  // ==========================================================================
  // Unsubscribe Methods
  // ==========================================================================

  /**
   * Unsubscribe from a specific channel
   */
  async unsubscribe(channel: string, handler?: MessageHandler): Promise<void> {
    const handlers = this.handlers.get(channel);
    if (!handlers) return;

    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(channel);
        await this.redis.unsubscribe(channel);
      }
    } else {
      this.handlers.delete(channel);
      await this.redis.unsubscribe(channel);
    }
  }

  /**
   * Unsubscribe from a pattern
   */
  async punsubscribe(pattern: string, handler?: MessageHandler): Promise<void> {
    const handlers = this.patternHandlers.get(pattern);
    if (!handlers) return;

    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.patternHandlers.delete(pattern);
        await this.redis.punsubscribe(pattern);
      }
    } else {
      this.patternHandlers.delete(pattern);
      await this.redis.punsubscribe(pattern);
    }
  }

  // ==========================================================================
  // Convenience Methods
  // ==========================================================================

  /**
   * Subscribe to all events for a specific user
   */
  async subscribeToUser(userId: string, handler: MessageHandler): Promise<void> {
    await this.psubscribe(CHANNEL_PATTERNS.USER_ALL(userId), handler);
  }

  /**
   * Unsubscribe from all events for a specific user
   */
  async unsubscribeFromUser(userId: string): Promise<void> {
    await this.punsubscribe(CHANNEL_PATTERNS.USER_ALL(userId));
  }

  /**
   * Subscribe to global job events
   */
  async subscribeToJobEvents(handler: MessageHandler): Promise<void> {
    await this.subscribe(CHANNELS.JOB_EVENTS, handler);
  }

  /**
   * Subscribe to system notifications
   */
  async subscribeToSystemNotifications(handler: MessageHandler): Promise<void> {
    await this.subscribe(CHANNELS.SYSTEM_NOTIFICATIONS, handler);
  }

  // ==========================================================================
  // State Inspection
  // ==========================================================================

  /**
   * Get all currently subscribed channels
   */
  getSubscribedChannels(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get all currently subscribed patterns
   */
  getSubscribedPatterns(): string[] {
    return Array.from(this.patternHandlers.keys());
  }

  /**
   * Check if subscribed to a user
   */
  isSubscribedToUser(userId: string): boolean {
    return this.patternHandlers.has(CHANNEL_PATTERNS.USER_ALL(userId));
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  async disconnect(): Promise<void> {
    // Unsubscribe from all channels
    for (const channel of this.handlers.keys()) {
      await this.redis.unsubscribe(channel);
    }

    // Unsubscribe from all patterns
    for (const pattern of this.patternHandlers.keys()) {
      await this.redis.punsubscribe(pattern);
    }

    this.handlers.clear();
    this.patternHandlers.clear();

    await this.redis.quit();
    this.isListening = false;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

const subscribers = new Map<string, PubSubSubscriber>();

export function getSubscriber(redisUrl: string, name = "default"): PubSubSubscriber {
  let subscriber = subscribers.get(name);

  if (!subscriber) {
    subscriber = new PubSubSubscriber(redisUrl);
    subscribers.set(name, subscriber);
  }

  return subscriber;
}

export async function closeSubscriber(name = "default"): Promise<void> {
  const subscriber = subscribers.get(name);
  if (subscriber) {
    await subscriber.disconnect();
    subscribers.delete(name);
  }
}

export async function closeAllSubscribers(): Promise<void> {
  const closePromises = Array.from(subscribers.values()).map((s) =>
    s.disconnect()
  );
  await Promise.all(closePromises);
  subscribers.clear();
}

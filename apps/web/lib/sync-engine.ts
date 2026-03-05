import { db, type LocalJob, type LocalNotification } from "./db";

// ============================================================================
// Configuration
// ============================================================================

const SYNC_INTERVAL = 30000; // 30 seconds
const SYNC_METADATA_KEY = "sync";

// ============================================================================
// Types
// ============================================================================

interface SyncChangesResponse {
  data: {
    jobs: ServerJob[];
    notifications: ServerNotification[];
    cursor: string;
  };
}

interface ServerJob {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  result?: Record<string, unknown>;
  error?: string;
  attempts: number;
  maxAttempts: number;
  priority: number;
  progress: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface ServerNotification {
  id: string;
  type: "JOB_STARTED" | "JOB_PROGRESS" | "JOB_COMPLETED" | "JOB_FAILED" | "SYSTEM";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  userId: string;
  createdAt: string;
}

type WebSocketMessage =
  | { type: "connected"; userId: string; timestamp: number }
  | { type: "ack"; originalMessage: unknown; timestamp: number }
  | { channel: string; message: PubSubMessage };

interface PubSubMessage {
  id: string;
  timestamp: number;
  type: string;
  [key: string]: unknown;
}

// ============================================================================
// Sync Engine Class
// ============================================================================

export class SyncEngine {
  private _userId: string;
  private restUrl: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isOnline = true;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(config: { userId: string; restUrl: string; wsUrl: string }) {
    this._userId = config.userId;
    this.restUrl = config.restUrl;
    this.wsUrl = config.wsUrl;
  }

  get userId(): string {
    return this._userId;
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  async start(): Promise<void> {
    // Initial sync
    await this.sync();

    // Start periodic sync
    this.syncInterval = setInterval(() => {
      this.sync().catch(console.error);
    }, SYNC_INTERVAL);

    // Connect WebSocket for real-time updates
    this.connectWebSocket();

    // Listen for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.disconnectWebSocket();

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
  }

  // ==========================================================================
  // Sync Logic
  // ==========================================================================

  async sync(): Promise<void> {
    if (!this.isOnline) {
      console.log("📴 Offline - skipping sync");
      return;
    }

    try {
      // Get last sync cursor
      const metadata = await db.syncMetadata.get(SYNC_METADATA_KEY);
      const cursor = metadata?.cursor;

      // Fetch changes from server
      const url = new URL(`${this.restUrl}/sync/changes`);
      url.searchParams.set("userId", this._userId);
      if (cursor) {
        url.searchParams.set("since", cursor);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = (await response.json()) as SyncChangesResponse;
      const { jobs, notifications, cursor: newCursor } = result.data;

      // Apply changes to local database
      await db.transaction("rw", [db.jobs, db.notifications, db.syncMetadata], async () => {
        // Upsert jobs
        for (const job of jobs) {
          const localJob: LocalJob = {
            ...job,
            createdAt: new Date(job.createdAt),
            updatedAt: new Date(job.updatedAt),
            startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
            completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
            _syncedAt: new Date(),
          };
          await db.jobs.put(localJob);
        }

        // Upsert notifications
        for (const notification of notifications) {
          const localNotification: LocalNotification = {
            ...notification,
            createdAt: new Date(notification.createdAt),
            _syncedAt: new Date(),
          };
          await db.notifications.put(localNotification);
        }

        // Update sync cursor
        await db.syncMetadata.put({
          id: SYNC_METADATA_KEY,
          entity: "all",
          cursor: newCursor,
          lastSyncedAt: new Date(),
        });
      });

      console.log(
        `✅ Synced ${jobs.length} jobs and ${notifications.length} notifications`
      );

      // Emit sync completed event
      this.emit("sync:completed", { jobs: jobs.length, notifications: notifications.length });
    } catch (error) {
      console.error("❌ Sync failed:", error);
      this.emit("sync:error", error);
    }
  }

  // ==========================================================================
  // WebSocket Connection
  // ==========================================================================

  private connectWebSocket(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${this.wsUrl}/ws?userId=${encodeURIComponent(this._userId)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("🔌 WebSocket connected");
      this.reconnectAttempts = 0;
      this.emit("ws:connected", null);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as WebSocketMessage;
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("🔌 WebSocket disconnected");
      this.emit("ws:disconnected", null);
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.emit("ws:error", error);
    };
  }

  private disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnect attempts reached");
      return;
    }

    const delay = this.reconnectDelay * 2 ** this.reconnectAttempts;
    this.reconnectAttempts++;

    setTimeout(() => {
      if (this.isOnline) {
        this.connectWebSocket();
      }
    }, delay);
  }

  private handleWebSocketMessage(data: WebSocketMessage): void {
    if ("channel" in data) {
      // Real-time update from pub/sub
      this.handleRealtimeUpdate(data.channel, data.message);
    } else if (data.type === "connected") {
      console.log(`Connected as user: ${data.userId}`);
    }
  }

  private async handleRealtimeUpdate(channel: string, message: PubSubMessage): Promise<void> {
    console.log(`📨 Real-time update on ${channel}:`, message.type);

    // Handle different message types
    if (message.type.startsWith("job:")) {
      await this.handleJobUpdate(message);
    } else if (message.type === "notification") {
      await this.handleNotificationUpdate(message);
    }

    // Emit event for UI updates
    this.emit("realtime:update", { channel, message });
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Job update logic requires multiple condition checks for different scenarios 
  private async handleJobUpdate(message: PubSubMessage): Promise<void> {
    const jobId = message.jobId as string;
    if (!jobId) return;

    // Update local job if it exists
    const existingJob = await db.jobs.get(jobId);
    if (existingJob) {
      const updates: Partial<LocalJob> = {
        updatedAt: new Date(),
      };

      if (message.type === "job:started") {
        updates.status = "PROCESSING";
        updates.startedAt = new Date();
      } else if (message.type === "job:progress" && typeof message.progress === "number") {
        updates.progress = message.progress;
      } else if (message.type === "job:completed") {
        updates.status = "COMPLETED";
        updates.progress = 100;
        updates.completedAt = new Date();
        if (message.result) {
          updates.result = message.result as Record<string, unknown>;
        }
      } else if (message.type === "job:failed") {
        updates.status = "FAILED";
        updates.completedAt = new Date();
        if (message.error) {
          updates.error = message.error as string;
        }
      }

      await db.jobs.update(jobId, updates);
      this.emit("job:updated", { jobId, ...updates });
    }
  }

  private async handleNotificationUpdate(message: PubSubMessage): Promise<void> {
    const notificationId = message.notificationId as string;
    if (!notificationId) return;

    // Check if notification already exists
    const existing = await db.notifications.get(notificationId);
    if (!existing) {
      // Add new notification
      const notification: LocalNotification = {
        id: notificationId,
        type: message.notificationType as LocalNotification["type"],
        title: message.title as string,
        message: message.message as string,
        data: message.data as Record<string, unknown> | undefined,
        read: false,
        userId: this._userId,
        createdAt: new Date(message.timestamp),
        _syncedAt: new Date(),
      };

      await db.notifications.add(notification);
      this.emit("notification:new", notification);
    }
  }

  // ==========================================================================
  // Online/Offline Handling
  // ==========================================================================

  private handleOnline = (): void => {
    console.log("📶 Back online");
    this.isOnline = true;
    this.sync().catch(console.error);
    this.connectWebSocket();
    this.emit("online", null);
  };

  private handleOffline = (): void => {
    console.log("📴 Gone offline");
    this.isOnline = false;
    this.emit("offline", null);
  };

  // ==========================================================================
  // Event Emitter
  // ==========================================================================

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      }
    }
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  async forceSync(): Promise<void> {
    await this.sync();
  }
}

// ============================================================================
// Singleton Factory
// ============================================================================

let syncEngineInstance: SyncEngine | null = null;

export function getSyncEngine(config: {
  userId: string;
  restUrl: string;
  wsUrl: string;
}): SyncEngine {
  if (!syncEngineInstance || syncEngineInstance.userId !== config.userId) {
    syncEngineInstance?.stop();
    syncEngineInstance = new SyncEngine(config);
  }
  return syncEngineInstance;
}

export function stopSyncEngine(): void {
  if (syncEngineInstance) {
    syncEngineInstance.stop();
    syncEngineInstance = null;
  }
}

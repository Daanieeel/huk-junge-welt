import Dexie, { type EntityTable } from "dexie";

// ============================================================================
// Entity Types (mirroring server-side models)
// ============================================================================

export interface LocalJob {
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
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  // Sync metadata
  _syncedAt?: Date;
}

export interface LocalNotification {
  id: string;
  type: "JOB_STARTED" | "JOB_PROGRESS" | "JOB_COMPLETED" | "JOB_FAILED" | "SYSTEM";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  userId: string;
  createdAt: Date;
  // Sync metadata
  _syncedAt?: Date;
}

export interface SyncMetadata {
  id: string;
  entity: string;
  cursor: string;
  lastSyncedAt: Date;
}

// ============================================================================
// Dexie Database Definition
// ============================================================================

export class AppDatabase extends Dexie {
  jobs!: EntityTable<LocalJob, "id">;
  notifications!: EntityTable<LocalNotification, "id">;
  syncMetadata!: EntityTable<SyncMetadata, "id">;

  constructor() {
    super("huk-app-db");

    this.version(1).stores({
      jobs: "id, userId, status, type, createdAt, updatedAt",
      notifications: "id, userId, type, read, createdAt",
      syncMetadata: "id, entity",
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const db = new AppDatabase();

// ============================================================================
// Helper Functions
// ============================================================================

export async function clearAllData(): Promise<void> {
  await db.transaction("rw", [db.jobs, db.notifications, db.syncMetadata], async () => {
    await db.jobs.clear();
    await db.notifications.clear();
    await db.syncMetadata.clear();
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return db.notifications.where({ userId, read: false }).count();
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await db.notifications.update(notificationId, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await db.notifications.where({ userId, read: false }).modify({ read: true });
}

export async function getJobsByStatus(
  userId: string,
  status: LocalJob["status"]
): Promise<LocalJob[]> {
  return db.jobs.where({ userId, status }).toArray();
}

export async function getPendingJobs(userId: string): Promise<LocalJob[]> {
  return db.jobs
    .where({ userId })
    .filter((job) => job.status === "PENDING" || job.status === "PROCESSING")
    .toArray();
}

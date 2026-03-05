"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  type LocalJob,
  type LocalNotification,
  getUnreadNotificationCount,
  markNotificationAsRead as markRead,
  markAllNotificationsAsRead as markAllRead,
} from "./db";
import { getSyncEngine, stopSyncEngine, type SyncEngine } from "./sync-engine";

// ============================================================================
// Types
// ============================================================================

interface SyncContextValue {
  // State
  isOnline: boolean;
  isConnected: boolean;
  isSyncing: boolean;

  // Data
  jobs: LocalJob[];
  notifications: LocalNotification[];
  unreadCount: number;

  // Actions
  sync: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const SyncContext = createContext<SyncContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface SyncProviderProps {
  children: ReactNode;
  userId: string;
  restUrl: string;
  wsUrl: string;
}

export function SyncProvider({
  children,
  userId,
  restUrl,
  wsUrl,
}: SyncProviderProps): ReactNode {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncEngine, setSyncEngine] = useState<SyncEngine | null>(null);

  // Live queries for reactive data
  const jobs = useLiveQuery(
    () => db.jobs.where("userId").equals(userId).reverse().sortBy("createdAt"),
    [userId],
    []
  );

  const notifications = useLiveQuery(
    () =>
      db.notifications
        .where("userId")
        .equals(userId)
        .reverse()
        .sortBy("createdAt"),
    [userId],
    []
  );

  const unreadCount = useLiveQuery(
    () => getUnreadNotificationCount(userId),
    [userId],
    0
  );

  // Initialize sync engine
  useEffect(() => {
    const engine = getSyncEngine({ userId, restUrl, wsUrl });
    setSyncEngine(engine);

    // Set up event listeners
    const unsubOnline = engine.on("online", () => setIsOnline(true));
    const unsubOffline = engine.on("offline", () => setIsOnline(false));
    const unsubConnected = engine.on("ws:connected", () => setIsConnected(true));
    const unsubDisconnected = engine.on("ws:disconnected", () =>
      setIsConnected(false)
    );

    // Start the engine
    engine.start().catch(console.error);

    // Cleanup
    return () => {
      unsubOnline();
      unsubOffline();
      unsubConnected();
      unsubDisconnected();
      stopSyncEngine();
    };
  }, [userId, restUrl, wsUrl]);

  // Actions
  const sync = useCallback(async () => {
    if (!syncEngine) return;
    setIsSyncing(true);
    try {
      await syncEngine.forceSync();
    } finally {
      setIsSyncing(false);
    }
  }, [syncEngine]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    await markRead(id);
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    await markAllRead(userId);
  }, [userId]);

  const value: SyncContextValue = {
    isOnline,
    isConnected,
    isSyncing,
    jobs: jobs ?? [],
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    sync,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}

// ============================================================================
// Individual Data Hooks
// ============================================================================

export function useJobs(): LocalJob[] {
  const { jobs } = useSync();
  return jobs;
}

export function useNotifications(): LocalNotification[] {
  const { notifications } = useSync();
  return notifications;
}

export function useUnreadNotificationCount(): number {
  const { unreadCount } = useSync();
  return unreadCount;
}

export function useConnectionStatus(): { isOnline: boolean; isConnected: boolean } {
  const { isOnline, isConnected } = useSync();
  return { isOnline, isConnected };
}

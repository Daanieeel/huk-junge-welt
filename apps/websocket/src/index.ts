import cors from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { env } from "@repo/env/server";
import {
  getSubscriber,
  isJobEventMessage,
  isNotificationMessage,
  type PubSubMessage,
} from "@repo/pub-sub";
import { auth, type AuthUser } from "@repo/auth";

// ============================================================================
// Types
// ============================================================================

interface WebSocketData {
  userId: string;
  connectedAt: number;
}

// ============================================================================
// Connection Management
// ============================================================================

const userConnections = new Map<string, Set<WebSocketData>>();

function addConnection(userId: string, data: WebSocketData): void {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)?.add(data);
}

function removeConnection(userId: string, data: WebSocketData): void {
  const connections = userConnections.get(userId);
  if (connections) {
    connections.delete(data);
    if (connections.size === 0) {
      userConnections.delete(userId);
    }
  }
}

function getActiveUserIds(): string[] {
  return Array.from(userConnections.keys());
}

function isUserOnline(userId: string): boolean {
  return userConnections.has(userId);
}

// ============================================================================
// Auth Helpers
//
// The WebSocket upgrade request may not carry cookies cross-origin.
// We accept the session token as a query parameter and validate it via
// the shared better-auth instance (no extra HTTP hop – direct DB lookup).
// ============================================================================

async function resolveSession(
  token: string
): Promise<{ user: AuthUser } | null> {
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  return { user: session.user };
}

// ============================================================================
// Redis Pub/Sub Subscriber
// ============================================================================

const subscriber = getSubscriber(env.PUBSUB_REDIS_URL, "websocket");

// ============================================================================
// WebSocket Instance Store (for broadcasting)
// ============================================================================

const wsInstances = new Map<string, Set<{ send: (data: string) => void }>>();

function broadcastToUser(userId: string, data: string): void {
  const instances = wsInstances.get(userId);
  if (instances) {
    for (const ws of instances) {
      try {
        ws.send(data);
      } catch (err) {
        console.error(`Failed to send to ${userId}:`, err);
      }
    }
  }
}

// ============================================================================
// Subscription Management
// ============================================================================

async function subscribeToUserChannels(userId: string): Promise<void> {
  if (!subscriber.isSubscribedToUser(userId)) {
    await subscriber.subscribeToUser(userId, (channel, message) => {
      broadcastToUser(userId, JSON.stringify({ channel, message }));
    });
    console.log(`📡 Subscribed to channels for user: ${userId}`);
  }
}

async function unsubscribeFromUserChannels(userId: string): Promise<void> {
  if (!isUserOnline(userId)) {
    await subscriber.unsubscribeFromUser(userId);
    console.log(`📡 Unsubscribed from channels for user: ${userId}`);
  }
}

// ============================================================================
// Elysia App
// ============================================================================

const app = new Elysia()
  .use(
    cors({
      origin: env.WEB_URL,
      methods: ["GET", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )

  // Health check (public)
  .get("/health", () => ({
    status: "ok",
    connections: getActiveUserIds().length,
    timestamp: new Date().toISOString(),
  }))

  // Active connections debug endpoint (public)
  .get("/connections", () => ({
    users: getActiveUserIds(),
    total: Array.from(userConnections.values()).reduce(
      (sum, set) => sum + set.size,
      0
    ),
  }))

  // ============================================================================
  // WebSocket endpoint
  //
  // Clients must provide their session token as a query parameter:
  //   ws://host/ws?token=<session_token>
  //
  // The token is validated against the shared better-auth instance on
  // connection open. The connection is closed immediately if auth fails.
  // ============================================================================
  .ws("/ws", {
    query: t.Object({
      token: t.String(),
    }),

    async open(ws) {
      const { token } = ws.data.query;

      // Validate session via better-auth (direct DB lookup, no HTTP hop)
      const resolved = await resolveSession(token);
      if (!resolved) {
        ws.send(
          JSON.stringify({ type: "error", code: 401, message: "Unauthorized" })
        );
        ws.close();
        return;
      }

      const { user } = resolved;
      const connectionData: WebSocketData = {
        userId: user.id,
        connectedAt: Date.now(),
      };

      addConnection(user.id, connectionData);

      if (!wsInstances.has(user.id)) {
        wsInstances.set(user.id, new Set());
      }
      wsInstances.get(user.id)?.add(ws);

      await subscribeToUserChannels(user.id);

      console.log(
        `🔌 Client connected: ${user.id} (total: ${userConnections.get(user.id)?.size ?? 0})`
      );

      ws.send(
        JSON.stringify({
          type: "connected",
          userId: user.id,
          timestamp: Date.now(),
        })
      );
    },

    async close(ws) {
      const { token } = ws.data.query;

      // Re-resolve to get the userId (tokens are cheap to validate from cache)
      const resolved = await resolveSession(token);
      if (!resolved) return;

      const userId = resolved.user.id;

      // Remove ws instance
      const instances = wsInstances.get(userId);
      if (instances) {
        instances.delete(ws);
        if (instances.size === 0) wsInstances.delete(userId);
      }

      // Remove connection tracking (use a placeholder since we don't store the exact object)
      const connections = userConnections.get(userId);
      if (connections) {
        const entry = Array.from(connections).find(
          (c) => c.userId === userId
        );
        if (entry) removeConnection(userId, entry);
      }

      await unsubscribeFromUserChannels(userId);

      console.log(`🔌 Client disconnected: ${userId}`);
    },

    async message(ws, message) {
      const { token } = ws.data.query;

      const resolved = await resolveSession(token);
      if (!resolved) {
        ws.send(
          JSON.stringify({ type: "error", code: 401, message: "Unauthorized" })
        );
        ws.close();
        return;
      }

      console.log(`📨 Message from ${resolved.user.id}:`, message);

      ws.send(
        JSON.stringify({
          type: "ack",
          originalMessage: message,
          timestamp: Date.now(),
        })
      );
    },
  })

  .listen(env.WEBSOCKET_PORT);

// ============================================================================
// Broadcast job events from pub/sub to connected WebSocket clients
// ============================================================================

subscriber
  .subscribeToJobEvents((channel, message: PubSubMessage) => {
    if (isJobEventMessage(message)) {
      broadcastToUser(message.userId, JSON.stringify({ channel, message }));
    } else if (isNotificationMessage(message)) {
      broadcastToUser(message.userId, JSON.stringify({ channel, message }));
    }
  })
  .catch(console.error);

console.log(
  `🔌 WebSocket server is running at ${app.server?.hostname}:${app.server?.port}`
);

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down WebSocket server...");
  await subscriber.disconnect();
  process.exit(0);
});

export type App = typeof app;

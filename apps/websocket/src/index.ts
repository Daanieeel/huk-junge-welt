import cors from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { env } from "@repo/env/server";
import {
  getSubscriber,
  isJobEventMessage,
  isNotificationMessage,
  type PubSubMessage,
} from "@repo/pub-sub";

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

// Track active connections by userId
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
// Redis Pub/Sub Subscriber
// ============================================================================

const subscriber = getSubscriber(env.PUBSUB_REDIS_URL, "websocket");

// Message handler that broadcasts to connected WebSocket clients
function handlePubSubMessage(channel: string, message: PubSubMessage): void {
  // Extract userId from the message
  let targetUserId: string | undefined;

  if (isJobEventMessage(message)) {
    targetUserId = message.userId;
  } else if (isNotificationMessage(message)) {
    targetUserId = message.userId;
  }

  if (!targetUserId) {
    console.warn("Received message without userId:", message);
    return;
  }

  // Broadcast to all connections for this user
  const connections = userConnections.get(targetUserId);
  if (connections && connections.size > 0) {
    const _payload = JSON.stringify({
      channel,
      message,
    });

    // Use Elysia's WebSocket broadcast (we'll store ws references)
    console.log(`📤 Broadcasting to ${connections.size} connections for user ${targetUserId}`);
    
    // The actual send happens via the ws.send in the websocket handler
    // We need to store ws references - this is a simplified approach
    // In production, you'd want to store the actual ws references
  }
}

// ============================================================================
// Subscription Management
// ============================================================================

async function subscribeToUserChannels(userId: string): Promise<void> {
  if (!subscriber.isSubscribedToUser(userId)) {
    await subscriber.subscribeToUser(userId, handlePubSubMessage);
    console.log(`📡 Subscribed to channels for user: ${userId}`);
  }
}

async function unsubscribeFromUserChannels(userId: string): Promise<void> {
  // Only unsubscribe if no more connections for this user
  if (!isUserOnline(userId)) {
    await subscriber.unsubscribeFromUser(userId);
    console.log(`📡 Unsubscribed from channels for user: ${userId}`);
  }
}

// ============================================================================
// WebSocket Server
// ============================================================================

// Store WebSocket instances for broadcasting
const wsInstances = new Map<string, Set<{ send: (data: string) => void }>>();

const app = new Elysia()
  .use(cors())

  // Health check
  .get("/health", () => ({
    status: "ok",
    connections: getActiveUserIds().length,
    timestamp: new Date().toISOString(),
  }))

  // List connected users (for debugging)
  .get("/connections", () => ({
    users: getActiveUserIds(),
    total: Array.from(userConnections.values()).reduce(
      (sum, set) => sum + set.size,
      0
    ),
  }))

  // WebSocket endpoint
  .ws("/ws", {
    query: t.Object({
      userId: t.String(),
    }),

    open(ws) {
      const userId = ws.data.query.userId;
      const connectionData: WebSocketData = {
        userId,
        connectedAt: Date.now(),
      };

      // Store connection
      addConnection(userId, connectionData);

      // Store ws instance for broadcasting
      if (!wsInstances.has(userId)) {
        wsInstances.set(userId, new Set());
      }
      wsInstances.get(userId)?.add(ws);

      // Subscribe to user's Redis channels
      subscribeToUserChannels(userId).catch(console.error);

      console.log(`🔌 Client connected: ${userId} (total: ${userConnections.get(userId)?.size ?? 0})`);

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: "connected",
          userId,
          timestamp: Date.now(),
        })
      );
    },

    close(ws) {
      const userId = ws.data.query.userId;
      const connectionData: WebSocketData = {
        userId,
        connectedAt: 0, // We don't need exact match for removal
      };

      // Remove ws instance
      const instances = wsInstances.get(userId);
      if (instances) {
        instances.delete(ws);
        if (instances.size === 0) {
          wsInstances.delete(userId);
        }
      }

      // Remove connection tracking
      removeConnection(userId, connectionData);

      // Unsubscribe if no more connections
      unsubscribeFromUserChannels(userId).catch(console.error);

      console.log(`🔌 Client disconnected: ${userId}`);
    },

    message(ws, message) {
      const userId = ws.data.query.userId;

      // Handle incoming messages from client
      // You can add message handling logic here
      console.log(`📨 Message from ${userId}:`, message);

      // Echo back for now (you can implement your own logic)
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
// Broadcast Helper (called from pub/sub handler)
// ============================================================================

// Update the handlePubSubMessage to actually broadcast
const _originalHandler = handlePubSubMessage;

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

// Re-register with actual broadcasting
subscriber.subscribeToJobEvents((channel, message) => {
  if (isJobEventMessage(message)) {
    broadcastToUser(
      message.userId,
      JSON.stringify({ channel, message })
    );
  }
}).catch(console.error);

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


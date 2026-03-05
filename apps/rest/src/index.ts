import cors from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { env } from "@repo/env/server";
import { prisma, JobStatus } from "@repo/database";
import { createExternalApiJobProducer } from "@repo/message-queue";
import { auth } from "@repo/auth";

// ============================================================================
// Initialize Services
// ============================================================================

const jobProducer = createExternalApiJobProducer(env.BULLMQ_REDIS_URL);

// ============================================================================
// Better Auth Elysia Plugin
//
// Mounts the auth handler at /api/auth/* and exposes a typed macro that
// resolves the current session. Routes decorated with { auth: true } will
// receive `user` and `session` in their context; unauthenticated requests
// are rejected with HTTP 401 before the route handler runs.
// ============================================================================

const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);
        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });

// ============================================================================
// Elysia App
// ============================================================================

const app = new Elysia()
  .use(
    cors({
      origin: env.WEB_URL,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(betterAuthPlugin)

  // Error handling
  .onError(({ code, error, set }): { error: string; details?: string } | undefined => {
    console.error(`Error [${code}]:`, error);

    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "Validation failed", details: error.message };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Not found" };
    }

    set.status = 500;
    return { error: "Internal server error" };
  })

  // ============================================================================
  // Health Check (public)
  // ============================================================================
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))

  // ============================================================================
  // User Routes (authenticated)
  // Returns only the current authenticated user's profile.
  // ============================================================================
  .group("/users", (app) =>
    app
      .get(
        "/me",
        async ({ user }) => ({ data: user }),
        {
          auth: true,
          detail: { tags: ["Users"], summary: "Get current user profile" },
        }
      )
      .patch(
        "/me",
        async ({ user, body }) => {
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: { name: body.name, image: body.image },
            select: { id: true, email: true, name: true, image: true, createdAt: true, updatedAt: true },
          });
          return { data: updated };
        },
        {
          auth: true,
          body: t.Object({
            name: t.Optional(t.String()),
            image: t.Optional(t.String()),
          }),
          detail: { tags: ["Users"], summary: "Update current user profile" },
        }
      )
  )

  // ============================================================================
  // Job Routes (authenticated – scoped to the current user)
  // ============================================================================
  .group("/jobs", (app) =>
    app
      .get(
        "/",
        async ({ user }) => {
          const jobs = await prisma.job.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 50,
          });
          return { data: jobs };
        },
        {
          auth: true,
          detail: { tags: ["Jobs"], summary: "Get jobs for the current user" },
        }
      )
      .get(
        "/:id",
        async ({ user, params, set }) => {
          const job = await prisma.job.findUnique({
            where: { id: params.id },
          });

          if (!job) {
            set.status = 404;
            return { error: "Job not found" };
          }

          // Ensure the job belongs to the authenticated user
          if (job.userId !== user.id) {
            set.status = 403;
            return { error: "Forbidden" };
          }

          return { data: job };
        },
        {
          auth: true,
          params: t.Object({ id: t.String() }),
          detail: { tags: ["Jobs"], summary: "Get job by ID" },
        }
      )
      .post(
        "/",
        async ({ user, body }) => {
          const dbJob = await prisma.job.create({
            data: {
              type: body.type,
              payload: body.payload,
              status: JobStatus.PENDING,
              userId: user.id,
              priority: body.priority ?? 0,
            },
          });

          const { jobId, correlationId } = await jobProducer.addFetchDataJob(
            {
              userId: user.id,
              endpoint: body.payload.endpoint ?? "/default",
              params: body.payload.params ?? {},
            },
            user.id,
            dbJob.id
          );

          return {
            data: {
              ...dbJob,
              queueJobId: jobId,
              correlationId,
            },
          };
        },
        {
          auth: true,
          body: t.Object({
            type: t.String(),
            payload: t.Object({
              endpoint: t.Optional(t.String()),
              params: t.Optional(t.Record(t.String(), t.String())),
            }),
            priority: t.Optional(t.Number()),
          }),
          detail: { tags: ["Jobs"], summary: "Create a new job" },
        }
      )
  )

  // ============================================================================
  // Notification Routes (authenticated – scoped to the current user)
  // ============================================================================
  .group("/notifications", (app) =>
    app
      .get(
        "/",
        async ({ user, query }) => {
          const notifications = await prisma.notification.findMany({
            where: {
              userId: user.id,
              read: query.unreadOnly ? false : undefined,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
          });
          return { data: notifications };
        },
        {
          auth: true,
          query: t.Object({
            unreadOnly: t.Optional(t.Boolean()),
          }),
          detail: { tags: ["Notifications"], summary: "Get notifications for the current user" },
        }
      )
      .patch(
        "/:id/read",
        async ({ user, params, set }) => {
          const notification = await prisma.notification.findUnique({
            where: { id: params.id },
          });

          if (!notification) {
            set.status = 404;
            return { error: "Notification not found" };
          }

          if (notification.userId !== user.id) {
            set.status = 403;
            return { error: "Forbidden" };
          }

          const updated = await prisma.notification.update({
            where: { id: params.id },
            data: { read: true },
          });
          return { data: updated };
        },
        {
          auth: true,
          params: t.Object({ id: t.String() }),
          detail: { tags: ["Notifications"], summary: "Mark notification as read" },
        }
      )
      .patch(
        "/mark-all-read",
        async ({ user }) => {
          await prisma.notification.updateMany({
            where: { userId: user.id, read: false },
            data: { read: true },
          });
          return { success: true };
        },
        {
          auth: true,
          detail: { tags: ["Notifications"], summary: "Mark all notifications as read" },
        }
      )
  )

  // ============================================================================
  // Sync Routes (authenticated – for Dexie sync engine)
  // ============================================================================
  .group("/sync", (app) =>
    app.get(
      "/changes",
      async ({ user, query }) => {
        const since = query.since ? new Date(query.since) : new Date(0);

        const [jobs, notifications] = await Promise.all([
          prisma.job.findMany({
            where: { userId: user.id, updatedAt: { gt: since } },
            orderBy: { updatedAt: "asc" },
          }),
          prisma.notification.findMany({
            where: { userId: user.id, createdAt: { gt: since } },
            orderBy: { createdAt: "asc" },
          }),
        ]);

        const allTimestamps = [
          ...jobs.map((j) => j.updatedAt),
          ...notifications.map((n) => n.createdAt),
        ];
        const newCursor =
          allTimestamps.length > 0
            ? new Date(Math.max(...allTimestamps.map((d) => d.getTime())))
            : since;

        return {
          data: {
            jobs,
            notifications,
            cursor: newCursor.toISOString(),
          },
        };
      },
      {
        auth: true,
        query: t.Object({
          since: t.Optional(t.String()),
        }),
        detail: { tags: ["Sync"], summary: "Get changes since cursor" },
      }
    )
  )

  // ============================================================================
  // Start Server
  // ============================================================================
  .listen(env.REST_PORT);

console.log(`🦊 REST API is running at ${app.server?.hostname}:${app.server?.port}`);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down REST API...");
  await prisma.$disconnect();
  process.exit(0);
});

export type App = typeof app;

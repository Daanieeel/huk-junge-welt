import cors from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { env } from "@repo/env/server";
import { prisma, JobStatus } from "@repo/database";
import { createExternalApiJobProducer } from "@repo/message-queue";

// ============================================================================
// Initialize Services
// ============================================================================

const jobProducer = createExternalApiJobProducer(env.BULLMQ_REDIS_URL);

// ============================================================================
// Elysia App Setup
// ============================================================================

// Using 'as const' to avoid complex type inference issues with Prisma
const app = new Elysia()
  .use(cors())
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
  // Health Check
  // ============================================================================
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))

  // ============================================================================
  // User Routes
  // ============================================================================
  .group("/users", (app) =>
    app
      .get(
        "/",
        async () => {
          const users = await prisma.user.findMany({
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          });
          return { data: users };
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Get all users",
          },
        }
      )
      .get(
        "/:id",
        async ({ params, set }) => {
          const user = await prisma.user.findUnique({
            where: { id: params.id },
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          if (!user) {
            set.status = 404;
            return { error: "User not found" };
          }

          return { data: user };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["Users"],
            summary: "Get user by ID",
          },
        }
      )
      .post(
        "/",
        async ({ body }) => {
          const user = await prisma.user.create({
            data: {
              email: body.email,
              name: body.name,
            },
          });
          return { data: user };
        },
        {
          body: t.Object({
            email: t.String({ format: "email" }),
            name: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Users"],
            summary: "Create a new user",
          },
        }
      )
  )

  // ============================================================================
  // Job Routes
  // ============================================================================
  .group("/jobs", (app) =>
    app
      .get(
        "/",
        async ({ query }) => {
          const jobs = await prisma.job.findMany({
            where: query.userId ? { userId: query.userId } : undefined,
            orderBy: { createdAt: "desc" },
            take: 50,
          });
          return { data: jobs };
        },
        {
          query: t.Object({
            userId: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Jobs"],
            summary: "Get jobs",
          },
        }
      )
      .get(
        "/:id",
        async ({ params, set }) => {
          const job = await prisma.job.findUnique({
            where: { id: params.id },
          });

          if (!job) {
            set.status = 404;
            return { error: "Job not found" };
          }

          return { data: job };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["Jobs"],
            summary: "Get job by ID",
          },
        }
      )
      .post(
        "/",
        async ({ body }) => {
          // Create job in database
          const dbJob = await prisma.job.create({
            data: {
              type: body.type,
              payload: body.payload,
              status: JobStatus.PENDING,
              userId: body.userId,
              priority: body.priority ?? 0,
            },
          });

          // Add job to BullMQ queue
          const { jobId, correlationId } = await jobProducer.addFetchDataJob(
            {
              userId: body.userId,
              endpoint: body.payload.endpoint ?? "/default",
              params: body.payload.params ?? {},
            },
            body.userId,
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
          body: t.Object({
            type: t.String(),
            payload: t.Object({
              endpoint: t.Optional(t.String()),
              params: t.Optional(t.Record(t.String(), t.String())),
            }),
            userId: t.String(),
            priority: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["Jobs"],
            summary: "Create a new job",
          },
        }
      )
  )

  // ============================================================================
  // Notification Routes
  // ============================================================================
  .group("/notifications", (app) =>
    app
      .get(
        "/",
        async ({ query }) => {
          const notifications = await prisma.notification.findMany({
            where: {
              userId: query.userId,
              read: query.unreadOnly ? false : undefined,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
          });
          return { data: notifications };
        },
        {
          query: t.Object({
            userId: t.String(),
            unreadOnly: t.Optional(t.Boolean()),
          }),
          detail: {
            tags: ["Notifications"],
            summary: "Get notifications for a user",
          },
        }
      )
      .patch(
        "/:id/read",
        async ({ params }) => {
          const notification = await prisma.notification.update({
            where: { id: params.id },
            data: { read: true },
          });
          return { data: notification };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["Notifications"],
            summary: "Mark notification as read",
          },
        }
      )
      .patch(
        "/mark-all-read",
        async ({ body }) => {
          await prisma.notification.updateMany({
            where: { userId: body.userId, read: false },
            data: { read: true },
          });
          return { success: true };
        },
        {
          body: t.Object({
            userId: t.String(),
          }),
          detail: {
            tags: ["Notifications"],
            summary: "Mark all notifications as read",
          },
        }
      )
  )

  // ============================================================================
  // Sync Routes (for Dexie sync)
  // ============================================================================
  .group("/sync", (app) =>
    app.get(
      "/changes",
      async ({ query }) => {
        const since = query.since ? new Date(query.since) : new Date(0);

        // Get all changes since the cursor
        const [jobs, notifications] = await Promise.all([
          prisma.job.findMany({
            where: {
              userId: query.userId,
              updatedAt: { gt: since },
            },
            orderBy: { updatedAt: "asc" },
          }),
          prisma.notification.findMany({
            where: {
              userId: query.userId,
              createdAt: { gt: since },
            },
            orderBy: { createdAt: "asc" },
          }),
        ]);

        // Calculate new cursor
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
        query: t.Object({
          userId: t.String(),
          since: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Sync"],
          summary: "Get changes since cursor",
        },
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

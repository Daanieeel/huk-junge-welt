import cors from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { env } from "@repo/env/server";
import {
  prisma,
  JobStatus,
  InsuranceType,
  type JobType,
  VehicleType,
  type RelationshipStatus,
  type HousingType,
  type HousingOwnershipType,
  type GoalType,
  type Insurance,
  type Proposal,
  type Questionnaire,
} from "@repo/database";
import { createExternalApiJobProducer } from "@repo/message-queue";
import { auth } from "@repo/auth";

// ============================================================================
// Helpers
// ============================================================================

type CoverageStatus = "covered" | "recommended" | "not_covered";

type CoverageItem = {
  type: string;
  status: CoverageStatus;
  coverageScore: number | null;
  insurance: { id: string; company: string; rate: string; interval: string } | null;
  proposal: {
    id: string;
    company: string;
    rate: string;
    interval: string;
    priority: number | null;
    reason: string | null;
  } | null;
};

/**
 * Derives which insurance types are recommended for a user based on their
 * questionnaire profile. Returns a deduplicated ordered array.
 */
function deriveRecommendedTypes(questionnaire: Questionnaire | null): InsuranceType[] {
  const types: InsuranceType[] = [
    InsuranceType.PRIVATHAFTPFLICHT,
    InsuranceType.ZAHNZUSATZ,
    InsuranceType.RECHTSSCHUTZ,
  ];

  if (!questionnaire) return types;

  const hasVehicle = questionnaire.vehicleTypes.some(
    (v: VehicleType) => v !== VehicleType.NONE && v !== VehicleType.PUBLIC_TRANSPORT
  );
  if (hasVehicle) types.push(InsuranceType.KFZ);

  if (questionnaire.housingType === "APARTMENT" || questionnaire.housingType === "HOUSE") {
    types.push(InsuranceType.HAUSRAT);
  }

  if (questionnaire.jobType === "EMPLOYEE" || questionnaire.jobType === "APPRENTICE") {
    types.push(InsuranceType.BERUFSUNFAEHIGKEIT);
  }

  if (questionnaire.relationshipStatus === "MARRIED" || questionnaire.childrenCount > 0) {
    types.push(InsuranceType.UNFALL);
    types.push(InsuranceType.PFLEGE);
  }

  const ageMs = Date.now() - new Date(questionnaire.dateOfBirth).getTime();
  const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365));
  if (age >= 25) types.push(InsuranceType.KRANKENZUSATZ);

  return [...new Set(types)];
}

function buildInsuranceItem(type: InsuranceType, insurance: Insurance): CoverageItem {
  return {
    type,
    status: "covered",
    coverageScore: insurance.coverageScore ?? null,
    insurance: {
      id: insurance.id,
      company: insurance.company,
      rate: insurance.rate.toString(),
      interval: insurance.interval,
    },
    proposal: null,
  };
}

function buildProposalItem(type: InsuranceType, proposal: Proposal | null): CoverageItem {
  return {
    type,
    status: proposal ? "recommended" : "not_covered",
    coverageScore: null,
    insurance: null,
    proposal: proposal
      ? {
          id: proposal.id,
          company: proposal.company,
          rate: proposal.rate.toString(),
          interval: proposal.interval,
          priority: proposal.priority ?? null,
          reason: proposal.reason ?? null,
        }
      : null,
  };
}

function buildCoverageItems(
  insurances: Insurance[],
  proposals: Proposal[],
  recommendedTypes: InsuranceType[]
): CoverageItem[] {
  const seenTypes = new Set<string>();
  const items: CoverageItem[] = [];

  for (const type of recommendedTypes) {
    seenTypes.add(type);
    const insurance = insurances.find((i: Insurance) => i.type === type) ?? null;
    const proposal = proposals.find((p: Proposal) => p.type === type) ?? null;
    items.push(insurance ? buildInsuranceItem(type, insurance) : buildProposalItem(type, proposal));
  }

  for (const insurance of insurances) {
    if (!seenTypes.has(insurance.type)) {
      items.push(buildInsuranceItem(insurance.type as InsuranceType, insurance));
    }
  }

  return items;
}

function computeInsuranceScore(insurances: Insurance[], items: CoverageItem[]): number {
  const covered = items.filter((i: CoverageItem) => i.status === "covered").length;
  const total = items.length;
  if (total === 0) return 0;

  const coverageRatio = covered / total;
  const scored = insurances.filter((i: Insurance) => i.coverageScore !== null);
  const avgQuality =
    scored.length > 0
      ? scored.reduce((sum: number, i: Insurance) => sum + (i.coverageScore ?? 70), 0) /
        scored.length
      : 70;

  return Math.round(coverageRatio * 70 + (avgQuality / 100) * 30);
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Sehr gut";
  if (score >= 65) return "Gut";
  if (score >= 45) return "Ausbaufähig";
  return "Lückenhaft";
}

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

const betterAuthPlugin = new Elysia({ name: "better-auth" }).mount(auth.handler).macro({
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
      .get("/me", async ({ user }) => ({ data: user }), {
        auth: true,
        detail: { tags: ["Users"], summary: "Get current user profile" },
      })
      .patch(
        "/me",
        async ({ user, body }) => {
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: { name: body.name, image: body.image },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              createdAt: true,
              updatedAt: true,
            },
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
  // Dashboard Route (authenticated)
  // Returns the user's insurance score and coverage overview for the homepage.
  // ============================================================================
  .group("/dashboard", (app) =>
    app.get(
      "/",
      async ({ user }) => {
        const [insurances, proposals, questionnaire] = await Promise.all([
          prisma.insurance.findMany({ where: { userId: user.id } }),
          prisma.proposal.findMany({
            where: { userId: user.id },
            orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
          }),
          prisma.questionnaire.findUnique({ where: { userId: user.id } }),
        ]);

        const recommendedTypes = deriveRecommendedTypes(questionnaire);
        const items = buildCoverageItems(insurances, proposals, recommendedTypes);
        const score = computeInsuranceScore(insurances, items);
        const coveredCount = items.filter((i) => i.status === "covered").length;

        return {
          data: {
            user: { name: user.name, email: user.email },
            score,
            scoreLabel: scoreLabel(score),
            totalRecommended: items.length,
            totalCovered: coveredCount,
            hasQuestionnaire: questionnaire !== null,
            items,
          },
        };
      },
      {
        auth: true,
        detail: { tags: ["Dashboard"], summary: "Get insurance score and coverage overview" },
      }
    )
  )

  // ============================================================================
  // Home Route (authenticated)
  // Returns the AI-generated coverage assessments and computed score.
  // Populated by the worker via the Bedarfscheck webhook flow.
  // ============================================================================
  .group("/home", (app) =>
    app.get(
      "/",
      async ({ user }) => {
        const coverageItems = await prisma.coverageAssessment.findMany({
          where: { userId: user.id },
          orderBy: [{ priority: "asc" }, { type: "asc" }],
        });

        const score =
          coverageItems.length > 0
            ? Math.round(
                coverageItems.reduce((sum, item) => sum + item.score, 0) / coverageItems.length
              )
            : 0;

        return {
          data: {
            user: { name: user.name, email: user.email },
            score,
            coverageItems,
          },
        };
      },
      {
        auth: true,
        detail: {
          tags: ["Home"],
          summary: "Get home screen data (AI score + coverage assessments)",
        },
      }
    )
  )

  // ============================================================================
  // Questionnaire Routes (authenticated)
  // ============================================================================
  .group("/questionnaire", (app) =>
    app
      .get(
        "/",
        async ({ user }) => {
          const questionnaire = await prisma.questionnaire.findUnique({
            where: { userId: user.id },
          });
          return { data: questionnaire };
        },
        {
          auth: true,
          detail: { tags: ["Questionnaire"], summary: "Get questionnaire for current user" },
        }
      )
      .post(
        "/",
        async ({ user, body }) => {
          const fields = {
            name: body.name,
            dateOfBirth: new Date(body.dateOfBirth),
            jobType: body.jobType as JobType,
            jobExpiryDate: body.jobExpiryDate ? new Date(body.jobExpiryDate) : null,
            salary: body.salary != null ? body.salary : null,
            vehicleTypes: body.vehicleTypes as VehicleType[],
            streetName: body.streetName ?? null,
            streetNumber: body.streetNumber ?? null,
            zipcode: body.zipcode ?? null,
            city: body.city ?? null,
            housingType: body.housingType ? (body.housingType as HousingType) : null,
            housingOwnershipType: body.housingOwnershipType
              ? (body.housingOwnershipType as HousingOwnershipType)
              : null,
            relationshipStatus: body.relationshipStatus as RelationshipStatus,
            childrenCount: body.childrenCount,
            goal: body.goal ? (body.goal as GoalType) : null,
          };
          const questionnaire = await prisma.questionnaire.upsert({
            where: { userId: user.id },
            create: { userId: user.id, ...fields },
            update: fields,
          });
          return { data: questionnaire };
        },
        {
          auth: true,
          body: t.Object({
            name: t.String({ minLength: 1 }),
            dateOfBirth: t.String(),
            jobType: t.String(),
            jobExpiryDate: t.Optional(t.Nullable(t.String())),
            salary: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
            vehicleTypes: t.Array(t.String()),
            streetName: t.Optional(t.Nullable(t.String())),
            streetNumber: t.Optional(t.Nullable(t.String())),
            zipcode: t.Optional(t.Nullable(t.String())),
            city: t.Optional(t.Nullable(t.String())),
            housingType: t.Optional(t.Nullable(t.String())),
            housingOwnershipType: t.Optional(t.Nullable(t.String())),
            relationshipStatus: t.String(),
            childrenCount: t.Number({ minimum: 0 }),
            goal: t.Optional(t.Nullable(t.String())),
          }),
          detail: { tags: ["Questionnaire"], summary: "Create or update questionnaire" },
        }
      )
      .put(
        "/",
        async ({ user, body, set }) => {
          const existing = await prisma.questionnaire.findUnique({
            where: { userId: user.id },
            select: { id: true },
          });
          if (!existing) {
            set.status = 404;
            return { error: "Questionnaire not found" };
          }
          const fields = {
            name: body.name,
            dateOfBirth: new Date(body.dateOfBirth),
            jobType: body.jobType as JobType,
            jobExpiryDate: body.jobExpiryDate ? new Date(body.jobExpiryDate) : null,
            salary: body.salary != null ? body.salary : null,
            vehicleTypes: body.vehicleTypes as VehicleType[],
            streetName: body.streetName ?? null,
            streetNumber: body.streetNumber ?? null,
            zipcode: body.zipcode ?? null,
            city: body.city ?? null,
            housingType: body.housingType ? (body.housingType as HousingType) : null,
            housingOwnershipType: body.housingOwnershipType
              ? (body.housingOwnershipType as HousingOwnershipType)
              : null,
            relationshipStatus: body.relationshipStatus as RelationshipStatus,
            childrenCount: body.childrenCount,
            goal: body.goal ? (body.goal as GoalType) : null,
          };
          const questionnaire = await prisma.questionnaire.update({
            where: { userId: user.id },
            data: fields,
          });
          return { data: questionnaire };
        },
        {
          auth: true,
          body: t.Object({
            name: t.String({ minLength: 1 }),
            dateOfBirth: t.String(),
            jobType: t.String(),
            jobExpiryDate: t.Optional(t.Nullable(t.String())),
            salary: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
            vehicleTypes: t.Array(t.String()),
            streetName: t.Optional(t.Nullable(t.String())),
            streetNumber: t.Optional(t.Nullable(t.String())),
            zipcode: t.Optional(t.Nullable(t.String())),
            city: t.Optional(t.Nullable(t.String())),
            housingType: t.Optional(t.Nullable(t.String())),
            housingOwnershipType: t.Optional(t.Nullable(t.String())),
            relationshipStatus: t.String(),
            childrenCount: t.Number({ minimum: 0 }),
            goal: t.Optional(t.Nullable(t.String())),
          }),
          detail: { tags: ["Questionnaire"], summary: "Overwrite existing questionnaire" },
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
});

export type App = typeof app;

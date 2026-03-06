import { env } from "@repo/env/server";
import { prisma, JobStatus, InsuranceType, PaymentInterval, type Prisma } from "@repo/database";
import {
  createWorker,
  createJobProcessor,
  closeAllWorkers,
  QUEUE_NAMES,
  type Job,
  type QueueJobData,
  type JobResult,
} from "@repo/message-queue";
import { getPublisher, closePublisher } from "@repo/pub-sub";

// ============================================================================
// Initialize Services
// ============================================================================

const publisher = getPublisher(env.PUBSUB_REDIS_URL);

// ============================================================================
// RAG Types
// ============================================================================

interface RagRecommendation {
  type: string;
  company: string;
  rate: number;
  interval: string;
  key_benefits: string[];
  summary: string;
  action_suggestion: string;
}

interface RagSkipped {
  type: string;
  reason: string;
}

interface RagResponse {
  recommendations: RagRecommendation[];
  skipped?: RagSkipped[];
  data_consistency_score: number;
  note?: string;
}

// ============================================================================
// RAG Webhook Call
//
// Endpoint: POST RAG_WEBHOOK_URL
// Auth:     Authorization: Basic <RAG_WEBHOOK_AUTH>
// Body:     { "message": "<german natural-language user context>" }
// ============================================================================

async function callRagWebhook(message: string): Promise<RagResponse> {
  const url = env.RAG_WEBHOOK_URL;
  const auth = env.RAG_WEBHOOK_AUTH;

  if (!url) throw new Error("RAG_WEBHOOK_URL is not configured");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  if (auth) {
    headers["Authorization"] = `Basic ${auth}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`RAG webhook failed: ${response.status} ${response.statusText}. ${text}`);
  }

  // Log the raw response so we can see the exact shape from the workflow
  const raw: unknown = await response.json();
  console.log("📥 RAG raw response:", JSON.stringify(raw, null, 2));

  return parseRagResponse(raw);
}

/**
 * Normalises the webhook response into our RagResponse shape.
 *
 * n8n "Respond to Webhook" nodes commonly wrap the AI output in one of:
 *   - Array envelope:  [{ "output": "<json-string or object>" }]
 *   - Object envelope: { "output": "<json-string or object>" }
 *   - Direct object:   { "recommendations": [...], ... }
 */
function parseRagResponse(raw: unknown): RagResponse {
  if (!raw || typeof raw !== "object") {
    return { recommendations: [], data_consistency_score: 0 };
  }

  // Unwrap array envelope: [{ output: ... }]
  const candidate = Array.isArray(raw) ? (raw[0] ?? {}) : raw;

  if (typeof candidate !== "object" || candidate === null) {
    return { recommendations: [], data_consistency_score: 0 };
  }

  const obj = candidate as Record<string, unknown>;

  // If the top-level object already has "recommendations", use it directly
  if (Array.isArray(obj.recommendations)) {
    return obj as unknown as RagResponse;
  }

  // Try common n8n output field names that may contain the JSON string or object
  for (const key of ["output", "text", "response", "result", "message", "content"]) {
    const value = obj[key];
    if (!value) continue;

    // Value is already an object with recommendations
    if (typeof value === "object" && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      if (Array.isArray(nested.recommendations)) {
        return nested as unknown as RagResponse;
      }
    }

    // Value is a JSON string – try to parse it
    if (typeof value === "string") {
      try {
        // Strip markdown code fences if present (```json ... ```)
        const cleaned = value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        const parsed = JSON.parse(cleaned) as Record<string, unknown>;
        if (Array.isArray(parsed.recommendations)) {
          return parsed as unknown as RagResponse;
        }
      } catch {
        // not valid JSON – ignore
      }
    }
  }

  console.warn("⚠️  Could not find 'recommendations' in RAG response. Keys found:", Object.keys(obj));
  return { recommendations: [], data_consistency_score: 0 };
}

// ============================================================================
// User Context Builder
// Assembles a natural-language context string from the user's profile.
// ============================================================================

function buildUserContext(params: {
  questionnaire: {
    dateOfBirth: Date;
    jobType: string;
    salary: unknown;
    relationshipStatus: string;
    childrenCount: number;
    vehicleTypes: string[];
    housingType: string | null;
    housingOwnershipType: string | null;
    goal: string | null;
    streetName: string | null;
    city: string | null;
    zipcode: string | null;
  };
  existingInsurances: Array<{
    type: string;
    company: string;
    rate: unknown;
    interval: string;
    coverageScore: number | null;
  }>;
  targetTypes: string[];
}): string {
  const { questionnaire, existingInsurances, targetTypes } = params;

  const ageMs = Date.now() - new Date(questionnaire.dateOfBirth).getTime();
  const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365));

  const jobTypeLabels: Record<string, string> = {
    STUDENT: "Student",
    APPRENTICE: "Auszubildender",
    EMPLOYEE: "Angestellter",
    SEARCHING: "Arbeitssuchend",
  };
  const relationshipLabels: Record<string, string> = {
    SINGLE: "ledig",
    IN_A_RELATIONSHIP: "in einer Beziehung",
    MARRIED: "verheiratet",
  };
  const goalLabels: Record<string, string> = {
    CHEAPEST: "möglichst günstig (Preis-Fokus)",
    BEST_VALUE: "bestes Preis-Leistungs-Verhältnis",
    COMPREHENSIVE: "umfassender Schutz",
  };
  const housingLabels: Record<string, string> = {
    SHARED_ROOM: "WG-Zimmer",
    APARTMENT: "Wohnung",
    HOUSE: "Haus",
  };
  const ownershipLabels: Record<string, string> = {
    RENTING: "Mieter",
    MORTGAGE: "Baufinanzierung",
    OWNER: "Eigentümer",
  };
  const vehicleLabels: Record<string, string> = {
    NONE: "kein Fahrzeug",
    SCOOTER: "Roller/Mofa",
    CAR: "Auto",
    MOTORCYCLE: "Motorrad",
    PUBLIC_TRANSPORT: "ÖPNV",
  };

  const parts: string[] = [
    `Ich bin ${age} Jahre alt, ${jobTypeLabels[questionnaire.jobType] ?? questionnaire.jobType}` +
      (questionnaire.salary ? ` mit einem Gehalt von ca. ${questionnaire.salary} EUR/Monat` : "") +
      ` und ${relationshipLabels[questionnaire.relationshipStatus] ?? questionnaire.relationshipStatus}.`,
  ];

  if (questionnaire.childrenCount > 0) {
    parts.push(`Ich habe ${questionnaire.childrenCount} ${questionnaire.childrenCount === 1 ? "Kind" : "Kinder"}.`);
  }

  if (questionnaire.housingType) {
    const housing = housingLabels[questionnaire.housingType] ?? questionnaire.housingType;
    const ownership = questionnaire.housingOwnershipType
      ? ` (${ownershipLabels[questionnaire.housingOwnershipType] ?? questionnaire.housingOwnershipType})`
      : "";
    parts.push(`Ich wohne in einer ${housing}${ownership}.`);
  }

  const vehicles = questionnaire.vehicleTypes
    .filter((v) => v !== "NONE" && v !== "PUBLIC_TRANSPORT")
    .map((v) => vehicleLabels[v] ?? v);
  if (vehicles.length > 0) {
    parts.push(`Ich besitze: ${vehicles.join(", ")}.`);
  }

  if (questionnaire.city) {
    parts.push(`Wohnort: ${[questionnaire.zipcode, questionnaire.city].filter(Boolean).join(" ")}.`);
  }

  if (questionnaire.goal) {
    parts.push(`Mein Versicherungsziel: ${goalLabels[questionnaire.goal] ?? questionnaire.goal}.`);
  }

  if (existingInsurances.length > 0) {
    const insLines = existingInsurances.map(
      (ins) =>
        `${ins.type} bei ${ins.company} (${ins.rate} EUR / ${ins.interval}` +
        (ins.coverageScore !== null ? `, Qualitätsscore: ${ins.coverageScore}/100` : "") +
        ")"
    );
    parts.push(`Ich habe bereits folgende Versicherungen: ${insLines.join("; ")}.`);
  } else {
    parts.push("Ich habe noch keine Versicherungen.");
  }

  if (targetTypes.length > 0) {
    parts.push(
      `Bitte analysiere ausschließlich folgende Versicherungsarten für mich und antworte im vorgegebenen JSON-Format: ${targetTypes.join(", ")}.`
    );
  } else {
    parts.push(
      "Welche Versicherungen empfiehlst du mir? Bitte antworte im vorgegebenen JSON-Format."
    );
  }

  return parts.join(" ");
}

// ============================================================================
// generate-proposals Handler
// ============================================================================

async function handleGenerateProposals(
  job: Job<QueueJobData>,
  payload: { userId: string; insuranceTypes?: string[] }
): Promise<JobResult> {
  const { userId, insuranceTypes = [] } = payload;
  const dbJobId = job.data.metadata.dbJobId;

  console.log(`🤖 Generating proposals for user ${userId}${insuranceTypes.length > 0 ? ` (types: ${insuranceTypes.join(", ")})` : ""}`);

  try {
    // Update DB job to processing
    if (dbJobId) {
      await prisma.job.update({
        where: { id: dbJobId },
        data: { status: JobStatus.PROCESSING, startedAt: new Date() },
      });
    }

    await publisher.publishJobStarted(job.id ?? "unknown", userId);

    // Fetch all user data in parallel
    const [questionnaire, existingInsurances] = await Promise.all([
      prisma.questionnaire.findUnique({ where: { userId } }),
      prisma.insurance.findMany({ where: { userId } }),
    ]);

    if (!questionnaire) {
      console.warn(`⚠️  No questionnaire found for user ${userId}, skipping RAG call`);
      if (dbJobId) {
        await prisma.job.update({
          where: { id: dbJobId },
          data: { status: JobStatus.COMPLETED, progress: 100, completedAt: new Date() },
        });
      }
      return { success: true, data: { skipped: true, reason: "No questionnaire" } };
    }

    // Determine which types to query
    const targetTypes = insuranceTypes.length > 0
      ? insuranceTypes
      : Object.values(InsuranceType);

    // Build context string for RAG
    const userContext = buildUserContext({
      questionnaire,
      existingInsurances,
      targetTypes,
    });

    if (dbJobId) {
      await prisma.job.update({ where: { id: dbJobId }, data: { progress: 30 } });
    }

    // Call RAG webhook
    console.log(`📡 Calling RAG webhook for user ${userId}`);
    const ragResponse = await callRagWebhook(userContext);

    if (dbJobId) {
      await prisma.job.update({ where: { id: dbJobId }, data: { progress: 70 } });
    }

    const { recommendations = [], skipped = [] } = ragResponse;

    if (skipped.length > 0) {
      console.log(`⏭️  RAG skipped ${skipped.length} type(s) for user ${userId}:`);
      for (const s of skipped) {
        console.log(`   - ${s.type}: ${s.reason}`);
      }
    }

    if (recommendations.length === 0) {
      console.log(`ℹ️  RAG returned no recommendations for user ${userId}`);
    }

    // Upsert proposals into the database
    const upsertedTypes: string[] = [];
    for (const rec of recommendations) {
      const type = rec.type as InsuranceType;
      const interval = rec.interval as PaymentInterval;

      // Validate enum values
      if (!Object.values(InsuranceType).includes(type)) {
        console.warn(`⚠️  Skipping unknown insurance type: ${rec.type}`);
        continue;
      }
      if (!Object.values(PaymentInterval).includes(interval)) {
        console.warn(`⚠️  Skipping unknown interval: ${rec.interval}`);
        continue;
      }

      // Derive priority from array position (1-based, max 5)
      const position = recommendations.indexOf(rec);
      const priority = Math.min(position + 1, 5);

      await prisma.proposal.upsert({
        where: {
          // We use a compound unique on userId+type – add this constraint via
          // a findFirst + update/create pattern since the schema has no @@unique.
          id: (
            await prisma.proposal.findFirst({ where: { userId, type }, select: { id: true } })
          )?.id ?? "new",
        },
        create: {
          userId,
          type,
          company: rec.company,
          rate: rec.rate,
          interval,
          templateId: `rag-${type}`,
          isAiGenerated: true,
          priority,
          reason: rec.summary,
          keyBenefits: rec.key_benefits ?? [],
          actionSuggestion: rec.action_suggestion ?? null,
        },
        update: {
          company: rec.company,
          rate: rec.rate,
          interval,
          priority,
          reason: rec.summary,
          keyBenefits: rec.key_benefits ?? [],
          actionSuggestion: rec.action_suggestion ?? null,
        },
      });

      upsertedTypes.push(type);
    }

    console.log(`✅ Upserted ${upsertedTypes.length} proposals for user ${userId}: ${upsertedTypes.join(", ")}`);

    // Update job as completed
    if (dbJobId) {
      await prisma.job.update({
        where: { id: dbJobId },
        data: {
          status: JobStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
          result: { upsertedTypes, dataConsistencyScore: ragResponse.data_consistency_score },
        },
      });
    }

    // Create notification
    const proposalCount = upsertedTypes.length;
    const notificationTitle =
      proposalCount === 1 ? "Neue Empfehlung" : `${proposalCount} neue Empfehlungen`;
    const notificationMessage =
      proposalCount === 1
        ? `Wir haben eine personalisierte Versicherungsempfehlung für dich.`
        : `Wir haben ${proposalCount} personalisierte Versicherungsempfehlungen für dich.`;

    const notification = await prisma.notification.create({
      data: {
        type: "SYSTEM",
        title: notificationTitle,
        message: notificationMessage,
        data: {
          subtype: "PROPOSALS_UPDATED",
          proposalCount,
          proposalTypes: upsertedTypes,
        },
        userId,
      },
    });

    // Publish via pub/sub so the WebSocket server pushes it to the client
    await publisher.publishNotification(userId, {
      notificationId: notification.id,
      notificationType: "SYSTEM",
      title: notification.title,
      message: notification.message,
      data: notification.data as Record<string, unknown>,
    });

    await publisher.publishJobCompleted(job.id ?? "unknown", userId, { upsertedTypes });

    return { success: true, data: { upsertedTypes, proposalCount } };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (dbJobId) {
      await prisma.job.update({
        where: { id: dbJobId },
        data: { status: JobStatus.FAILED, error: errorMessage, completedAt: new Date() },
      });

      const notification = await prisma.notification.create({
        data: {
          type: "JOB_FAILED",
          title: "Empfehlungen konnten nicht geladen werden",
          message: `Fehler: ${errorMessage}`,
          data: { jobId: dbJobId, error: errorMessage },
          userId,
        },
      });

      await publisher.publishNotification(userId, {
        notificationId: notification.id,
        notificationType: "JOB_FAILED",
        title: notification.title,
        message: notification.message,
        data: notification.data as Record<string, unknown>,
      });
    }

    await publisher.publishJobFailed(job.id ?? "unknown", userId, errorMessage);
    console.error(`❌ generate-proposals job ${job.id} failed:`, errorMessage);
    throw error;
  }
}

// ============================================================================
// send-notification Handler
// ============================================================================

async function handleSendNotification(
  _job: Job<QueueJobData>,
  payload: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
): Promise<JobResult> {
  const { userId, type, title, message, data } = payload;

  const notification = await prisma.notification.create({
    data: {
      type: type as "JOB_STARTED" | "JOB_PROGRESS" | "JOB_COMPLETED" | "JOB_FAILED" | "SYSTEM",
      title,
      message,
      data: data as Prisma.InputJsonValue | undefined,
      userId,
    },
  });

  await publisher.publishNotification(userId, {
    notificationId: notification.id,
    notificationType: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data as Record<string, unknown> | undefined,
  });

  return { success: true, data: { notificationId: notification.id } };
}

// ============================================================================
// Create Job Processor
// ============================================================================

const processor = createJobProcessor({
  "generate-proposals": handleGenerateProposals,
  "send-notification": handleSendNotification,
});

// ============================================================================
// Start Workers
// ============================================================================

console.log("🚀 Starting workers...");

createWorker({
  queueName: QUEUE_NAMES.EXTERNAL_API,
  redisUrl: env.BULLMQ_REDIS_URL,
  processor,
  concurrency: 3,
});

createWorker({
  queueName: QUEUE_NAMES.NOTIFICATIONS,
  redisUrl: env.BULLMQ_REDIS_URL,
  processor,
  concurrency: 10,
});

console.log("✅ Workers started:");
console.log(`   - External API worker (queue: ${QUEUE_NAMES.EXTERNAL_API})`);
console.log(`   - Notifications worker (queue: ${QUEUE_NAMES.NOTIFICATIONS})`);

// ============================================================================
// Graceful Shutdown
// ============================================================================

async function shutdown(): Promise<void> {
  console.log("\n🛑 Shutting down workers...");
  try {
    await closeAllWorkers();
    await closePublisher();
    await prisma.$disconnect();
    console.log("✅ Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("👷 Worker is running and waiting for jobs...");

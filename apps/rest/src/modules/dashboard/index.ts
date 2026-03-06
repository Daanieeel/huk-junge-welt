import { Elysia } from "elysia";
import { prisma, JobStatus } from "@repo/database";
import { betterAuthPlugin } from "../auth";
import {
  deriveRecommendedTypes,
  buildCoverageItems,
  computeInsuranceScore,
  scoreLabel,
} from "./service";

export const dashboard = new Elysia({ prefix: "/dashboard" })
  .use(betterAuthPlugin)
  .get(
    "/",
    async ({ user }) => {
      const [insurances, proposals, questionnaire, lastProposalJob, activeJobs] = await Promise.all([
        prisma.insurance.findMany({ where: { userId: user.id } }),
        prisma.proposal.findMany({
          where: { userId: user.id },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        }),
        prisma.questionnaire.findUnique({ where: { userId: user.id } }),
        prisma.job.findFirst({
          where: {
            userId: user.id,
            type: "generate-proposals",
            status: { in: [JobStatus.COMPLETED, JobStatus.FAILED] },
          },
          orderBy: { completedAt: "desc" },
          select: { status: true },
        }),
        // Active (pending/processing) proposal jobs so we can surface per-type loading state
        prisma.job.findMany({
          where: {
            userId: user.id,
            type: "generate-proposals",
            status: { in: [JobStatus.PENDING, JobStatus.PROCESSING] },
          },
          select: { payload: true },
        }),
      ]);

      // Extract which insurance types are currently being processed
      const processingTypes: string[] = [];
      for (const job of activeJobs) {
        const payload = job.payload as { insuranceTypes?: string[] };
        if (Array.isArray(payload?.insuranceTypes) && payload.insuranceTypes.length > 0) {
          for (const t of payload.insuranceTypes) {
            if (!processingTypes.includes(t)) processingTypes.push(t);
          }
        }
      }

      const recommendedTypes = deriveRecommendedTypes(questionnaire);
      const items = buildCoverageItems(insurances, proposals, recommendedTypes, questionnaire?.goal ?? null);
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
          hasCompletedProposalJob: lastProposalJob !== null,
          processingTypes,
          items,
        },
      };
    },
    {
      auth: true,
      detail: { tags: ["Dashboard"], summary: "Get insurance score and coverage overview" },
    }
  );

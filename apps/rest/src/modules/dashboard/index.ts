import { Elysia } from "elysia";
import { prisma } from "@repo/database";
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
  );

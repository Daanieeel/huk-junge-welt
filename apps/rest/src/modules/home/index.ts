import { Elysia } from "elysia";
import { prisma } from "@repo/database";
import { betterAuthPlugin } from "../auth";

export const home = new Elysia({ prefix: "/home" })
  .use(betterAuthPlugin)
  .get(
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
  );

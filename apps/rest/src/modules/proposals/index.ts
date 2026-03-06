import { Elysia } from "elysia";
import { prisma } from "@repo/database";
import { betterAuthPlugin } from "../auth";
import { dispatchGenerateProposals } from "../../lib/producers";

export const proposals = new Elysia({ prefix: "/proposals" })
  .use(betterAuthPlugin)
  .get(
    "/",
    async ({ user }) => {
      const list = await prisma.proposal.findMany({
        where: { userId: user.id },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      });
      return { data: list };
    },
    {
      auth: true,
      detail: { tags: ["Proposals"], summary: "List AI-generated proposals for current user" },
    }
  )
  .post(
    "/regenerate",
    async ({ user, set }) => {
      const questionnaire = await prisma.questionnaire.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!questionnaire) {
        set.status = 400;
        return { error: "Kein Fragebogen vorhanden. Bitte zuerst den Bedarfscheck abschließen." };
      }

      await prisma.proposal.deleteMany({ where: { userId: user.id } });
      await dispatchGenerateProposals({ userId: user.id });
      return { success: true };
    },
    {
      auth: true,
      detail: {
        tags: ["Proposals"],
        summary: "Re-trigger full proposal generation for the current user",
      },
    }
  );

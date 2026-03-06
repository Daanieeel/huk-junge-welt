import { Elysia } from "elysia";
import { prisma, InsuranceType, PaymentInterval } from "@repo/database";
import { betterAuthPlugin } from "../auth";
import { InsuranceModel } from "./model";
import { dispatchGenerateProposals } from "../../lib/producers";

export const insurances = new Elysia({ prefix: "/insurances" })
  .use(betterAuthPlugin)
  .get(
    "/",
    async ({ user }) => {
      const list = await prisma.insurance.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      return { data: list };
    },
    {
      auth: true,
      detail: { tags: ["Insurances"], summary: "List current user's insurances" },
    }
  )
  .post(
    "/",
    async ({ user, body, set }) => {
      const type = body.type as InsuranceType;
      const interval = body.interval as PaymentInterval;

      if (!Object.values(InsuranceType).includes(type)) {
        set.status = 400;
        return { error: `Invalid insurance type: ${body.type}` };
      }
      if (!Object.values(PaymentInterval).includes(interval)) {
        set.status = 400;
        return { error: `Invalid interval: ${body.interval}` };
      }

      const insurance = await prisma.insurance.create({
        data: {
          userId: user.id,
          type,
          company: body.company,
          rate: body.rate,
          interval,
          number: body.number ?? `USER-${Date.now()}`,
        },
      });

      // Trigger a targeted proposal re-generation for this specific insurance type.
      // The RAG will evaluate whether the user should switch to a HUK product.
      await dispatchGenerateProposals({ userId: user.id, insuranceTypes: [type] });

      return { data: insurance };
    },
    {
      auth: true,
      body: InsuranceModel.createBody,
      detail: {
        tags: ["Insurances"],
        summary: "Add an existing insurance and trigger a targeted proposal refresh",
      },
    }
  )
  .delete(
    "/:id",
    async ({ user, params, set }) => {
      const insurance = await prisma.insurance.findUnique({
        where: { id: params.id },
      });

      if (!insurance) {
        set.status = 404;
        return { error: "Insurance not found" };
      }
      if (insurance.userId !== user.id) {
        set.status = 403;
        return { error: "Forbidden" };
      }

      await prisma.insurance.delete({ where: { id: params.id } });

      // Re-generate proposal for that type now that the coverage is gone
      await dispatchGenerateProposals({ userId: user.id, insuranceTypes: [insurance.type] });

      return { success: true };
    },
    {
      auth: true,
      params: InsuranceModel.params,
      detail: { tags: ["Insurances"], summary: "Delete an insurance and refresh proposals" },
    }
  );

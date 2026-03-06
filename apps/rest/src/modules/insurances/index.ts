import { Elysia, t } from "elysia";
import { prisma, InsuranceType, PaymentInterval } from "@repo/database";
import { betterAuthPlugin } from "../auth";
import { InsuranceModel } from "./model";
import { dispatchGenerateProposals } from "../../lib/producers";
import { uploadFile, deleteFile, objectNameFromUrl } from "../../lib/storage";

export const insurances = new Elysia({ prefix: "/insurances" })
  .use(betterAuthPlugin)
  .get(
    "/",
    async ({ user }) => {
      const list = await prisma.insurance.findMany({
        where: { userId: user.id },
        include: { documents: true },
        orderBy: { createdAt: "desc" },
      });
      return { data: list };
    },
    {
      auth: true,
      detail: { tags: ["Insurances"], summary: "List current user's insurances" },
    }
  )
  .get(
    "/:id",
    async ({ user, params, set }) => {
      const insurance = await prisma.insurance.findUnique({
        where: { id: params.id },
        include: { documents: { orderBy: { createdAt: "asc" } } },
      });

      if (!insurance) {
        set.status = 404;
        return { error: "Insurance not found" };
      }
      if (insurance.userId !== user.id) {
        set.status = 403;
        return { error: "Forbidden" };
      }

      return { data: insurance };
    },
    {
      auth: true,
      params: InsuranceModel.params,
      detail: { tags: ["Insurances"], summary: "Get single insurance with documents" },
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
  .post(
    "/:id/documents",
    async ({ user, params, request, set }) => {
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

      // Parse multipart form data from raw request
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        set.status = 400;
        return { error: "No file provided" };
      }

      const maxSize = 20 * 1024 * 1024; // 20 MB
      if (file.size > maxSize) {
        set.status = 400;
        return { error: "File too large (max 20 MB)" };
      }

      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        set.status = 400;
        return { error: "Only PDF, JPEG, PNG and WEBP files are allowed" };
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() ?? "bin";
      const objectName = `${user.id}/${params.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const url = await uploadFile({
        objectName,
        data: buffer,
        contentType: file.type,
        size: file.size,
      });

      const document = await prisma.document.create({
        data: {
          insuranceId: params.id,
          title: file.name,
          url,
        },
      });

      return { data: document };
    },
    {
      auth: true,
      params: InsuranceModel.params,
      detail: {
        tags: ["Insurances"],
        summary: "Upload a document for an insurance (multipart/form-data, field: file)",
      },
    }
  )
  .delete(
    "/:id/documents/:docId",
    async ({ user, params, set }) => {
      const document = await prisma.document.findUnique({
        where: { id: params.docId },
        include: { insurance: true },
      });

      if (!document) {
        set.status = 404;
        return { error: "Document not found" };
      }
      if (document.insurance.userId !== user.id) {
        set.status = 403;
        return { error: "Forbidden" };
      }

      // Delete from MinIO
      try {
        const objectName = objectNameFromUrl(document.url);
        await deleteFile(objectName);
      } catch {
        // Continue even if MinIO deletion fails (file may already be gone)
      }

      await prisma.document.delete({ where: { id: params.docId } });

      return { success: true };
    },
    {
      auth: true,
      params: t.Object({ id: t.String(), docId: t.String() }),
      detail: { tags: ["Insurances"], summary: "Delete an insurance document" },
    }
  )
  .delete(
    "/:id",
    async ({ user, params, set }) => {
      const insurance = await prisma.insurance.findUnique({
        where: { id: params.id },
        include: { documents: true },
      });

      if (!insurance) {
        set.status = 404;
        return { error: "Insurance not found" };
      }
      if (insurance.userId !== user.id) {
        set.status = 403;
        return { error: "Forbidden" };
      }

      // Delete all documents from MinIO
      for (const doc of insurance.documents) {
        try {
          await deleteFile(objectNameFromUrl(doc.url));
        } catch {
          // Continue
        }
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

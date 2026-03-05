import { Elysia } from "elysia";
import { prisma, JobStatus } from "@repo/database";
import { env } from "@repo/env/server";
import { createExternalApiJobProducer } from "@repo/message-queue";
import { betterAuthPlugin } from "../auth";
import { JobModel } from "./model";

const jobProducer = createExternalApiJobProducer(env.BULLMQ_REDIS_URL);

export const jobs = new Elysia({ prefix: "/jobs" })
  .use(betterAuthPlugin)
  .get(
    "/",
    async ({ user }) => {
      const jobList = await prisma.job.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return { data: jobList };
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

      if (job.userId !== user.id) {
        set.status = 403;
        return { error: "Forbidden" };
      }

      return { data: job };
    },
    {
      auth: true,
      params: JobModel.params,
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
      body: JobModel.createBody,
      detail: { tags: ["Jobs"], summary: "Create a new job" },
    }
  );

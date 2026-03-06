import { env } from "@repo/env/server";
import { createExternalApiJobProducer } from "@repo/message-queue";
import { prisma, JobStatus } from "@repo/database";

export const jobProducer = createExternalApiJobProducer(env.BULLMQ_REDIS_URL);

/**
 * Creates a DB job record and dispatches a generate-proposals queue job.
 * If insuranceTypes is omitted, all recommended types will be regenerated.
 */
export async function dispatchGenerateProposals(params: {
  userId: string;
  insuranceTypes?: string[];
}): Promise<void> {
  const { userId, insuranceTypes } = params;

  const dbJob = await prisma.job.create({
    data: {
      type: "generate-proposals",
      payload: { userId, insuranceTypes: insuranceTypes ?? [] },
      status: JobStatus.PENDING,
      userId,
    },
  });

  await jobProducer.addGenerateProposalsJob(
    { userId, insuranceTypes },
    userId,
    dbJob.id
  );
}

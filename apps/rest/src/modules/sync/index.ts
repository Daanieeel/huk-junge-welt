import { Elysia, t } from "elysia";
import { prisma } from "@repo/database";
import { betterAuthPlugin } from "../auth";

export const sync = new Elysia({ prefix: "/sync" })
  .use(betterAuthPlugin)
  .get(
    "/changes",
    async ({ user, query }) => {
      const since = query.since ? new Date(query.since) : new Date(0);

      const [jobList, notificationList] = await Promise.all([
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
        ...jobList.map((j) => j.updatedAt),
        ...notificationList.map((n) => n.createdAt),
      ];
      const newCursor =
        allTimestamps.length > 0
          ? new Date(Math.max(...allTimestamps.map((d) => d.getTime())))
          : since;

      return {
        data: {
          jobs: jobList,
          notifications: notificationList,
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
  );

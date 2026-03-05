import { Elysia } from "elysia";
import { prisma } from "@repo/database";
import { betterAuthPlugin } from "../auth";
import { NotificationModel } from "./model";

export const notifications = new Elysia({ prefix: "/notifications" })
  .use(betterAuthPlugin)
  .get(
    "/",
    async ({ user, query }) => {
      const notificationList = await prisma.notification.findMany({
        where: {
          userId: user.id,
          read: query.unreadOnly ? false : undefined,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return { data: notificationList };
    },
    {
      auth: true,
      query: NotificationModel.listQuery,
      detail: { tags: ["Notifications"], summary: "Get notifications for the current user" },
    }
  )
  .patch(
    "/:id/read",
    async ({ user, params, set }) => {
      const notification = await prisma.notification.findUnique({
        where: { id: params.id },
      });

      if (!notification) {
        set.status = 404;
        return { error: "Notification not found" };
      }

      if (notification.userId !== user.id) {
        set.status = 403;
        return { error: "Forbidden" };
      }

      const updated = await prisma.notification.update({
        where: { id: params.id },
        data: { read: true },
      });
      return { data: updated };
    },
    {
      auth: true,
      params: NotificationModel.params,
      detail: { tags: ["Notifications"], summary: "Mark notification as read" },
    }
  )
  .patch(
    "/mark-all-read",
    async ({ user }) => {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
      return { success: true };
    },
    {
      auth: true,
      detail: { tags: ["Notifications"], summary: "Mark all notifications as read" },
    }
  );

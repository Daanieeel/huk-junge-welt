import { t } from "elysia";

export const NotificationModel = {
  listQuery: t.Object({
    unreadOnly: t.Optional(t.Boolean()),
  }),

  params: t.Object({ id: t.String() }),
};

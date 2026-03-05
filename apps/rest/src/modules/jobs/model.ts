import { t } from "elysia";

export const JobModel = {
  createBody: t.Object({
    type: t.String(),
    payload: t.Object({
      endpoint: t.Optional(t.String()),
      params: t.Optional(t.Record(t.String(), t.String())),
    }),
    priority: t.Optional(t.Number()),
  }),

  params: t.Object({ id: t.String() }),
};

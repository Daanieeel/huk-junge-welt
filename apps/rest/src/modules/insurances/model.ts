import { t } from "elysia";

export const InsuranceModel = {
  createBody: t.Object({
    type: t.String(),
    company: t.String({ minLength: 1 }),
    rate: t.Number({ minimum: 0 }),
    interval: t.String(),
    number: t.Optional(t.String()),
  }),
  params: t.Object({
    id: t.String(),
  }),
};

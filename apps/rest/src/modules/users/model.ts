import { t } from "elysia";

export const UserModel = {
  updateBody: t.Object({
    name: t.Optional(t.String()),
    image: t.Optional(t.String()),
  }),
};

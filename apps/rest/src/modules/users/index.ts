import { Elysia } from "elysia";
import { prisma } from "@repo/database";
import { betterAuthPlugin } from "../auth";
import { UserModel } from "./model";

export const users = new Elysia({ prefix: "/users" })
  .use(betterAuthPlugin)
  .get("/me", async ({ user }) => ({ data: user }), {
    auth: true,
    detail: { tags: ["Users"], summary: "Get current user profile" },
  })
  .patch(
    "/me",
    async ({ user, body }) => {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name: body.name, image: body.image },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return { data: updated };
    },
    {
      auth: true,
      body: UserModel.updateBody,
      detail: { tags: ["Users"], summary: "Update current user profile" },
    }
  );

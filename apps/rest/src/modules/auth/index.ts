import { Elysia } from "elysia";
import { auth } from "@repo/auth";

// ============================================================================
// Better Auth Elysia Plugin
//
// Mounts the auth handler at /api/auth/* and exposes a typed macro that
// resolves the current session. Routes decorated with { auth: true } will
// receive `user` and `session` in their context; unauthenticated requests
// are rejected with HTTP 401 before the route handler runs.
// ============================================================================

export const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);
        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });

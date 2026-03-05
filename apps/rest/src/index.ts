import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { env } from "@repo/env/server";
import { prisma } from "@repo/database";

import { betterAuthPlugin } from "./modules/auth";
import { users } from "./modules/users";
import { jobs } from "./modules/jobs";
import { notifications } from "./modules/notifications";
import { sync } from "./modules/sync";
import { dashboard } from "./modules/dashboard";
import { home } from "./modules/home";
import { questionnaire } from "./modules/questionnaire";


const app = new Elysia()
  .use(
    cors({
      origin: env.WEB_URL,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(betterAuthPlugin)

  // Error handling
  .onError(({ code, error, set }): { error: string; details?: string } | undefined => {
    console.error(`Error [${code}]:`, error);

    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "Validation failed", details: error.message };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Not found" };
    }

    set.status = 500;
    return { error: "Internal server error" };
  })

  // Health check (public)
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))

  // Feature modules
  .use(users)
  .use(jobs)
  .use(notifications)
  .use(sync)
  .use(dashboard)
  .use(home)
  .use(questionnaire)

  .listen(env.REST_PORT);

console.log(`🦊 REST API is running at ${app.server?.hostname}:${app.server?.port}`);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down REST API...");
  await prisma.$disconnect();
  process.exit(0);
});

export type App = typeof app;
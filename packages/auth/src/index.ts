import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@repo/database";

// Env vars are read lazily at runtime (not import time) to support monorepo
// where the env package validates on first access.
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const auth = betterAuth({
  // These are read at call time, not module load time
  get baseURL() {
    return getEnv("BETTER_AUTH_URL");
  },
  get secret() {
    return getEnv("BETTER_AUTH_SECRET");
  },

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh if older than 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes client-side cache
    },
  },

  get trustedOrigins() {
    const webUrl = process.env["WEB_URL"] ?? "http://localhost:3000";
    return [webUrl];
  },

  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      httpOnly: true,
    },
  },
});

// Inferred types from the auth instance
export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;

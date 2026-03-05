// Server-only auth helpers for Next.js Server Components and middleware.
// These functions call the REST API – do NOT import this file in client
// components (use lib/auth-client.ts instead).

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientEnv } from "@repo/env/client";

type Session = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: string;
    ipAddress: string | null;
    userAgent: string | null;
  };
};

// ---------------------------------------------------------------------------
// getServerSession
//
// Fetches the current session from the REST API using the incoming request's
// cookie header. Safe to call in Server Components and Route Handlers.
// Returns null when the user is not authenticated.
// ---------------------------------------------------------------------------
export async function getServerSession(): Promise<Session | null> {
  const cookieHeader = (await headers()).get("cookie") ?? "";

  const res = await fetch(
    `${clientEnv.NEXT_PUBLIC_REST_URL}/api/auth/get-session`,
    {
      headers: { cookie: cookieHeader },
      // Opt out of Next.js fetch cache – sessions must always be fresh
      cache: "no-store",
    }
  );

  if (!res.ok) return null;

  const data: unknown = await res.json();
  if (!data || typeof data !== "object") return null;

  return data as Session;
}

// ---------------------------------------------------------------------------
// requireServerSession
//
// Like getServerSession, but redirects to /login if the user is not
// authenticated. Use in protected Server Components / layouts.
// ---------------------------------------------------------------------------
export async function requireServerSession(
  redirectTo = "/sign-in"
): Promise<Session> {
  const session = await getServerSession();
  if (!session) redirect(redirectTo);
  return session;
}

// ---------------------------------------------------------------------------
// getSessionToken
//
// Returns only the raw session token string, useful when you need to
// connect to the WebSocket from a server context.
// ---------------------------------------------------------------------------
export async function getSessionToken(): Promise<string | null> {
  const session = await getServerSession();
  return session?.session.token ?? null;
}

// Server-only API helpers for Next.js Server Components.
// These functions call the REST API forwarding the incoming request's cookie header
// so that authenticated routes work correctly from server-side code.
// Do NOT import this file in client components.

import { headers } from "next/headers";
import { clientEnv } from "@repo/env/client";
import type { Dashboard } from "./api-client";
import { DashboardSchema } from "./api-client";

async function serverRequest<T>(endpoint: string): Promise<T> {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${clientEnv.NEXT_PUBLIC_REST_URL}${endpoint}`, {
    headers: { cookie: cookieHeader, "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Server API error ${res.status} for ${endpoint}`);
  }

  return res.json() as Promise<T>;
}

export async function getServerDashboard(): Promise<Dashboard | null> {
  try {
    const response = await serverRequest<{ data: unknown }>("/dashboard");
    return DashboardSchema.parse(response.data);
  } catch {
    return null;
  }
}

// Server-only API helpers for Next.js Server Components.
// Uses Eden Treaty to call the REST API, forwarding the incoming request's
// cookie header so that authenticated routes work correctly from server-side code.
// Do NOT import this file in client components.

import { headers } from "next/headers";
import { treaty } from "@elysiajs/eden";
import type { App } from "@app/rest";
import type { Dashboard } from "./api-client";
import { DashboardSchema } from "./api-client";

const REST_URL = process.env.NEXT_PUBLIC_REST_URL ?? "http://localhost:3001";

/**
 * Creates an Eden Treaty client that forwards the current request's cookies,
 * enabling authenticated calls from Next.js Server Components.
 */
async function getServerApi() {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  return treaty<App>(REST_URL, {
    headers: { cookie: cookieHeader },
    fetch: { cache: "no-store" },
  });
}

export async function getServerDashboard(): Promise<Dashboard | null> {
  try {
    const api = await getServerApi();
    const { data, error } = await api.dashboard.get();
    if (error || !data || !("data" in data)) return null;
    return DashboardSchema.parse(data.data);
  } catch {
    return null;
  }
}

export async function getServerQuestionnaire(): Promise<{ id: string } | null> {
  try {
    const api = await getServerApi();
    const { data, error } = await api.questionnaire.get();
    if (error || !data || !("data" in data)) return null;
    return data.data ?? null;
  } catch {
    return null;
  }
}

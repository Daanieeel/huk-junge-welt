/**
 * Eden Treaty client – type-safe RPC interface to the Elysia REST API.
 *
 * This module is intentionally thin: it only creates the treaty proxy.
 * All actual HTTP calls happen inside TanStack Query hooks so they run in
 * the browser (client components) and benefit from the query cache.
 *
 * The `App` type is imported as a **type-only** import – it is erased at
 * compile time and never bundled into the client, so there is no risk of
 * leaking server-only code.
 */

import { treaty } from "@elysiajs/eden";
import type { App } from "@app/rest";

const REST_URL =
  process.env.NEXT_PUBLIC_REST_URL ?? "http://localhost:3001";

export const api = treaty<App>(REST_URL, {
  fetch: {
    credentials: "include",
  },
});

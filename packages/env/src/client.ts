import { z } from "zod";

/**
 * Client-side environment variables schema
 * These are exposed to the browser (NEXT_PUBLIC_*)
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_REST_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_WEBSOCKET_URL: z.string().url().default("ws://localhost:3002"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

declare const window: Window & { __ENV__?: Record<string, unknown> };

function createClientEnv(): ClientEnv {
  // In browser, use window.__ENV__ if available, otherwise use process.env
  const envSource =
    typeof window !== "undefined" && window.__ENV__
      ? window.__ENV__
      : (typeof process !== "undefined" ? process.env : {});

  const parsed = clientEnvSchema.safeParse(envSource);

  if (!parsed.success) {
    console.error(
      "❌ Invalid client environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid client environment variables");
  }

  return parsed.data;
}

// Lazy initialization
let _clientEnv: ClientEnv | undefined;

export function getClientEnv(): ClientEnv {
  if (!_clientEnv) {
    _clientEnv = createClientEnv();
  }
  return _clientEnv;
}

// For direct access
export const clientEnv = new Proxy({} as ClientEnv, {
  get(_, prop: string) {
    return getClientEnv()[prop as keyof ClientEnv];
  },
});

import { z } from "zod";

/**
 * Server-side environment variables schema
 * These are only available on the server
 */
export const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // BullMQ
  BULLMQ_REDIS_URL: z.string().url(),

  // Pub/Sub
  PUBSUB_REDIS_URL: z.string().url(),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3001"),
  WEB_URL: z.string().url().default("http://localhost:3000"),

  // Ports
  REST_PORT: z.coerce.number().default(3001),
  WEBSOCKET_PORT: z.coerce.number().default(3002),
  WEB_PORT: z.coerce.number().default(3000),

  // RAG Webhook (only required by the worker process)
  RAG_WEBHOOK_URL: z.string().url().optional(),
  RAG_WEBHOOK_AUTH: z.string().optional(),

  // MinIO (S3-compatible object storage for insurance documents)
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z.string().transform((v) => v === "true").default("false"),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  MINIO_BUCKET: z.string().default("huk-documents"),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function createEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

// Lazy initialization to avoid issues during build time
let _env: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (!_env) {
    _env = createEnv();
  }
  return _env;
}

// For direct access (validates on first access)
export const env = new Proxy({} as ServerEnv, {
  get(_, prop: string) {
    return getServerEnv()[prop as keyof ServerEnv];
  },
});

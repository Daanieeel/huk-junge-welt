import { z } from "zod";

// ============================================================================
// Configuration
// ============================================================================

let baseUrl = "http://localhost:3001";

export function setApiBaseUrl(url: string): void {
  baseUrl = url;
}

// ============================================================================
// Types
// ============================================================================

// User
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

// Job
export const JobSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.record(z.unknown()),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
  result: z.record(z.unknown()).nullable().optional(),
  error: z.string().nullable().optional(),
  attempts: z.number(),
  maxAttempts: z.number(),
  priority: z.number(),
  progress: z.number(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
});

export type Job = z.infer<typeof JobSchema>;

// Notification
export const NotificationSchema = z.object({
  id: z.string(),
  type: z.enum(["JOB_STARTED", "JOB_PROGRESS", "JOB_COMPLETED", "JOB_FAILED", "SYSTEM"]),
  title: z.string(),
  message: z.string(),
  data: z.record(z.unknown()).nullable().optional(),
  read: z.boolean(),
  userId: z.string(),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// API Response wrapper
const _ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
  });

const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

// ============================================================================
// API Client
// ============================================================================

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const parsed = ApiErrorSchema.safeParse(data);
    if (parsed.success) {
      throw new ApiError(parsed.data.error, response.status, parsed.data.details);
    }
    throw new ApiError("Unknown error", response.status);
  }

  return data as T;
}

// ============================================================================
// User API
// ============================================================================

export const usersApi = {
  list: async (): Promise<User[]> => {
    const response = await request<{ data: unknown[] }>("/users");
    return z.array(UserSchema).parse(response.data);
  },

  get: async (id: string): Promise<User> => {
    const response = await request<{ data: unknown }>(`/users/${id}`);
    return UserSchema.parse(response.data);
  },

  create: async (input: { email: string; name?: string }): Promise<User> => {
    const response = await request<{ data: unknown }>("/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return UserSchema.parse(response.data);
  },
};

// ============================================================================
// Jobs API
// ============================================================================

export const jobsApi = {
  list: async (userId?: string): Promise<Job[]> => {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const response = await request<{ data: unknown[] }>(`/jobs${params}`);
    return z.array(JobSchema).parse(response.data);
  },

  get: async (id: string): Promise<Job> => {
    const response = await request<{ data: unknown }>(`/jobs/${id}`);
    return JobSchema.parse(response.data);
  },

  create: async (input: {
    type: string;
    payload: { endpoint?: string; params?: Record<string, string> };
    userId: string;
    priority?: number;
  }): Promise<Job & { queueJobId: string; correlationId: string }> => {
    const response = await request<{
      data: Job & { queueJobId: string; correlationId: string };
    }>("/jobs", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return response.data;
  },
};

// ============================================================================
// Notifications API
// ============================================================================

export const notificationsApi = {
  list: async (
    userId: string,
    unreadOnly?: boolean
  ): Promise<Notification[]> => {
    const params = new URLSearchParams({ userId });
    if (unreadOnly) {
      params.set("unreadOnly", "true");
    }
    const response = await request<{ data: unknown[] }>(
      `/notifications?${params}`
    );
    return z.array(NotificationSchema).parse(response.data);
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await request<{ data: unknown }>(
      `/notifications/${id}/read`,
      {
        method: "PATCH",
      }
    );
    return NotificationSchema.parse(response.data);
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await request("/notifications/mark-all-read", {
      method: "PATCH",
      body: JSON.stringify({ userId }),
    });
  },
};

// ============================================================================
// Sync API
// ============================================================================

export interface SyncChanges {
  jobs: Job[];
  notifications: Notification[];
  cursor: string;
}

export const syncApi = {
  getChanges: async (userId: string, since?: string): Promise<SyncChanges> => {
    const params = new URLSearchParams({ userId });
    if (since) {
      params.set("since", since);
    }
    const response = await request<{ data: SyncChanges }>(
      `/sync/changes?${params}`
    );
    return response.data;
  },
};

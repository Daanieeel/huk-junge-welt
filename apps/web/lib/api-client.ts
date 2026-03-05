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
    credentials: "include",
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

// ============================================================================
// Dashboard API
// ============================================================================

export const InsuranceTypeLabels: Record<string, string> = {
  PRIVATHAFTPFLICHT: "Privathaftpflicht",
  HAUSRAT: "Hausrat",
  KFZ: "Kfz-Versicherung",
  BERUFSUNFAEHIGKEIT: "Berufsunfähigkeit",
  ZAHNZUSATZ: "Zahnzusatz",
  PFLEGE: "Pflegeversicherung",
  UNFALL: "Unfallversicherung",
  RECHTSSCHUTZ: "Rechtsschutz",
  KRANKENZUSATZ: "Krankenzusatz",
};

export const InsuranceTypeIcons: Record<string, string> = {
  PRIVATHAFTPFLICHT: "🛡️",
  HAUSRAT: "🏠",
  KFZ: "🚗",
  BERUFSUNFAEHIGKEIT: "💼",
  ZAHNZUSATZ: "🦷",
  PFLEGE: "🏥",
  UNFALL: "⚡",
  RECHTSSCHUTZ: "⚖️",
  KRANKENZUSATZ: "💊",
};

export const CoverageItemSchema = z.object({
  type: z.string(),
  status: z.enum(["covered", "recommended", "not_covered"]),
  coverageScore: z.number().nullable(),
  insurance: z
    .object({
      id: z.string(),
      company: z.string(),
      rate: z.string(),
      interval: z.string(),
    })
    .nullable(),
  proposal: z
    .object({
      id: z.string(),
      company: z.string(),
      rate: z.string(),
      interval: z.string(),
      priority: z.number().nullable(),
      reason: z.string().nullable(),
    })
    .nullable(),
});

export type CoverageItem = z.infer<typeof CoverageItemSchema>;

export const DashboardSchema = z.object({
  user: z.object({ name: z.string().nullable(), email: z.string() }),
  score: z.number(),
  scoreLabel: z.string(),
  totalRecommended: z.number(),
  totalCovered: z.number(),
  hasQuestionnaire: z.boolean(),
  items: z.array(CoverageItemSchema),
});

export type Dashboard = z.infer<typeof DashboardSchema>;

export const dashboardApi = {
  get: async (): Promise<Dashboard> => {
    const response = await request<{ data: unknown }>("/dashboard");
    return DashboardSchema.parse(response.data);
  },
};

// ============================================================================
// Home API
// ============================================================================

export const CoverageAssessmentSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(["MISSING", "WEAK", "ADEQUATE", "GOOD", "EXCELLENT"]),
  score: z.number(),
  priority: z.number(),
  notes: z.string().nullable(),
});

export type CoverageAssessmentItem = z.infer<typeof CoverageAssessmentSchema>;

export const HomeDataSchema = z.object({
  user: z.object({
    name: z.string().nullable(),
    email: z.string(),
  }),
  score: z.number(),
  coverageItems: z.array(CoverageAssessmentSchema),
});

export type HomeData = z.infer<typeof HomeDataSchema>;

export const homeApi = {
  get: async (): Promise<HomeData> => {
    const response = await request<{ data: unknown }>("/home");
    return HomeDataSchema.parse(response.data);
  },
};

// ============================================================================
// Questionnaire API
// ============================================================================

export const QuestionnaireSchema = z.object({
  id: z.string(),
  name: z.string(),
  dateOfBirth: z.string(),
  jobType: z.string(),
  vehicleTypes: z.array(z.string()),
  relationshipStatus: z.string(),
  childrenCount: z.number(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type QuestionnaireData = z.infer<typeof QuestionnaireSchema>;

export type QuestionnaireInput = {
  name: string;
  dateOfBirth: string;
  jobType: string;
  vehicleTypes: string[];
  relationshipStatus: string;
  childrenCount: number;
};

export const questionnaireApi = {
  get: async (): Promise<QuestionnaireData | null> => {
    const response = await request<{ data: unknown }>("/questionnaire");
    if (!response || (response as { data: unknown }).data === null) return null;
    return QuestionnaireSchema.parse((response as { data: unknown }).data);
  },

  submit: async (input: QuestionnaireInput): Promise<QuestionnaireData> => {
    const response = await request<{ data: unknown }>("/questionnaire", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return QuestionnaireSchema.parse((response as { data: unknown }).data);
  },
};

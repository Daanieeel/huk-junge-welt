// Re-export Prisma Client and types
export { prisma, type PrismaClient } from "./client";

// Re-export all generated types from Prisma
export {
  JobStatus,
  NotificationType,
  Prisma,
  type Account,
  type Job,
  type Notification,
  type Session,
  type SyncCursor,
  type User,
  type Verification,
} from "../generated/client";

// Input types for creating entities
import type { Prisma } from "../generated/client";

export type CreateUserInput = Prisma.UserCreateInput;
export type UpdateUserInput = Prisma.UserUpdateInput;

export type CreateJobInput = Prisma.JobCreateInput;
export type UpdateJobInput = Prisma.JobUpdateInput;

export type CreateNotificationInput = Prisma.NotificationCreateInput;
export type UpdateNotificationInput = Prisma.NotificationUpdateInput;

// Select types for queries
export type UserSelect = Prisma.UserSelect;
export type JobSelect = Prisma.JobSelect;
export type NotificationSelect = Prisma.NotificationSelect;

// Where types for filtering
export type UserWhereInput = Prisma.UserWhereInput;
export type JobWhereInput = Prisma.JobWhereInput;
export type NotificationWhereInput = Prisma.NotificationWhereInput;

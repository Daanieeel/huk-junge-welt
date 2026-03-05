import { Elysia } from "elysia";
import {
  prisma,
  type JobType,
  type VehicleType,
  type RelationshipStatus,
  type HousingType,
  type HousingOwnershipType,
  type GoalType,
} from "@repo/database";
import { betterAuthPlugin } from "../auth";
import { QuestionnaireModel } from "./model";

function buildFields(body: {
  name: string;
  dateOfBirth: string;
  jobType: string;
  jobExpiryDate?: string | null;
  salary?: number | null;
  vehicleTypes: string[];
  streetName?: string | null;
  streetNumber?: string | null;
  zipcode?: string | null;
  city?: string | null;
  housingType?: string | null;
  housingOwnershipType?: string | null;
  relationshipStatus: string;
  childrenCount: number;
  goal?: string | null;
}) {
  return {
    name: body.name,
    dateOfBirth: new Date(body.dateOfBirth),
    jobType: body.jobType as JobType,
    jobExpiryDate: body.jobExpiryDate ? new Date(body.jobExpiryDate) : null,
    salary: body.salary != null ? body.salary : null,
    vehicleTypes: body.vehicleTypes as VehicleType[],
    streetName: body.streetName ?? null,
    streetNumber: body.streetNumber ?? null,
    zipcode: body.zipcode ?? null,
    city: body.city ?? null,
    housingType: body.housingType ? (body.housingType as HousingType) : null,
    housingOwnershipType: body.housingOwnershipType
      ? (body.housingOwnershipType as HousingOwnershipType)
      : null,
    relationshipStatus: body.relationshipStatus as RelationshipStatus,
    childrenCount: body.childrenCount,
    goal: body.goal ? (body.goal as GoalType) : null,
  };
}

export const questionnaire = new Elysia({ prefix: "/questionnaire" })
  .use(betterAuthPlugin)
  .get(
    "/",
    async ({ user }) => {
      const result = await prisma.questionnaire.findUnique({
        where: { userId: user.id },
      });
      return { data: result };
    },
    {
      auth: true,
      detail: { tags: ["Questionnaire"], summary: "Get questionnaire for current user" },
    }
  )
  .post(
    "/",
    async ({ user, body }) => {
      const fields = buildFields(body);
      const result = await prisma.questionnaire.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...fields },
        update: fields,
      });
      return { data: result };
    },
    {
      auth: true,
      body: QuestionnaireModel.body,
      detail: { tags: ["Questionnaire"], summary: "Create or update questionnaire" },
    }
  )
  .put(
    "/",
    async ({ user, body, set }) => {
      const existing = await prisma.questionnaire.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!existing) {
        set.status = 404;
        return { error: "Questionnaire not found" };
      }

      const result = await prisma.questionnaire.update({
        where: { userId: user.id },
        data: buildFields(body),
      });
      return { data: result };
    },
    {
      auth: true,
      body: QuestionnaireModel.body,
      detail: { tags: ["Questionnaire"], summary: "Overwrite existing questionnaire" },
    }
  );

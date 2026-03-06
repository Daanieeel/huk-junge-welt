import { t } from "elysia";

export const QuestionnaireModel = {
  body: t.Object({
    dateOfBirth: t.String(),
    jobType: t.String(),
    jobExpiryDate: t.Optional(t.Nullable(t.String())),
    salary: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
    vehicleTypes: t.Array(t.String()),
    streetName: t.Optional(t.Nullable(t.String())),
    streetNumber: t.Optional(t.Nullable(t.String())),
    zipcode: t.Optional(t.Nullable(t.String())),
    city: t.Optional(t.Nullable(t.String())),
    housingType: t.Optional(t.Nullable(t.String())),
    housingOwnershipType: t.Optional(t.Nullable(t.String())),
    relationshipStatus: t.String(),
    childrenCount: t.Number({ minimum: 0 }),
    goal: t.Optional(t.Nullable(t.String())),
  }),
};

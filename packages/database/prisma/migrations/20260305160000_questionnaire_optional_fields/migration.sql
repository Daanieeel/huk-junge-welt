-- Make address, salary, housingType and goal fields optional in questionnaire
ALTER TABLE "questionnaire"
  ALTER COLUMN "streetName" DROP NOT NULL,
  ALTER COLUMN "streetNumber" DROP NOT NULL,
  ALTER COLUMN "zipcode" DROP NOT NULL,
  ALTER COLUMN "city" DROP NOT NULL,
  ALTER COLUMN "salary" DROP NOT NULL,
  ALTER COLUMN "housingType" DROP NOT NULL,
  ALTER COLUMN "goal" DROP NOT NULL;

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('PRIVATHAFTPFLICHT', 'HAUSRAT', 'KFZ', 'BERUFSUNFAEHIGKEIT', 'ZAHNZUSATZ', 'PFLEGE', 'UNFALL', 'RECHTSSCHUTZ', 'AUSLANDS_KRANKEN');

-- CreateEnum
CREATE TYPE "PaymentInterval" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('SINGLE', 'IN_A_RELATIONSHIP', 'MARRIED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('NONE', 'SCOOTER', 'CAR', 'MOTORCYCLE', 'PUBLIC_TRANSPORT');

-- CreateEnum
CREATE TYPE "HousingType" AS ENUM ('SHARED_ROOM', 'APARTMENT', 'HOUSE');

-- CreateEnum
CREATE TYPE "HousingOwnershipType" AS ENUM ('RENTING', 'MORTGAGE', 'OWNER');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('STUDENT', 'APPRENTICE', 'EMPLOYEE', 'SEARCHING');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('CHEAPEST', 'BEST_VALUE', 'COMPREHENSIVE');

-- CreateEnum
CREATE TYPE "CoverageStatus" AS ENUM ('MISSING', 'WEAK', 'ADEQUATE', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('GERMAN', 'ENGLISH');

-- DropIndex
DROP INDEX "sync_cursors_user_id_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'GERMAN';

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance" (
    "id" TEXT NOT NULL,
    "type" "InsuranceType" NOT NULL,
    "company" TEXT NOT NULL DEFAULT 'Unsere Partner-Versicherung AG',
    "rate" DECIMAL(10,2) NOT NULL,
    "interval" "PaymentInterval" NOT NULL,
    "number" TEXT NOT NULL,
    "coverageScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "insuranceId" TEXT NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal" (
    "id" TEXT NOT NULL,
    "type" "InsuranceType" NOT NULL,
    "company" TEXT NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "interval" "PaymentInterval" NOT NULL DEFAULT 'MONTHLY',
    "templateId" TEXT NOT NULL,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER,
    "reason" TEXT,
    "keyBenefits" TEXT[],
    "actionSuggestion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire" (
    "id" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "streetName" TEXT,
    "streetNumber" TEXT,
    "zipcode" TEXT,
    "city" TEXT,
    "jobType" "JobType" NOT NULL,
    "jobExpiryDate" DATE,
    "salary" DECIMAL(10,2),
    "relationshipStatus" "RelationshipStatus" NOT NULL,
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "vehicleTypes" "VehicleType"[],
    "housingType" "HousingType",
    "housingOwnershipType" "HousingOwnershipType",
    "goal" "GoalType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coverage_assessments" (
    "id" TEXT NOT NULL,
    "type" "InsuranceType" NOT NULL,
    "status" "CoverageStatus" NOT NULL DEFAULT 'MISSING',
    "score" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "coverage_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_id_provider_id_key" ON "accounts"("account_id", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_userId_key" ON "questionnaire"("userId");

-- CreateIndex
CREATE INDEX "coverage_assessments_user_id_idx" ON "coverage_assessments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "coverage_assessments_user_id_type_key" ON "coverage_assessments"("user_id", "type");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance" ADD CONSTRAINT "insurance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "insurance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire" ADD CONSTRAINT "questionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage_assessments" ADD CONSTRAINT "coverage_assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

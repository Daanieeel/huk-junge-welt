-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('PRIVATHAFTPFLICHT', 'HAUSRAT', 'KFZ', 'BERUFSUNFAEHIGKEIT', 'ZAHNZUSATZ', 'PFLEGE', 'UNFALL', 'RECHTSSCHUTZ', 'KRANKENZUSATZ');

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
CREATE TYPE "Language" AS ENUM ('GERMAN', 'ENGLISH');

-- DropIndex
DROP INDEX "sync_cursors_user_id_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'GERMAN';

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
    "company" TEXT NOT NULL DEFAULT 'Unsere Partner-Versicherung AG',
    "rate" DECIMAL(10,2) NOT NULL,
    "interval" "PaymentInterval" NOT NULL DEFAULT 'MONTHLY',
    "templateId" TEXT NOT NULL,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "streetName" TEXT NOT NULL,
    "streetNumber" TEXT NOT NULL,
    "zipcode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL,
    "jobExpiryDate" DATE,
    "salary" DECIMAL(10,2) NOT NULL,
    "relationshipStatus" "RelationshipStatus" NOT NULL,
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "vehicleTypes" "VehicleType"[],
    "housingType" "HousingType" NOT NULL,
    "housingOwnershipType" "HousingOwnershipType",
    "goal" "GoalType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_userId_key" ON "questionnaire"("userId");

-- AddForeignKey
ALTER TABLE "insurance" ADD CONSTRAINT "insurance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "insurance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire" ADD CONSTRAINT "questionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

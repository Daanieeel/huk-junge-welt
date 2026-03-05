-- CreateEnum
CREATE TYPE "CoverageStatus" AS ENUM ('MISSING', 'WEAK', 'ADEQUATE', 'GOOD', 'EXCELLENT');

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
CREATE UNIQUE INDEX "coverage_assessments_user_id_type_key" ON "coverage_assessments"("user_id", "type");

-- CreateIndex
CREATE INDEX "coverage_assessments_user_id_idx" ON "coverage_assessments"("user_id");

-- AddForeignKey
ALTER TABLE "coverage_assessments" ADD CONSTRAINT "coverage_assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

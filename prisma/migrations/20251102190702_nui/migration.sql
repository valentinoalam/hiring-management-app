/*
  Warnings:

  - You are about to drop the column `recruiter_id` on the `jobs` table. All the data in the column will be lost.
  - Made the column `salary_min` on table `jobs` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."jobs_recruiter_id_idx";

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "recruiter_id",
ALTER COLUMN "salary_min" SET NOT NULL;

-- CreateIndex
CREATE INDEX "jobs_author_id_idx" ON "jobs"("author_id");

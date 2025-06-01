-- AlterTable
ALTER TABLE "tour_requests" ADD COLUMN     "isLegacyRange" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requestDate" TIMESTAMP(3),
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "tour_requests_requestDate_idx" ON "tour_requests"("requestDate");

-- CreateIndex
CREATE INDEX "tour_requests_isLegacyRange_idx" ON "tour_requests"("isLegacyRange");

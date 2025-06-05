-- CreateEnum
CREATE TYPE "HoldStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'DECLINED');

-- CreateTable
CREATE TABLE "hold_requests" (
    "id" TEXT NOT NULL,
    "showId" TEXT,
    "showRequestId" TEXT,
    "requestedById" TEXT NOT NULL,
    "respondedById" TEXT,
    "duration" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "customMessage" TEXT,
    "status" "HoldStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hold_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hold_requests_showId_idx" ON "hold_requests"("showId");

-- CreateIndex
CREATE INDEX "hold_requests_showRequestId_idx" ON "hold_requests"("showRequestId");

-- CreateIndex
CREATE INDEX "hold_requests_requestedById_idx" ON "hold_requests"("requestedById");

-- CreateIndex
CREATE INDEX "hold_requests_status_idx" ON "hold_requests"("status");

-- CreateIndex
CREATE INDEX "hold_requests_expiresAt_idx" ON "hold_requests"("expiresAt");

-- CreateIndex
CREATE INDEX "hold_requests_createdAt_idx" ON "hold_requests"("createdAt");

-- AddForeignKey
ALTER TABLE "hold_requests" ADD CONSTRAINT "hold_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hold_requests" ADD CONSTRAINT "hold_requests_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hold_requests" ADD CONSTRAINT "hold_requests_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hold_requests" ADD CONSTRAINT "hold_requests_showRequestId_fkey" FOREIGN KEY ("showRequestId") REFERENCES "show_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

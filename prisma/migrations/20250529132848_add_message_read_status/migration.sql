/*
  Warnings:

  - Made the column `startDate` on table `tour_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endDate` on table `tour_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'PENDING', 'INACTIVE');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "readAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tour_requests" ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL;

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" JSONB,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memberships_entityType_entityId_idx" ON "memberships"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "memberships_userId_idx" ON "memberships"("userId");

-- CreateIndex
CREATE INDEX "memberships_status_idx" ON "memberships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_userId_entityType_entityId_key" ON "memberships"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "messages_readAt_idx" ON "messages"("readAt");

-- CreateIndex
CREATE INDEX "tour_requests_createdById_idx" ON "tour_requests"("createdById");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

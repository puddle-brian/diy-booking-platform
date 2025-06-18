/*
  Warnings:

  - You are about to drop the column `socialHandles` on the `artists` table. All the data in the column will be lost.
  - The `ageRestriction` column on the `show_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `artistId` on the `shows` table. All the data in the column will be lost.
  - You are about to drop the column `billingOrder` on the `shows` table. All the data in the column will be lost.
  - You are about to drop the column `guarantee` on the `shows` table. All the data in the column will be lost.
  - You are about to drop the column `socialHandles` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the `bids` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tour_requests` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[venueId,date]` on the table `shows` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BidHoldState" AS ENUM ('AVAILABLE', 'FROZEN', 'HELD', 'ACCEPTED_HELD');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('HOLD_REQUEST', 'HOLD_GRANTED', 'HOLD_DECLINED', 'MESSAGE', 'BID_UPDATE', 'BID_RECEIVED', 'SHOW_EDIT', 'SHOW_CONFIRMED', 'SHOW_REQUEST', 'TOUR_REQUEST', 'MEMBER_INVITE', 'REVIEW_RECEIVED', 'VENUE_OFFER');

-- CreateEnum
CREATE TYPE "BillingPosition" AS ENUM ('HEADLINER', 'CO_HEADLINER', 'SUPPORT', 'OPENER', 'LOCAL_SUPPORT');

-- CreateEnum
CREATE TYPE "LineupStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EntityType" ADD VALUE 'SHOW';
ALTER TYPE "EntityType" ADD VALUE 'SHOW_REQUEST';
ALTER TYPE "EntityType" ADD VALUE 'BID';
ALTER TYPE "EntityType" ADD VALUE 'VENUE_OFFER';
ALTER TYPE "EntityType" ADD VALUE 'HOLD_REQUEST';
ALTER TYPE "EntityType" ADD VALUE 'MESSAGE';
ALTER TYPE "EntityType" ADD VALUE 'TOUR_REQUEST';

-- DropForeignKey
ALTER TABLE "bids" DROP CONSTRAINT "bids_bidderId_fkey";

-- DropForeignKey
ALTER TABLE "bids" DROP CONSTRAINT "bids_tourRequestId_fkey";

-- DropForeignKey
ALTER TABLE "bids" DROP CONSTRAINT "bids_venueId_fkey";

-- DropForeignKey
ALTER TABLE "shows" DROP CONSTRAINT "shows_artistId_fkey";

-- DropForeignKey
ALTER TABLE "tour_requests" DROP CONSTRAINT "tour_requests_artistId_fkey";

-- DropForeignKey
ALTER TABLE "tour_requests" DROP CONSTRAINT "tour_requests_createdById_fkey";

-- DropIndex
DROP INDEX "hold_requests_createdAt_idx";

-- DropIndex
DROP INDEX "hold_requests_expiresAt_idx";

-- DropIndex
DROP INDEX "hold_requests_requestedById_idx";

-- DropIndex
DROP INDEX "hold_requests_showId_idx";

-- DropIndex
DROP INDEX "hold_requests_showRequestId_idx";

-- DropIndex
DROP INDEX "hold_requests_status_idx";

-- DropIndex
DROP INDEX "hold_requests_venueOfferId_idx";

-- DropIndex
DROP INDEX "show_requests_artistId_venueId_requestedDate_key";

-- DropIndex
DROP INDEX "shows_artistId_idx";

-- AlterTable
ALTER TABLE "artists" DROP COLUMN "socialHandles",
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "profileCoverText" TEXT,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "recentUpdates" JSONB,
ADD COLUMN     "socialLinks" JSONB;

-- AlterTable
ALTER TABLE "hold_requests" ADD COLUMN     "frozenBidIds" TEXT[],
ADD COLUMN     "frozenOfferIds" TEXT[],
ADD COLUMN     "notifiedParties" TEXT[];

-- AlterTable
ALTER TABLE "scene_reports" ADD COLUMN     "artistId" TEXT;

-- AlterTable
ALTER TABLE "show_request_bids" ADD COLUMN     "artistId" TEXT,
ADD COLUMN     "frozenAt" TIMESTAMP(3),
ADD COLUMN     "frozenByHoldId" TEXT,
ADD COLUMN     "holdState" "BidHoldState" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "statusHistory" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "unfrozenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "show_requests" DROP COLUMN "ageRestriction",
ADD COLUMN     "ageRestriction" "AgeRestriction";

-- AlterTable
ALTER TABLE "shows" DROP COLUMN "artistId",
DROP COLUMN "billingOrder",
DROP COLUMN "guarantee",
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "venue_offers" ADD COLUMN     "frozenAt" TIMESTAMP(3),
ADD COLUMN     "frozenByHoldId" TEXT,
ADD COLUMN     "holdState" "BidHoldState" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "statusHistory" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "unfrozenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "venues" DROP COLUMN "socialHandles",
ADD COLUMN     "socialLinks" JSONB;

-- DropTable
DROP TABLE "bids";

-- DropTable
DROP TABLE "tour_requests";

-- CreateTable
CREATE TABLE "show_lineup" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "billingPosition" "BillingPosition" NOT NULL,
    "setLength" INTEGER,
    "guarantee" DOUBLE PRECISION,
    "status" "LineupStatus" NOT NULL DEFAULT 'PENDING',
    "performanceOrder" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "show_lineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "fullContent" TEXT,
    "entityType" "EntityType",
    "entityId" TEXT,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "actionTaken" BOOLEAN NOT NULL DEFAULT false,
    "actionTakenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "activity_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "show_lineup_showId_idx" ON "show_lineup"("showId");

-- CreateIndex
CREATE INDEX "show_lineup_artistId_idx" ON "show_lineup"("artistId");

-- CreateIndex
CREATE INDEX "show_lineup_billingPosition_idx" ON "show_lineup"("billingPosition");

-- CreateIndex
CREATE UNIQUE INDEX "show_lineup_showId_artistId_key" ON "show_lineup"("showId", "artistId");

-- CreateIndex
CREATE INDEX "activity_notifications_userId_isRead_idx" ON "activity_notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "activity_notifications_userId_createdAt_idx" ON "activity_notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_notifications_type_createdAt_idx" ON "activity_notifications"("type", "createdAt");

-- CreateIndex
CREATE INDEX "activity_notifications_entityType_entityId_idx" ON "activity_notifications"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_notifications_expiresAt_idx" ON "activity_notifications"("expiresAt");

-- CreateIndex
CREATE INDEX "artists_ownerId_idx" ON "artists"("ownerId");

-- CreateIndex
CREATE INDEX "hold_requests_showRequestId_status_idx" ON "hold_requests"("showRequestId", "status");

-- CreateIndex
CREATE INDEX "hold_requests_status_expiresAt_idx" ON "hold_requests"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "shows_venueId_date_key" ON "shows"("venueId", "date");

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_request_bids" ADD CONSTRAINT "show_request_bids_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_reports" ADD CONSTRAINT "scene_reports_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_lineup" ADD CONSTRAINT "show_lineup_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_lineup" ADD CONSTRAINT "show_lineup_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_notifications" ADD CONSTRAINT "activity_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "BookingOpportunityStatus" AS ENUM ('OPEN', 'PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BookingSourceType" AS ENUM ('SHOW_REQUEST', 'VENUE_OFFER', 'SHOW_LINEUP');

-- AlterTable
ALTER TABLE "hold_requests" ADD COLUMN     "bookingOpportunityId" TEXT;

-- CreateTable
CREATE TABLE "booking_opportunities" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "proposedDate" TIMESTAMP(3) NOT NULL,
    "initiatedBy" "RequestInitiator" NOT NULL,
    "initiatedById" TEXT NOT NULL,
    "status" "BookingOpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "guarantee" DOUBLE PRECISION,
    "doorDeal" JSONB,
    "ticketPrice" JSONB,
    "merchandiseSplit" TEXT,
    "billingPosition" "BillingPosition",
    "performanceOrder" INTEGER,
    "setLength" INTEGER,
    "otherActs" TEXT,
    "billingNotes" TEXT,
    "capacity" INTEGER,
    "ageRestriction" "AgeRestriction",
    "equipmentProvided" JSONB,
    "loadIn" TEXT,
    "soundcheck" TEXT,
    "doorsOpen" TEXT,
    "showTime" TEXT,
    "curfew" TEXT,
    "promotion" JSONB,
    "lodging" JSONB,
    "additionalTerms" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "sourceType" "BookingSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "holdState" "BidHoldState" NOT NULL DEFAULT 'AVAILABLE',
    "frozenAt" TIMESTAMP(3),
    "frozenByHoldId" TEXT,
    "unfrozenAt" TIMESTAMP(3),
    "statusHistory" JSONB NOT NULL DEFAULT '[]',
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declinedReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledReason" TEXT,

    CONSTRAINT "booking_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_opportunities_artistId_idx" ON "booking_opportunities"("artistId");

-- CreateIndex
CREATE INDEX "booking_opportunities_venueId_idx" ON "booking_opportunities"("venueId");

-- CreateIndex
CREATE INDEX "booking_opportunities_proposedDate_idx" ON "booking_opportunities"("proposedDate");

-- CreateIndex
CREATE INDEX "booking_opportunities_status_idx" ON "booking_opportunities"("status");

-- CreateIndex
CREATE INDEX "booking_opportunities_initiatedBy_idx" ON "booking_opportunities"("initiatedBy");

-- CreateIndex
CREATE INDEX "booking_opportunities_sourceType_sourceId_idx" ON "booking_opportunities"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "booking_opportunities_createdAt_idx" ON "booking_opportunities"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "booking_opportunities_artistId_venueId_proposedDate_key" ON "booking_opportunities"("artistId", "venueId", "proposedDate");

-- AddForeignKey
ALTER TABLE "hold_requests" ADD CONSTRAINT "hold_requests_bookingOpportunityId_fkey" FOREIGN KEY ("bookingOpportunityId") REFERENCES "booking_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_opportunities" ADD CONSTRAINT "booking_opportunities_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_opportunities" ADD CONSTRAINT "booking_opportunities_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_opportunities" ADD CONSTRAINT "booking_opportunities_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "RequestInitiator" AS ENUM ('ARTIST', 'VENUE');

-- CreateEnum
CREATE TYPE "ShowRequestStatus" AS ENUM ('OPEN', 'PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "show_requests" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "venueId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "initiatedBy" "RequestInitiator" NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "ShowRequestStatus" NOT NULL DEFAULT 'OPEN',
    "amount" DOUBLE PRECISION,
    "doorDeal" JSONB,
    "ticketPrice" JSONB,
    "merchandiseSplit" TEXT,
    "billingPosition" TEXT,
    "lineupPosition" INTEGER,
    "setLength" INTEGER,
    "otherActs" TEXT,
    "billingNotes" TEXT,
    "capacity" INTEGER,
    "ageRestriction" TEXT,
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
    "targetLocations" TEXT[],
    "genres" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "show_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "show_request_bids" (
    "id" TEXT NOT NULL,
    "showRequestId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "proposedDate" TIMESTAMP(3),
    "message" TEXT,
    "amount" DOUBLE PRECISION,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "billingNotes" TEXT,
    "billingPosition" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "declinedAt" TIMESTAMP(3),
    "declinedReason" TEXT,
    "heldAt" TIMESTAMP(3),
    "heldUntil" TIMESTAMP(3),
    "holdPosition" INTEGER,
    "lineupPosition" INTEGER,
    "otherActs" TEXT,
    "setLength" INTEGER,

    CONSTRAINT "show_request_bids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "show_requests_artistId_idx" ON "show_requests"("artistId");

-- CreateIndex
CREATE INDEX "show_requests_venueId_idx" ON "show_requests"("venueId");

-- CreateIndex
CREATE INDEX "show_requests_requestedDate_idx" ON "show_requests"("requestedDate");

-- CreateIndex
CREATE INDEX "show_requests_status_idx" ON "show_requests"("status");

-- CreateIndex
CREATE INDEX "show_requests_initiatedBy_idx" ON "show_requests"("initiatedBy");

-- CreateIndex
CREATE INDEX "show_requests_createdAt_idx" ON "show_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "show_requests_artistId_venueId_requestedDate_key" ON "show_requests"("artistId", "venueId", "requestedDate");

-- CreateIndex
CREATE INDEX "show_request_bids_showRequestId_idx" ON "show_request_bids"("showRequestId");

-- CreateIndex
CREATE INDEX "show_request_bids_venueId_idx" ON "show_request_bids"("venueId");

-- CreateIndex
CREATE INDEX "show_request_bids_bidderId_idx" ON "show_request_bids"("bidderId");

-- CreateIndex
CREATE INDEX "show_request_bids_status_idx" ON "show_request_bids"("status");

-- CreateIndex
CREATE INDEX "show_request_bids_proposedDate_idx" ON "show_request_bids"("proposedDate");

-- CreateIndex
CREATE INDEX "show_request_bids_holdPosition_idx" ON "show_request_bids"("holdPosition");

-- CreateIndex
CREATE INDEX "show_request_bids_createdAt_idx" ON "show_request_bids"("createdAt");

-- AddForeignKey
ALTER TABLE "show_requests" ADD CONSTRAINT "show_requests_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_requests" ADD CONSTRAINT "show_requests_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_requests" ADD CONSTRAINT "show_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_request_bids" ADD CONSTRAINT "show_request_bids_showRequestId_fkey" FOREIGN KEY ("showRequestId") REFERENCES "show_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_request_bids" ADD CONSTRAINT "show_request_bids_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_request_bids" ADD CONSTRAINT "show_request_bids_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

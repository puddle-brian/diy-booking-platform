-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('TECH_RIDER', 'BUSINESS', 'LOGISTICS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- AlterTable
ALTER TABLE "shows" ADD COLUMN     "billingOrder" JSONB,
ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "curfew" TEXT,
ADD COLUMN     "doorDeal" JSONB,
ADD COLUMN     "doorsOpen" TEXT,
ADD COLUMN     "guarantee" DOUBLE PRECISION,
ADD COLUMN     "loadIn" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "showTime" TEXT,
ADD COLUMN     "soundcheck" TEXT;

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_templates" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "equipment" JSONB,
    "technicalRequirements" JSONB,
    "hospitalityRequirements" JSONB,
    "stageRequirements" TEXT,
    "soundCheckTime" INTEGER,
    "setLength" INTEGER,
    "guaranteeRange" JSONB,
    "acceptsDoorDeals" BOOLEAN,
    "merchandising" BOOLEAN,
    "travelMethod" TEXT,
    "lodging" TEXT,
    "dietaryRestrictions" TEXT[],
    "expectedDraw" JSONB,
    "ageRestriction" TEXT,
    "tourStatus" TEXT,
    "priority" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_offers" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "proposedDate" TIMESTAMP(3) NOT NULL,
    "alternativeDates" TIMESTAMP(3)[],
    "message" TEXT,
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
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declinedReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_offer_templates" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "amount" DOUBLE PRECISION,
    "doorDeal" JSONB,
    "ticketPrice" JSONB,
    "merchandiseSplit" TEXT,
    "billingPosition" TEXT,
    "setLength" INTEGER,
    "equipmentProvided" JSONB,
    "loadIn" TEXT,
    "soundcheck" TEXT,
    "doorsOpen" TEXT,
    "showTime" TEXT,
    "curfew" TEXT,
    "promotion" JSONB,
    "lodging" JSONB,
    "messageTemplate" TEXT,
    "additionalTerms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_offer_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE INDEX "favorites_entityType_entityId_idx" ON "favorites"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "favorites_createdAt_idx" ON "favorites"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_entityType_entityId_key" ON "favorites"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "artist_templates_artistId_idx" ON "artist_templates"("artistId");

-- CreateIndex
CREATE INDEX "artist_templates_type_idx" ON "artist_templates"("type");

-- CreateIndex
CREATE INDEX "artist_templates_isDefault_idx" ON "artist_templates"("isDefault");

-- CreateIndex
CREATE INDEX "artist_templates_createdAt_idx" ON "artist_templates"("createdAt");

-- CreateIndex
CREATE INDEX "artist_templates_name_idx" ON "artist_templates"("name");

-- CreateIndex
CREATE INDEX "venue_offers_venueId_idx" ON "venue_offers"("venueId");

-- CreateIndex
CREATE INDEX "venue_offers_artistId_idx" ON "venue_offers"("artistId");

-- CreateIndex
CREATE INDEX "venue_offers_createdById_idx" ON "venue_offers"("createdById");

-- CreateIndex
CREATE INDEX "venue_offers_status_idx" ON "venue_offers"("status");

-- CreateIndex
CREATE INDEX "venue_offers_proposedDate_idx" ON "venue_offers"("proposedDate");

-- CreateIndex
CREATE INDEX "venue_offers_expiresAt_idx" ON "venue_offers"("expiresAt");

-- CreateIndex
CREATE INDEX "venue_offers_createdAt_idx" ON "venue_offers"("createdAt");

-- CreateIndex
CREATE INDEX "venue_offer_templates_venueId_idx" ON "venue_offer_templates"("venueId");

-- CreateIndex
CREATE INDEX "venue_offer_templates_isDefault_idx" ON "venue_offer_templates"("isDefault");

-- CreateIndex
CREATE INDEX "venue_offer_templates_name_idx" ON "venue_offer_templates"("name");

-- CreateIndex
CREATE INDEX "venue_offer_templates_createdAt_idx" ON "venue_offer_templates"("createdAt");

-- CreateIndex
CREATE INDEX "users_verified_idx" ON "users"("verified");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_templates" ADD CONSTRAINT "artist_templates_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_offers" ADD CONSTRAINT "venue_offers_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_offers" ADD CONSTRAINT "venue_offers_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_offers" ADD CONSTRAINT "venue_offers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_offer_templates" ADD CONSTRAINT "venue_offer_templates_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "hold_requests" ADD COLUMN     "venueOfferId" TEXT;

-- CreateIndex
CREATE INDEX "hold_requests_venueOfferId_idx" ON "hold_requests"("venueOfferId");

-- AddForeignKey
ALTER TABLE "hold_requests" ADD CONSTRAINT "hold_requests_venueOfferId_fkey" FOREIGN KEY ("venueOfferId") REFERENCES "venue_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

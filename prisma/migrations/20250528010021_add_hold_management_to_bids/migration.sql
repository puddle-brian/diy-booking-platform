-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BidStatus" ADD VALUE 'HOLD';
ALTER TYPE "BidStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "billingNotes" TEXT,
ADD COLUMN     "billingPosition" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledReason" TEXT,
ADD COLUMN     "declinedAt" TIMESTAMP(3),
ADD COLUMN     "declinedReason" TEXT,
ADD COLUMN     "heldAt" TIMESTAMP(3),
ADD COLUMN     "heldUntil" TIMESTAMP(3),
ADD COLUMN     "holdPosition" INTEGER,
ADD COLUMN     "lineupPosition" INTEGER,
ADD COLUMN     "otherActs" TEXT,
ADD COLUMN     "setLength" INTEGER;

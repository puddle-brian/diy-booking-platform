import { PrismaClient, HoldStatus } from '@prisma/client';

// Create prisma instance - update this path to match your actual prisma location
const prisma = new PrismaClient();

// Define the enum locally since it's new
enum BidHoldState {
  AVAILABLE = 'AVAILABLE',
  FROZEN = 'FROZEN', 
  HELD = 'HELD'
}

export interface HoldRequest {
  id: string;
  showRequestId?: string | null;
  venueOfferId?: string | null;
  showId?: string | null;
  requestedById: string;
  respondedById?: string | null;
  status: HoldStatus;
  expiresAt?: Date | null;
}

export interface CompetingItem {
  id: string;
  type: 'bid' | 'offer' | 'showRequestBid';
  venueId: string;
  venueName: string;
  submittedById: string;
  currentStatus: string;
}

export class HoldManagementService {
  
  /**
   * Grant a hold request - SINGLE HOLD SYSTEM
   * Only one active hold allowed per show request at a time
   */
  async grantHold(holdRequestId: string, grantedByUserId: string): Promise<void> {
    console.log('🔒 HoldManagementService: Granting hold request', holdRequestId);
    
    try {
      // Get the hold request details
      const holdRequest = await prisma.holdRequest.findUnique({
        where: { id: holdRequestId },
        include: { 
          showRequest: true,
          requestedBy: {
            include: {
              memberships: {
                where: { entityType: 'VENUE' }
              }
            }
          }
        }
      });

      if (!holdRequest) {
        throw new Error('Hold request not found');
      }

      // Find which venue the requester owns (for determining which bid gets the hold)
      const venueOwnership = holdRequest.requestedBy.memberships.find(m => m.entityType === 'VENUE');
      
      if (!venueOwnership?.entityId) {
        throw new Error('Cannot determine which venue requested the hold - no venue ownership found');
      }

      const heldVenueId = venueOwnership.entityId;

      // 🚨 SINGLE HOLD ENFORCEMENT: Check if there's already an active hold for this show
      const existingActiveHold = await prisma.holdRequest.findFirst({
        where: {
          showRequestId: holdRequest.showRequestId,
          status: 'ACTIVE',
          id: { not: holdRequestId } // Exclude current hold request
        }
      });

      if (existingActiveHold) {
        throw new Error(`Cannot grant hold: There is already an active hold for this show (Hold ID: ${existingActiveHold.id}). Only one active hold is allowed per show.`);
      }

      // Grant the hold
      await prisma.holdRequest.update({
        where: { id: holdRequestId },
        data: {
          status: 'ACTIVE',
          respondedById: grantedByUserId,
          respondedAt: new Date(),
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + holdRequest.duration * 60 * 60 * 1000), // duration in hours
        }
      });

      // 🔒 FREEZE competing bids for this show request
      console.log('🔒 Freezing competing bids for show request:', holdRequest.showRequestId);
      console.log('🏢 Held venue ID:', heldVenueId);
      
      // Update ShowRequestBids to frozen state (all except the one getting the hold)
      const updateResult = await prisma.showRequestBid.updateMany({
        where: {
          showRequestId: holdRequest.showRequestId || '',
          // Don't freeze the bid that got the hold
          venueId: { not: heldVenueId }
        },
        data: {
          holdState: 'FROZEN',
          frozenByHoldId: holdRequestId,
          frozenAt: new Date()
        }
      });

      // Update the held venue's bid to HELD status
      await prisma.showRequestBid.updateMany({
        where: {
          showRequestId: holdRequest.showRequestId || '',
          venueId: heldVenueId
        },
        data: {
          holdState: 'HELD',
          frozenByHoldId: holdRequestId,
          frozenAt: new Date()
        }
      });

      console.log(`✅ Hold granted successfully. Frozen ${updateResult.count} competing bids.`);
      
    } catch (error) {
      console.error('❌ Error granting hold:', error);
      throw error;
    }
  }

  /**
   * Release a hold - unfreezes all competing items
   * Used when hold is declined, expired, or cancelled
   */
  static async releaseHold(holdId: string, reason: 'declined' | 'expired' | 'cancelled'): Promise<{
    success: boolean;
    unfrozenItems?: CompetingItem[];
    error?: string;
  }> {
    try {
      const hold = await prisma.holdRequest.findUnique({
        where: { id: holdId }
      });

      if (!hold) {
        return { success: false, error: 'Hold not found' };
      }

      const now = new Date();
      let newStatus: HoldStatus;
      
      switch (reason) {
        case 'declined':
          newStatus = 'DECLINED';
          break;
        case 'expired':
          newStatus = 'EXPIRED';
          break;
        case 'cancelled':
          newStatus = 'CANCELLED';
          break;
      }

      // Execute the hold release in a transaction
      const unfrozenItems: CompetingItem[] = [];

      await prisma.$transaction(async (tx) => {
        // 1. Update the hold status
        await tx.holdRequest.update({
          where: { id: holdId },
          data: {
            status: newStatus,
            respondedAt: now
          }
        });

        // 2. Unfreeze all bids that were frozen by this hold
        if (hold.showRequestId) {
          const bidsToUnfreeze = await tx.bid.findMany({
            where: {
              frozenByHoldId: holdId
            }
          });

          if (bidsToUnfreeze.length > 0) {
            await tx.bid.updateMany({
              where: { frozenByHoldId: holdId },
              data: {
                holdState: 'AVAILABLE',
                frozenByHoldId: null,
                unfrozenAt: now
              }
            });
          }

          for (const bid of bidsToUnfreeze) {
            unfrozenItems.push({
              id: bid.id,
              type: 'bid',
              venueId: bid.venueId,
              venueName: 'Unknown Venue',
              submittedById: bid.bidderId || '',
              currentStatus: bid.status
            });
          }
        }

        // 3. Unfreeze all venue offers that were frozen by this hold
        if (hold.venueOfferId) {
          const offersToUnfreeze = await tx.venueOffer.findMany({
            where: {
              frozenByHoldId: holdId
            }
          });

          if (offersToUnfreeze.length > 0) {
            await tx.venueOffer.updateMany({
              where: { frozenByHoldId: holdId },
              data: {
                holdState: 'AVAILABLE',
                frozenByHoldId: null,
                unfrozenAt: now
              }
            });
          }

          for (const offer of offersToUnfreeze) {
            unfrozenItems.push({
              id: offer.id,
              type: 'offer',
              venueId: offer.venueId,
              venueName: 'Unknown Venue',
              submittedById: offer.createdById,
              currentStatus: offer.status
            });
          }
        }
      });

      // 3. Notify affected parties that bidding is open again
      await this.notifyAffectedParties(holdId, unfrozenItems, `hold_${reason}`);

      return {
        success: true,
        unfrozenItems: unfrozenItems
      };

    } catch (error) {
      console.error('Error releasing hold:', error);
      return { success: false, error: 'Failed to release hold' };
    }
  }

  /**
   * Check for expired holds and automatically release them
   */
  static async processExpiredHolds(): Promise<void> {
    try {
      const expiredHolds = await prisma.holdRequest.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lte: new Date()
          }
        }
      });

      for (const hold of expiredHolds) {
        await this.releaseHold(hold.id, 'expired');
      }

      if (expiredHolds.length > 0) {
        console.log(`🔒 Processed ${expiredHolds.length} expired holds`);
      }

    } catch (error) {
      console.error('Error processing expired holds:', error);
    }
  }

  /**
   * Get the current hold state for a show request
   */
  static async getHoldStateForRequest(showRequestId: string): Promise<{
    hasActiveHold: boolean;
    holdRequest?: HoldRequest;
    competingBidCount: number;
    competingOfferCount: number;
  }> {
    const activeHold = await prisma.holdRequest.findFirst({
      where: {
        showRequestId: showRequestId,
        status: 'ACTIVE'
      }
    });

    if (!activeHold) {
      return {
        hasActiveHold: false,
        competingBidCount: 0,
        competingOfferCount: 0
      };
    }

    // Count competing bids that would be affected
    const competingBids = await prisma.bid.findMany({
      where: {
        tourRequestId: showRequestId,
        status: 'PENDING'
      }
    });

    return {
      hasActiveHold: true,
      holdRequest: activeHold as HoldRequest,
      competingBidCount: competingBids.length,
      competingOfferCount: 0 // TODO: Count venue offers when schema supports it
    };
  }

  /**
   * Send notifications to affected parties
   */
  private static async notifyAffectedParties(
    holdId: string, 
    items: CompetingItem[], 
    event: 'hold_granted' | 'hold_declined' | 'hold_expired' | 'hold_cancelled' | 'booking_confirmed'
  ): Promise<void> {
    // TODO: Implement notification system
    // This would integrate with your existing messaging/notification system
    
    console.log(`🔒 Hold Event: ${event} for hold ${holdId}`);
    console.log(`📢 Affected items: ${items.length}`);
    
    for (const item of items) {
      console.log(`   - ${item.type} ${item.id} from ${item.venueName} (${item.currentStatus})`);
    }
  }
}

// Background job to process expired holds
export const startHoldExpirationJob = () => {
  // Run every 5 minutes
  setInterval(async () => {
    await HoldManagementService.processExpiredHolds();
  }, 5 * 60 * 1000);
}; 
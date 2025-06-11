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
   * Grant a hold request - ENHANCED with competing bid freezing
   */
  static async grantHold(holdId: string, userId: string): Promise<{
    success: boolean;
    hold?: HoldRequest;
    frozenItems?: CompetingItem[];
    error?: string;
  }> {
    try {
      const hold = await prisma.holdRequest.findUnique({
        where: { id: holdId },
        include: {
          showRequest: true,
          venueOffer: true
        }
      });

      if (!hold || hold.status !== 'PENDING') {
        return { success: false, error: 'Hold request not found or not pending' };
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + hold.duration * 60 * 60 * 1000);

      // Find all competing items to freeze
      const competingItems: CompetingItem[] = [];
      const frozenBidIds: string[] = [];
      const frozenOfferIds: string[] = [];

      if (hold.showRequestId) {
        // Find competing bids for this show request
        const competingBids = await prisma.bid.findMany({
          where: {
            tourRequestId: hold.showRequestId,
            status: 'PENDING',
            // TODO: Add holdState filter when migration is complete
            NOT: { bidderId: hold.requestedById } // Don't freeze the requester's own bid
          },
          include: {
            venue: { select: { id: true, name: true } }
          }
        });

        // Find competing bids in the ShowRequestBid table (current system)
        const competingShowRequestBids = await prisma.showRequestBid.findMany({
          where: {
            showRequestId: hold.showRequestId,
            status: 'PENDING',
            // holdState: 'AVAILABLE', // TODO: Re-enable when types are fixed
            NOT: { bidderId: hold.requestedById }
          },
          include: {
            venue: { select: { id: true, name: true } }
          }
        });

        // Also check unified ShowRequestBid table
        const unifiedBids = await prisma.showRequestBid.findMany({
          where: {
            showRequestId: hold.showRequestId,
            status: 'PENDING',
            NOT: { bidderId: hold.requestedById }
          },
          include: {
            venue: { select: { id: true, name: true } }
          }
        });

        // Combine all bids
        const allBids = [...competingBids, ...competingShowRequestBids];
        frozenBidIds.push(...allBids.map(bid => bid.id));

        for (const bid of allBids) {
          competingItems.push({
            id: bid.id,
            type: competingBids.includes(bid) ? 'bid' : 'showRequestBid',
            venueId: bid.venueId,
            venueName: bid.venue?.name || 'Unknown Venue',
            submittedById: bid.bidderId || '',
            currentStatus: 'PENDING'
          });
        }
      }

      if (hold.venueOfferId) {
        // Find competing venue offers for same artist/date
        const venueOffer = hold.venueOffer;
        if (venueOffer) {
          const competingOffers = await prisma.venueOffer.findMany({
            where: {
              artistId: venueOffer.artistId,
              proposedDate: venueOffer.proposedDate,
              status: 'PENDING',
              // TODO: Add holdState filter when migration is complete
              NOT: { id: hold.venueOfferId }
            },
            include: {
              venue: { select: { id: true, name: true } }
            }
          });

          frozenOfferIds.push(...competingOffers.map(offer => offer.id));

          for (const offer of competingOffers) {
            competingItems.push({
              id: offer.id,
              type: 'offer',
              venueId: offer.venueId,
              venueName: offer.venue?.name || 'Unknown Venue',
              submittedById: offer.createdById,
              currentStatus: 'PENDING'
            });
          }
        }
      }

      // Execute the hold grant in a transaction - NOW WITH REAL FREEZING!
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update the hold to ACTIVE
        const updatedHold = await tx.holdRequest.update({
          where: { id: holdId },
          data: {
            status: 'ACTIVE',
            respondedById: userId,
            respondedAt: now,
            startsAt: now,
            expiresAt: expiresAt,
            frozenBidIds: frozenBidIds,
            frozenOfferIds: frozenOfferIds
          }
        });

        // 2. 🔒 FREEZE all competing bids 
        const legacyBidIds = frozenBidIds.filter(id => 
          competingItems.find(item => item.id === id && item.type === 'bid')
        );
        if (legacyBidIds.length > 0) {
          await tx.bid.updateMany({
            where: { id: { in: legacyBidIds } },
            data: {
              holdState: 'FROZEN',
              frozenByHoldId: holdId,
              frozenAt: now,
              statusHistory: {
                set: [{
                  status: 'FROZEN',
                  timestamp: now.toISOString(),
                  reason: `Frozen by hold ${holdId}`,
                  holdId: holdId
                }]
              }
            }
          });
        }

        // 2b. 🔒 FREEZE all competing ShowRequestBids
        const showRequestBidIds = frozenBidIds.filter(id => 
          competingItems.find(item => item.id === id && item.type === 'showRequestBid')
        );
        if (showRequestBidIds.length > 0) {
          await tx.showRequestBid.updateMany({
            where: { id: { in: showRequestBidIds } },
            data: {
              holdState: 'FROZEN',
              frozenByHoldId: holdId,
              frozenAt: now,
              statusHistory: {
                set: [{
                  status: 'FROZEN',
                  timestamp: now.toISOString(),
                  reason: `Frozen by hold ${holdId}`,
                  holdId: holdId
                }]
              }
            }
          });
        }

        // 3. 🔒 FREEZE all competing venue offers
        if (frozenOfferIds.length > 0) {
          await tx.venueOffer.updateMany({
            where: { id: { in: frozenOfferIds } },
            data: {
              holdState: 'FROZEN',
              frozenByHoldId: holdId,
              frozenAt: now,
              statusHistory: {
                set: [{
                  status: 'FROZEN',
                  timestamp: now.toISOString(),
                  reason: `Frozen by hold ${holdId}`,
                  holdId: holdId
                }]
              }
            }
          });
        }

        return updatedHold;
      });

      console.log(`🔒 Hold ${holdId} granted: Froze ${frozenBidIds.length} bids and ${frozenOfferIds.length} offers`);

      // 3. Send notifications to affected parties
      await this.notifyAffectedParties(holdId, competingItems, 'hold_granted');

      return {
        success: true,
        hold: result as HoldRequest,
        frozenItems: competingItems
      };

    } catch (error) {
      console.error('Error granting hold:', error);
      return { success: false, error: 'Failed to grant hold: ' + (error instanceof Error ? error.message : 'Unknown error') };
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
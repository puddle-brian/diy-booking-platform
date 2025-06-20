import { VenueBid, VenueOffer, Show } from '../../types';

interface BidStatusBadge {
  className: string;
  text: string;
}

interface DateConflictResult {
  acceptedBid: VenueBid | null;
  acceptedOffer: VenueOffer | null;
}

interface BidActionCallbacks {
  setBidStatusOverrides: (fn: (prev: Map<string, 'pending' | 'accepted' | 'declined'>) => Map<string, 'pending' | 'accepted' | 'declined'>) => void;
  setDeclinedBids: (fn: (prev: Set<string>) => Set<string>) => void;
  setBidActions: (fn: (prev: { [key: string]: boolean }) => { [key: string]: boolean }) => void;
  fetchData: () => Promise<void>;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  toast: (type: 'info' | 'success' | 'error' | 'warning', title: string, message: string, duration?: number) => void;
  confirm: (title: string, message: string, onConfirm: () => void) => void;
  // 🐛 BUG FIX: Add deleteRequestOptimistic to handle venue bid withdrawals
  deleteRequestOptimistic?: (requestId: string) => void;
}

interface OfferActionCallbacks extends BidActionCallbacks {
  deleteRequestOptimistic: (requestId: string) => void;
}

export class BidService {
  /**
   * Get effective bid status considering optimistic overrides
   */
  static getEffectiveBidStatus(
    bid: VenueBid, 
    bidStatusOverrides: Map<string, 'pending' | 'accepted' | 'declined'>
  ): string {
    const override = bidStatusOverrides.get(bid.id);
    if (override) {
      return override;
    }
    // Convert legacy 'hold' status to 'pending' since we removed hold functionality
    if (bid.status === 'hold') {
      return 'pending';
    }
    return bid.status;
  }

  /**
   * Get badge styling and text for bid status
   */
  static getBidStatusBadge(
    bid: VenueBid, 
    bidStatusOverrides: Map<string, 'pending' | 'accepted' | 'declined'>
  ): BidStatusBadge {
    const effectiveStatus = this.getEffectiveBidStatus(bid, bidStatusOverrides);
    
    switch (effectiveStatus) {
      case 'pending':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
          text: 'Open'
        };
      case 'accepted':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800',
          text: 'Accepted'
        };
      case 'declined':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800',
          text: 'Declined'
        };
      case 'cancelled':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
          text: 'Cancelled'
        };
      default:
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
          text: effectiveStatus
        };
    }
  }

  /**
   * Check for date conflicts with already accepted bids/offers
   */
  static checkDateConflict(
    proposedDate: string,
    shows: Show[],
    venueBids: VenueBid[],
    venueOffers: VenueOffer[] = [],
    bidStatusOverrides: Map<string, 'pending' | 'accepted' | 'declined'>,
    excludeBidId?: string,
    excludeOfferId?: string
  ): DateConflictResult {
    // Check for accepted bids
    const acceptedBid = venueBids.find(bid => {
      if (excludeBidId && bid.id === excludeBidId) return false;
      const effectiveStatus = this.getEffectiveBidStatus(bid, bidStatusOverrides);
      return bid.proposedDate === proposedDate && effectiveStatus === 'accepted';
    });

    // Check for accepted offers
    const acceptedOffer = venueOffers.find(offer => {
      if (excludeOfferId && offer.id === excludeOfferId) return false;
      const override = bidStatusOverrides.get(offer.id);
      const effectiveStatus = override || offer.status;
      return offer.proposedDate === proposedDate && effectiveStatus === 'accepted';
    });

    return { acceptedBid: acceptedBid || null, acceptedOffer: acceptedOffer || null };
  }

  /**
   * Handle bid actions with hold-aware logic and conflict checking
   */
  static async handleBidAction(
    bid: VenueBid,
    action: string,
    callbacks: BidActionCallbacks,
    bidStatusOverrides: Map<string, 'pending' | 'accepted' | 'declined'>,
    shows: Show[],
    venueBids: VenueBid[],
    venueOffers: VenueOffer[] = [],
    reason?: string
  ): Promise<void> {
    // 🔒 HOLD-AWARE: Check if this bid is involved in a hold system
    const isHeldBid = (bid as any).holdState === 'HELD';
    const isFrozenBid = (bid as any).holdState === 'FROZEN';
    
    // Map regular actions to hold-aware actions when appropriate
    let actualAction = action;
    if (isHeldBid && (action === 'accept' || action === 'decline')) {
      actualAction = action === 'accept' ? 'accept-held' : 'decline-held';
      console.log(`🔒 Converting ${action} to ${actualAction} for held bid ${bid.id}`);
    }
    
    // Add conflict validation for accept action
    if (action === 'accept' || action === 'accept-held') {
      const { acceptedBid, acceptedOffer } = this.checkDateConflict(
        bid.proposedDate, 
        shows, 
        venueBids, 
        venueOffers, 
        bidStatusOverrides, 
        bid.id
      );
      
      if (acceptedBid || acceptedOffer) {
        const conflictVenue = acceptedBid ? acceptedBid.venueName : acceptedOffer?.venueName;
        const conflictType = acceptedBid ? 'bid' : 'offer';
        
        callbacks.confirm(
          'Date Conflict',
          `You've already accepted ${conflictType === 'bid' ? 'a bid' : 'an offer'} from ${conflictVenue} for this date. Only one booking can be accepted per date. Switch to ${bid.venueName} instead?`,
          async () => {
            // Show loading toast (brief, auto-dismiss)
            callbacks.toast('info', 'Switching Bookings', `Switching to ${bid.venueName}...`, 2000);
            
            // Optimistic updates for seamless UX
            try {
              // Immediately update UI state
              if (acceptedBid) {
                callbacks.setBidStatusOverrides(prev => new Map(prev).set(acceptedBid.id, 'pending'));
              }
              callbacks.setBidStatusOverrides(prev => new Map(prev).set(bid.id, 'accepted'));
              
              // Perform backend updates
              if (acceptedBid) {
                await fetch(`/api/show-requests/${acceptedBid.showRequestId}/bids`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    bidId: acceptedBid.id,
                    action: 'undo-accept',
                    reason: `Reverted - switched to ${bid.venueName} for same date`
                  }),
                });
              }
              
              if (acceptedOffer) {
                await fetch(`/api/show-requests/${acceptedOffer.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'decline',
                    status: 'DECLINED',
                    reason: `Switched to ${bid.venueName} for same date`
                  }),
                });
              }
              
              // Accept the new bid
              await fetch(`/api/show-requests/${bid.showRequestId}/bids`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bidId: bid.id,
                  action: actualAction,
                  reason
                }),
              });
              
              await callbacks.fetchData();
              callbacks.showSuccess('Booking Switched', `Successfully switched to ${bid.venueName} for ${bid.proposedDate}.`);
            } catch (error) {
              console.error('Error switching bookings:', error);
              callbacks.showError('Switch Failed', `Failed to switch bookings: ${error instanceof Error ? error.message : 'Unknown error'}`);
              await callbacks.fetchData(); // Revert on error
            }
          }
        );
        return;
      }
    }
    
    // Proceed with normal bid action
    await this.proceedWithBidActionOptimistic(bid, actualAction, callbacks, reason);
  }

  /**
   * Optimistic bid action processing
   */
  static async proceedWithBidActionOptimistic(
    bid: VenueBid,
    action: string,
    callbacks: BidActionCallbacks,
    reason?: string
  ): Promise<void> {
    callbacks.setBidActions(prev => ({ ...prev, [bid.id]: true }));
    
    // Immediate optimistic update
    if (action === 'accept' || action === 'accept-held') {
      callbacks.setBidStatusOverrides(prev => new Map(prev).set(bid.id, 'accepted'));
    } else if (action === 'undo-accept') {
      callbacks.setBidStatusOverrides(prev => new Map(prev).set(bid.id, 'pending'));
    } else if (action === 'decline' || action === 'decline-held') {
      callbacks.setDeclinedBids(prev => new Set([...prev, bid.id]));
      
      // 🐛 BUG FIX: When venue withdraws their own bid, also remove the synthetic timeline entry
      // Check if this is a venue bid withdrawal (reason contains "withdrew") and callbacks has deleteRequestOptimistic
      if (reason?.includes('withdrew') && callbacks.deleteRequestOptimistic) {
        const syntheticRequestId = `venue-bid-${bid.id}`;
        callbacks.deleteRequestOptimistic(syntheticRequestId);
        console.log('🐛 Removed synthetic venue bid timeline entry:', syntheticRequestId);
      }
    }
    
    try {
      const response = await fetch(`/api/show-requests/${bid.showRequestId}/bids`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidId: bid.id,
          action,
          reason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} bid`);
      }

      // 🎯 FIX: Refresh data for actions that affect competing bids' states
      if (action === 'accept-held' || action === 'confirm-accepted' || action === 'decline-held' || action === 'release-held' || action === 'undo-accept' || action === 'accept') {
        console.log(`🔄 Refreshing data after ${action} to update competing bid states`);
        await callbacks.fetchData();
      }
      
      const actionMessages = {
        accept: 'Bid accepted! You can now coordinate with the venue to finalize details.',
        'accept-held': 'Bid accepted! Click "Confirm" to finalize or change your mind.',
        'confirm-accepted': 'Show confirmed! Competing venues have been notified.',
        'release-held': 'Hold released. Bid returned to normal bidding - other venues can now compete again.',
        'decline-held': 'Held bid declined. Other venues can now compete again.',
        hold: 'Bid placed on hold. You have time to consider other options.',
        decline: 'Bid declined and removed from your itinerary.'
      };
      
      if (action === 'decline' || action === 'decline-held') {
        callbacks.showSuccess('Bid Declined', 'The bid has been removed from your itinerary.');
      } else if (action === 'accept-held') {
        callbacks.showSuccess('Bid Accepted', 'Bid accepted! You can now confirm or change your mind.');
      } else if (action === 'confirm-accepted') {
        callbacks.showSuccess('Show Confirmed', 'Show confirmed! Competing venues have been notified.');
      } else if (action === 'release-held') {
        callbacks.showSuccess('Hold Released', 'The hold has been released. Bid is now available for normal accept/decline.');
      } else if (action === 'undo-accept') {
        callbacks.showSuccess('Acceptance Undone', 'Bid returned to pending. Competing venues can now compete again.');
      } else if (action === 'accept') {
        callbacks.showSuccess('Bid Accepted', 'Bid accepted! Competing venues are now frozen while you finalize.');
      }
    } catch (error) {
      console.error(`Error ${action}ing bid:`, error);
      
      // Revert optimistic updates on error
      if (action === 'accept') {
        callbacks.setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(bid.id);
          return newMap;
        });
      } else if (action === 'undo-accept') {
        callbacks.setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(bid.id);
          return newMap;
        });
      } else if (action === 'hold') {
        callbacks.setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(bid.id);
          return newMap;
        });
      } else if (action === 'decline') {
        callbacks.setDeclinedBids(prev => {
          const newSet = new Set(prev);
          newSet.delete(bid.id);
          return newSet;
        });
      }
      
      // 🎯 For actions that affect multiple bids, always refresh to ensure consistency
      if (['accept', 'undo-accept', 'accept-held', 'confirm-accepted'].includes(action)) {
        console.log(`🔄 Error occurred during ${action} - refreshing data to ensure consistency`);
        await callbacks.fetchData();
      }
      
      callbacks.showError(`${action.charAt(0).toUpperCase() + action.slice(1)} Failed`, `Failed to ${action} bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      callbacks.setBidActions(prev => ({ ...prev, [bid.id]: false }));
    }
  }

  /**
   * Handle venue offer actions with conflict checking
   */
  static async handleOfferAction(
    offer: VenueOffer,
    action: string,
    callbacks: OfferActionCallbacks,
    bidStatusOverrides: Map<string, 'pending' | 'accepted' | 'declined'>,
    shows: Show[],
    venueBids: VenueBid[],
    venueOffers: VenueOffer[] = []
  ): Promise<void> {
    // Add conflict validation for accept action
    if (action === 'accept') {
      const { acceptedBid, acceptedOffer } = this.checkDateConflict(
        offer.proposedDate,
        shows,
        venueBids,
        venueOffers,
        bidStatusOverrides,
        undefined,
        offer.id
      );
      
      if (acceptedBid || acceptedOffer) {
        const conflictVenue = acceptedBid ? acceptedBid.venueName : acceptedOffer?.venueName;
        const conflictType = acceptedBid ? 'bid' : 'offer';
        
        callbacks.confirm(
          'Date Conflict',
          `You've already accepted ${conflictType === 'bid' ? 'a bid' : 'an offer'} from ${conflictVenue} for this date. Only one booking can be accepted per date. Switch to ${offer.venueName} instead?`,
          async () => {
            // Show loading toast (brief, auto-dismiss)
            callbacks.toast('info', 'Switching Bookings', `Switching to ${offer.venueName}...`, 2000);
            
            // Optimistic updates for seamless UX
            try {
              // Immediately update UI state
              if (acceptedBid) {
                callbacks.setBidStatusOverrides(prev => new Map(prev).set(acceptedBid.id, 'pending'));
              }
              callbacks.setBidStatusOverrides(prev => new Map(prev).set(offer.id, 'accepted'));
              
              // Perform backend updates
              if (acceptedBid) {
                await fetch(`/api/show-requests/${acceptedBid.showRequestId}/bids`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    bidId: acceptedBid.id,
                    action: 'undo-accept',
                    reason: `Reverted - switched to ${offer.venueName} for same date`
                  }),
                });
              }
              
              if (acceptedOffer) {
                await fetch(`/api/show-requests/${acceptedOffer.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'decline',
                    status: 'DECLINED',
                    reason: `Switched to ${offer.venueName} for same date`
                  }),
                });
              }
              
              // Accept the new offer
              await fetch(`/api/show-requests/${offer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'accept',
                  status: 'CONFIRMED'
                }),
              });
              
              await callbacks.fetchData();
              callbacks.showSuccess('Booking Switched', `Successfully switched to ${offer.venueName} for ${offer.proposedDate}.`);
            } catch (error) {
              console.error('Error switching bookings:', error);
              callbacks.showError('Switch Failed', `Failed to switch bookings: ${error instanceof Error ? error.message : 'Unknown error'}`);
              await callbacks.fetchData(); // Revert on error
            }
          }
        );
        return;
      }
    }
    
    // Proceed with normal offer action
    await this.proceedWithOfferActionOptimistic(offer, action, callbacks);
  }

  /**
   * Optimistic offer action processing
   */
  static async proceedWithOfferActionOptimistic(
    offer: VenueOffer,
    action: string,
    callbacks: OfferActionCallbacks
  ): Promise<void> {
    const actionText = action === 'accept' ? 'accept' : action === 'decline' ? 'decline' : action;
    
    // Optimistic update for decline action to avoid flashing
    if (action === 'decline') {
      // Find and hide the synthetic tour request for this offer
      const syntheticRequestId = `venue-offer-${offer.id}`;
      callbacks.deleteRequestOptimistic(syntheticRequestId);
      
      // 🎯 UX IMPROVEMENT: Stay on current month after deletion to confirm action worked
      // (Removed auto-switching logic that was confusing users)
    } else if (action === 'accept') {
      // Optimistic update for accept action
      callbacks.setBidStatusOverrides(prev => new Map(prev).set(offer.id, 'accepted'));
    }
    
    try {
      // 🎯 NEW UNIFIED SYSTEM FIX: Check if this is a ShowRequest (new system) or VenueOffer (old system)
      // ShowRequests from admin reset will have a different ID pattern and need different API endpoints
      let response;
      
      // Try the new ShowRequest API first (for admin-created offers)
      const showRequestResponse = await fetch(`/api/show-requests/${offer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: action === 'decline' ? 'decline' : action,
          status: action === 'decline' ? 'DECLINED' : action === 'accept' ? 'CONFIRMED' : action.toUpperCase()
        }),
      });

      if (showRequestResponse.ok) {
        // This was a ShowRequest from the new system
        response = showRequestResponse;
        console.log(`✅ Successfully updated ShowRequest ${offer.id} via new unified API`);
      } else {
        // Some other error with ShowRequest API
        response = showRequestResponse;
      }

      if (!response.ok) {
        const errorData = await response.json();
        
        // 🎯 NEW: Auto-refresh on 404 errors (stale data detection)
        if (response.status === 404) {
          console.warn('🔄 Stale data detected (404 error), automatically refreshing...');
          callbacks.showInfo('Data Updated', 'The data has been refreshed to show the latest information.');
          await callbacks.fetchData(); // Auto-refresh to get fresh data
          return; // Exit early since data was refreshed
        }
        
        throw new Error(errorData.error || `Failed to ${actionText} offer`);
      }

      // Clear optimistic override since backend is now in sync  
      // Don't clear for decline (uses different state)
      if (action !== 'decline') {
        callbacks.setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(offer.id);
          return newMap;
        });
      }
      
      if (action === 'decline') {
        callbacks.showSuccess('Offer Declined', 'The venue offer has been removed from your itinerary.');
      } else if (action === 'accept') {
        callbacks.showSuccess('Offer Accepted', 'The venue offer has been accepted and added to your confirmed shows!');
      }
    } catch (error) {
      console.error(`Error ${actionText}ing offer:`, error);
      
      // Revert optimistic updates on error
      if (action === 'accept') {
        callbacks.setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(offer.id);
          return newMap;
        });
      } else if (action === 'decline') {
        // Revert optimistic update on error by refreshing data
        await callbacks.fetchData();
      }
      
      callbacks.showError(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Failed`, `Failed to ${actionText} offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
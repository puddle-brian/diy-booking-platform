import { VenueBid, VenueOffer } from '../../types';
import { getTimelineBorderClass } from '../utils/timelineUtils';

interface UseTimelineEntryProcessorProps {
  venueBids: VenueBid[];
  venueOffers: VenueOffer[];
  declinedBids: Set<string>;
  tourRequests: any[];
}

export function useTimelineEntryProcessor({
  venueBids,
  venueOffers,
  declinedBids,
  tourRequests
}: UseTimelineEntryProcessorProps) {
  
  const processShowRequestEntry = (request: any) => {
    // Get bids for this request
    let requestBids: VenueBid[] = [];
    
    if (request.isVenueInitiated && request.originalOfferId) {
      // 🐛 FIX: Even for venue-initiated requests, we need to find ALL competing bids
      // The venue offer might be one of several competing bids for the same date/artist
      
      // Look for other requests with the same date/artist to find the original artist request
      const potentialOriginalRequests = tourRequests.filter((sr: any) => 
        !(sr as any).isVenueInitiated && 
        sr.startDate === request.startDate &&
        sr.artistId === request.artistId
      );
      
      if (potentialOriginalRequests.length > 0) {
        const originalShowRequestId = potentialOriginalRequests[0].id;
        
        // Find ALL bids for the original request (this will include competing venues)
        requestBids = venueBids.filter(bid => 
          bid.showRequestId === originalShowRequestId && 
          !declinedBids.has(bid.id)
        );
      } else {
        // Fallback: Create synthetic bid for just this venue
        const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
        if (originalOffer) {
          const bidDate = originalOffer.proposedDate.split('T')[0];
          
          const syntheticBid: VenueBid = {
            id: `offer-bid-${originalOffer.id}`,
            showRequestId: request.id,
            venueId: originalOffer.venueId,
            venueName: originalOffer.venueName || 'Unknown Venue',
            proposedDate: bidDate,
            guarantee: originalOffer.amount,
            doorDeal: originalOffer.doorDeal ? {
              split: originalOffer.doorDeal.split,
              minimumGuarantee: originalOffer.doorDeal.minimumGuarantee
            } : undefined,
            ticketPrice: originalOffer.ticketPrice || {},
            capacity: originalOffer.capacity || 0,
            ageRestriction: originalOffer.ageRestriction || 'all-ages',
            equipmentProvided: originalOffer.equipmentProvided || {
              pa: false, mics: false, drums: false, amps: false, piano: false
            },
            loadIn: originalOffer.loadIn || '',
            soundcheck: originalOffer.soundcheck || '',
            doorsOpen: originalOffer.doorsOpen || '',
            showTime: originalOffer.showTime || '',
            curfew: originalOffer.curfew || '',
            promotion: originalOffer.promotion || {
              social: false, flyerPrinting: false, radioSpots: false, pressCoverage: false
            },
            message: originalOffer.message || '',
            status: originalOffer.status.toLowerCase() as 'pending' | 'accepted' | 'declined' | 'cancelled',
            readByArtist: true,
            createdAt: originalOffer.createdAt,
            updatedAt: originalOffer.updatedAt,
            expiresAt: originalOffer.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            billingPosition: originalOffer.billingPosition,
            lineupPosition: originalOffer.lineupPosition,
            setLength: originalOffer.setLength,
            otherActs: originalOffer.otherActs,
            billingNotes: originalOffer.billingNotes,
            // Add missing artist information for show document headers
            artistId: originalOffer.artistId,
            artistName: originalOffer.artistName,
          } as VenueBid & { artistId?: string; artistName?: string };
          
          requestBids = [syntheticBid];
        }
      }
    } else if (request.isVenueBid && request.originalShowRequestId) {
      // For synthetic requests from venue bids, use originalShowRequestId to find ALL competing bids
      const allBidsOnRequest = venueBids.filter(bid => 
        bid.showRequestId === request.originalShowRequestId && 
        !declinedBids.has(bid.id)
      );
      
      requestBids = allBidsOnRequest;
    } else {
      // For regular artist-initiated requests, use normal bid filtering
      requestBids = venueBids.filter(bid => bid.showRequestId === request.id && !declinedBids.has(bid.id));
    }

    return requestBids;
  };

  const getRequestStatus = (requestBids: VenueBid[], request: any) => {
    // Determine status for border styling
    const hasAcceptedBid = requestBids.some((bid: VenueBid) => 
      bid.status === 'accepted' || (bid as any).holdState === 'ACCEPTED_HELD'
    );
    const hasActiveHold = requestBids.some((bid: VenueBid) => 
      (bid as any).holdState === 'HELD' || (bid as any).holdState === 'FROZEN'
    );
    const isHeldBidRequest = (request as any).isHeldBid;
    
    let requestStatus: 'confirmed' | 'pending' | 'hold' | 'accepted' = 'pending';
    if (hasAcceptedBid) {
      requestStatus = 'accepted';
    } else if (hasActiveHold || isHeldBidRequest) {
      requestStatus = 'hold';
    }
    
    return requestStatus;
  };

  const getStyleClasses = (requestStatus: 'confirmed' | 'pending' | 'hold' | 'accepted') => {
    const borderClass = getTimelineBorderClass(requestStatus);

    // Generate class names safely
    const baseClasses = "cursor-pointer transition-colors duration-150 hover:shadow-sm";
    const hoverClass = requestStatus === 'accepted' ? 'bg-green-50/30 hover:bg-green-100' :
                      requestStatus === 'hold' ? 'bg-violet-50/30 hover:bg-violet-100' :
                      'hover:bg-blue-50';
    const rowClassName = `${baseClasses} ${hoverClass}`;
    
    // Pre-calculate text colors
    const textColorClass = requestStatus === 'accepted' ? 'text-green-900' :
                          requestStatus === 'hold' ? 'text-violet-900' :
                          'text-blue-900';
    
    // Pre-calculate expanded section classes
      const expandedBgClass = requestStatus === 'accepted' ? 'bg-green-50' :
    requestStatus === 'hold' ? 'bg-violet-50' :
    'bg-yellow-50';
    const expandedHeaderClass = requestStatus === 'accepted' ? 'bg-green-100' :
                               requestStatus === 'hold' ? 'bg-violet-100' :
                               'bg-yellow-100';
    const expandedTextClass = requestStatus === 'accepted' ? 'text-left text-xs font-medium text-green-700' :
                             requestStatus === 'hold' ? 'text-left text-xs font-medium text-violet-700' :
                             'text-left text-xs font-medium text-yellow-700';
    const expandedDividerClass = requestStatus === 'accepted' ? 'divide-y divide-green-200' :
                                requestStatus === 'hold' ? 'divide-y divide-violet-200' :
                                'divide-y divide-yellow-200';

    return {
      borderClass,
      rowClassName,
      textColorClass,
      expandedBgClass,
      expandedHeaderClass,
      expandedTextClass,
      expandedDividerClass
    };
  };

  return {
    processShowRequestEntry,
    getRequestStatus,
    getStyleClasses
  };
} 
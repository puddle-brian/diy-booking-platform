import React from 'react';
import { VenueBid, VenueOffer } from '../../../types';
import { ShowRequestRow } from './ShowRequestRow';
import { ExpandedBidsSection } from './ExpandedBidsSection';
import { getTimelineBorderClass, extractDateFromEntry } from '../../utils/timelineUtils';
import { getBillingPriority } from '../../utils/showNaming';

interface ShowRequestProcessorProps {
  entry: any;
  request: any;
  venueBids: VenueBid[];
  venueOffers: VenueOffer[];
  declinedBids: Set<string>;
  tourRequests: any[];
  sameDateSiblings: any[];
  isFirstOfDate: boolean;
  entryDate: string;
  artistId?: string;
  venueId?: string;
  venueName?: string;
  permissions: any;
  state: any;
  handlers: any;
  actions: any;
  getBidStatusBadge: (bid: VenueBid) => any;
  toggleRequestExpansion: (requestId: string) => void;
  handleDeleteShowRequest: (requestId: string, requestName: string) => Promise<void>;
  handleOfferAction: (offer: VenueOffer, action: string) => Promise<void>;
  handleBidAction: (bid: VenueBid, action: string, reason?: string) => Promise<void>;
  getEffectiveBidStatus: (bid: VenueBid) => string;
  venues: any[];
}

export function ShowRequestProcessor({
  entry,
  request,
  venueBids,
  venueOffers,
  declinedBids,
  tourRequests,
  sameDateSiblings,
  isFirstOfDate,
  entryDate,
  artistId,
  venueId,
  venueName,
  permissions,
  state,
  handlers,
  actions,
  getBidStatusBadge,
  toggleRequestExpansion,
  handleDeleteShowRequest,
  handleOfferAction,
  handleBidAction,
  getEffectiveBidStatus,
  venues
}: ShowRequestProcessorProps) {
  
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
  const expandedBgClass = requestStatus === 'accepted' ? 'bg-green-50 border-l-4 border-green-400' :
                         requestStatus === 'hold' ? 'bg-violet-50 border-l-4 border-violet-400' :
                         'bg-yellow-50 border-l-4 border-yellow-400';
  const expandedHeaderClass = requestStatus === 'accepted' ? 'bg-green-100' :
                             requestStatus === 'hold' ? 'bg-violet-100' :
                             'bg-yellow-100';
  const expandedTextClass = requestStatus === 'accepted' ? 'text-left text-xs font-medium text-green-700' :
                           requestStatus === 'hold' ? 'text-left text-xs font-medium text-violet-700' :
                           'text-left text-xs font-medium text-yellow-700';
  const expandedDividerClass = requestStatus === 'accepted' ? 'divide-y divide-green-200' :
                              requestStatus === 'hold' ? 'divide-y divide-violet-200' :
                              'divide-y divide-yellow-200';

  return (
    <React.Fragment key={`request-${request.id}`}>
      <ShowRequestRow
        entry={entry}
        request={request}
        requestBids={requestBids}
        sameDateSiblings={sameDateSiblings}
        isFirstOfDate={isFirstOfDate}
        entryDate={entryDate}
        borderClass={borderClass}
        textColorClass={textColorClass}
        artistId={artistId}
        venueId={venueId}
        permissions={permissions}
        state={state}
        handlers={handlers}
        getBidStatusBadge={getBidStatusBadge}
        toggleRequestExpansion={toggleRequestExpansion}
        handleDeleteShowRequest={handleDeleteShowRequest}
        handleOfferAction={handleOfferAction}
        handleBidAction={handleBidAction}
        venueOffers={venueOffers}
        venueBids={venueBids}
      />

      {/* Expanded Bids Section */}
      {state.expandedRequests.has(request.id) && requestBids.length > 0 && permissions.canExpandRequest(request) && (
        <tr>
          <td colSpan={venueId ? 9 : 10} className="px-0 py-0">
            <div className={expandedBgClass}>
              <div className="overflow-x-auto">
                <ExpandedBidsSection
                  request={request}
                  requestBids={requestBids}
                  sameDateSiblings={sameDateSiblings}
                  venueOffers={venueOffers as any}
                  venueBids={venueBids}
                  declinedBids={declinedBids}
                  permissions={permissions}
                  venues={venues}
                  venueId={venueId}
                  venueName={venueName}
                  artistId={artistId}
                  handlers={handlers}
                  actions={actions}
                  getEffectiveBidStatus={getEffectiveBidStatus}
                  handleBidAction={handleBidAction}
                  handleOfferAction={handleOfferAction}
                  getBillingPriority={getBillingPriority}
                  expandedDividerClass={expandedDividerClass}
                />
              </div>
              
              {/* Add Another Artist Button - shows on any expanded row for venue owners */}
              {permissions.actualViewerType === 'venue' && permissions.isOwner && (
                <div className="bg-gray-50 hover:bg-gray-100 transition-colors duration-150 px-4 py-2 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Extract date from the current timeline entry
                      const extractedDate = extractDateFromEntry(request);
                      handlers.openAddAnotherArtistModal(request.id, extractedDate);
                    }}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-1 px-4 rounded border-2 border-dashed border-yellow-400 transition-colors duration-150 flex items-center justify-center space-x-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Artist</span>
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
} 
import React from 'react';
import { VenueBid, VenueOffer } from '../../../types';
import { ShowRequestRow } from './ShowRequestRow';
import { ExpandedBidsSection } from './ExpandedBidsSection';
import { getTimelineBorderClass, extractDateFromEntry } from '../../utils/timelineUtils';
import { getBillingPriority } from '../../utils/showNaming';
import { 
  getTimelineRowStyling, 
  getTimelineTextStyling,
  getExpansionContainerStyling,
  getExpansionHeaderStyling,
  getExpansionTextStyling,
  getExpansionDividerStyling
} from '../../utils/timelineRowStyling';
import { UnifiedActionButton } from '../ActionButtons/UnifiedActionButton';

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
    // 🔧 FIX: For venue view, get ALL bids that match the timeline entries for this date
    if (venueId) {
      // Extract date from request
      const requestDate = request.requestedDate?.split('T')[0] || request.startDate;
      
      // Get all timeline entry IDs for this date (strip the 'venue-bid-' prefix)
      const sameDateTimelineIds = sameDateSiblings.map(sibling => {
        const timelineId = sibling.id;
        return timelineId.startsWith('venue-bid-') ? timelineId.replace('venue-bid-', '') : timelineId;
      });
      
      // Also include the current entry ID
      const currentEntryId = entry.id.startsWith('venue-bid-') ? entry.id.replace('venue-bid-', '') : entry.id;
      const allRelevantIds = [...sameDateTimelineIds, currentEntryId];
      
      // 🔧 DEBUG: Log the filtering process
      console.log('🔧 ShowRequestProcessor Debug:');
      console.log('  RequestDate:', requestDate);
      console.log('  VenueId:', venueId);
      console.log('  AllRelevantIds:', allRelevantIds);
      console.log('  VenueBids count:', venueBids.length);
      console.log('  VenueBids for this venue/date:', venueBids.filter(bid => {
        const bidDate = bid.proposedDate?.split('T')[0] || bid.proposedDate;
        return bidDate === requestDate && bid.venueId === venueId;
      }).map(bid => ({ id: bid.id, showRequestId: bid.showRequestId })));
      
      // Find all bids that match these timeline entry IDs
      requestBids = venueBids.filter(bid => {
        const bidDate = bid.proposedDate?.split('T')[0] || bid.proposedDate;
        return bidDate === requestDate && 
               bid.venueId === venueId && 
               allRelevantIds.includes(bid.id) &&
               !declinedBids.has(bid.id);
      });
      
      console.log('  Filtered RequestBids:', requestBids.map(bid => ({ id: bid.id, showRequestId: bid.showRequestId })));
    } else {
      // For artist view, use normal filtering
      requestBids = venueBids.filter(bid => bid.showRequestId === request.id && !declinedBids.has(bid.id));
    }
  }

  // Determine status for styling
  // BUSINESS LOGIC: Show requests are either "Open" or have "Hold" status
  // Accepted bids should be converted to confirmed shows, not shown as accepted requests
  const hasActiveHold = requestBids.some((bid: VenueBid) => 
    (bid as any).holdState === 'HELD' || (bid as any).holdState === 'FROZEN'
  );
  const isHeldBidRequest = (request as any).isHeldBid;
  
  // Determine styling variant using unified system
  let styleVariant: 'confirmed' | 'open' | 'hold' = 'open';
  if (hasActiveHold || isHeldBidRequest) {
    styleVariant = 'hold';
  }
  // All other show requests use 'open' styling
  
  // Use unified styling system
  const rowClassName = getTimelineRowStyling(styleVariant);
  const textColorClass = getTimelineTextStyling(styleVariant);
  const expandedBgClass = getExpansionContainerStyling(styleVariant);
  const expandedHeaderClass = getExpansionHeaderStyling(styleVariant);
  const expandedTextClass = getExpansionTextStyling(styleVariant);
  const expandedDividerClass = getExpansionDividerStyling(styleVariant);

  return (
    <React.Fragment key={`request-${request.id}`}>
      <ShowRequestRow
        entry={entry}
        request={request}
        requestBids={requestBids}
        sameDateSiblings={sameDateSiblings}
        isFirstOfDate={isFirstOfDate}
        entryDate={entryDate}
        borderClass={rowClassName}
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
          variant={styleVariant}
        />
      )}
      
      {/* Add Another Artist Button - shows on any expanded row for venue owners */}
      {state.expandedRequests.has(request.id) && permissions.actualViewerType === 'venue' && permissions.isOwner && (
        <tr>
          <td colSpan={venueId ? 9 : 10} className="px-0 py-0">
            <div className="bg-gray-50 hover:bg-gray-100 transition-colors duration-150 px-4 py-2 border-t border-gray-200">
              <UnifiedActionButton
                variant="secondary"
                size="md"
                onClick={() => {
                  // Extract date from the current timeline entry
                  const extractedDate = extractDateFromEntry(request);
                  handlers.openAddAnotherArtistModal(request.id, extractedDate);
                }}
                className="w-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 hover:border-gray-400 transition-all duration-150 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Artist</span>
              </UnifiedActionButton>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
} 
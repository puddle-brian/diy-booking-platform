import React from 'react';
import { VenueBid, VenueOffer } from '../../../types';
import { BidTimelineItem } from './BidTimelineItem';

interface ExpandedBidsSectionProps {
  request: any;
  requestBids: VenueBid[];
  sameDateSiblings: any[];
  venueOffers: VenueOffer[];
  venueBids: VenueBid[];
  declinedBids: Set<string>;
  permissions: any;
  venues: any[];
  venueId?: string;
  venueName?: string;
  artistId?: string;
  handlers: any;
  actions: any;
  getEffectiveBidStatus: (bid: VenueBid) => string;
  handleBidAction: (bid: VenueBid, action: string, reason?: string) => Promise<void>;
  handleOfferAction: (offer: VenueOffer, action: string) => Promise<void>;
  getBillingPriority: (item: { billingPosition?: string }) => number;
  expandedDividerClass: string;
}

export function ExpandedBidsSection({
  request,
  requestBids,
  sameDateSiblings,
  venueOffers,
  venueBids,
  declinedBids,
  permissions,
  venues,
  venueId,
  venueName,
  artistId,
  handlers,
  actions,
  getEffectiveBidStatus,
  handleBidAction,
  handleOfferAction,
  getBillingPriority,
  expandedDividerClass
}: ExpandedBidsSectionProps) {
  
  // Collect all bids from parent and siblings
  let allBids: Array<{
    bid: VenueBid;
    request: any;
    artistName: string;
    billingPosition?: string;
  }> = [];
  
  // Add parent bids
  const parentBids = requestBids
    .filter((bid: VenueBid) => {
      if (['expired', 'declined', 'rejected'].includes(bid.status) || declinedBids.has(bid.id)) {
        return false;
      }
      return permissions.canSeeFinancialDetails(undefined, bid, request);
    })
    .map((bid: VenueBid) => ({
      bid,
      request,
      artistName: request.artist?.name || request.artistName || 'Unknown',
      billingPosition: bid.billingPosition
    }));
  
  allBids.push(...parentBids);
  
  // Add sibling bids
  if (sameDateSiblings.length > 0) {
    for (const siblingEntry of sameDateSiblings) {
      if (siblingEntry.type === 'show-request') {
        const siblingRequest = siblingEntry.data as any & { 
          isVenueInitiated?: boolean; 
          originalOfferId?: string; 
          isVenueBid?: boolean;
          originalShowRequestId?: string;
        };
        
        // Get bids for this sibling request
        let siblingBids: VenueBid[] = [];
        if (siblingRequest.isVenueInitiated && siblingRequest.originalOfferId) {
          const originalOffer = venueOffers.find(offer => offer.id === siblingRequest.originalOfferId);
          if (originalOffer) {
            const syntheticBid: VenueBid = {
              id: `offer-bid-${originalOffer.id}`,
              showRequestId: siblingRequest.id,
              venueId: originalOffer.venueId,
                             venueName: originalOffer.venueName || 'Unknown Venue',
              proposedDate: originalOffer.proposedDate.split('T')[0],
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
              artistId: originalOffer.artistId,
              artistName: originalOffer.artistName,
            } as VenueBid & { artistId?: string; artistName?: string };
            siblingBids = [syntheticBid];
          }
        } else if (siblingRequest.isVenueBid && siblingRequest.originalShowRequestId) {
          siblingBids = venueBids.filter(bid => 
            bid.showRequestId === siblingRequest.originalShowRequestId && 
            !declinedBids.has(bid.id)
          );
        } else {
          siblingBids = venueBids.filter(bid => bid.showRequestId === siblingRequest.id && !declinedBids.has(bid.id));
        }
        
        // Filter and add sibling bids
        const filteredSiblingBids = siblingBids
          .filter((bid: VenueBid) => {
            if (['expired', 'declined', 'rejected'].includes(bid.status) || declinedBids.has(bid.id)) {
              return false;
            }
            return permissions.canSeeFinancialDetails(undefined, bid, siblingRequest);
          })
          .map((bid: VenueBid) => ({
            bid,
            request: siblingRequest,
            artistName: siblingRequest.artist?.name || siblingRequest.artistName || 'Unknown',
            billingPosition: bid.billingPosition
          }));
        
        allBids.push(...filteredSiblingBids);
      }
    }
  }
  
  // Sort all bids by billing position using centralized billing priority function
  const sortedBids = allBids.sort((a, b) => {
    return getBillingPriority(a) - getBillingPriority(b);
  });
  
  return (
    <div className="bg-white border-l-4 border-blue-200">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium text-gray-600">
            <th className="px-4 py-1 w-[3%]"></th>
            <th className="px-4 py-1 w-[12%]">Date</th>
            {!venueId && <th className="px-4 py-1 w-[14%]">Location</th>}
            <th className={`px-4 py-1 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>{artistId ? 'Venue' : venueId ? 'Artist' : 'Artist'}</th>
            <th className="px-4 py-1 w-[10%]">Status</th>
            <th className="px-4 py-1 w-[7%]">{venueId ? 'Position' : 'Capacity'}</th>
            <th className="px-4 py-1 w-[7%]">Age</th>
            <th className={`px-4 py-1 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>Offers</th>
            <th className="px-4 py-1 w-[8%]">Details</th>
            <th className="px-4 py-1 w-[10%]">Actions</th>
          </tr>
        </thead>
        <tbody className={expandedDividerClass}>
          {sortedBids.map(({ bid, request: bidRequest }) => {
            const isFrozenByHold = (bid as any).holdState === 'FROZEN' || (bid as any).holdState === 'HELD';
            
            return (
              <BidTimelineItem
                key={`bid-${bid.id}`}
                bid={bid}
                request={bidRequest}
                permissions={permissions}
                isExpanded={false}
                isDeleting={false}
                venueOffers={venueOffers as any}
                venueBids={venueBids}
                venueId={venueId}
                venueName={venueName}
                artistId={artistId}
                venues={venues}
                effectiveStatus={getEffectiveBidStatus(bid)}
                onToggleExpansion={() => {}}
                onDeleteBid={() => {}}
                onShowDocument={handlers.handleBidDocumentModal}
                onShowDetail={handlers.handleBidDocumentModal}
                onAcceptBid={(bid) => handleBidAction(bid, 'accept')}
                onDeclineBid={(bid) => handleBidAction(bid, 'decline')}
                onOfferAction={handleOfferAction}
                onBidAction={handleBidAction}
                onMakeOffer={(request, existingBid) => {
                  const requestWithDates = request as any;
                  const preSelectedDate = requestWithDates.requestDate || requestWithDates.startDate || null;
                  
                  actions.openUniversalOffer(
                    {
                      id: request.artistId,
                      name: request.artist?.name || request.artistName
                    },
                    {
                      id: request.id,
                      title: request.title,
                      artistName: request.artist?.name || request.artistName
                    },
                    preSelectedDate,
                    existingBid
                  );
                }}
                isFrozenByHold={isFrozenByHold}
                activeHoldInfo={isFrozenByHold ? {
                  id: (bid as any).frozenByHoldId || '',
                  expiresAt: '',
                  requesterName: 'Hold Request',
                  reason: 'Bid locked by active hold'
                } : undefined}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 
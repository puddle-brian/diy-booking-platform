import React from 'react';
import { VenueBid } from '../../../types';
import { ItineraryDate } from '../DateDisplay';
import { AlignedDate } from './AlignedDate';
import { DeleteActionButton } from '../ActionButtons';
import { generateSmartShowTitle, getBillingPriority } from '../../utils/showNaming';
import { ExpansionIndicator } from './ExpansionIndicator';
import { timelineTypography } from '../../utils/timelineRowStyling';

interface ShowRequestRowProps {
  entry: any;
  request: any;
  requestBids: VenueBid[];
  sameDateSiblings: any[];
  isFirstOfDate: boolean;
  entryDate: string;
  borderClass: string;
  textColorClass: string;
  artistId?: string;
  venueId?: string;
  permissions: any;
  state: any;
  handlers: any;
  getBidStatusBadge: (bid: VenueBid) => { className: string; text: string };
  toggleRequestExpansion: (requestId: string) => void;
  handleDeleteShowRequest: (requestId: string, requestName: string) => Promise<void>;
  handleOfferAction: (offer: any, action: string) => Promise<void>;
  handleBidAction: (bid: any, action: string, reason?: string) => Promise<void>;
  venueOffers: any[];
  venueBids: VenueBid[];
}

export function ShowRequestRow({
  entry,
  request,
  requestBids,
  sameDateSiblings,
  isFirstOfDate,
  entryDate,
  borderClass,
  textColorClass,
  artistId,
  venueId,
  permissions,
  state,
  handlers,
  getBidStatusBadge,
  toggleRequestExpansion,
  handleDeleteShowRequest,
  handleOfferAction,
  handleBidAction,
  venueOffers,
  venueBids,
}: ShowRequestRowProps) {
  return (
    <tr 
      className={`${borderClass} cursor-pointer transition-colors duration-150 hover:shadow-sm`}
      onClick={() => toggleRequestExpansion(request.id)}
      title={`Click to ${state.expandedRequests.has(request.id) ? 'hide' : 'view'} bids for this show request`}
    >
      <td className="px-4 py-1 w-[3%]">
        <div className="flex items-center justify-center">
          <ExpansionIndicator 
            isExpanded={state.expandedRequests.has(request.id)}
            title={`Click to ${state.expandedRequests.has(request.id) ? 'hide' : 'view'} bids for this show request`}
          />
        </div>
      </td>
      <td className="px-4 py-1 w-[12%]">
        <AlignedDate
          startDate={request.requestedDate?.split('T')[0] || request.startDate}
          endDate={request.requestedDate?.split('T')[0] || request.endDate}
          isSingleDate={true}
          className={timelineTypography.date}
        />
      </td>
      {!venueId && (
        <td className="px-4 py-1 w-[14%]">
          <div className={`text-sm truncate ${textColorClass}`}>{request.location}</div>
        </td>
      )}
      <td className={`px-4 py-1 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>
        <div className="text-sm font-medium text-gray-900 truncate" title={
          (() => {
            if (venueId) {
              // Generate tooltip for venue view using unified system
              const allSameDateArtists = [entry, ...sameDateSiblings]
                .filter(e => e.type === 'show-request')
                .map(e => {
                  const req = e.data as any;
                  const artistBid = requestBids.find(bid => bid.showRequestId === req.id);
                  
                  return {
                    artistName: req.artist?.name || req.artistName || 'Unknown Artist',
                    status: 'accepted' as const,
                    billingPosition: artistBid?.billingPosition || 'support' as const
                  };
                })
                .filter(artist => artist.artistName !== 'Unknown Artist');
              
              const { tooltip } = generateSmartShowTitle({
                headlinerName: allSameDateArtists[0]?.artistName || request.artist?.name || request.artistName || 'Unknown Artist',
                supportActs: allSameDateArtists.slice(1),
                includeStatusInCount: true
              });
              
              return tooltip;
            } else {
              // Generate tooltip for other views
              const { tooltip } = generateSmartShowTitle({
                headlinerName: request.artist?.name || request.artistName || 'Unknown Artist',
                supportActs: [],
                includeStatusInCount: true
              });
              
              return tooltip;
            }
          })()
        }>
          {(() => {
            if (artistId) {
              // For artist pages, show venue information
              if (request.isVenueInitiated) {
                if (requestBids.length > 1) {
                  return (
                    <span className="text-gray-600 text-sm">
                      {requestBids.length} competing venues
                    </span>
                  );
                } else {
                  const requestAsVenueRequest = request as any & { venueId?: string; venueName?: string };
                  if (requestAsVenueRequest.venueId && requestAsVenueRequest.venueId !== 'external-venue') {
                    return (
                      <a 
                        href={`/venues/${requestAsVenueRequest.venueId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        title="View venue page"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {requestAsVenueRequest.venueName}
                      </a>
                    );
                  } else {
                    return <span>{requestAsVenueRequest.venueName}</span>;
                  }
                }
              } else {
                const requestAsVenueSpecific = request as any & { 
                  isVenueSpecific?: boolean; 
                  venueSpecificId?: string; 
                  venueSpecificName?: string; 
                };
                
                if (requestAsVenueSpecific.isVenueSpecific && requestAsVenueSpecific.venueSpecificId) {
                  return (
                    <a 
                      href={`/venues/${requestAsVenueSpecific.venueSpecificId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      title="View venue page"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {requestAsVenueSpecific.venueSpecificName}
                    </a>
                  );
                } else if (requestBids.length === 0) {
                  return <span className="text-gray-500 text-sm">No bids yet</span>;
                } else {
                  if (requestBids.length === 1) {
                    const singleBid = requestBids[0];
                    if (singleBid.venueId && singleBid.venueId !== 'external-venue') {
                      return (
                        <a 
                          href={`/venues/${singleBid.venueId}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          title="View venue page"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {singleBid.venueName}
                        </a>
                      );
                    } else {
                      return <span>{singleBid.venueName}</span>;
                    }
                  } else {
                    return (
                      <span className="text-gray-600 text-sm">
                        {requestBids.length} competing venues
                      </span>
                    );
                  }
                }
              }
            } else if (venueId) {
              // 🚀 SIMPLIFIED FIX: Use venueBids directly instead of complex matching
              // Filter venueBids to only those for this date and venue
              const sameDateVenueBids = venueBids.filter(bid => {
                const bidDate = bid.proposedDate?.split('T')[0] || bid.proposedDate;
                return bidDate === entryDate && bid.venueId === venueId;
              });
              
              // Get artist names from timeline entries and billing positions from venueBids
              const allSameDateArtists = [entry, ...sameDateSiblings]
                .filter(e => e.type === 'show-request')
                .map(e => {
                  const req = e.data as any;
                  const timelineEntryId = req.id.startsWith('venue-bid-') ? req.id.replace('venue-bid-', '') : req.id;
                  const matchingBid = sameDateVenueBids.find(bid => bid.id === timelineEntryId);
                  
                  return {
                    artistName: req.artist?.name || req.artistName || 'Unknown Artist',
                    status: 'accepted' as const,
                    billingPosition: matchingBid?.billingPosition || 'support' as const
                  };
                })
                .filter(artist => artist.artistName !== 'Unknown Artist');
              
              // 🔍 DEBUG: Log title generation for August 29th
              if (entryDate === '2025-08-29') {
                              console.log('🎵 Aug 29 Title Debug - AllSameDateArtists:', allSameDateArtists);
              console.log('🎵 Aug 29 Title Debug - RequestBids:', requestBids);
              console.log('🎵 Aug 29 RequestBids IDs:', requestBids.map(bid => ({
                id: bid.id,
                showRequestId: bid.showRequestId,
                billingPosition: bid.billingPosition
              })));
              console.log('🎵 Aug 29 Title Debug - Entry data:', entry.data);
              console.log('🎵 Aug 29 Title Debug - SameDateSiblings data:', sameDateSiblings.map(s => s.data));
              
              // 🔍 DEBUG: Check bid matching for each artist
              console.log('🎵 Aug 29 Bid Matching Debug:');
              allSameDateArtists.forEach((artist, i) => {
                const req = [entry, ...sameDateSiblings][i]?.data as any;
                const timelineEntryId = req?.id?.startsWith('venue-bid-') ? req.id.replace('venue-bid-', '') : req?.id;
                const artistBid = requestBids.find(bid => bid.id === timelineEntryId);
                console.log(`  ${i+1}. ${artist.artistName}:`);
                console.log(`     Timeline Entry ID: ${req?.id}`);
                console.log(`     Stripped ID for matching: ${timelineEntryId}`);
                console.log(`     Found bid: ${artistBid ? 'YES' : 'NO'}`);
                console.log(`     Billing: ${artist.billingPosition}`);
                if (artistBid) {
                  console.log(`     Bid details:`, artistBid);
                }
              });
              }
              
              // 🚀 FIX: Find the actual headliner, not just the first artist
              const headliners = allSameDateArtists.filter(artist => 
                artist.billingPosition === 'headliner' || artist.billingPosition === 'co-headliner'
              );
              const supportActs = allSameDateArtists.filter(artist => 
                artist.billingPosition === 'support' || artist.billingPosition === 'local-support'
              );
              
              // Use the first headliner as the main headliner, others become co-headliners
              const mainHeadliner = headliners[0]?.artistName || allSameDateArtists[0]?.artistName || 'Unknown Artist';
              const coHeadliners = headliners.slice(1).map(h => ({
                artistName: h.artistName,
                status: h.status,
                billingPosition: 'co-headliner' as const
              }));
              const supportActsForTitle = supportActs.map(s => ({
                artistName: s.artistName,
                status: s.status,
                billingPosition: s.billingPosition
              }));
              
              const { title } = generateSmartShowTitle({
                headlinerName: mainHeadliner,
                supportActs: [...coHeadliners, ...supportActsForTitle],
                includeStatusInCount: true
              });
              
              // 🔍 DEBUG: Log generated title for August 29th
              if (entryDate === '2025-08-29') {
                console.log('🎵 Aug 29 Title Debug - Generated title:', title);
              }
              
              return title;
            } else {
              // Use unified title system for all views
              const { title } = generateSmartShowTitle({
                headlinerName: request.artist?.name || request.artistName || 'Unknown Artist',
                supportActs: [],
                includeStatusInCount: true
              });
              
              return title;
            }
          })()}
        </div>
      </td>
      <td className="px-4 py-1 w-[10%]">
        <div className="flex items-center space-x-1">
          {(() => {
            // If viewing as a venue, show venue's specific bid status
            // BUSINESS LOGIC: Even accepted venue bids should show as "Open" 
            // since show requests are "always open unless confirmed"
            if (venueId && requestBids.length > 0) {
              const venueBid = requestBids.find(bid => bid.venueId === venueId);
              if (venueBid) {
                // Check for accepted state first (even in auto-hold)
                if (venueBid.status === 'accepted' || (venueBid as any).holdState === 'ACCEPTED_HELD') {
                  return (
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Accepted
                    </span>
                  );
                }
                
                // Check for hold status (manual holds, not auto-holds from acceptance)
                if ((venueBid as any).holdState === 'HELD' || (venueBid as any).holdState === 'FROZEN') {
                  return (
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
                      Hold
                    </span>
                  );
                }
                
                // All other venue bids (pending) show as "Open"
                return (
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Open
                  </span>
                );
              }
            }
            
            // Default logic for artists and venues without bids
            // BUSINESS LOGIC: Show requests are either "Open" or become confirmed shows
            // Show "Accepted" for auto-held acceptances, "Hold" for manual holds
            
            const hasAcceptedBid = requestBids.some((bid: VenueBid) => 
              bid.status === 'accepted' || (bid as any).holdState === 'ACCEPTED_HELD'
            );
            
            if (hasAcceptedBid) {
              return (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Accepted
                </span>
              );
            }
            
            const hasActiveHold = requestBids.some((bid: VenueBid) => 
              (bid as any).holdState === 'HELD' || (bid as any).holdState === 'FROZEN'
            );
            
            const isHeldBidRequest = (request as any).isHeldBid;
            
            if (hasActiveHold || isHeldBidRequest) {
              return (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
                  Hold
                </span>
              );
            }
            
            // All show requests without holds are "Open"
            return (
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                Open
              </span>
            );
          })()}
          

        </div>
      </td>
      <td className="px-4 py-1 w-[7%]"></td>
      <td className="px-4 py-1 w-[7%]"></td>
      <td className={`px-4 py-1 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>
        <div className="flex items-center space-x-2">
          {/* Offers column - content moved to venue column to avoid redundancy */}
        </div>
      </td>
      <td className="px-4 py-1 w-[8%]">
        <div className="flex items-center space-x-1">
          <div className="w-6 h-6"></div>
        </div>
      </td>
      <td className="px-4 py-1 w-[10%]">
        <div className="flex items-center space-x-2">
          {(venueId || artistId) && (
            <DeleteActionButton
              request={request}
              venueId={venueId}
              venueOffers={venueOffers as any}
              venueBids={venueBids}
              permissions={permissions}
              isLoading={state.deleteLoading === request.id}
              onDeleteRequest={handleDeleteShowRequest}
              onOfferAction={(offer, action) => handleOfferAction(offer as any, action)}
              onBidAction={(bid, action, reason) => handleBidAction(bid as any, action, reason)}
            />
          )}
        </div>
      </td>
    </tr>
  );
} 
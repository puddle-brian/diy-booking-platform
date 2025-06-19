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
      className="cursor-pointer transition-colors duration-150 hover:shadow-sm"
      onClick={() => toggleRequestExpansion(request.id)}
      title={`Click to ${state.expandedRequests.has(request.id) ? 'hide' : 'view'} bids for this show request`}
    >
      <td className={`px-4 py-1 w-[3%] ${borderClass}`}>
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
        <div className="text-sm font-medium text-gray-900 truncate">
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
              // For venue pages, show intelligent artist lineup
              const allSameDateArtists = [entry, ...sameDateSiblings]
                .filter(e => e.type === 'show-request')
                .map(e => {
                  const req = e.data as any;
                  const artistBid = requestBids.find(bid => bid.showRequestId === req.id);
                  
                  return {
                    artistName: req.artist?.name || req.artistName || 'Unknown Artist',
                    artistId: req.artistId,
                    status: 'accepted' as const,
                    billingPosition: artistBid?.billingPosition || undefined
                  };
                })
                .filter(artist => artist.artistName !== 'Unknown Artist')
                .sort((a, b) => {
                  return getBillingPriority(a) - getBillingPriority(b);
                });
              
              const smartTitle = (() => {
                if (!allSameDateArtists || allSameDateArtists.length === 0) {
                  return request.artist?.name || request.artistName || 'Unknown Artist';
                }
                
                if (allSameDateArtists.length === 1) {
                  const artist = allSameDateArtists[0];
                  if (artist.artistId && artist.artistId !== 'external-artist') {
                    return (
                      <a 
                        href={`/artists/${artist.artistId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        title="View artist page"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {artist.artistName}
                      </a>
                    );
                  } else {
                    return artist.artistName;
                  }
                } else {
                  const sortedArtists = [...allSameDateArtists].sort((a, b) => {
                    return getBillingPriority(a) - getBillingPriority(b);
                  });
                  const headlinerArtist = sortedArtists[0];
                  
                  if (!headlinerArtist) {
                    return 'Unknown Artist';
                  }
                  
                  const supportActs = sortedArtists.slice(1);
                  
                  const { title, tooltip } = generateSmartShowTitle({
                    headlinerName: headlinerArtist.artistName || 'Unknown Artist',
                    supportActs: supportActs.map(artist => ({
                      artistName: artist.artistName || 'Unknown Artist',
                      status: 'accepted' as const,
                      billingPosition: artist.billingPosition || 'support' as const
                    })),
                    includeStatusInCount: true
                  });
                  
                  if (headlinerArtist.artistId && headlinerArtist.artistId !== 'external-artist') {
                    return (
                      <a 
                        href={`/artists/${headlinerArtist.artistId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        title={tooltip ? `${tooltip} - Click to view ${headlinerArtist.artistName || 'Unknown Artist'} page` : `View ${headlinerArtist.artistName || 'Unknown Artist'} page`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {title}
                      </a>
                    );
                  } else {
                    return (
                      <span title={tooltip || undefined}>
                        {title}
                      </span>
                    );
                  }
                }
              })();
              
              return smartTitle;
            } else {
              // For public/general view, show artist name
              if (request.artistId && request.artistId !== 'external-artist') {
                return (
                  <a 
                    href={`/artists/${request.artistId}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                    title="View artist page"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {request.artist?.name || request.artistName}
                  </a>
                );
              } else {
                return request.artist?.name || request.artistName;
              }
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
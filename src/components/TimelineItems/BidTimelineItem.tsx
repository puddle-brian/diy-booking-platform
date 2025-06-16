import React from 'react';
import { VenueBid, TourRequest, VenueOffer } from '../../../types';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { ItineraryDate } from '../DateDisplay';
import { DeleteActionButton, DocumentActionButton, MakeOfferActionButton } from '../ActionButtons';
import { InlineOfferDisplay } from '../OfferDisplay';

interface BidTimelineItemProps {
  bid: VenueBid;
  request?: TourRequest;
  permissions: ItineraryPermissions;
  isExpanded: boolean;
  isDeleting: boolean;
  venueOffers: VenueOffer[];
  venueBids: VenueBid[];
  venueId?: string;
  venueName?: string;
  artistId?: string;  // Add artistId to determine viewer type
  venues?: Array<{ id: string; name: string; city: string; state: string; }>;
  effectiveStatus?: string; // Override bid.status for optimistic updates
  onToggleExpansion: (bidId: string) => void;
  onDeleteBid: (bidId: string, bidName: string) => void;
  onShowDocument: (bid: VenueBid) => void;
  onShowDetail: (bid: VenueBid) => void;
  onAcceptBid?: (bid: VenueBid) => void;
  onDeclineBid?: (bid: VenueBid) => void;
  onOfferAction?: (offer: VenueOffer, action: string) => Promise<void>;
  onBidAction?: (bid: VenueBid, action: string, reason?: string) => Promise<void>;
  onMakeOffer?: (request: TourRequest, existingBid?: VenueBid) => void;
  // NEW: Hold state management
  isFrozenByHold?: boolean;
  activeHoldInfo?: {
    id: string;
    expiresAt: string;
    requesterName: string;
    reason: string;
  };
}

export function BidTimelineItem({
  bid,
  request,
  permissions,
  isExpanded,
  isDeleting,
  venueOffers,
  venueBids,
  venueId,
  venueName,
  artistId,
  venues,
  effectiveStatus,
  onToggleExpansion,
  onDeleteBid,
  onShowDocument,
  onShowDetail,
  onAcceptBid,
  onDeclineBid,
  onOfferAction,
  onBidAction,
  onMakeOffer,
  isFrozenByHold = false,
  activeHoldInfo
}: BidTimelineItemProps) {
  
  const getStatusBadge = (status: string, isFrozen = false, holdState?: string) => {
    // ❄️ FROZEN/HELD states take priority over normal status
    if (isFrozen && holdState === 'FROZEN') {
      return {
        className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 text-slate-700',
        text: 'Frozen'
      };
    }
    if (isFrozen && holdState === 'HELD') {
      return {
        className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700',
        text: 'On Hold'
      };
    }

    // Normal status badges
    switch (status) {
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
      default:
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
          text: 'Pending'
        };
    }
  };

  const currentStatus = effectiveStatus || bid.status;
  const statusBadge = getStatusBadge(currentStatus, isFrozenByHold, (bid as any).holdState);

  // 🎵 Helper function to generate billing position badge with status-matched colors
  const getBillingPositionBadge = (billingPosition: string, bidStatus: string) => {
    const abbreviations: Record<string, string> = {
      'headliner': 'HL',
      'co-headliner': 'CH', 
      'support': 'SP',
      'local-support': 'LS'
    };

    const abbr = abbreviations[billingPosition] || billingPosition.toUpperCase().slice(0, 2);

    // Match colors to bid status
    let colorClass = '';
    switch (bidStatus.toLowerCase()) {
      case 'pending':
        colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
        break;
      case 'accepted':
        colorClass = 'bg-green-100 text-green-800 border-green-300';
        break;
      case 'declined':
      case 'rejected':
        colorClass = 'bg-red-100 text-red-800 border-red-300';
        break;
      case 'confirmed':
        colorClass = 'bg-blue-100 text-blue-800 border-blue-300';
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800 border-gray-300';
    }

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ml-2 flex-shrink-0`}>
        {abbr}
      </span>
    );
  };

  // 🎨 Dynamic row styling based on hold state
  const getRowStyling = () => {
    if (isFrozenByHold && (bid as any).holdState === 'HELD') {
      return "bg-violet-100 hover:bg-violet-200 transition-colors duration-150"; // Held state - bold purple for active hold
    }
    // Frozen rows stay the same yellow as parent rows to avoid confusion
    return "bg-yellow-50 hover:bg-yellow-100 transition-colors duration-150"; // Normal/frozen state
  };

  return (
    <tr className={getRowStyling()}>
      {/* Expansion toggle column - w-[3%] - Empty for child rows */}
      <td className="px-2 py-1.5 w-[3%]">
        {/* Intentionally blank - child rows are not expandable */}
      </td>

      {/* Date column - w-[12%] - Empty for child rows to show hierarchy */}
      <td className="px-4 py-1.5 w-[12%]">
        {/* Intentionally blank - parent row provides date context */}
      </td>

      {/* Location column - w-[14%] - Hidden for venue views */}
      {!venueId && (
        <td className="px-4 py-1.5 w-[14%]">
          <div className={`text-sm truncate ${
            isFrozenByHold && (bid as any).holdState === 'HELD' ? 'text-violet-700' :
            'text-yellow-900'
          }`}>
            {(() => {
              // Look up venue location from venues array
              if (venues && bid.venueId) {
                const venue = venues.find(v => v.id === bid.venueId);
                if (venue && venue.city && venue.state) {
                  return `${venue.city}, ${venue.state}`;
                }
              }
              
              // Fallback: try to parse location from venueName if it contains a clear pattern
              // Some venues might include location like "Venue Name - City, State"
              const venueNameParts = bid.venueName.split(' - ');
              if (venueNameParts.length > 1) {
                const lastPart = venueNameParts[venueNameParts.length - 1];
                // Check if it looks like "City, State" pattern
                if (lastPart.includes(',') && lastPart.match(/,\s*[A-Z]{2}$/)) {
                  return lastPart;
                }
              }
              
              // Check if venue name ends with state abbreviation pattern (e.g. "lost bag, providence RI")
              if (bid.venueName.match(/,\s*[a-z]+\s+[A-Z]{2}$/i)) {
                const parts = bid.venueName.split(',');
                if (parts.length >= 2) {
                  return parts.slice(-2).join(',').trim();
                }
              }
              
              // Show dash when no location data is available
              return '-';
            })()}
          </div>
        </td>
      )}

      {/* Venue/Artist column - w-[26%] for venue views, w-[19%] for artist views */}
      <td className={`px-4 py-1.5 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>
          <div className="text-sm font-medium text-gray-900 truncate">
            {venueId ? (
              // When viewing as venue, show artist information
              (bid as any).artistId && (bid as any).artistId !== 'external-artist' ? (
                <a 
                  href={`/artists/${(bid as any).artistId}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  title="View artist page"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(bid as any).artistName || 'Unknown Artist'}
                </a>
              ) : (
                <span>{(bid as any).artistName || 'Unknown Artist'}</span>
              )
            ) : (
              // When viewing as artist, show venue information (original behavior)
              bid.venueId && bid.venueId !== 'external-venue' ? (
                <a 
                  href={`/venues/${bid.venueId}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  title="View venue page"
                  onClick={(e) => e.stopPropagation()}
                >
                  {bid.venueName}
                </a>
              ) : (
                <span>{bid.venueName}</span>
              )
            )}
          </div>
        </td>

            {/* Status column - w-[10%] */}
      <td className="px-4 py-1.5 w-[10%]">
        <span className={statusBadge.className}>
          {statusBadge.text}
        </span>
      </td>

      {/* Capacity/Position column - w-[7%] - Context sensitive */}
      <td className="px-4 py-1.5 w-[7%]">
        {venueId ? (
          // Venue view: Show billing position instead of capacity (venue knows their own capacity)
          (bid as any).billingPosition ? (
            <div className="flex justify-center">
              {getBillingPositionBadge((bid as any).billingPosition, currentStatus)}
            </div>
          ) : (
            <div className="text-xs text-gray-600 text-center">-</div>
          )
        ) : (
          // Artist view: Show venue capacity (important for artist decision-making)
          <div className="text-xs text-gray-600">
            {bid.capacity || '-'}
          </div>
        )}
      </td>

      {/* Age column - w-[7%] */}
      <td className="px-4 py-1.5 w-[7%]">
        <div className="text-xs text-gray-600 whitespace-nowrap">
          {bid.ageRestriction || '-'}
        </div>
      </td>

      {/* Offers column - w-[15%] for venue views, w-[10%] for artist views */}
      <td className={`px-4 py-1.5 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>
        <div className="text-xs text-gray-600">
          {permissions.canSeeFinancialDetails(undefined, bid, request) ? (
            <InlineOfferDisplay 
              amount={bid.guarantee || (bid as any).amount}
              doorDeal={bid.doorDeal}
              className="text-xs"
            />
          ) : '-'}
        </div>
      </td>

      {/* Details column - w-[8%] */}
      <td className="px-4 py-1.5 w-[8%]">
        <div className="flex items-center space-x-1">
          {/* ✅ FIX: Show document icon in bid rows for both artists and venues */}
          {(permissions.actualViewerType === 'artist' || permissions.actualViewerType === 'venue') && (
            <>
              {/* Show greyed out document icon for frozen bids */}
              {isFrozenByHold && (bid as any).holdState === 'FROZEN' ? (
                <div className="inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-gray-100 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed" title="Document access temporarily frozen by active hold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              ) : (
                <DocumentActionButton
                  type="bid"
                  bid={bid}
                  request={request}
                  permissions={permissions}
                  onBidDocument={() => onShowDocument(bid)}
                />
              )}
            </>
          )}
          
          {/* 🎵 Billing Position Badge for Artist View - in Details column */}
          {!venueId && (bid as any).billingPosition && (
            <div className="ml-1">
              {getBillingPositionBadge((bid as any).billingPosition, currentStatus)}
            </div>
          )}
        </div>
      </td>

      {/* Actions column - w-[10%] */}
      <td className="px-4 py-1.5 w-[10%]">
        <div className="flex items-center space-x-1">
          {/* Make/Edit Offer button for venues viewing their own bid */}
          {venueId && bid.venueId === venueId && request && onMakeOffer && (
            <MakeOfferActionButton
              request={request as any}
              permissions={permissions}
              venueId={venueId}
              venueName={venueName}
              requestBids={venueBids}
              onMakeOffer={(req, _existingBid) => onMakeOffer(req as any, bid)}
            />
          )}
          
          {/* ❄️ FROZEN: Show just snowflake icon when bid is frozen by hold (but NOT when it's held) */}
          {isFrozenByHold && (bid as any).holdState === 'FROZEN' ? (
            <div className="flex items-center justify-center">
              <span 
                className="text-lg text-slate-500 cursor-help filter drop-shadow-none"
                title={`Frozen by active hold${activeHoldInfo ? ` (${activeHoldInfo.requesterName})` : ''}`}
              >
                ❄️
              </span>
            </div>
          ) : (bid as any).holdState === 'HELD' ? (
            /* 🔒 HELD BID: Show two distinct actions - Release Hold vs Decline Bid */
            <div className="flex items-center space-x-1">
              {/* Accept Button (with hold context) */}
              {permissions.canAcceptBid && permissions.canAcceptBid(bid, request) && onBidAction && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBidAction(bid, 'accept-held');
                  }}
                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                  disabled={isDeleting}
                  title="Accept this held bid - will cancel competing bids and release hold"
                >
                  ✓
                </button>
              )}
              
              {/* NEW: Release Hold Button - removes hold but keeps bid pending */}
              {onBidAction && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBidAction(bid, 'release-held');
                  }}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  disabled={isDeleting}
                  title="Release hold - return to normal bidding (bid stays available)"
                >
                  🔓
                </button>
              )}
              
              {/* Decline Bid Button - actually rejects the venue */}
              {permissions.canDeclineBid && permissions.canDeclineBid(bid, request) && onBidAction && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBidAction(bid, 'decline-held');
                  }}
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  disabled={isDeleting}
                  title="Decline this venue entirely - removes bid and releases hold"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Normal bid actions for non-held bids */}
              {currentStatus === 'pending' && (
                <>
                  {/* Accept Button */}
                  {permissions.canAcceptBid && permissions.canAcceptBid(bid, request) && onAcceptBid && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptBid(bid);
                      }}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      disabled={isDeleting}
                      title="Accept bid"
                    >
                      ✓
                    </button>
                  )}
                  
                  {/* Decline Button */}
                  {permissions.canDeclineBid && permissions.canDeclineBid(bid, request) && onDeclineBid && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeclineBid(bid);
                      }}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      disabled={isDeleting}
                      title="Decline bid"
                    >
                      ✕
                    </button>
                  )}
                </>
              )}

              {/* Actions for accepted bids */}
              {currentStatus === 'accepted' && (
                <>
                  {/* 🎯 NEW: Venue-specific actions for accepted bids */}
                  {permissions.actualViewerType === 'venue' ? (
                    <>
                      {/* Confirm Button */}
                      {onBidAction && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBidAction(bid, 'confirm-accepted');
                          }}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          disabled={isDeleting}
                          title="Confirm show - finalizes booking"
                        >
                          ✓
                        </button>
                      )}
                      
                      {/* Decline Button */}
                      {onBidAction && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBidAction(bid, 'decline');
                          }}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          disabled={isDeleting}
                          title="Reject acceptance - venue cannot confirm"
                        >
                          ✕
                        </button>
                      )}
                    </>
                  ) : (
                    /* Artist view: Show Undo Accept Button */
                    permissions.canAcceptBid && permissions.canAcceptBid(bid, request) && onBidAction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBidAction(bid, 'undo-accept');
                        }}
                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                        disabled={isDeleting}
                        title="Undo acceptance"
                      >
                        ↶
                      </button>
                    )
                  )}
                </>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
} 
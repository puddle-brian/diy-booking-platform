import React from 'react';
import { VenueBid, TourRequest, VenueOffer } from '../../../types';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { ItineraryDate } from '../DateDisplay';
import { DeleteActionButton, DocumentActionButton } from '../ActionButtons';

interface BidTimelineItemProps {
  bid: VenueBid;
  request?: TourRequest;
  permissions: ItineraryPermissions;
  isExpanded: boolean;
  isDeleting: boolean;
  venueOffers: VenueOffer[];
  venueBids: VenueBid[];
  venueId?: string;
  venues?: Array<{ id: string; name: string; city: string; state: string; }>;
  effectiveStatus?: string; // Override bid.status for optimistic updates
  onToggleExpansion: (bidId: string) => void;
  onDeleteBid: (bidId: string, bidName: string) => void;
  onShowDocument: (bid: VenueBid) => void;
  onShowDetail: (bid: VenueBid) => void;
  onAcceptBid?: (bid: VenueBid) => void;
  onHoldBid?: (bid: VenueBid) => void;
  onDeclineBid?: (bid: VenueBid) => void;
  onOfferAction?: (offer: VenueOffer, action: string) => Promise<void>;
  onBidAction?: (bid: VenueBid, action: string, reason?: string) => Promise<void>;
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
  venues,
  effectiveStatus,
  onToggleExpansion,
  onDeleteBid,
  onShowDocument,
  onShowDetail,
  onAcceptBid,
  onHoldBid,
  onDeclineBid,
  onOfferAction,
  onBidAction
}: BidTimelineItemProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800',
          text: 'Accepted'
        };
      case 'hold':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
          text: 'On Hold'
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
  const statusBadge = getStatusBadge(currentStatus);

  return (
    <tr className="bg-yellow-50 hover:bg-yellow-100 transition-colors duration-150">
      {/* Expansion toggle column - w-[3%] */}
      <td className="px-2 py-1.5 w-[3%]">
        <div className="flex items-center justify-center text-gray-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </td>

      {/* Date column - w-[12%] */}
      <td className="px-4 py-1.5 w-[12%]">
        <ItineraryDate
          date={bid.proposedDate}
          className="text-sm font-medium text-yellow-900"
        />
      </td>

      {/* Location column - w-[14%] */}
      <td className="px-4 py-1.5 w-[14%]">
        <div className="text-sm text-yellow-900 truncate">
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

      {/* Venue column - w-[19%] */}
      <td className="px-4 py-1.5 w-[19%]">
        <div className="text-sm font-medium text-gray-900 truncate">
          {bid.venueId && bid.venueId !== 'external-venue' ? (
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
          )}
        </div>
      </td>

      {/* Status column - w-[10%] */}
      <td className="px-4 py-1.5 w-[10%]">
        <span className={statusBadge.className}>
          {statusBadge.text}
        </span>
      </td>

      {/* Capacity column - w-[7%] */}
      <td className="px-4 py-1.5 w-[7%]">
        <div className="text-xs text-gray-600">
          {bid.capacity || '-'}
        </div>
      </td>

      {/* Age column - w-[7%] */}
      <td className="px-4 py-1.5 w-[7%]">
        <div className="text-xs text-gray-600 whitespace-nowrap">
          {bid.ageRestriction || '-'}
        </div>
      </td>

      {/* Offers column - w-[10%] */}
      <td className="px-4 py-1.5 w-[10%]">
        <div className="text-xs text-gray-600">
          {bid.guarantee ? `$${bid.guarantee}` : 'Door deal'}
        </div>
      </td>

      {/* Details column - w-[8%] */}
      <td className="px-4 py-1.5 w-[8%]">
        <div className="flex items-center space-x-1">
          <DocumentActionButton
            type="bid"
            bid={bid}
            request={request}
            permissions={permissions}
            onBidDocument={() => onShowDocument(bid)}
          />
          
          
        </div>
      </td>

      {/* Actions column - w-[10%] */}
      <td className="px-4 py-1.5 w-[10%]">
        <div className="flex items-center space-x-1">
          {/* Accept/Hold/Decline buttons for pending bids */}
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
              
              {/* Hold Button */}
              {permissions.canHoldBid && permissions.canHoldBid(bid, request) && onHoldBid && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onHoldBid(bid);
                  }}
                  className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                  disabled={isDeleting}
                  title="Put on hold"
                >
                  ⏸
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

          {/* Accept/Decline buttons for hold bids */}
          {currentStatus === 'hold' && (
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

          {/* Undo Accept button for accepted bids */}
          {currentStatus === 'accepted' && (
            <>
              {/* Undo Accept Button */}
              {permissions.canAcceptBid && permissions.canAcceptBid(bid, request) && onBidAction && (
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
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
} 
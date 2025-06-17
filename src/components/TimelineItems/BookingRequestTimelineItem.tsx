import React from 'react';
import { ShowRequest, Show, Artist, Venue } from '@prisma/client';
import { formatDisplayDate } from '@/utils/dateUtils';
import { ItineraryDate } from '../DateDisplay';
import { formatAgeRestriction } from '../../utils/ageRestrictionUtils';

// Extended types to include relations for timeline display
type ShowRequestWithRelations = ShowRequest & {
  artist?: Artist;
  venue?: Venue;
};

type ShowWithRelations = Show & {
  artist?: Artist;
  venue?: Venue;
};

interface BookingRequestTimelineItemProps {
  entry: ShowRequestWithRelations | ShowWithRelations;
  permissions: any; // Will match existing permissions interface
  isExpanded: boolean;
  isDeleting: boolean;
  venueOffers: any[];
  venueBids: any[];
  venueId?: string;
  onToggleExpansion: (id: string) => void;
  onDeleteRequest?: (id: string, name: string) => void;
  onRequestDocument?: (entry: any) => void;
  onMakeOffer?: (entry: any) => void;
  onOfferAction?: (offer: any, action: string) => void;
  onBidAction?: (bid: any, action: string) => void;
}

export const BookingRequestTimelineItem: React.FC<BookingRequestTimelineItemProps> = ({
  entry,
  permissions,
  isExpanded,
  isDeleting,
  venueOffers,
  venueBids,
  venueId,
  onToggleExpansion,
  onDeleteRequest,
  onRequestDocument,
  onMakeOffer,
  onOfferAction,
  onBidAction
}) => {
  // Type guards to determine entry type
  const isShowRequest = 'requestedDate' in entry && 'initiatedBy' in entry;
  const isShow = 'date' in entry && !('requestedDate' in entry);
  
  // Normalize data for display
  const displayData = React.useMemo(() => {
    if (isShowRequest) {
      return {
        id: entry.id,
        title: entry.title,
        date: entry.requestedDate,
        status: entry.status,
        ageRestriction: entry.ageRestriction,
        location: entry.venue ? `${entry.venue.name}` : 'TBD',
        artistName: entry.artist?.name || 'TBD',
        venueName: entry.venue?.name || 'TBD',
        isVenueInitiated: entry.initiatedBy === 'VENUE',
        type: 'show-request' as const
      };
    } else if (isShow) {
      return {
        id: entry.id,
        title: entry.title,
        date: entry.date,
        status: 'CONFIRMED' as const,
        ageRestriction: entry.ageRestriction,
        location: entry.venue?.name || 'TBD',
        artistName: entry.artist?.name || 'TBD', 
        venueName: entry.venue?.name || 'TBD',
        isVenueInitiated: false,
        type: 'confirmed-show' as const
      };
    }
    
    throw new Error('Invalid entry type');
  }, [entry, isShowRequest, isShow]);

  // Status badge styling (matches existing patterns)
  const getStatusBadge = () => {
    if (displayData.type === 'confirmed-show') {
      return {
        className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800",
        text: "Confirmed"
      };
    }
    
    // For ShowRequests
    if (displayData.isVenueInitiated) {
      return {
        className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800",
        text: "Venue Offer"
      };
    }
    
    return {
      className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800", 
      text: "Tour Request"
    };
  };

  // Age restriction display (normalized format using centralized utility)
  const displayAgeRestriction = (ageRestriction: any): string => {
    return formatAgeRestriction(ageRestriction);
  };

  const statusBadge = getStatusBadge();

  return (
    <tr 
      className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
      onClick={() => onToggleExpansion(displayData.id)}
    >
      {/* Expand/Collapse Button */}
      <td className="px-4 py-1 w-[3%]">
        <button
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </td>

      {/* Date */}
      <td className="px-4 py-1 w-[12%]">
        <ItineraryDate
          date={displayData.date}
          className="text-sm font-medium text-gray-900"
        />
      </td>

      {/* Location (only show if not venue-specific view) */}
      {!venueId && (
        <td className="px-4 py-1 w-[14%]">
          <div className="text-sm text-gray-900 truncate">
            {displayData.location}
          </div>
        </td>
      )}

      {/* Title */}
      <td className={`px-4 py-1 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>
        <div className="text-sm font-medium text-gray-900 truncate">
          {displayData.title}
        </div>
      </td>

      {/* Status Badge */}
      <td className="px-4 py-1 w-[10%]">
        <span className={statusBadge.className}>
          {statusBadge.text}
        </span>
      </td>

      {/* Expected Draw (placeholder for now) */}
      <td className="px-4 py-1 w-[7%]">
        <div className="text-xs text-gray-600">
          -
        </div>
      </td>

      {/* Age Restriction */}
      <td className="px-4 py-1 w-[7%]">
        <div className="text-xs text-gray-600">
          {displayAgeRestriction(displayData.ageRestriction)}
        </div>
      </td>

      {/* Financial Terms */}
      <td className={`px-4 py-1 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>
        <div className="text-xs text-gray-600">
          {isShowRequest && entry.amount ? `$${entry.amount}` : '-'}
        </div>
      </td>

      {/* Document Actions */}
      <td className="px-4 py-1 w-[8%]">
        <div className="flex items-center space-x-1">
          {/* Document button placeholder */}
          <div className="w-6 h-6"></div>
        </div>
      </td>

      {/* Action Buttons */}
      <td className="px-4 py-1 w-[10%]">
        <div className="flex items-center space-x-1">
          {/* Delete/Cancel Button */}
          {onDeleteRequest && displayData.type === 'show-request' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(displayData.id, displayData.title);
              }}
              className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs"
              disabled={isDeleting}
              title="Delete Request"
            >
              {isDeleting ? '...' : '×'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}; 
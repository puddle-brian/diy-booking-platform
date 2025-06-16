import React from 'react';
import { TourRequest } from '../../../types';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { ItineraryDate } from '../DateDisplay';
import { DeleteActionButton, DocumentActionButton, MakeOfferActionButton } from '../ActionButtons';

interface TourRequestTimelineItemProps {
  request: TourRequest & { 
    isVenueInitiated?: boolean;
    billingPosition?: string;
  };
  permissions: ItineraryPermissions;
  isExpanded: boolean;
  isDeleting: boolean;
  venueOffers: any[];
  venueBids: any[];
  venueId?: string;
  onToggleExpansion: (requestId: string) => void;
  onDeleteRequest: (requestId: string, requestName: string) => void;
  onRequestDocument: (request: TourRequest) => void;
  onBidDocument?: (bid: any) => void;
  onMakeOffer: (request: TourRequest, existingBid?: any) => void;
  onOfferAction: (offer: any, action: string) => void;
  onBidAction: (bid: any, action: string, reason?: string) => void;
}

export function TourRequestTimelineItem({
  request,
  permissions,
  isExpanded,
  isDeleting,
  venueOffers,
  venueBids,
  venueId,
  onToggleExpansion,
  onDeleteRequest,
  onRequestDocument,
  onBidDocument,
  onMakeOffer,
  onOfferAction,
  onBidAction
}: TourRequestTimelineItemProps) {
  
  const getRequestStatusBadge = () => {
    if (request.isVenueInitiated) {
      // 🎵 IMPROVED: Updated billing position detection for simplified system
      const isSupportAct = (
        request.title?.includes('(Support)') ||
        request.billingPosition === 'SUPPORT' ||
        request.billingPosition === 'support' ||
        request.billingPosition === 'local-support'
      );
      
      if (isSupportAct) {
        // 🎵 ENHANCED: Show specific billing position with better visual indicators
        const billingText = request.billingPosition === 'support' ? '🎸 Support' :
                           request.billingPosition === 'local-support' ? '🏠 Local Support' :
                           '🎸 Support Act';
        
        return {
          className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800",
          text: billingText
        };
      }
      
      // Check for headliner/co-headliner positions
      const isHeadliner = request.billingPosition === 'headliner';
      const isCoHeadliner = request.billingPosition === 'co-headliner';
      
      if (isHeadliner) {
        return {
          className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800",
          text: "🌟 Headliner Offer"
        };
      }
      
      if (isCoHeadliner) {
        return {
          className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800",
          text: "⭐ Co-Headliner Offer"
        };
      }
      
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

  const statusBadge = getRequestStatusBadge();

  return (
    <tr 
      className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
      onClick={() => onToggleExpansion(request.id)}
    >
      <td className="px-4 py-3 w-[3%]">
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

      <td className="px-4 py-3 w-[12%]">
        <ItineraryDate
          date={request.requestDate || request.startDate}
          endDate={request.endDate}
          className="text-sm font-medium text-gray-900"
        />
      </td>

      {!venueId && (
        <td className="px-4 py-3 w-[14%]">
          <div className="text-sm text-gray-900 truncate">
            {request.location || '-'}
          </div>
        </td>
      )}

      <td className={`px-4 py-3 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>
        <div className="text-sm font-medium text-gray-900 truncate">
          {request.title}
        </div>
      </td>

      <td className="px-4 py-3 w-[10%]">
        <span className={statusBadge.className}>
          {statusBadge.text}
        </span>
      </td>

      <td className="px-4 py-3 w-[7%]">
        <div className="text-xs text-gray-600">
          {request.expectedDraw?.max || '-'}
        </div>
      </td>

      <td className="px-4 py-3 w-[7%]">
        <div className="text-xs text-gray-600">
          {request.ageRestriction?.toLowerCase().replace('_', '-') || 'flexible'}
        </div>
      </td>

      <td className={`px-4 py-3 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>
        <div className="text-xs text-gray-600">
          {request.guaranteeRange ? 
            `$${request.guaranteeRange.min}-${request.guaranteeRange.max}` : 
            (request.acceptsDoorDeals ? 'Door deals' : '-')
          }
        </div>
      </td>

      <td className="px-4 py-3 w-[8%]">
        <div className="flex items-center space-x-1">
          {/* Document button moved to individual bid rows in expanded view */}
        </div>
      </td>

      <td className="px-4 py-3 w-[10%]">
        <div className="flex items-center space-x-1">
          {/* Make/Edit Offer buttons moved to individual bid rows in expanded view */}
          
          {/* Delete/Cancel Button - Only show when edit button is not available */}
          {permissions.canDeleteRequest(request, venueBids) && (
            <DeleteActionButton
              request={request}
              permissions={permissions}
              venueId={venueId}
              venueOffers={venueOffers}
              venueBids={venueBids}
              isLoading={isDeleting}
              onDeleteRequest={onDeleteRequest}
              onOfferAction={onOfferAction}
              onBidAction={onBidAction}
            />
          )}
        </div>
      </td>
    </tr>
  );
} 
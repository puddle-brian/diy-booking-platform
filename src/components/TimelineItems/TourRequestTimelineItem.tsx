import React, { useState } from 'react';
import { TourRequest } from '../../../types';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { ItineraryDate } from '../DateDisplay';
import { DeleteActionButton, DocumentActionButton, MakeOfferActionButton } from '../ActionButtons';
import { AddSupportActModal } from '../modals/AddSupportActModal';

interface TourRequestTimelineItemProps {
  request: TourRequest & { 
    isVenueInitiated?: boolean;
    billingPosition?: string;
    originalOfferIds?: string[]; // For grouped venue offers
    venueId?: string;
    venueName?: string;
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
  onSupportActAdded?: (offer: any) => void; // NEW: For optimistic updates
  onSupportActAction?: (offer: any, action: string) => void; // NEW: For support act actions
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
  onBidAction,
  onSupportActAdded,
  onSupportActAction
}: TourRequestTimelineItemProps) {
  
  // State for Add Support Act modal
  const [isAddSupportActModalOpen, setIsAddSupportActModalOpen] = useState(false);
  
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

  // Helper function for support act offer success
  const handleSupportActOfferSuccess = (offer: any) => {
    console.log('✅ Support act offer created:', offer);
    setIsAddSupportActModalOpen(false);
    onSupportActAdded?.(offer);
  };

  // Get grouped offers for this request (if it's a grouped venue offer)
  const groupedOffers = request.originalOfferIds ? 
    venueOffers.filter(offer => request.originalOfferIds?.includes(offer.id)) : 
    [];

  return (
    <>
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

        <td className="px-4 py-3 w-[14%]">
          <div className="text-sm text-gray-900 truncate">
            {request.location || '-'}
          </div>
        </td>

        <td className="px-4 py-3 w-[19%]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
              {request.title}
            </div>
            
            {/* Show count of grouped offers if this is a grouped venue offer */}
            {request.isVenueInitiated && groupedOffers.length > 1 && (
              <span 
                className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 ml-2 flex-shrink-0"
                title={`${groupedOffers.length} artists for this date`}
              >
                {groupedOffers.length}
              </span>
            )}
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

        <td className="px-4 py-3 w-[10%]">
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

      {/* Expanded view for venue-initiated requests (grouped venue offers) */}
      {isExpanded && request.isVenueInitiated && groupedOffers.length > 0 && (
        <tr>
          <td colSpan={10} className="px-0 py-0">
            <div className="bg-purple-50/50">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] table-fixed">
                  <thead className="bg-purple-100/60">
                    <tr className="text-left text-xs font-medium text-purple-700">
                      <th className="px-2 py-1.5 w-[3%]"></th>
                      <th className="px-4 py-1.5 w-[12%]">Date</th>
                      <th className="px-4 py-1.5 w-[14%]">Location</th>
                      <th className="px-4 py-1.5 w-[19%]">Artist</th>
                      <th className="px-4 py-1.5 w-[10%]">Status</th>
                      <th className="px-4 py-1.5 w-[7%]">Position</th>
                      <th className="px-4 py-1.5 w-[7%]">Age</th>
                      <th className="px-4 py-1.5 w-[10%]">Payment</th>
                      <th className="px-4 py-1.5 w-[8%]">Details</th>
                      <th className="px-4 py-1.5 w-[10%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render each grouped offer as a row */}
                    {groupedOffers.map((offer, index) => (
                      <tr key={`offer-${offer.id}`} className="bg-purple-50 hover:bg-purple-100">
                        <td className="px-2 py-1 w-[3%]">
                          <div className="flex items-center justify-center text-gray-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4m0 6l-4 4-4-4" />
                            </svg>
                          </div>
                        </td>

                        <td className="px-4 py-1 w-[12%]">
                          <ItineraryDate
                            date={offer.proposedDate}
                            className="text-sm font-medium text-purple-900"
                          />
                        </td>

                        <td className="px-4 py-1 w-[14%]">
                          <div className="text-sm text-purple-900 truncate">
                            {offer.venueName || request.venueName || 'Unknown Venue'}
                          </div>
                        </td>

                        <td className="px-4 py-1 w-[19%]">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {offer.artistId && offer.artistId !== 'external-artist' ? (
                              <a 
                                href={`/artists/${offer.artistId}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                title="View artist page"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {offer.artistName || 'Unknown Artist'}
                              </a>
                            ) : (
                              <span>{offer.artistName || 'Unknown Artist'}</span>
                            )}
                            {/* Show set length if available */}
                            {offer.setLength && (
                              <span className="text-xs text-gray-500 ml-2">• {offer.setLength}min</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-1 w-[10%]">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            {offer.status === 'pending' ? 'Pending' : 
                             offer.status === 'accepted' ? 'Confirmed' :
                             offer.status === 'declined' ? 'Declined' : 'Unknown'}
                          </span>
                        </td>

                        <td className="px-4 py-1 w-[7%]">
                          <div className="flex justify-center">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border bg-purple-100 text-purple-800 border-purple-300">
                              {offer.billingPosition === 'headliner' ? 'HL' :
                               offer.billingPosition === 'co-headliner' ? 'CH' :
                               offer.billingPosition === 'support' ? 'SP' :
                               offer.billingPosition === 'local-support' ? 'LS' : 'HL'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-1 w-[7%]">
                          <div className="text-xs text-gray-600 whitespace-nowrap">
                            {offer.ageRestriction?.toLowerCase().replace('_', '-') || 'all-ages'}
                          </div>
                        </td>

                        <td className="px-4 py-1 w-[10%]">
                          <div className="text-xs text-gray-600">
                            {permissions.canSeeFinancialDetails(offer) ? 
                              (offer.amount ? `$${offer.amount}` : 
                               offer.doorDeal ? 'Door split' : 'TBD') : '-'}
                          </div>
                        </td>

                        <td className="px-4 py-1 w-[8%]">
                          <div className="flex items-center space-x-1">
                            {/* Document button for individual offers */}
                          </div>
                        </td>

                        <td className="px-4 py-1 w-[10%]">
                          <div className="flex items-center space-x-1">
                            {/* Delete button for individual offers */}
                            {permissions.actualViewerType === 'venue' && permissions.isOwner && onSupportActAction && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSupportActAction(offer, 'delete');
                                }}
                                className="inline-flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                title="Remove offer from lineup"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Add Support Act button row for venue-initiated requests */}
              {permissions.actualViewerType === 'venue' && permissions.isOwner && (
                <div className="bg-gray-50 hover:bg-gray-100 transition-colors duration-150 px-4 py-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddSupportActModalOpen(true);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-1.5 px-4 rounded border-2 border-dashed border-purple-400 transition-colors duration-150 flex items-center justify-center space-x-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Support Act</span>
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Add Support Act Modal for venue-initiated requests */}
      {request.isVenueInitiated && (
        <AddSupportActModal
          isOpen={isAddSupportActModalOpen}
          onClose={() => setIsAddSupportActModalOpen(false)}
          showId={`venue-offer-${request.startDate}`} // Use date-based ID for venue offers
          showDate={request.startDate}
          venueName={request.venueName || 'Unknown Venue'}
          venueId={request.venueId || venueId || ''}
          onSuccess={handleSupportActOfferSuccess}
        />
      )}
    </>
  );
} 
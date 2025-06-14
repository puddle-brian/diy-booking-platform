import React, { useState, useEffect, useMemo } from 'react';
import { Show, VenueBid, LineupPosition } from '../../../types';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { ItineraryDate } from '../DateDisplay';
import { DeleteActionButton, DocumentActionButton } from '../ActionButtons';
import { AddSupportActModal } from '../modals/AddSupportActModal';
import { BidActionButtons } from '../ActionButtons/BidActionButtons';
import { isSameDate } from '../../utils/dateUtils';

// 🧹 CLEANUP: Removed LineupBid interface - unified offer system

// Helper functions to convert support offers to synthetic format for document viewing
function createSyntheticRequest(supportOffer: any) {
  const offerDate = supportOffer.proposedDate.split('T')[0];
  
  return {
    id: `venue-offer-${supportOffer.id}`,
    artistId: supportOffer.artistId,
    artistName: supportOffer.artistName,
    title: supportOffer.title,
    description: supportOffer.description || `Support act offer from ${supportOffer.venueName}`,
    startDate: offerDate,
    endDate: offerDate,
    isSingleDate: true,
    location: supportOffer.venueName,
    radius: 0,
    flexibility: 'exact-cities' as const,
    genres: [],
    expectedDraw: { min: 0, max: supportOffer.capacity || 0, description: '' },
    tourStatus: 'exploring-interest' as const,
    ageRestriction: 'flexible' as const,
    equipment: { needsPA: false, needsMics: false, needsDrums: false, needsAmps: false, acoustic: false },
    acceptsDoorDeals: !!supportOffer.doorDeal,
    merchandising: false,
    travelMethod: 'van' as const,
    lodging: 'flexible' as const,
    status: 'active' as const,
    priority: 'medium' as const,
    responses: 1,
    createdAt: supportOffer.createdAt || new Date().toISOString(),
    updatedAt: supportOffer.updatedAt || new Date().toISOString(),
    expiresAt: supportOffer.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVenueInitiated: true,
    originalOfferId: supportOffer.id,
    venueId: supportOffer.venueId,
    venueName: supportOffer.venueName
  } as any; // Use 'as any' to avoid extensive type definition
}

function createSyntheticBid(supportOffer: any) {
  const offerDate = supportOffer.proposedDate.split('T')[0];
  
  return {
    id: `offer-bid-${supportOffer.id}`,
    showRequestId: `venue-offer-${supportOffer.id}`,
    venueId: supportOffer.venueId,
    venueName: supportOffer.venueName,
    proposedDate: offerDate,
    guarantee: supportOffer.amount,
    doorDeal: supportOffer.doorDeal,
    ticketPrice: supportOffer.ticketPrice || {},
    capacity: supportOffer.capacity || 0,
    ageRestriction: supportOffer.ageRestriction || 'all-ages',
    equipmentProvided: supportOffer.equipmentProvided || {
      pa: false, mics: false, drums: false, amps: false, piano: false
    },
    loadIn: supportOffer.loadIn || '',
    soundcheck: supportOffer.soundcheck || '',
    doorsOpen: supportOffer.doorsOpen || '',
    showTime: supportOffer.showTime || '',
    curfew: supportOffer.curfew || '',
    promotion: supportOffer.promotion || {
      social: false, flyerPrinting: false, radioSpots: false, pressCoverage: false
    },
    message: supportOffer.message || '',
    status: supportOffer.status.toLowerCase(),
    readByArtist: true,
    createdAt: supportOffer.createdAt,
    updatedAt: supportOffer.updatedAt,
    expiresAt: supportOffer.expiresAt,
    billingPosition: supportOffer.billingPosition,
    lineupPosition: supportOffer.lineupPosition,
    setLength: supportOffer.setLength,
    otherActs: supportOffer.otherActs,
    billingNotes: supportOffer.billingNotes,
    artistId: supportOffer.artistId,
    artistName: supportOffer.artistName
  } as any; // Use 'as any' to avoid extensive type definition
}

interface ShowTimelineItemProps {
  show: Show;
  permissions: ItineraryPermissions;
  isExpanded: boolean;
  isDeleting: boolean;
  artistId?: string; // Page context: if present, we're on an artist page
  venueId?: string;  // Page context: if present, we're on a venue page
  venueOffers?: any[]; // For displaying support acts in venue timeline
  onToggleExpansion: (showId: string) => void;
  onDeleteShow: (showId: string, showName: string) => void;
  onShowDocument: (show: Show) => void;
  onShowDetail: (show: Show) => void;
  onSupportActAdded?: (offer: any) => void; // NEW: For optimistic updates
  onSupportActDocument?: (offer: any) => void; // NEW: For support act documents
  onSupportActAction?: (offer: any, action: string) => void; // NEW: For support act actions
}

// Utility function for consistent timeline border styling
const getTimelineBorderClass = (status: string) => {
  const normalizedStatus = status?.toLowerCase();
  switch (normalizedStatus) {
    case 'confirmed':
      return 'border-l-4 border-l-green-500 bg-green-50/30';
    case 'accepted':
      return 'border-l-4 border-l-green-400 bg-green-50/20';
    case 'hold':
      return 'border-l-4 border-l-violet-400 bg-violet-50/30';
    case 'pending':
    default:
      return ''; // No border for non-confirmed items
  }
};

// Utility function for status badge styling
const getShowStatusBadge = (status: string) => {
  const normalizedStatus = status?.toLowerCase();
  switch (normalizedStatus) {
    case 'confirmed':
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
        text: 'Confirmed'
      };
    case 'pending':
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
        text: 'Open'
      };
    case 'hold':
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700',
        text: 'Hold'
      };
    default:
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
        text: status || 'Unknown'
      };
  }
};

// 🎵 Helper function to generate billing position badge for confirmed shows
const getBillingPositionBadge = (billingPosition: string, showStatus: string) => {
  const abbreviations: Record<string, string> = {
    'headliner': 'HL',
    'co-headliner': 'CH', 
    'support': 'SP',
    'local-support': 'LS'
  };

  const abbr = abbreviations[billingPosition] || billingPosition.toUpperCase().slice(0, 2);

  // Match colors to show status (confirmed shows are typically green/blue)
  let colorClass = '';
  switch (showStatus.toLowerCase()) {
    case 'confirmed':
      colorClass = 'bg-blue-100 text-blue-800 border-blue-300';
      break;
    case 'pending':
      colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
      break;
    case 'hold':
      colorClass = 'bg-violet-100 text-violet-800 border-violet-300';
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

export function ShowTimelineItem({
  show,
  permissions,
  isExpanded,
  isDeleting,
  artistId,
  venueId,
  venueOffers = [],
  onToggleExpansion,
  onDeleteShow,
  onShowDocument,
  onShowDetail,
  onSupportActAdded,
  onSupportActDocument,
  onSupportActAction
}: ShowTimelineItemProps) {
  // 🧹 CLEANUP: Removed all lineup functionality - unified offer system handles invitations
  const [isAddSupportActModalOpen, setIsAddSupportActModalOpen] = useState(false);
  
  // Calculate support acts counts for both venue and artist pages
  const supportActsCounts = useMemo(() => {
    if ((!venueId && !artistId) || !venueOffers.length) return { confirmed: 0, pending: 0 };
    
    const supportOffers = venueOffers.filter(offer => {
      // ✅ IMPROVED: More robust support act detection
      const isSupportAct = (
        offer.billingPosition === 'SUPPORT' ||
        offer.billingPosition === 'support' ||
        offer.billingPosition === 'local-support' ||
        offer.title?.includes('(Support)')
      );
      
      // ✅ IMPROVED: More robust date matching using date utility to avoid timezone issues
      const datesMatch = isSameDate(offer.proposedDate, show.date);
      
      // ✅ IMPROVED: More robust venue matching
      const isVenueMatch = (
        offer.venueId === show.venueId ||
        offer.venueId === venueId ||
        offer.venueName === show.venueName
      );
      
      // ✅ Filter out declined offers - they shouldn't be counted
      const isActiveOffer = offer.status !== 'declined' && offer.status !== 'DECLINED';
      
      return isSupportAct && datesMatch && isVenueMatch && isActiveOffer;
    });
    
    const confirmed = supportOffers.filter(offer => 
      offer.status === 'accepted' || offer.status === 'confirmed'
    ).length;
    
    const pending = supportOffers.filter(offer => 
      offer.status === 'pending'
    ).length;
    
    return { confirmed, pending };
  }, [venueId, venueOffers, show.date, show.venueId, show.venueName]);
  
  // Simple show title without support act indicators (badges will be separate)
  const showTitle = show.artistName || 'Unknown Show';

  const handleSupportActOfferSuccess = (offer: any) => {
    console.log('✅ Support act offer created:', offer);
    // Close modal and let parent component handle refresh
    setIsAddSupportActModalOpen(false);
    
    // NEW: Optimistic update - immediately add to parent's venue offers
    onSupportActAdded?.(offer);
  };

  return (
    <>
      <tr 
        className="border-b border-gray-200 hover:bg-green-50 transition-colors duration-150 cursor-pointer"
        onClick={() => onToggleExpansion(show.id)}
      >
        <td className={`px-4 py-3 w-[3%] ${getTimelineBorderClass(show.status)}`}>
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
            date={show.date}
            className="text-sm font-medium text-gray-900"
          />
        </td>

        <td className="px-4 py-3 w-[14%]">
          <div className="text-sm text-gray-900 truncate">
            {show.city && show.state ? `${show.city}, ${show.state}` : '-'}
          </div>
        </td>

        <td className="px-4 py-3 w-[19%]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
              {(() => {
                // Determine what to show based on PAGE CONTEXT, not viewer type
                const showVenueInfo = artistId; // If we're on an artist page, show venue info
                const showArtistInfo = venueId;  // If we're on a venue page, show artist info
                
                if (showVenueInfo) {
                  // Show venue information (we're on an artist page)
                  if (show.venueId && show.venueId !== 'external-venue') {
                    return (
                      <a 
                        href={`/venues/${show.venueId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        title="View venue page"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {show.venueName || 'TBA'}
                      </a>
                    );
                  } else {
                    return show.venueName || 'TBA';
                  }
                } else if (showArtistInfo) {
                  // Show artist information (we're on a venue page) - use show title
                  if (show.artistId && show.artistId !== 'external-artist') {
                    return (
                      <a 
                        href={`/artists/${show.artistId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        title="View artist page"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {showTitle}
                      </a>
                    );
                  } else {
                    return showTitle;
                  }
                } else {
                  // Fallback: general pages, use viewer type logic
                  if (permissions.actualViewerType === 'venue') {
                    return showTitle;
                  } else {
                    return show.venueName || 'TBA';
                  }
                }
              })()}
            </div>
            
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* 🎵 Billing Position Badge for main show */}
              {(show as any).billingPosition && (
                <div>
                  {getBillingPositionBadge((show as any).billingPosition, show.status)}
                </div>
              )}
              
              {/* Support act count badges - show on both venue and artist pages */}
              {(venueId || artistId) && (supportActsCounts.confirmed > 0 || supportActsCounts.pending > 0) && (
                <>
                  {/* Confirmed support acts badge (green) */}
                  {supportActsCounts.confirmed > 0 && (
                    <span 
                      className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800"
                      title={`${supportActsCounts.confirmed} confirmed support act${supportActsCounts.confirmed !== 1 ? 's' : ''}`}
                    >
                      +{supportActsCounts.confirmed}
                    </span>
                  )}
                  
                  {/* Pending support acts badge (orange) */}
                  {supportActsCounts.pending > 0 && (
                    <span 
                      className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800"
                      title={`${supportActsCounts.pending} pending support act offer${supportActsCounts.pending !== 1 ? 's' : ''}`}
                    >
                      +{supportActsCounts.pending}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </td>

        <td className="px-4 py-3 w-[10%]">
          {(() => {
            const statusBadge = getShowStatusBadge(show.status);
            return (
              <span className={statusBadge.className}>
                {statusBadge.text}
              </span>
            );
          })()}
        </td>

        <td className="px-4 py-3 w-[7%]">
          <div className="text-xs text-gray-600">
            {venueId ? '' : (show.capacity || '-')}
          </div>
        </td>

        <td className="px-4 py-3 w-[7%]">
          <div className="text-xs text-gray-600 whitespace-nowrap">
            {show.ageRestriction?.toLowerCase().replace('_', '-') || 'all-ages'}
          </div>
        </td>

        <td className="px-4 py-3 w-[10%]">
          <div className="text-xs text-gray-600">
            {venueId ? '' : (permissions.canSeeFinancialDetails(show) ? (show.guarantee ? `$${show.guarantee}` : '-') : '-')}
          </div>
        </td>

        <td className="px-4 py-3 w-[8%]">
          <div className="flex items-center space-x-1">
            {/* Document button moved to individual artist rows in expanded view */}
          </div>
        </td>

        <td className="px-4 py-3 w-[10%]">
          {permissions.canEditShow(show) && (
            <DeleteActionButton
              show={show}
              permissions={permissions}
              venueOffers={[]}
              venueBids={[]}
              isLoading={isDeleting}
              onDeleteShow={onDeleteShow}
            />
          )}
        </td>
      </tr>

      {/* 🎯 UNIFIED EXPANSION: Show lineup details for both venue and artist perspectives */}
      {isExpanded && (venueId || artistId) && (
        <>
          {/* Column Headers Row */}
          <tr>
                          <td colSpan={10} className={`px-0 py-0 relative ${getTimelineBorderClass(show.status).split(' ').filter(c => c.startsWith('border-l')).join(' ')}`}>
                <div className="bg-green-50/50">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] table-fixed">
                    <thead className="bg-green-100/60">
                      <tr className="text-left text-xs font-medium text-green-700">
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
                      {/* Headliner detail row */}
                      <tr className="bg-green-50 hover:bg-green-100">
                        <td className="px-2 py-1.5 w-[3%]">
                          <div className="flex items-center justify-center text-gray-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4m0 6l-4 4-4-4" />
                            </svg>
                          </div>
                        </td>

                        <td className="px-4 py-1.5 w-[12%]">
                          <ItineraryDate
                            date={show.date}
                            className="text-sm font-medium text-green-900"
                          />
                        </td>

                        <td className="px-4 py-1.5 w-[14%]">
                          <div className="text-sm text-green-900 truncate">
                            {show.city && show.state ? `${show.city}, ${show.state}` : '-'}
                          </div>
                        </td>

                        <td className="px-4 py-1.5 w-[19%]">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {show.artistId && show.artistId !== 'external-artist' ? (
                              <a 
                                href={`/artists/${show.artistId}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                title="View artist page"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {show.artistName || 'Unknown Artist'}
                              </a>
                            ) : (
                              <span>{show.artistName || 'Unknown Artist'}</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-1.5 w-[10%]">
                          {(() => {
                            const statusBadge = getShowStatusBadge(show.status);
                            return (
                              <span className={statusBadge.className}>
                                {statusBadge.text}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="px-4 py-1.5 w-[7%]">
                          <div className="flex justify-center">
                            {getBillingPositionBadge((show as any).billingPosition || 'headliner', show.status)}
                          </div>
                        </td>

                        <td className="px-4 py-1.5 w-[7%]">
                          <div className="text-xs text-gray-600 whitespace-nowrap">
                            {show.ageRestriction?.toLowerCase().replace('_', '-') || 'all-ages'}
                          </div>
                        </td>

                        <td className="px-4 py-1.5 w-[10%]">
                          <div className="text-xs text-gray-600">
                            {permissions.canSeeFinancialDetails(show) ? (show.guarantee ? `$${show.guarantee}` : 'Fee TBD') : '-'}
                          </div>
                        </td>

                        <td className="px-4 py-1.5 w-[8%]">
                          <div className="flex items-center space-x-1">
                            {permissions.canViewShowDocument(show) && (
                              <DocumentActionButton
                                type="show"
                                show={show}
                                permissions={permissions}
                                onShowDocument={() => onShowDocument(show)}
                              />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-1.5 w-[10%]">
                          <div className="flex items-center space-x-1">
                            {/* Future: Edit headliner details */}
                          </div>
                        </td>
                      </tr>

                      {/* Support act rows - more compact with py-1 instead of py-1.5 */}
                      {venueOffers
                        .filter(offer => {
                          // ✅ IMPROVED: More robust support act detection
                          const isSupportAct = (
                                      offer.billingPosition === 'SUPPORT' ||
          offer.billingPosition === 'support' ||
          offer.billingPosition === 'local-support' ||
                            offer.title?.includes('(Support)')
                          );
                          
                          // ✅ IMPROVED: More robust date matching using date strings to avoid timezone issues
                          const datesMatch = isSameDate(offer.proposedDate, show.date);
                          
                          // ✅ IMPROVED: More robust venue matching
                          const isVenueMatch = (
                            offer.venueId === show.venueId ||
                            offer.venueId === venueId ||
                            offer.venueName === show.venueName
                          );
                          
                          // ✅ NEW: Filter out declined offers - they shouldn't clutter the timeline
                          const isActiveOffer = offer.status !== 'declined' && offer.status !== 'DECLINED';
                          
                          return isSupportAct && datesMatch && isVenueMatch && isActiveOffer;
                        })
                        .map((supportOffer, index) => (
                          <tr key={`support-${supportOffer.id}`} className="bg-orange-50 hover:bg-orange-100">
                            <td className="px-2 py-1 w-[3%]">
                              <div className="flex items-center justify-center text-gray-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4m0 6l-4 4-4-4" />
                                </svg>
                              </div>
                            </td>

                            <td className="px-4 py-1 w-[12%]">
                              <ItineraryDate
                                date={supportOffer.proposedDate}
                                className="text-sm font-medium text-orange-900"
                              />
                            </td>

                            <td className="px-4 py-1 w-[14%]">
                              <div className="text-sm text-orange-900 truncate">
                                {show.city && show.state ? `${show.city}, ${show.state}` : '-'}
                              </div>
                            </td>

                                                        <td className="px-4 py-1 w-[19%]">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {supportOffer.artistId && supportOffer.artistId !== 'external-artist' ? (
                                  <a 
                                    href={`/artists/${supportOffer.artistId}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                    title="View artist page"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {supportOffer.artistName || 'Unknown Artist'}
                                  </a>
                                ) : (
                                  <span>{supportOffer.artistName || 'Unknown Artist'}</span>
                                )}
                                {/* Show set length if available */}
                                {supportOffer.setLength && (
                                  <span className="text-xs text-gray-500 ml-2">• {supportOffer.setLength}min</span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-1 w-[10%]">
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                {supportOffer.status === 'pending' ? 'Pending' : 
                                 supportOffer.status === 'accepted' ? 'Confirmed' :
                                 supportOffer.status === 'declined' ? 'Declined' : 'Unknown'}
                              </span>
                            </td>

                            <td className="px-4 py-1 w-[7%]">
                              <div className="flex justify-center">
                                {getBillingPositionBadge(supportOffer.billingPosition, supportOffer.status)}
                              </div>
                            </td>

                            <td className="px-4 py-1 w-[7%]">
                              <div className="text-xs text-gray-600 whitespace-nowrap">
                                {show.ageRestriction?.toLowerCase().replace('_', '-') || 'all-ages'}
                              </div>
                            </td>

                            <td className="px-4 py-1 w-[10%]">
                              <div className="text-xs text-gray-600">
                                {permissions.canSeeFinancialDetails(show) ? 
                                  (supportOffer.amount ? `$${supportOffer.amount}` : 
                                   supportOffer.doorDeal ? 'Door split' : 'TBD') : '-'}
                              </div>
                            </td>

                            <td className="px-4 py-1 w-[8%]">
                              <div className="flex items-center space-x-1">
                                {/* Support act document actions - specific to the support offer */}
                                {onSupportActDocument && (
                                  <DocumentActionButton
                                    type="request"
                                    request={createSyntheticRequest(supportOffer)}
                                    permissions={permissions}
                                    artistId={supportOffer.artistId}
                                    venueId={supportOffer.venueId}
                                    requestBids={[createSyntheticBid(supportOffer)]}
                                    onRequestDocument={() => onSupportActDocument(supportOffer)}
                                    onBidDocument={() => onSupportActDocument(supportOffer)}
                                  />
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-1 w-[10%]">
                              <div className="flex items-center space-x-1">
                                {/* Support act delete button - standardized design */}
                                {permissions.actualViewerType === 'venue' && permissions.isOwner && onSupportActAction && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSupportActAction(supportOffer, 'delete');
                                    }}
                                    className="inline-flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                    title="Remove support act from lineup"
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
                
                {/* Add Support Act button row */}
                <div className="bg-gray-50 hover:bg-gray-100 transition-colors duration-150 px-4 py-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddSupportActModalOpen(true);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-4 rounded border-2 border-dashed border-green-400 transition-colors duration-150 flex items-center justify-center space-x-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Support Act</span>
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </>
      )}

      {/* Add Support Act Modal */}
      <AddSupportActModal
        isOpen={isAddSupportActModalOpen}
        onClose={() => setIsAddSupportActModalOpen(false)}
        showId={show.id}
        showDate={show.date}
        venueName={show.venueName || 'Unknown Venue'}
        venueId={show.venueId || venueId || ''}
        onSuccess={handleSupportActOfferSuccess}
      />
    </>
  );
} 
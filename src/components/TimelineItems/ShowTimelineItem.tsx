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
  
  // Calculate support acts counts for venue pages
  const supportActsCounts = useMemo(() => {
    if (!venueId || !venueOffers.length) return { confirmed: 0, pending: 0 };
    
    const supportOffers = venueOffers.filter(offer => {
      // ✅ IMPROVED: More robust support act detection
      const isSupportAct = (
        offer.billingPosition === 'SUPPORT' ||
        offer.billingPosition === 'direct-support' ||
        offer.billingPosition === 'opener' ||
        offer.billingPosition === 'local-opener' ||
        offer.title?.includes('(Support)')
      );
      
      // ✅ IMPROVED: More robust date matching
      const proposedDate = new Date(offer.proposedDate);
      const showDate = new Date(show.date);
      const isSameDate = (
        proposedDate.getFullYear() === showDate.getFullYear() &&
        proposedDate.getMonth() === showDate.getMonth() &&
        proposedDate.getDate() === showDate.getDate()
      );
      
      // ✅ IMPROVED: More robust venue matching
      const isVenueMatch = (
        offer.venueId === show.venueId ||
        offer.venueId === venueId ||
        offer.venueName === show.venueName
      );
      
      // ✅ Filter out declined offers - they shouldn't be counted
      const isActiveOffer = offer.status !== 'declined' && offer.status !== 'DECLINED';
      
      return isSupportAct && isSameDate && isVenueMatch && isActiveOffer;
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
        className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 cursor-pointer !border-t-2 !border-t-green-400 !border-b-2 !border-b-green-400"
        onClick={() => onToggleExpansion(show.id)}
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
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium text-gray-900 truncate">
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
            
            {/* Support act count badges - only show on venue pages */}
            {venueId && (supportActsCounts.confirmed > 0 || supportActsCounts.pending > 0) && (
              <div className="flex items-center space-x-1">
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
              </div>
            )}
          </div>
        </td>

        <td className="px-4 py-3 w-[10%]">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Confirmed
          </span>
        </td>

        <td className="px-4 py-3 w-[7%]">
          <div className="text-xs text-gray-600">{show.capacity || '-'}</div>
        </td>

        <td className="px-4 py-3 w-[7%]">
          <div className="text-xs text-gray-600 whitespace-nowrap">
            {show.ageRestriction?.toLowerCase().replace('_', '-') || 'all-ages'}
          </div>
        </td>

        <td className="px-4 py-3 w-[10%]">
          <div className="text-xs text-gray-600">
            {permissions.canSeeFinancialDetails(show) ? (show.guarantee ? `$${show.guarantee}` : '-') : '-'}
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

      {/* 🎯 VENUE-SIDE EXPANSION: Show lineup details when viewing from venue perspective */}
      {isExpanded && venueId && (
        <>
          {/* Column Headers Row */}
          <tr>
            <td colSpan={10} className="px-0 py-0">
              <div className="bg-green-50 border-l-4 border-green-400">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] table-fixed">
                    <thead className="bg-green-100">
                      <tr className="text-left text-xs font-medium text-green-700">
                        <th className="px-2 py-1.5 w-[3%]"></th>
                        <th className="px-4 py-1.5 w-[12%]">Date</th>
                        <th className="px-4 py-1.5 w-[14%]">Location</th>
                        <th className="px-4 py-1.5 w-[19%]">Artist</th>
                        <th className="px-4 py-1.5 w-[10%]">Status</th>
                        <th className="px-4 py-1.5 w-[7%]">Capacity</th>
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
                            <span className="text-xs text-gray-500 ml-2">• Headliner</span>
                          </div>
                        </td>

                        <td className="px-4 py-1.5 w-[10%]">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Confirmed
                          </span>
                        </td>

                        <td className="px-4 py-1.5 w-[7%]">
                          <div className="text-xs text-gray-600">{show.capacity || '-'}</div>
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
                            offer.billingPosition === 'direct-support' ||
                            offer.billingPosition === 'opener' ||
                            offer.billingPosition === 'local-opener' ||
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
                                <span className="text-xs text-gray-500 ml-2">
                                  • {supportOffer.billingPosition === 'SUPPORT' ? 'Support' : 
                                      supportOffer.billingPosition === 'direct-support' ? 'Direct Support' :
                                      supportOffer.billingPosition === 'opener' ? 'Opener' :
                                      supportOffer.billingPosition === 'local-opener' ? 'Local Opener' : 'Support'}
                                  {supportOffer.setLength && ` • ${supportOffer.setLength}min`}
                                </span>
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
                              <div className="text-xs text-gray-600">{show.capacity || '-'}</div>
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
import React, { useState } from 'react';
import { Show } from '../../../types';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { ShowHeaderRow } from './ShowHeaderRow';
import { LineupTableSection } from './LineupTableSection';
import { AddSupportActModal } from '../modals/AddSupportActModal';
import { LineupItem } from '../../utils/showUtils';

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
  onToggleExpansion: (showId: string) => void;
  onDeleteShow: (showId: string, showName: string) => void;
  onShowDocument: (show: Show) => void;
  onShowDetail: (show: Show) => void;
  onSupportActAdded?: (offer: any) => void; // For optimistic updates
}

/**
 * ShowTimelineItem - REFACTORED VERSION
 * 
 * This component implements the new architecture:
 * - Show = Container (venue event with date/location)
 * - Lineup = Equal Artists (no "headliner owns show" pattern)
 * - Clean Component Separation (ShowHeaderRow + LineupTableSection)
 * 
 * FIXES:
 * ✅ No more status display bugs - Each artist shows correct status
 * ✅ Clean component separation - Single responsibility per component
 * ✅ Consistent data model - Show = container, Lineup = artists
 * ✅ Intuitive UI - Users see actual booking status at a glance
 * ✅ Maintainable code - No duplicate status logic
 */
export function ShowTimelineItem({
  show,
  permissions,
  isExpanded,
  isDeleting,
  artistId,
  venueId,
  onToggleExpansion,
  onDeleteShow,
  onShowDocument,
  onShowDetail,
  onSupportActAdded
}: ShowTimelineItemProps) {
  const [isAddSupportActModalOpen, setIsAddSupportActModalOpen] = useState(false);

  // Convert show.lineup to our utility format, OR create synthetic lineup from legacy fields
  const lineup: LineupItem[] = show.lineup || [];
  
  // Debug logging can be removed once expansion is working
  
  // Handle legacy single-artist shows by creating synthetic lineup
  const hasLegacyArtist = show.artistId && show.artistName && lineup.length === 0;
  let effectiveLineup: LineupItem[] = lineup;
  
  if (hasLegacyArtist) {
    effectiveLineup = [{
      artistId: show.artistId!,
      artistName: show.artistName!,
      billingPosition: 'HEADLINER',
      status: 'CONFIRMED',
      performanceOrder: 1,
      guarantee: show.guarantee
    }];
    console.log('🎯 CREATED SYNTHETIC LINEUP:', effectiveLineup);
  }
  
  const hasLineup = effectiveLineup.length > 0;
  
  // Expansion logic working correctly

  const handleSupportActOfferSuccess = (offer: any) => {
    if (onSupportActAdded) {
      onSupportActAdded(offer);
    }
    setIsAddSupportActModalOpen(false);
  };

  return (
    <>
      {/* 🎯 NEW ARCHITECTURE: Show Header Row */}
      <ShowHeaderRow
        show={show}
        permissions={permissions}
        isExpanded={isExpanded}
        venueId={venueId}
        onToggleExpansion={onToggleExpansion}
        onShowDocument={onShowDocument}
        effectiveLineup={effectiveLineup}
      />

      {/* 🎯 NEW ARCHITECTURE: Lineup Rows */}
      {isExpanded && hasLineup && (
        <LineupTableSection
          show={show}
          lineup={effectiveLineup}
          permissions={permissions}
          venueId={venueId}
          onShowDocument={onShowDocument}
        />
      )}
      
      {/* Add Support Act button row */}
      {isExpanded && permissions.canEditShow(show) && (
        <tr>
          <td colSpan={venueId ? 9 : 10}>
            <div className="bg-gray-50 hover:bg-gray-100 transition-colors duration-150 px-4 py-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddSupportActModalOpen(true);
                }}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded border-2 border-dashed border-yellow-400 transition-colors duration-150 flex items-center justify-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Artist to Lineup</span>
              </button>
            </div>
          </td>
        </tr>
      )}

      {/* Empty state when expanded but no lineup */}
      {isExpanded && !hasLineup && (
        <tr>
          <td colSpan={venueId ? 9 : 10}>
            <div className="bg-gray-50 px-4 py-8 text-center">
              <div className="text-gray-500 text-sm mb-4">
                No artists confirmed for this show yet
              </div>
              {permissions.canEditShow(show) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddSupportActModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-150"
                >
                  Add First Artist
                </button>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Add Artist Modal */}
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
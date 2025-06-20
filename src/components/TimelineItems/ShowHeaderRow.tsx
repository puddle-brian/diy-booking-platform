import React from 'react';
import { Show } from '../../../types';
import { getAggregateStatusBadge, getAggregateStatus, LineupItem } from '../../utils/showUtils';
import { generateSmartShowTitle } from '../../utils/showNaming';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { ItineraryDate } from '../DateDisplay';
import { AlignedDate } from './AlignedDate';
import { DocumentActionButton, DeleteActionButton } from '../ActionButtons';
import { formatAgeRestriction } from '../../utils/ageRestrictionUtils';
import { StatusBadge } from '../StatusBadge';
import { getTimelineRowStyling, timelineTypography } from '../../utils/timelineRowStyling';
import { ExpansionIndicator } from './ExpansionIndicator';

interface ShowHeaderRowProps {
  show: Show;
  permissions: ItineraryPermissions;
  isExpanded: boolean;
  venueId?: string; // Context: if present, we're on a venue page
  artistId?: string; // Context: if present, we're on an artist page - affects status display
  onToggleExpansion: (showId: string) => void;
  onShowDocument: (show: Show) => void;
  onDeleteShow?: (showId: string, showName: string) => void;
  effectiveLineup?: LineupItem[]; // Override lineup for legacy show support
  isDeleteLoading?: boolean;
}

/**
 * ShowHeaderRow - Clean show container with smart title generation
 * This represents the show as a venue event with multiple artists,
 * replacing the legacy "single artist owns show" pattern
 * 
 * 🎯 PERSPECTIVE-AWARE STATUS: When artistId is provided (artist page view),
 * shows that specific artist's status rather than the aggregate show status.
 */
export function ShowHeaderRow({
  show,
  permissions,
  isExpanded,
  venueId,
  artistId,
  onToggleExpansion,
  onShowDocument,
  onDeleteShow,
  effectiveLineup,
  isDeleteLoading = false
}: ShowHeaderRowProps) {
  // Use effectiveLineup if provided (for legacy shows), otherwise use show.lineup
  const lineup: LineupItem[] = effectiveLineup || show.lineup || [];
  
  // 🔍 DEBUG: Log lineup data for Lightning Bolt show
  if (show.title === 'Punk Rock Festival') {
    console.log('🎯 Lightning Bolt show lineup:', lineup);
    console.log('🎯 Lineup length:', lineup.length);
  }
  
  const { title: showTitle, tooltip: detailedTitle } = generateSmartShowTitle(lineup);
  
  // 🔍 DEBUG: Log generated title
  if (show.title === 'Punk Rock Festival') {
    console.log('🎯 Generated title:', showTitle);
    console.log('🎯 Generated tooltip:', detailedTitle);
  }
  
  // Show has lineup if there are any artists
  const hasLineup = lineup.length > 0;
  
  // 🎯 ARTIST PERSPECTIVE: When viewing from artist page, show that artist's specific status
  const getViewingPerspectiveStatus = () => {
    if (artistId && lineup.length > 0) {
      // Find the viewing artist's status in this show
      const viewingArtistLineupItem = lineup.find(item => item.artistId === artistId);
      if (viewingArtistLineupItem) {
        // Return the artist's individual status
        return {
          status: viewingArtistLineupItem.status,
          isArtistSpecific: true,
          badge: null // Use StatusBadge component for individual artist status
        };
      }
    }
    
    // Default to aggregate status (venue perspective or no specific artist context)
    const statusBadge = getAggregateStatusBadge(lineup, false);
    
    // For venue view, return the actual badge to show custom text like "2/3", "3/4"
    return {
      status: statusBadge.text?.toLowerCase()?.includes('confirmed') || statusBadge.text?.includes('/') ? 'CONFIRMED' : 'PENDING',
      isArtistSpecific: false,
      badge: statusBadge // Use the actual badge HTML for custom text
    };
  };
  
  const perspectiveStatus = getViewingPerspectiveStatus();
  
  // Use unified styling system for consistent appearance
  const getStyleVariant = (): 'confirmed' | 'open' | 'hold' => {
    const status = perspectiveStatus.status.toLowerCase();
    
    if (status === 'confirmed') {
      return 'confirmed';
    } else if (status === 'pending') {
      return 'open'; // Pending shows use 'open' styling (blue)
    } else {
      return 'confirmed'; // Default to confirmed styling for edge cases
    }
  };
  
  const styleVariant = getStyleVariant();
  const rowClassName = getTimelineRowStyling(styleVariant);
  
  return (
    <tr 
      className={rowClassName}
      onClick={() => onToggleExpansion(show.id)}
    >
      {/* Expand/Collapse Button - Unified with open show requests */}
      <td className="px-4 py-1 w-[3%]">
        <div className="flex items-center justify-center">
          <ExpansionIndicator isExpanded={isExpanded} />
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-1 w-[12%]">
        <AlignedDate date={show.date} className={timelineTypography.date} />
      </td>

      {/* Location (only show if not on venue page) */}
      {!venueId && (
        <td className="px-4 py-1 w-[14%]">
          <div className="text-sm text-gray-600 truncate">
            {show.city && show.state ? (
              `${show.city}, ${show.state}`
            ) : (
              show.venueName || 'Unknown Location'
            )}
          </div>
        </td>
      )}

      {/* Context-aware content: Artists column for venue view, Venue column for artist view */}
      <td className={`px-4 py-1 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>
        <div className="text-sm font-medium text-gray-900 truncate" title={detailedTitle}>
          {venueId ? (
            // Use unified title system - exactly the same as show requests
            showTitle
          ) : (
            // Artist view: Show venue information with clickable link
            show.venueId ? (
              <a 
                href={`/venues/${show.venueId}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
                title="View venue page"
                onClick={(e) => e.stopPropagation()}
              >
                {show.venueName || 'Unknown Venue'}
              </a>
            ) : (
              <span>{show.venueName || 'Unknown Venue'}</span>
            )
          )}
        </div>
      </td>

      {/* Status - Artist-specific when viewing from artist page, aggregate otherwise */}
      <td className="px-4 py-1 w-[10%]">
        {perspectiveStatus.badge ? (
          // Use custom badge for venue view (shows "2/3", "3/4", etc.)
          <span className={perspectiveStatus.badge.className}>
            {perspectiveStatus.badge.text}
          </span>
        ) : (
          // Use StatusBadge component for artist-specific view
          <StatusBadge 
            status={perspectiveStatus.status.toLowerCase() === 'confirmed' ? 'confirmed' : 'pending'} 
            variant="compact" 
          />
        )}
      </td>

      {/* Billing Position - N/A for show header */}
      <td className="px-4 py-1 w-[7%]">
        <div className="flex justify-center">
        </div>
      </td>

      {/* Age Restriction */}
      <td className="px-4 py-1 w-[7%]">
        <div className="text-xs text-gray-600 whitespace-nowrap">
          {/* Show-level age restriction would go here if available */}
        </div>
      </td>

      {/* Financial - Show-level guarantee */}
      <td className="px-4 py-1 w-[10%]">
        <div className="text-xs text-gray-600">
          {permissions.canSeeFinancialDetails(show) && show.guarantee ? (
            `$${show.guarantee}`
          ) : (
            ''
          )}
        </div>
      </td>

      {/* Document Actions - N/A for show header */}
      <td className="px-4 py-1 w-[8%]">
        <div className="flex items-center space-x-1">
          {/* Documents are artist-specific, shown in child rows */}
        </div>
      </td>

      {/* Show Actions */}
      <td className="px-4 py-1 w-[10%]">
        <div className="flex items-center space-x-1">
          {onDeleteShow && permissions.canEditShow(show) && (
            <DeleteActionButton
              show={show}
              permissions={permissions}
              venueId={venueId}
              venueOffers={[]}
              venueBids={[]}
              isLoading={isDeleteLoading}
              onDeleteShow={onDeleteShow}
            />
          )}
        </div>
      </td>
    </tr>
  );
} 
import React from 'react';
import { Show } from '../../../types';
import { generateSmartShowTitle, generateDetailedShowTitle, getAggregateStatusBadge, LineupItem } from '../../utils/showUtils';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { ItineraryDate } from '../DateDisplay';
import { DocumentActionButton, DeleteActionButton } from '../ActionButtons';
import { formatAgeRestriction } from '../../utils/ageRestrictionUtils';
import { StatusBadge } from '../StatusBadge';
import { getTimelineRowStyling, timelineTypography } from '../../utils/timelineRowStyling';

interface ShowHeaderRowProps {
  show: Show;
  permissions: ItineraryPermissions;
  isExpanded: boolean;
  venueId?: string; // Context: if present, we're on a venue page
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
 */
export function ShowHeaderRow({
  show,
  permissions,
  isExpanded,
  venueId,
  onToggleExpansion,
  onShowDocument,
  onDeleteShow,
  effectiveLineup,
  isDeleteLoading = false
}: ShowHeaderRowProps) {
  // Use effectiveLineup if provided (for legacy shows), otherwise use show.lineup
  const lineup: LineupItem[] = effectiveLineup || show.lineup || [];
  const showTitle = generateSmartShowTitle(lineup);
  const detailedTitle = generateDetailedShowTitle(lineup);
  const statusBadge = getAggregateStatusBadge(lineup);
  
  // Show has lineup if there are any artists
  const hasLineup = lineup.length > 0;
  
  // Use unified styling system for consistent appearance
  const getStyleVariant = (): 'confirmed' | 'open' | 'hold' => {
    const statusText = statusBadge.text?.toLowerCase() || '';
    
    if (statusText.includes('confirmed') || statusText.includes('complete')) {
      return 'confirmed';
    } else if (statusText.includes('pending') || statusText.includes('partial')) {
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
      {/* Expand/Collapse Button - EXACTLY like open show requests */}
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
        <ItineraryDate date={show.date} />
      </td>

      {/* Location (only show if not on venue page) */}
      {!venueId && (
        <td className="px-4 py-1 w-[14%]">
          <div className="text-sm text-gray-600 truncate">
            {show.venueName || 'Unknown Venue'}
          </div>
        </td>
      )}

      {/* Show Title with Clickable Artist Links */}
      <td className={`px-4 py-1 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>
        <div className="text-sm font-medium text-gray-900 truncate" title={detailedTitle}>
          {lineup.length === 1 ? (
            // Single artist - make it clickable
            <a 
              href={`/artists/${lineup[0].artistId}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
              title="View artist page"
              onClick={(e) => e.stopPropagation()}
            >
              {lineup[0].artistName}
            </a>
          ) : lineup.length === 2 ? (
            // Two artists - both clickable
            <>
              <a 
                href={`/artists/${lineup[0].artistId}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
                title="View artist page"
                onClick={(e) => e.stopPropagation()}
              >
                {lineup[0].artistName}
              </a>
              <span> & </span>
              <a 
                href={`/artists/${lineup[1].artistId}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
                title="View artist page"
                onClick={(e) => e.stopPropagation()}
              >
                {lineup[1].artistName}
              </a>
            </>
          ) : (
            // Multiple artists - use smart title with clickable headliner
            lineup.length > 0 ? (
              <>
                <a 
                  href={`/artists/${lineup[0].artistId}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  title="View artist page"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lineup[0].artistName}
                </a>
                <span> + {lineup.length - 1} more</span>
              </>
            ) : (
              showTitle
            )
          )}
          {show.venueName && !venueId && (
            <span className="text-xs text-gray-500 ml-2">
              at {show.venueName}
            </span>
          )}
        </div>
      </td>

      {/* Aggregate Status */}
      <td className="px-4 py-1 w-[10%]">
        <StatusBadge 
          status={styleVariant === 'confirmed' ? 'confirmed' : 'pending'} 
          variant="compact" 
        />
      </td>

      {/* Billing Position - N/A for show header */}
      <td className="px-4 py-1 w-[7%]">
        <div className="flex justify-center">
          <span className="text-xs text-gray-400">
            {hasLineup ? `${lineup.length} artists` : 'No lineup'}
          </span>
        </div>
      </td>

      {/* Age Restriction */}
      <td className="px-4 py-1 w-[7%]">
        <div className="text-xs text-gray-600 whitespace-nowrap">
          {/* Show-level age restriction would go here if available */}
          <span className="text-gray-400">—</span>
        </div>
      </td>

      {/* Financial - Show-level guarantee */}
      <td className="px-4 py-1 w-[10%]">
        <div className="text-xs text-gray-600">
          {permissions.canSeeFinancialDetails(show) ? (
            show.guarantee ? `$${show.guarantee}` : '—'
          ) : (
            '—'
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
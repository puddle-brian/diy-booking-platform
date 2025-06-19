import React from 'react';
import { Show } from '../../../types';
import { LineupItem, getLineupItemStatusBadge, getBillingPositionBadge } from '../../utils/showUtils';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { DocumentActionButton } from '../ActionButtons';
import { formatAgeRestriction } from '../../utils/ageRestrictionUtils';
import { StatusBadge, StatusType } from '../StatusBadge';
import { UnifiedActionButton } from '../ActionButtons/UnifiedActionButton';
import { getTimelineRowStyling, timelineTypography } from '../../utils/timelineRowStyling';

interface LineupItemRowProps {
  lineupItem: LineupItem;
  show: Show;
  permissions: ItineraryPermissions;
  venueId?: string; // Context: if present, we're on a venue page
  index: number; // For display order
  onShowDocument?: (show: Show) => void; // Handler for show document action
}

/**
 * LineupItemRow - Individual artist display as equal participants
 * This replaces the "support acts are subordinate" visual hierarchy
 * Each artist gets their own status and is treated equally
 */
export function LineupItemRow({
  lineupItem,
  show,
  permissions,
  venueId,
  index,
  onShowDocument
}: LineupItemRowProps) {
  const billingBadge = getBillingPositionBadge(lineupItem.billingPosition);
  
  // Use unified styling system for consistent appearance
  const getStatusType = (): StatusType => {
    switch (lineupItem.status?.toLowerCase()) {
      case 'confirmed':
        return 'confirmed';
      case 'pending':
        return 'pending';
      case 'declined':
      case 'rejected':
        return 'declined';
      case 'accepted':
        return 'accepted';
      default:
        return 'pending';
    }
  };
  
  const getStyleVariant = (): 'confirmed' | 'open' | 'hold' => {
    switch (lineupItem.status?.toLowerCase()) {
      case 'confirmed':
      case 'accepted':
        return 'confirmed';
      default:
        return 'open'; // Pending/other states use open (blue) styling
    }
  };
  
  const statusType = getStatusType();
  const styleVariant = getStyleVariant();
  const rowClassName = getTimelineRowStyling(styleVariant);
  
      return (
    <tr className={rowClassName}>
      {/* Empty expansion column - child row */}
      <td className="px-4 py-1 w-[3%]">
        {/* Empty - child row doesn't need expansion button */}
      </td>

      {/* Empty date column - parent provides context */}
      <td className="px-4 py-1 w-[12%]">
        {/* Empty - parent row provides date context */}
      </td>

      {/* Location (only show if not on venue page) */}
      {!venueId && (
        <td className="px-4 py-1 w-[14%]">
          {/* Intentionally empty - parent row provides venue context */}
        </td>
      )}

      {/* Artist Name - Clickable Link */}
      <td className={`px-4 py-1 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>
        <div className={`${timelineTypography.title} truncate`}>
          {lineupItem.artistId && lineupItem.artistId !== 'external-artist' ? (
            <a 
              href={`/artists/${lineupItem.artistId}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
              title="View artist page"
              onClick={(e) => e.stopPropagation()}
            >
              {lineupItem.artistName || 'Unknown Artist'}
            </a>
          ) : (
            <span>{lineupItem.artistName || 'Unknown Artist'}</span>
          )}
          {/* Show set length if available */}
          {lineupItem.setLength && (
            <span className={`${timelineTypography.muted} ml-2`}>• {lineupItem.setLength}min</span>
          )}
        </div>
      </td>

      {/* Individual Artist Status */}
      <td className="px-4 py-1 w-[10%]">
        <StatusBadge status={statusType} variant="compact" />
      </td>

      {/* Billing Position */}
      <td className="px-4 py-1 w-[7%]">
        <div className="flex justify-center">
          <span className={billingBadge.className}>
            {billingBadge.text}
          </span>
        </div>
      </td>

      {/* Age Restriction - Inherited from show */}
      <td className="px-4 py-1 w-[7%]">
        <div className={`${timelineTypography.muted} whitespace-nowrap`}>
          {/* Could show artist-specific age requirements here if needed */}
          <span className="text-gray-400">—</span>
        </div>
      </td>

      {/* Financial - Individual Guarantee */}
      <td className={`px-4 py-1 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>
        <div className={timelineTypography.subtitle}>
          {permissions.canSeeFinancialDetails(show) ? 
            (lineupItem.guarantee ? `$${lineupItem.guarantee}` : 'TBD') : 
            '—'}
        </div>
      </td>

      {/* Document Actions - Artist-specific */}
      <td className="px-4 py-1 w-[8%]">
        <div className="flex items-center space-x-1">
          {permissions.canViewShowDocument(show) && (
            <DocumentActionButton
              type="show"
              show={{
                ...show,
                // Override the primary artist fields to be the specific lineup item
                artistId: lineupItem.artistId,
                artistName: lineupItem.artistName,
                // Override the lineup to show ONLY this artist as the headliner
                // This ensures the extractData function will find this artist as the headliner
                lineup: [{
                  artistId: lineupItem.artistId,
                  artistName: lineupItem.artistName,
                  billingPosition: 'HEADLINER' as const,
                  performanceOrder: 1,
                  setLength: lineupItem.setLength,
                  guarantee: lineupItem.guarantee,
                  status: lineupItem.status || 'CONFIRMED' as const
                }]
              } as Show}
              permissions={permissions}
              onShowDocument={(artistSpecificShow) => {
                console.log('🎯 LineupItemRow: Document clicked for artist:', lineupItem.artistName);
                console.log('🎯 LineupItemRow: Artist-specific show object:', {
                  artistId: artistSpecificShow.artistId,
                  artistName: artistSpecificShow.artistName,
                  lineup: artistSpecificShow.lineup
                });
                onShowDocument?.(artistSpecificShow);
              }}
            />
          )}
        </div>
      </td>

      {/* Artist Actions */}
      <td className="px-4 py-1 w-[10%]">
        <div className="flex items-center space-x-1">
          {permissions.canEditShow(show) && (
            <UnifiedActionButton
              variant="danger"
              size="sm"
              onClick={() => {
                // Future: Remove artist from lineup
                console.log('Remove artist from lineup:', lineupItem.artistName);
              }}
              title="Remove from lineup"
            >
              ✕
            </UnifiedActionButton>
          )}
        </div>
      </td>
    </tr>
  );
} 
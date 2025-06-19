import React from 'react';
import { Show } from '../../../types';
import { LineupItem, getLineupItemStatusBadge, getBillingPositionBadge } from '../../utils/showUtils';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { DocumentActionButton } from '../ActionButtons';
import { formatAgeRestriction } from '../../utils/ageRestrictionUtils';

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
  const statusBadge = getLineupItemStatusBadge(lineupItem.status);
  const billingBadge = getBillingPositionBadge(lineupItem.billingPosition);
  
  // Status-based row styling similar to BidTimelineItem
  const getRowStyling = () => {
    const baseClasses = "transition-colors duration-150";
    
    switch (lineupItem.status?.toLowerCase()) {
      case 'confirmed':
        return `${baseClasses} bg-green-50 hover:bg-green-100`;
      case 'pending':
        return `${baseClasses} bg-yellow-50 hover:bg-yellow-100`;
      case 'declined':
      case 'rejected':
        return `${baseClasses} bg-red-50 hover:bg-red-100`;
      case 'accepted':
        return `${baseClasses} bg-emerald-50 hover:bg-emerald-100`;
      default:
        return `${baseClasses} bg-gray-50 hover:bg-gray-100`;
    }
  };
  
  return (
    <tr className={getRowStyling()}>
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
        <div className="text-sm font-medium text-gray-900 truncate">
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
            <span className="text-xs text-gray-500 ml-2">• {lineupItem.setLength}min</span>
          )}
        </div>
      </td>

      {/* Individual Artist Status */}
      <td className="px-4 py-1 w-[10%]">
        <span className={statusBadge.className}>
          {statusBadge.text}
        </span>
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
        <div className="text-xs text-gray-500 whitespace-nowrap">
          {/* Could show artist-specific age requirements here if needed */}
          <span className="text-gray-400">—</span>
        </div>
      </td>

      {/* Financial - Individual Guarantee */}
      <td className={`px-4 py-1 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>
        <div className="text-xs text-gray-600">
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
              show={show}
              permissions={permissions}
              onShowDocument={() => onShowDocument?.(show)}
            />
          )}
        </div>
      </td>

      {/* Artist Actions */}
      <td className="px-4 py-1 w-[10%]">
        <div className="flex items-center space-x-1">
          {permissions.canEditShow(show) && (
            <button
              className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:border-red-300 transition-colors"
              title="Remove from lineup"
              onClick={(e) => {
                e.stopPropagation();
                // Future: Remove artist from lineup
                console.log('Remove artist from lineup:', lineupItem.artistName);
              }}
            >
              Remove
            </button>
          )}
        </div>
      </td>
    </tr>
  );
} 
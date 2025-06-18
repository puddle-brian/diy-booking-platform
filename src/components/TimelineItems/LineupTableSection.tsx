import React from 'react';
import { Show } from '../../../types';
import { LineupItem } from '../../utils/showUtils';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { LineupItemRow } from './LineupItemRow';

interface LineupTableSectionProps {
  show: Show;
  lineup: LineupItem[];
  permissions: ItineraryPermissions;
  venueId?: string; // Context: if present, we're on a venue page
}

/**
 * LineupTableSection - Clean lineup display with all artists as equals
 * This replaces the confusing "green headliner + orange support" hierarchy
 */
export function LineupTableSection({
  show,
  lineup,
  permissions,
  venueId
}: LineupTableSectionProps) {
  // Sort lineup by performance order for proper display
  const sortedLineup = [...lineup].sort((a, b) => a.performanceOrder - b.performanceOrder);
  
  return (
    <tr>
      <td colSpan={venueId ? 9 : 10} className="px-0 py-0">
        <div className="bg-blue-50/30 border-l-4 border-l-blue-400">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] table-fixed">
              <tbody>
                {sortedLineup.map((lineupItem, index) => (
                  <LineupItemRow
                    key={`lineup-${lineupItem.artistId}-${index}`}
                    lineupItem={lineupItem}
                    show={show}
                    permissions={permissions}
                    venueId={venueId}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  );
} 
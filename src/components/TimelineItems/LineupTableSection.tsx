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
  onShowDocument?: (show: Show) => void; // Handler for show document action
  artistId?: string; // Add artistId for permission checks
}

/**
 * LineupTableSection - Clean lineup display with all artists as equals
 * This replaces the confusing "green headliner + orange support" hierarchy
 */
export function LineupTableSection({
  show,
  lineup,
  permissions,
  venueId,
  onShowDocument,
  artistId
}: LineupTableSectionProps) {
  // Sort lineup by performance order for proper display
  const sortedLineup = [...lineup].sort((a, b) => a.performanceOrder - b.performanceOrder);
  
  return (
    <tr>
      <td colSpan={venueId ? 9 : 10} className="px-0 py-0">
        <div className="bg-blue-50/30 border-l-4 border-l-blue-400">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] table-fixed">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-600">
                  <th className="px-4 py-1 w-[3%]"></th>
                  <th className="px-4 py-1 w-[12%]">Date</th>
                  {!venueId && <th className="px-4 py-1 w-[14%]">Location</th>}
                  <th className={`px-4 py-1 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>Artist</th>
                  <th className="px-4 py-1 w-[10%]">Status</th>
                  <th className="px-4 py-1 w-[7%]">Position</th>
                  <th className="px-4 py-1 w-[7%]">Age</th>
                  <th className={`px-4 py-1 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>Financial</th>
                  <th className="px-4 py-1 w-[8%]">Details</th>
                  <th className="px-4 py-1 w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLineup.map((lineupItem, index) => (
                  <LineupItemRow
                    key={`lineup-${lineupItem.artistId}-${index}`}
                    lineupItem={lineupItem}
                    show={show}
                    permissions={permissions}
                    venueId={venueId}
                    index={index}
                    onShowDocument={onShowDocument}
                    artistId={artistId}
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
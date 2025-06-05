import React from 'react';
import { Show } from '../../../types';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { ItineraryDate } from '../DateDisplay';
import { DeleteActionButton, DocumentActionButton } from '../ActionButtons';

interface ShowTimelineItemProps {
  show: Show;
  permissions: ItineraryPermissions;
  isExpanded: boolean;
  isDeleting: boolean;
  onToggleExpansion: (showId: string) => void;
  onDeleteShow: (showId: string, showName: string) => void;
  onShowDocument: (show: Show) => void;
  onShowDetail: (show: Show) => void;
}

export function ShowTimelineItem({
  show,
  permissions,
  isExpanded,
  isDeleting,
  onToggleExpansion,
  onDeleteShow,
  onShowDocument,
  onShowDetail
}: ShowTimelineItemProps) {
  return (
    <tr 
      className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
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
        <div className="text-sm font-medium text-gray-900 truncate">
          {(() => {
            if (permissions.actualViewerType === 'venue') {
              if (show.artistId && show.artistId !== 'external-artist') {
                return (
                  <a 
                    href={`/artists/${show.artistId}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                    title="View artist page"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {show.artistName || 'Unknown Artist'}
                  </a>
                );
              } else {
                return show.artistName || 'Unknown Artist';
              }
            } else {
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
            }
          })()}
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
          {show.guarantee ? `$${show.guarantee}` : '-'}
        </div>
      </td>

      <td className="px-4 py-3 w-[8%]">
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
  );
} 
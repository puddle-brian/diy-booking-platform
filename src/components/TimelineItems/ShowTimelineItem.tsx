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
          {show.venueName || 'TBA'}
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
        <div className="text-xs text-gray-600">
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
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowDetail(show);
            }}
            className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
            title="View show details"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
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
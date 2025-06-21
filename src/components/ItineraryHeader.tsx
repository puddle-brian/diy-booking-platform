import React from 'react';

interface ItineraryHeaderProps {
  showTitle: boolean;
  title?: string;
  artistId?: string;
  filteredShows: any[];
  filteredTourRequests: any[];
  editable: boolean;
  onRefresh: () => void;
}

export function ItineraryHeader({
  showTitle,
  title,
  artistId,
  filteredShows,
  filteredTourRequests,
  editable,
  onRefresh
}: ItineraryHeaderProps) {
  if (!showTitle) return null;

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {title || (artistId ? 'Show Dates' : 'Booking Calendar')}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredShows.length} confirmed show{filteredShows.length !== 1 ? 's' : ''}
            {artistId && filteredTourRequests.length > 0 && (
              <span> • {filteredTourRequests.length} active show request{filteredTourRequests.length !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        {editable && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
            title="Refresh data to get the latest updates"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        )}
      </div>
    </div>
  );
} 
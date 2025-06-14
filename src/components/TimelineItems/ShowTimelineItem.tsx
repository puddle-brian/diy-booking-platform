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
  artistId?: string; // Page context: if present, we're on an artist page
  venueId?: string;  // Page context: if present, we're on a venue page
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
  artistId,
  venueId,
  onToggleExpansion,
  onDeleteShow,
  onShowDocument,
  onShowDetail
}: ShowTimelineItemProps) {
  // Generate automatic show title based on lineup
  const generateShowTitle = (show: Show) => {
    const headlinerName = show.artistName || 'Unknown Artist';
    
    // TODO: When we add lineup support, calculate support acts count
    // For now, all shows are single-band
    const supportCount = 0; // show.lineup?.filter(slot => slot.position !== 'headliner').length || 0;
    
    if (supportCount === 0) {
      return headlinerName;
    } else {
      return `${headlinerName} +${supportCount}`;
    }
  };

  const showTitle = generateShowTitle(show);

  return (
    <>
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
              // Determine what to show based on PAGE CONTEXT, not viewer type
              const showVenueInfo = artistId; // If we're on an artist page, show venue info
              const showArtistInfo = venueId;  // If we're on a venue page, show artist info
              
              if (showVenueInfo) {
                // Show venue information (we're on an artist page)
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
              } else if (showArtistInfo) {
                // Show artist information (we're on a venue page) - use show title
                if (show.artistId && show.artistId !== 'external-artist') {
                  return (
                    <a 
                      href={`/artists/${show.artistId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      title="View artist page"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {showTitle}
                    </a>
                  );
                } else {
                  return showTitle;
                }
              } else {
                // Fallback: general pages, use viewer type logic
                if (permissions.actualViewerType === 'venue') {
                  return showTitle;
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
            {permissions.canSeeFinancialDetails(show) ? (show.guarantee ? `$${show.guarantee}` : '-') : '-'}
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

      {/* Lineup child rows (same styling as bid rows) */}
      {isExpanded && (
        <>
          {/* Headliner row */}
          <tr className="bg-green-50 hover:bg-green-100 transition-colors duration-150">
            <td className="px-2 py-1.5 w-[3%]">
              <div className="flex items-center justify-center text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </td>

            <td className="px-4 py-1.5 w-[12%]">
              <ItineraryDate
                date={show.date}
                className="text-sm font-medium text-green-900"
              />
            </td>

            <td className="px-4 py-1.5 w-[14%]">
              <div className="text-sm text-green-900 truncate">
                {show.city && show.state ? `${show.city}, ${show.state}` : '-'}
              </div>
            </td>

            <td className="px-4 py-1.5 w-[19%]">
              <div className="text-sm font-medium text-gray-900 truncate">
                {show.artistName || 'Unknown Artist'}
                <span className="text-xs text-gray-500 ml-2">• Headliner</span>
              </div>
            </td>

            <td className="px-4 py-1.5 w-[10%]">
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Confirmed
              </span>
            </td>

            <td className="px-4 py-1.5 w-[7%]">
              <div className="text-xs text-gray-600">{show.capacity || '-'}</div>
            </td>

            <td className="px-4 py-1.5 w-[7%]">
              <div className="text-xs text-gray-600 whitespace-nowrap">
                {show.ageRestriction?.toLowerCase().replace('_', '-') || 'all-ages'}
              </div>
            </td>

            <td className="px-4 py-1.5 w-[10%]">
              <div className="text-xs text-gray-600">
                {permissions.canSeeFinancialDetails(show) ? (show.guarantee ? `$${show.guarantee}` : 'Fee TBD') : '-'}
              </div>
            </td>

            <td className="px-4 py-1.5 w-[8%]">
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

            <td className="px-4 py-1.5 w-[10%]">
              <div className="flex items-center space-x-1">
                {/* Future: Edit headliner button */}
              </div>
            </td>
          </tr>

          {/* TODO: Support act rows will be rendered here */}
          {/* Example of what they'll look like:
          <tr className="bg-yellow-50 hover:bg-yellow-100 transition-colors duration-150">
            <td className="px-2 py-1.5 w-[3%]">
              <div className="flex items-center justify-center text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </td>
            <td className="px-4 py-1.5 w-[12%]">
              <ItineraryDate date={show.date} className="text-sm font-medium text-yellow-900" />
            </td>
            <td className="px-4 py-1.5 w-[14%]">
              <div className="text-sm text-yellow-900 truncate">
                {show.city && show.state ? `${show.city}, ${show.state}` : '-'}
              </div>
            </td>
            <td className="px-4 py-1.5 w-[19%]">
              <div className="text-sm font-medium text-gray-900 truncate">
                Support Band Name
                <span className="text-xs text-gray-500 ml-2">• Direct Support</span>
              </div>
            </td>
            <td className="px-4 py-1.5 w-[10%]">
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                Invited
              </span>
            </td>
            <td className="px-4 py-1.5 w-[7%]">
              <div className="text-xs text-gray-600">300</div>
            </td>
            <td className="px-4 py-1.5 w-[7%]">
              <div className="text-xs text-gray-600 whitespace-nowrap">all-ages</div>
            </td>
            <td className="px-4 py-1.5 w-[10%]">
              <div className="text-xs text-gray-600">$300</div>
            </td>
            <td className="px-4 py-1.5 w-[8%]">
              <div className="flex items-center space-x-1">
                Document icon
              </div>
            </td>
            <td className="px-4 py-1.5 w-[10%]">
              <div className="flex items-center space-x-1">
                Accept/Decline buttons
              </div>
            </td>
          </tr>
          */}

          {/* Add Support Act Button Row - matching "Add Date" button style */}
          {permissions.canEditShow(show) && (
            <tr className="bg-gray-50">
              <td colSpan={10} className="px-4 py-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement add support act functionality
                    alert('Adding support acts coming soon!');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Support Act</span>
                </button>
              </td>
            </tr>
          )}
        </>
      )}
    </>
  );
} 
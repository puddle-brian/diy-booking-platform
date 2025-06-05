import React, { useEffect } from 'react';
import { useItineraryState } from '../hooks/useItineraryState';
import { useTourItineraryData } from '../hooks/useTourItineraryData';
import { useItineraryPermissions } from '../hooks/useItineraryPermissions';
import { ShowTimelineItem, TourRequestTimelineItem } from './TimelineItems';
import { createTimelineEntries, groupEntriesByMonth, getDefaultActiveMonth } from '../utils/timelineUtils';

interface SimplifiedItineraryProps {
  artistId?: string;
  artistName?: string;
  venueId?: string;
  venueName?: string;
  editable?: boolean;
  viewerType?: 'artist' | 'venue' | 'public';
}

export default function SimplifiedItinerary({ 
  artistId, 
  artistName, 
  venueId, 
  venueName,
  editable = false,
  viewerType = 'public'
}: SimplifiedItineraryProps) {
  
  // 🎯 CLEAN STATE MANAGEMENT - One hook instead of 15+ useState calls
  const { state, actions } = useItineraryState();
  
  // 🎯 CLEAN DATA FETCHING - Centralized in hook
  const {
    shows,
    tourRequests,
    venueBids,
    venueOffers,
    loading,
    fetchError,
    fetchData
  } = useTourItineraryData({ artistId, venueId, venueName });
  
  // 🎯 CLEAN PERMISSIONS - All permission logic centralized
  const permissions = useItineraryPermissions({
    viewerType,
    editable,
    artistId,
    venueId,
    venueName
  });

  // Apply optimistic filters
  const filteredShows = shows.filter(show => !state.deletedShows.has(show.id));
  const filteredRequests = tourRequests.filter(request => !state.deletedRequests.has(request.id));
  const filteredOffers = venueOffers.filter(offer => !state.deletedRequests.has(`venue-offer-${offer.id}`));
  const filteredBids = venueBids.filter(bid => !state.deletedRequests.has(`venue-bid-${bid.id}`));
  
  // Create timeline
  const timelineEntries = createTimelineEntries(
    filteredShows, 
    filteredRequests, 
    filteredOffers, 
    filteredBids, 
    artistId, 
    venueId
  );
  const monthGroups = groupEntriesByMonth(timelineEntries);
  
  // Set default active month
  useEffect(() => {
    if (monthGroups.length > 0 && !state.activeMonthTab) {
      const defaultMonth = getDefaultActiveMonth(monthGroups);
      actions.setActiveMonth(defaultMonth);
    }
  }, [monthGroups.length, state.activeMonthTab, actions]);

  // Reset optimistic state when switching entities
  useEffect(() => {
    actions.resetOptimisticState();
  }, [artistId, venueId, actions]);

  const activeMonthEntries = monthGroups.find(group => group.monthKey === state.activeMonthTab)?.entries || [];

  // 🎯 SIMPLE ACTION HANDLERS - No complex conditionals
  const handleDeleteShow = async (showId: string, showName: string) => {
    try {
      actions.setDeleteLoading(showId);
      actions.deleteShowOptimistic(showId);
      
      const response = await fetch(`/api/shows/${showId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      
      await fetchData();
    } catch (error) {
      console.error('Error deleting show:', error);
      // Revert optimistic update on error
      await fetchData();
    } finally {
      actions.setDeleteLoading(null);
    }
  };

  const handleDeleteRequest = async (requestId: string, requestName: string) => {
    try {
      actions.setDeleteLoading(requestId);
      actions.deleteRequestOptimistic(requestId);
      
      const response = await fetch(`/api/show-requests/${requestId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      
      await fetchData();
    } catch (error) {
      console.error('Error deleting request:', error);
      await fetchData();
    } finally {
      actions.setDeleteLoading(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  if (fetchError) {
    return <div className="text-red-600 text-center py-8">{fetchError}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Month Tabs */}
      {monthGroups.length > 0 && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {monthGroups.map((group) => (
              <button
                key={group.monthKey}
                onClick={() => actions.setActiveMonth(group.monthKey)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  state.activeMonthTab === group.monthKey
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {group.monthLabel} ({group.count})
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Timeline Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full table-fixed">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 w-[3%]"></th>
              <th className="px-4 py-3 w-[12%]">Date</th>
              <th className="px-4 py-3 w-[14%]">Location</th>
              <th className="px-4 py-3 w-[19%]">Venue/Title</th>
              <th className="px-4 py-3 w-[10%]">Status</th>
              <th className="px-4 py-3 w-[7%]">Capacity</th>
              <th className="px-4 py-3 w-[7%]">Age</th>
              <th className="px-4 py-3 w-[10%]">Offers</th>
              <th className="px-4 py-3 w-[8%]">Details</th>
              <th className="px-4 py-3 w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeMonthEntries.map((entry) => {
              // 🎯 CLEAN RENDERING - Each component handles its own logic
              if (entry.type === 'show') {
                const show = entry.data as any;
                return (
                  <ShowTimelineItem
                    key={`show-${show.id}`}
                    show={show}
                    permissions={permissions}
                    isExpanded={state.expandedShows.has(show.id)}
                    isDeleting={state.deleteShowLoading === show.id}
                    onToggleExpansion={actions.toggleShowExpansion}
                    onDeleteShow={handleDeleteShow}
                    onShowDocument={(show) => actions.openDocumentModal({ show })}
                    onShowDetail={actions.openShowDetail}
                  />
                );
              }
              
              if (entry.type === 'tour-request') {
                const request = entry.data as any;
                return (
                  <TourRequestTimelineItem
                    key={`request-${request.id}`}
                    request={request}
                    permissions={permissions}
                    isExpanded={state.expandedRequests.has(request.id)}
                    isDeleting={state.deleteLoading === request.id}
                    venueOffers={venueOffers}
                    venueBids={venueBids}
                    venueId={venueId}
                    onToggleExpansion={actions.toggleRequestExpansion}
                    onDeleteRequest={handleDeleteRequest}
                    onRequestDocument={(request) => actions.openDocumentModal({ request })}
                    onMakeOffer={(request) => actions.openUniversalOffer({ artist: { id: request.artistId, name: request.artistName } })}
                    onOfferAction={(offer, action) => {/* Handle offer action */}}
                    onBidAction={(bid, action, reason) => {/* Handle bid action */}}
                  />
                );
              }
              
              return null;
            })}
          </tbody>
        </table>
      </div>

      {/* Add Date Button */}
      {editable && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              // Handle add date logic
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Date</span>
          </button>
        </div>
      )}
    </div>
  );
} 
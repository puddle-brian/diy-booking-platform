import { useMemo } from 'react';
import { Show, VenueBid, VenueOffer } from '../../types';
import {
  createTimelineEntries,
  groupEntriesByMonth,
  generateCompactMonthLabels
} from '../utils/timelineUtils';

interface UseCleanTimelineDataParams {
  shows: Show[];
  tourRequests: any[];
  venueBids: VenueBid[];
  venueOffers: VenueOffer[];
  deletedShows: Set<string>;
  deletedRequests: Set<string>;
  artistId?: string;
  venueId?: string;
}

export interface CleanTimelineData {
  filteredShows: Show[];
  filteredTourRequests: any[];
  filteredVenueOffers: VenueOffer[];
  filteredVenueBids: VenueBid[];
  timelineEntries: any[];
  monthGroups: any;
  stableMonthTabs: any[];
}

/**
 * 🎯 MICRO-PHASE A: Clean Timeline Data Hook
 * 
 * Extracts complex data filtering and timeline processing logic
 * from TabbedTourItinerary component.
 * 
 * This hook takes raw data and optimistic state, returns clean
 * processed data ready for rendering.
 */
export function useCleanTimelineData(params: UseCleanTimelineDataParams): CleanTimelineData {
  const {
    shows,
    tourRequests,
    venueBids,
    venueOffers,
    deletedShows,
    deletedRequests,
    artistId,
    venueId
  } = params;

  return useMemo(() => {
    // Step 1: Filter deleted items (optimistic updates)
    const filteredShows = shows.filter(show => !deletedShows.has(show.id));
    const filteredTourRequests = tourRequests.filter(request => !deletedRequests.has(request.id));
    
    // Step 2: Filter venue offers - exclude offers whose synthetic request IDs are in deletedRequests
    const filteredVenueOffers = venueOffers.filter(offer => {
      const syntheticRequestId = `venue-offer-${offer.id}`;
      return !deletedRequests.has(syntheticRequestId);
    });
    
    // Step 3: Filter venue bids - exclude bids whose synthetic request IDs are in deletedRequests
    const filteredVenueBids = venueBids.filter(bid => {
      const syntheticRequestId = `venue-bid-${bid.id}`;
      return !deletedRequests.has(syntheticRequestId);
    });

    // Step 4: Create timeline entries from filtered data
    const timelineEntries = createTimelineEntries(
      filteredShows,
      filteredTourRequests,
      filteredVenueOffers,
      filteredVenueBids,
      artistId,
      venueId
    );

    // Step 5: Group entries by month
    const monthGroups = groupEntriesByMonth(timelineEntries);
    
    // Step 6: Generate stable 12-month tabs with compact spacing
    const stableMonthTabs = generateCompactMonthLabels(monthGroups);

    return {
      filteredShows,
      filteredTourRequests,
      filteredVenueOffers,
      filteredVenueBids,
      timelineEntries,
      monthGroups,
      stableMonthTabs
    };
  }, [
    shows,
    tourRequests,
    venueBids,
    venueOffers,
    deletedShows,
    deletedRequests,
    artistId,
    venueId
  ]);
} 
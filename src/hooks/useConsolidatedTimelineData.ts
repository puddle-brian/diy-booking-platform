import { useState, useEffect, useMemo } from 'react';
import { Show, VenueBid, VenueOffer } from '../../types';
import { BookingOpportunity } from '../types/BookingOpportunity';
import { useTourItineraryData } from './useTourItineraryData';
import { useCleanTimelineData } from './useCleanTimelineData';

interface ConsolidatedTimelineParams {
  artistId?: string;
  venueId?: string;
  venueName?: string;
  viewerType?: 'artist' | 'venue' | 'public';
  // Optimistic state (from calling component)
  deletedShows?: Set<string>;
  deletedRequests?: Set<string>;
}

// ULTRA-SAFE VERSION: Perfect interface match with existing component expectations
export interface ConsolidatedTimelineData {
  // Raw data (exactly as useTourItineraryData provides)
  shows: Show[];
  tourRequests: any[];
  venueBids: VenueBid[];
  venueOffers: VenueOffer[];
  loading: boolean;
  fetchError: string | null;
  fetchData: () => Promise<void>;
  
  // Clean timeline data (exactly as useCleanTimelineData provides)
  filteredShows: Show[];
  filteredTourRequests: any[];
  filteredVenueBids: VenueBid[];
  filteredVenueOffers: VenueOffer[];
  timelineEntries: any[];
  monthGroups: any;
  stableMonthTabs: any[];
}

/**
 * 🎯 PHASE 1.1: ULTRA-SAFE Consolidated Timeline Data Hook
 * 
 * This hook is a pure pass-through that maintains perfect interface
 * compatibility with existing components. It just provides a single
 * hook interface without changing ANY behavior.
 * 
 * ULTRA-SAFE APPROACH:
 * - Perfect interface match with existing component expectations
 * - Zero behavior changes
 * - Just consolidates the two hook calls
 */
export function useConsolidatedTimelineData({
  artistId,
  venueId,
  venueName,
  viewerType = 'public',
  deletedShows = new Set<string>(),
  deletedRequests = new Set<string>()
}: ConsolidatedTimelineParams): ConsolidatedTimelineData {
  
  // Call existing hooks exactly as before
  const tourItineraryData = useTourItineraryData({ artistId, venueId, venueName });
  
  const cleanTimelineData = useCleanTimelineData({
    shows: tourItineraryData.shows,
    tourRequests: tourItineraryData.tourRequests,
    venueBids: tourItineraryData.venueBids,
    venueOffers: tourItineraryData.venueOffers,
    deletedShows,
    deletedRequests,
    artistId,
    venueId
  });

  // Return combined data with perfect interface match
  return {
    // From useTourItineraryData (exactly as it provides)
    shows: tourItineraryData.shows,
    tourRequests: tourItineraryData.tourRequests,
    venueBids: tourItineraryData.venueBids,
    venueOffers: tourItineraryData.venueOffers,
    loading: tourItineraryData.loading,
    fetchError: tourItineraryData.fetchError,
    fetchData: tourItineraryData.fetchData,
    
    // From useCleanTimelineData (exactly as it provides)
    filteredShows: cleanTimelineData.filteredShows,
    filteredTourRequests: cleanTimelineData.filteredTourRequests,
    filteredVenueBids: cleanTimelineData.filteredVenueBids,
    filteredVenueOffers: cleanTimelineData.filteredVenueOffers,
    timelineEntries: cleanTimelineData.timelineEntries,
    monthGroups: cleanTimelineData.monthGroups,
    stableMonthTabs: cleanTimelineData.stableMonthTabs
  };
} 
import { useState, useEffect, useCallback, useRef } from 'react';
import { BookingOpportunitiesResponse, BookingOpportunity } from '@/types/BookingOpportunity';

/**
 * Hook to fetch booking opportunities for a specific context (artist or venue)
 * 
 * This replaces the need for separate hooks like:
 * - useShowRequests
 * - useVenueOffers  
 * - useShowLineups
 * 
 * Everything is now unified under a single data source.
 */
export function useBookingOpportunities(params: {
  perspective: 'ARTIST' | 'VENUE';
  contextId: string;
  status?: string; // Comma-separated list: 'OPEN,PENDING'
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  includeExpired?: boolean;
}) {
  const [opportunities, setOpportunities] = useState<BookingOpportunity[]>([]);
  const [metadata, setMetadata] = useState<BookingOpportunitiesResponse['metadata'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLoadTime = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);

  // Load booking opportunities with caching
  const loadOpportunities = useCallback(async (force = false) => {
    if (!params.contextId) {
      setOpportunities([]);
      setMetadata(null);
      return;
    }

    // Prevent excessive API calls - cache for 30 seconds
    const now = Date.now();
    if (!force && now - lastLoadTime.current < 30000) {
      return;
    }

    // Prevent concurrent requests
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        perspective: params.perspective,
        ...(params.perspective === 'ARTIST' 
          ? { artistId: params.contextId }
          : { venueId: params.contextId }
        ),
        ...(params.status && { status: params.status }),
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.includeExpired !== undefined && { 
          includeExpired: params.includeExpired.toString() 
        })
      });

      const url = `/api/booking-opportunities?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data: BookingOpportunitiesResponse = await response.json();
        setOpportunities(data.opportunities);
        setMetadata(data.metadata);
        lastLoadTime.current = now;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load booking opportunities';
      console.error('Error loading booking opportunities:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [params.perspective, params.contextId, params.status, params.startDate, params.endDate, params.includeExpired]);

  // Load opportunities when parameters change
  useEffect(() => {
    if (params.contextId) {
      loadOpportunities();
    }
  }, [loadOpportunities]);

  return {
    opportunities,
    metadata,
    loading,
    error,
    
    // Convenience methods
    refetch: () => loadOpportunities(true),
    
    // Status-specific getters
    getOpenOpportunities: () => opportunities.filter((opp: BookingOpportunity) => opp.status === 'OPEN'),
    getPendingOpportunities: () => opportunities.filter((opp: BookingOpportunity) => opp.status === 'PENDING'),
    getConfirmedOpportunities: () => opportunities.filter((opp: BookingOpportunity) => opp.status === 'CONFIRMED'),
    
    // Date-based getters
    getUpcomingOpportunities: () => {
      const now = new Date();
      return opportunities.filter((opp: BookingOpportunity) => new Date(opp.proposedDate) > now);
    },
    
    // Source-based getters (useful for debugging/migration)
    getBySource: (sourceType: 'SHOW_REQUEST' | 'VENUE_OFFER' | 'SHOW_LINEUP') => 
      opportunities.filter((opp: BookingOpportunity) => opp.sourceType === sourceType)
  };
}

/**
 * Hook specifically for artist timelines
 * Convenience wrapper around useBookingOpportunities
 */
export function useArtistBookingOpportunities(artistId: string, options?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  includeExpired?: boolean;
}) {
  return useBookingOpportunities({
    perspective: 'ARTIST',
    contextId: artistId,
    ...options
  });
}

/**
 * Hook specifically for venue dashboards
 * Convenience wrapper around useBookingOpportunities
 */
export function useVenueBookingOpportunities(venueId: string, options?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  includeExpired?: boolean;
}) {
  return useBookingOpportunities({
    perspective: 'VENUE',
    contextId: venueId,
    ...options
  });
}

/**
 * Hook to get competing opportunities for a specific date
 * Useful for expansion panels showing multiple offers for same date
 */
export function useCompetingOpportunities(
  artistId: string, 
  proposedDate: string,
  excludeId?: string
) {
  const { opportunities } = useArtistBookingOpportunities(artistId, {
    startDate: proposedDate,
    endDate: proposedDate,
    includeExpired: true
  });
  
  return opportunities.filter((opp: BookingOpportunity) => 
    opp.proposedDate.split('T')[0] === proposedDate.split('T')[0] &&
    opp.id !== excludeId
  );
} 
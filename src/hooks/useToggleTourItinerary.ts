import { useTourItineraryData } from './useTourItineraryData';
import { useTourItineraryDataUnified } from './useTourItineraryDataUnified';

interface UseToggleTourItineraryProps {
  artistId?: string;
  venueId?: string;
  venueName?: string;
  useUnified?: boolean; // Toggle flag
}

/**
 * 🔄 PHASE 4.1: A/B TESTING TOGGLE HOOK
 * 
 * This hook allows us to switch between the legacy and unified data sources
 * without changing any UI code. Perfect for safe testing!
 * 
 * Usage:
 * - Default: useUnified=false (legacy system)
 * - Test: useUnified=true (unified system)
 * - URL param: ?useUnified=true
 */
export function useToggleTourItinerary({ 
  artistId, 
  venueId, 
  venueName,
  useUnified = false 
}: UseToggleTourItineraryProps) {
  
  // Check URL parameter for override
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlToggle = urlParams?.get('useUnified') === 'true';
  const shouldUseUnified = urlToggle || useUnified;
  
  console.log(`🔄 TOGGLE: Using ${shouldUseUnified ? 'UNIFIED' : 'LEGACY'} tour itinerary hook`);
  
  // Use the appropriate hook
  const legacyResult = useTourItineraryData({ 
    artistId, 
    venueId, 
    venueName 
  });
  
  const unifiedResult = useTourItineraryDataUnified({ 
    artistId, 
    venueId, 
    venueName 
  });
  
  // Return the selected result with metadata
  return {
    ...(shouldUseUnified ? unifiedResult : legacyResult),
    // Add metadata for debugging
    _metadata: {
      isUnified: shouldUseUnified,
      source: shouldUseUnified ? 'unified-api' : 'legacy-apis',
      urlToggle,
      explicitToggle: useUnified
    }
  };
} 
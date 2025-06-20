import { Show, VenueBid, VenueOffer } from '../../types'; // 🎯 PHASE 1: Use unified types
import { extractDateString } from './dateUtils';

// 🎯 PHASE 1: Removed duplicate interfaces - now using unified types from main types.ts

interface TimelineEntry {
  type: 'show' | 'show-request'; // 🎯 PHASE 3: Updated to 'show-request'
  date: string;
  endDate?: string;
  data: Show | any | VenueBid; // 🎯 PHASE 3: Using 'any' for ShowRequest
  parentTourRequest?: any; // 🎯 PHASE 3: Will be ShowRequest instead of TourRequest
}

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  entries: TimelineEntry[];
  count: number;
}

/**
 * Creates timeline entries from shows, tour requests, venue offers, and venue bids
 */
export function createTimelineEntries(
  shows: Show[],
  tourRequests: any[], // 🎯 PHASE 3: Now accepts ShowRequest[] instead of TourRequest[]
  venueOffers: VenueOffer[],
  venueBids: VenueBid[] = [],
  artistId?: string,
  venueId?: string
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  
  // Add shows with artist-context-aware logic
  shows.forEach(show => {
    const status = show.status?.toLowerCase();
    if (status === 'confirmed' || status === 'accepted') {
      
      if (artistId) {
        // 🎯 ARTIST PERSPECTIVE: Only add as 'show' type if THIS ARTIST is confirmed
        const artistLineupItem = show.lineup?.find(item => item.artistId === artistId);
        const artistConfirmed = artistLineupItem?.status?.toLowerCase() === 'confirmed';
        
        if (artistConfirmed) {
          // Artist is confirmed → show as confirmed show (expands to lineup)
          entries.push({
            type: 'show',
            date: show.date,
            data: show
          });
        } else if (artistLineupItem) {
          // Artist is in lineup but NOT confirmed → convert to show-request (expands to competing bids)
          const syntheticRequest = {
            id: `show-request-${show.id}`,
            artistId: artistId,
            artistName: artistLineupItem.artistName,
            title: `Pending Show at ${show.venueName}`,
            description: `Multi-artist show where you're pending confirmation`,
            requestedDate: show.date,
            startDate: show.date,
            endDate: show.date,
            isSingleDate: true,
            location: show.city && show.state ? `${show.city}, ${show.state}` : show.venueName,
            status: 'OPEN',
            // Mark as synthetic show-request for special handling
            isShowBasedRequest: true,
            originalShowId: show.id,
            venueId: show.venueId,
            venueName: show.venueName
          };
          
          entries.push({
            type: 'show-request',
            date: show.date,
            data: syntheticRequest
          });
        }
        // If artist not in lineup at all, don't show the show
      } else {
        // 🎯 VENUE PERSPECTIVE: Use aggregate show status (existing logic)
        entries.push({
          type: 'show',
          date: show.date,
          data: show
        });
      }
    }
  });
  
  // 🎯 UNIFIED SYSTEM: Convert venue offers to synthetic tour requests with bids
  // This creates a consistent UX where all booking opportunities are tour-request rows
  venueOffers.forEach(offer => {
    const status = offer.status.toLowerCase();
    
    // 🎯 ENHANCED FILTERING: Ensure declined/rejected offers disappear completely from UI
    if (!['cancelled', 'declined', 'rejected', 'expired'].includes(status)) {
      // 🎯 FIX: When viewing artist pages, only show offers FOR that specific artist
      if (artistId && offer.artistId !== artistId) {
        return; // Skip offers for other artists when viewing a specific artist page
      }
      
      // 🎯 FIX: Consistent date handling - extract date string to avoid timezone issues  
      const offerDate = extractDateString(offer.proposedDate);
      
      // Create synthetic tour request from venue offer
      const syntheticRequest: any = { // 🎯 PHASE 4: Updated to any for ShowRequest
        id: `venue-offer-${offer.id}`, // Prefix to distinguish synthetic requests
        artistId: offer.artistId,
        artistName: offer.artistName || 'Unknown Artist',
        title: offer.title,
        description: offer.description || `Offer from ${offer.venueName}`,
        startDate: offerDate, // 🎯 FIX: Use consistent date without timezone
        endDate: offerDate, // Single date for offers
        isSingleDate: true,
        location: offer.venueName || 'Unknown Location', // 🎯 PHASE 1: Simplified location display
        radius: 0, // Not applicable for venue offers
        flexibility: 'exact-cities' as const,
        genres: [], // Could be enhanced with venue/artist genre matching
        expectedDraw: {
          min: 0,
          max: offer.capacity || 0,
          description: `Venue capacity: ${offer.capacity || 'Unknown'}`
        },
        tourStatus: 'exploring-interest' as const,
        ageRestriction: (offer.ageRestriction as any) || 'ALL_AGES', // 🎯 PHASE 6.5: Use actual offer age restriction, default to enum value
        equipment: {
          needsPA: false,
          needsMics: false, 
          needsDrums: false,
          needsAmps: false,
          acoustic: false
        },
        // 🎯 FIX: Don't set guaranteeRange for venue offers - they have specific amounts, not ranges
        acceptsDoorDeals: !!offer.doorDeal,
        merchandising: false,
        travelMethod: 'van' as const,
        lodging: 'flexible' as const,
        status: 'active' as const, // Always active for display
        priority: 'medium' as const,
        responses: 1, // Always 1 since there's exactly one offer/bid
        createdAt: offer.createdAt || new Date().toISOString(),
        updatedAt: offer.updatedAt || new Date().toISOString(),
        expiresAt: offer.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        
        // 🎯 VENUE-INITIATED FLAGS: Mark as venue-initiated for ownership control
        isVenueInitiated: true,
        venueInitiatedBy: offer.venueId,
        originalOfferId: offer.id,
        // 🎯 FIX: Add venue information for proper display in artist timelines
        venueId: offer.venueId,
        venueName: offer.venueName
      } as any & { // 🎯 PHASE 4: Updated to any for ShowRequest 
        isVenueInitiated?: boolean; 
        venueInitiatedBy?: string; 
        originalOfferId?: string; 
      };
      
      entries.push({
        type: 'show-request', // 🎯 PHASE 3: Updated to 'show-request'
        date: offerDate, // 🎯 FIX: Use consistent date without timezone
        data: syntheticRequest
      });
    } else {
      console.log('🚫 Filtering out venue offer with status:', status);
    }
  });
  
  // ✅ SIMPLE: No synthetic request promotion - held bids stay in their natural rows
  
  // 🎯 NEW: Convert venue bids to synthetic tour requests for venue timeline view ONLY
  // 🎯 FIX: Only create synthetic venue bid requests when viewing venue pages, not when venue users view artist pages
  if (venueId && !artistId && venueBids.length > 0) {
    
    venueBids.forEach(bid => {
      const status = bid.status.toLowerCase();
      
      // Only show active bid statuses (same filtering as venue offers)
      if (!['cancelled', 'declined', 'rejected', 'expired'].includes(status)) {
        // 🎯 KEY FIX: Only create timeline entries for bids that belong to the current venue
        if (bid.venueId === venueId) {
          

          
          const bidDate = bid.proposedDate.split('T')[0];
          
                      // Create synthetic tour request from venue bid to show in venue timeline
            const syntheticBidRequest: any = { // 🎯 PHASE 4: Updated to any for ShowRequest
              id: `venue-bid-${bid.id}`, // Use first bid ID for this request
              artistId: bid.artistId || 'unknown', // 🎯 FIX: Use stored artist ID
              artistName: bid.artistName || bid.location || 'Unknown Artist', // 🎯 FIX: Use stored artist name
            title: `Bid on Artist Request`, // Generic title since we don't have full request info
            description: bid.message || `Bid placed by ${bid.venueName}`,
            startDate: bidDate,
            endDate: bidDate,
            isSingleDate: true,
            location: bid.location || 'Unknown Location',
            radius: 0,
            targetLocations: [bid.location || 'Unknown Location'],
            genres: [],
            initiatedBy: 'ARTIST' as const,
            flexibility: 'exact-cities' as const,
            expectedDraw: {
              min: 0,
              max: bid.capacity || 0,
              description: `Venue capacity: ${bid.capacity || 'Unknown'}`
            },
            tourStatus: 'exploring-interest' as const,
            equipment: {
              needsPA: false,
              needsMics: false,
              needsDrums: false,
              needsAmps: false,
              acoustic: false
            },
            guaranteeRange: {
              min: bid.guarantee || 0,
              max: bid.guarantee || 0
            },
            acceptsDoorDeals: true,
            merchandising: true,
            ageRestriction: (bid.ageRestriction as any) || 'ALL_AGES', // 🎯 PHASE 6.5: Use actual bid age restriction, default to enum value
            travelMethod: 'van' as const,
            lodging: 'flexible' as const,
            priority: 'medium' as const,
            technicalRequirements: [],
            hospitalityRequirements: [],
            notes: bid.message || '',
            status: 'active' as const,
            requestedDate: bidDate,
            responses: 1,
            createdAt: bid.createdAt,
            updatedAt: bid.updatedAt,
            expiresAt: bid.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            // 🎯 Mark as venue bid synthetic request with metadata for proper handling
            isVenueBid: true,
            originalBidId: bid.id,
            originalShowRequestId: bid.showRequestId,
            bidStatus: bid.status,
            bidAmount: bid.guarantee
          } as any & { // 🎯 PHASE 4: Updated to any for ShowRequest 
            isVenueBid: boolean; 
            originalBidId: string; 
            originalShowRequestId: string;
            bidStatus: string; 
            bidAmount?: number;
          };
          
          entries.push({
            type: 'show-request', // 🎯 PHASE 3: Updated to 'show-request'
            date: bidDate,
            data: syntheticBidRequest
          });
        }
      }
    });
  }
  
  if (artistId) {
    // Add regular artist-initiated show requests  
    tourRequests.forEach(request => {
      if (request.status === 'OPEN') { // 🎯 PHASE 3: ShowRequest uses 'OPEN' not 'active'
        entries.push({
          type: 'show-request', // 🎯 PHASE 3: Updated to 'show-request'
          date: request.requestedDate?.split('T')[0] || request.startDate, // 🎯 PHASE 3: Use requestedDate from ShowRequest
          data: request
        });
      }
    });
  }
  
  // 🎯 NEW: Also add tourRequests to venue timelines (for venue-specific artist requests)
  if (venueId && !artistId) {
    // Add show requests that are specifically targeted at this venue
    tourRequests.forEach(request => {
      if (request.status === 'OPEN') { // 🎯 PHASE 3: ShowRequest uses 'OPEN' not 'active'

        entries.push({
          type: 'show-request', // 🎯 PHASE 3: Updated to 'show-request'
          date: request.requestedDate?.split('T')[0], // 🎯 PHASE 3: Use requestedDate from ShowRequest
          data: request
        });
      }
    });
  }
  
  // Sort by date
  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Groups timeline entries by month
 */
export function groupEntriesByMonth(entries: TimelineEntry[]): MonthGroup[] {
  const monthGroups: { [key: string]: MonthGroup & { uniqueDates: Set<string> } } = {};
  
  entries.forEach(entry => {
    // 🎯 FIX: Use timezone-safe date parsing to avoid month shifting
    // This prevents "2025-08-01" from being interpreted as UTC and shifting to July in negative timezones
    let date: Date;
    
    if (typeof entry.date === 'string') {
      if (entry.date.includes('T') || entry.date.includes('Z')) {
        // ISO string with time - parse normally
        date = new Date(entry.date);
      } else {
        // Date-only string (e.g., "2025-08-01") - treat as local date
        const parts = entry.date.split('-');
        if (parts.length === 3) {
          // Create date in local timezone to avoid UTC conversion
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          date = new Date(entry.date);
        }
      }
    } else {
      date = new Date(entry.date);
    }
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    // Extract date string for uniqueness tracking
    const dateString = entry.date.split('T')[0]; // Gets "2025-08-15" from "2025-08-15" or "2025-08-15T10:00:00Z"
    
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = {
        monthKey,
        monthLabel,
        entries: [],
        count: 0,
        uniqueDates: new Set<string>()
      };
    }
    
    monthGroups[monthKey].entries.push(entry);
    
    // 🎯 FIX: Only increment count for unique dates
    if (!monthGroups[monthKey].uniqueDates.has(dateString)) {
      monthGroups[monthKey].uniqueDates.add(dateString);
      monthGroups[monthKey].count++;
    }
  });
  
  // Sort months chronologically and remove the uniqueDates helper
  return Object.values(monthGroups).map(group => ({
    monthKey: group.monthKey,
    monthLabel: group.monthLabel,
    entries: group.entries,
    count: group.count
  })).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

/**
 * Generates a complete 12-month tab structure with abbreviated month names
 * This ensures consistent navigation regardless of which months have data
 */
export function generateStableMonthTabs(monthGroups: MonthGroup[]): MonthGroup[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Generate 12 months starting from current month
  const stableMonths: MonthGroup[] = [];
  
  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(currentYear, currentMonth + i, 1);
    const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    
    // 🎯 UX IMPROVEMENT: Smart year display logic
    let monthLabel: string;
    
    if (targetDate.getFullYear() === currentYear) {
      // Current year: just show month name
      monthLabel = targetDate.toLocaleDateString('en-US', { month: 'short' });
    } else {
      // Different year: show abbreviated year
      monthLabel = targetDate.toLocaleDateString('en-US', { 
        month: 'short',
        year: '2-digit' // This gives us "'25" format
      }).replace(',', ' \''); // Format as "Jan '25"
    }
    
    // Find existing data for this month
    const existingMonth = monthGroups.find(group => group.monthKey === monthKey);
    
    stableMonths.push({
      monthKey,
      monthLabel,
      entries: existingMonth?.entries || [],
      count: existingMonth?.count || 0
    });
  }
  
  return stableMonths;
}

/**
 * Generates appropriate default active month tab with stable month structure
 */
export function getDefaultActiveMonthStable(stableMonthTabs: MonthGroup[]): string {
  // Find the soonest month with shows (not just any entries)
  const monthWithShows = stableMonthTabs.find(group => 
    group.entries.some(entry => entry.type === 'show')
  );
  
  if (monthWithShows) {
    return monthWithShows.monthKey;
  }
  
  // Find the soonest month with any content
  const monthWithContent = stableMonthTabs.find(group => group.count > 0);
  if (monthWithContent) {
    return monthWithContent.monthKey;
  }
  
  // Default to current month
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Original function for backward compatibility
 */
export function getDefaultActiveMonth(monthGroups: MonthGroup[]): string {
  if (monthGroups.length === 0) {
    // Set to current month if no entries
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Find the soonest month with shows (not just any entries)
  const monthWithShows = monthGroups.find(group => 
    group.entries.some(entry => entry.type === 'show')
  );
  
  if (monthWithShows) {
    return monthWithShows.monthKey;
  } else {
    // If no shows, use the first month with any entries
    return monthGroups[0].monthKey;
  }
}

/**
 * Extracts month key from a date string for auto-focusing
 */
export function getMonthKeyFromDate(dateString: string): string {
  let date: Date;
  
  if (typeof dateString === 'string') {
    if (dateString.includes('T') || dateString.includes('Z')) {
      // ISO string with time - parse normally
      date = new Date(dateString);
    } else {
      // Date-only string (e.g., "2025-08-01") - treat as local date
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // Create date in local timezone to avoid UTC conversion
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        date = new Date(dateString);
      }
    }
  } else {
    date = new Date(dateString);
  }
  
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Alternative month label generators for different space/clarity tradeoffs
 */

// Option 1: Minimal - just month names, year only when it changes
export function generateMinimalMonthLabels(monthGroups: MonthGroup[]): MonthGroup[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const stableMonths: MonthGroup[] = [];
  let lastYear = currentYear;
  
  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(currentYear, currentMonth + i, 1);
    const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
    const yearChanged = targetDate.getFullYear() !== lastYear;
    
    // Show year only when it changes
    const monthLabel = yearChanged ? `${monthName} '${String(targetDate.getFullYear()).slice(-2)}` : monthName;
    lastYear = targetDate.getFullYear();
    
    const existingMonth = monthGroups.find(group => group.monthKey === monthKey);
    
    stableMonths.push({
      monthKey,
      monthLabel,
      entries: existingMonth?.entries || [],
      count: existingMonth?.count || 0
    });
  }
  
  return stableMonths;
}

// Option 2: Ultra-compact - just 3-letter month codes
export function generateCompactMonthLabels(monthGroups: MonthGroup[]): MonthGroup[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const stableMonths: MonthGroup[] = [];
  
  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(currentYear, currentMonth + i, 1);
    const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Just the 3-letter month abbreviation
    const monthLabel = targetDate.toLocaleDateString('en-US', { month: 'short' });
    
    const existingMonth = monthGroups.find(group => group.monthKey === monthKey);
    
    stableMonths.push({
      monthKey,
      monthLabel,
      entries: existingMonth?.entries || [],
      count: existingMonth?.count || 0
    });
  }
  
  return stableMonths;
}

/**
 * Utility function for consistent timeline border styling
 */
export function getTimelineBorderClass(status: string): string {
  const normalizedStatus = status?.toLowerCase();
  switch (normalizedStatus) {
    case 'confirmed':
      return 'bg-green-50/30';
    case 'accepted':
      return 'bg-green-50/20';
    case 'hold':
      return 'bg-violet-50/30';
    case 'pending':
    default:
      return ''; // No border for non-confirmed items
  }
}

/**
 * Helper function to extract date from any timeline entry
 */
export function extractDateFromEntry(entry: any): string {
  // For shows
  if (entry.date) return entry.date;
  // For tour requests
  if (entry.requestDate) return entry.requestDate;
  if (entry.startDate) return entry.startDate;
  // For venue offers
  if (entry.proposedDate) return entry.proposedDate;
  // For venue bids
  if (entry.proposedDate) return entry.proposedDate;
  return '';
} 
import { Show, TourRequest } from '../../types';
import { extractDateString } from './dateUtils';

interface VenueBid {
  id: string;
  showRequestId: string;
  venueId: string;
  venueName: string;
  proposedDate: string;
  guarantee?: number;
  doorDeal?: {
    split: string;
    minimumGuarantee?: number;
  };
  ticketPrice: {
    advance?: number;
    door?: number;
  };
  capacity: number;
  ageRestriction: string;
  equipmentProvided: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  loadIn: string;
  soundcheck: string;
  doorsOpen: string;
  showTime: string;
  curfew: string;
  promotion: {
    social: boolean;
    flyerPrinting: boolean;
    radioSpots: boolean;
    pressCoverage: boolean;
  };
  message: string;
  status: 'pending' | 'hold' | 'accepted' | 'declined' | 'cancelled';
  readByArtist: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  location?: string;
  holdPosition?: 1 | 2 | 3;
  heldAt?: string;
  heldUntil?: string;
  acceptedAt?: string;
  declinedAt?: string;
  declinedReason?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  billingPosition?: 'headliner' | 'co-headliner' | 'support' | 'local-support';
  lineupPosition?: number;
  setLength?: number;
  otherActs?: string;
  billingNotes?: string;
  // 🔒 HOLD STATE MANAGEMENT FIELDS
  holdState?: 'AVAILABLE' | 'FROZEN' | 'HELD';
  frozenByHoldId?: string;
  frozenAt?: string;
  unfrozenAt?: string;
  isFrozen?: boolean;
  venue?: any;
  artistId?: string;
  artistName?: string;
}

interface VenueOffer {
  id: string;
  venueId: string;
  venueName: string;
  artistId: string;
  artistName: string;
  title: string;
  description?: string;
  proposedDate: string;
  alternativeDates?: string[];
  message?: string;
  amount?: number;
  doorDeal?: {
    split: string;
    minimumGuarantee?: number;
    afterExpenses?: boolean;
  };
  ticketPrice?: {
    advance?: number;
    door?: number;
  };
  merchandiseSplit?: string;
  billingPosition?: 'headliner' | 'co-headliner' | 'support' | 'local-support';
  lineupPosition?: number;
  setLength?: number;
  otherActs?: string;
  billingNotes?: string;
  capacity?: number;
  ageRestriction?: string;
  equipmentProvided?: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  loadIn?: string;
  soundcheck?: string;
  doorsOpen?: string;
  showTime?: string;
  curfew?: string;
  promotion?: {
    social: boolean;
    flyerPrinting: boolean;
    radioSpots: boolean;
    pressCoverage: boolean;
  };
  lodging?: {
    offered: boolean;
    type: 'floor-space' | 'couch' | 'private-room';
    details?: string;
  };
  additionalTerms?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  venue?: {
    id: string;
    name: string;
    venueType?: string;
    capacity?: number;
    location?: {
      city: string;
      stateProvince: string;
      country: string;
    };
  };
  artist?: {
    id: string;
    name: string;
    genres?: string[];
  };
}

interface TimelineEntry {
  type: 'show' | 'tour-request' | 'venue-bid';
  date: string;
  endDate?: string;
  data: Show | TourRequest | VenueBid;
  parentTourRequest?: TourRequest;
  id: string;
  sortKey: string;
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
  tourRequests: TourRequest[],
  venueOffers: VenueOffer[],
  venueBids: VenueBid[],
  artistId?: string,
  venueId?: string
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  
  // Helper function to extract date string from various date formats
  const extractDateString = (date: string | Date): string => {
    if (typeof date === 'string') {
      return date.split('T')[0]; // Extract YYYY-MM-DD part
    }
    return date.toISOString().split('T')[0];
  };

  // Add shows
  shows.forEach(show => {
    entries.push({
      id: `show-${show.id}`,
      type: 'show' as const,
      date: extractDateString(show.date),
      data: show,
      sortKey: `${extractDateString(show.date)}-show-${show.id}`
    });
  });

  // Add tour requests
  tourRequests.forEach(request => {
    entries.push({
      id: `tour-request-${request.id}`,
      type: 'tour-request' as const,
      date: extractDateString(request.startDate),
      data: request,
      sortKey: `${extractDateString(request.startDate)}-tour-request-${request.id}`
    });
  });

  // 🎯 NEW: Unified venue timeline creation for venue pages
  if (venueId) {
    // Create a map to track all venue activities by date
    const venueActivitiesByDate = new Map<string, {
      offers: VenueOffer[];
      bids: VenueBid[];
    }>();

    // Group venue offers by date
    const filteredOffers = venueOffers.filter(offer => offer.status !== 'declined');
    filteredOffers.forEach(offer => {
      const offerDate = extractDateString(offer.proposedDate);
      if (!venueActivitiesByDate.has(offerDate)) {
        venueActivitiesByDate.set(offerDate, { offers: [], bids: [] });
      }
      venueActivitiesByDate.get(offerDate)!.offers.push(offer);
    });

    // Group venue bids by date
    const filteredBids = venueBids.filter(bid => bid.status !== 'declined');
    filteredBids.forEach(bid => {
      const bidDate = extractDateString(bid.proposedDate);
      if (!venueActivitiesByDate.has(bidDate)) {
        venueActivitiesByDate.set(bidDate, { offers: [], bids: [] });
      }
      venueActivitiesByDate.get(bidDate)!.bids.push(bid);
    });

    // 🔍 DEBUG: Log unified venue activities
    console.log('🔍 DEBUG: Unified venue activities by date:');
    console.log('🔍 Total dates with venue activities:', venueActivitiesByDate.size);
    console.log('🔍 Activities by date:', Array.from(venueActivitiesByDate.entries()).map(([date, activities]) => ({
      date,
      offers: activities.offers.length,
      bids: activities.bids.length,
      total: activities.offers.length + activities.bids.length
    })));

    // Create unified timeline entries for each date
    venueActivitiesByDate.forEach((activities, activityDate) => {
      const { offers, bids } = activities;
      
      if (offers.length > 0) {
        // Create grouped venue offer entry
        const primaryOffer = offers[0];
        const groupedOfferEntry: TimelineEntry = {
          id: `venue-offers-${activityDate}`,
          type: 'tour-request' as const,
          date: activityDate,
          data: {
            id: `venue-offers-${activityDate}`,
            artistId: primaryOffer.artistId,
            title: offers.length > 1 
              ? `${offers.length} offers for ${activityDate}`
              : primaryOffer.title,
            artistName: offers.length > 1 
              ? `${offers.length} artists` 
              : primaryOffer.artistName,
            description: offers.length > 1 
              ? `Multiple venue offers for ${activityDate}`
              : primaryOffer.description || `Offer from ${primaryOffer.venueName}`,
            startDate: activityDate,
            endDate: activityDate,
            location: primaryOffer.venue?.location ? 
              `${primaryOffer.venue.location.city}, ${primaryOffer.venue.location.stateProvince}` : 
              primaryOffer.venueName || 'Unknown Location',
            radius: 0,
            flexibility: 'exact-cities' as const,
            genres: [],
            expectedDraw: {
              min: 0,
              max: primaryOffer.capacity || 0,
              description: `Venue capacity: ${primaryOffer.capacity || 'Unknown'}`
            },
            tourStatus: 'exploring-interest' as const,
            ageRestriction: (primaryOffer.ageRestriction as any) || 'flexible',
            equipment: {
              needsPA: false,
              needsMics: false, 
              needsDrums: false,
              needsAmps: false,
              acoustic: false
            },
            acceptsDoorDeals: offers.some(offer => !!offer.doorDeal),
            merchandising: false,
            travelMethod: 'van' as const,
            lodging: 'flexible' as const,
            status: 'active' as const,
            priority: 'medium' as const,
            responses: offers.length,
            createdAt: primaryOffer.createdAt || new Date().toISOString(),
            updatedAt: Math.max(...offers.map(o => new Date(o.updatedAt || o.createdAt || new Date()).getTime())).toString(),
            expiresAt: primaryOffer.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isVenueInitiated: true,
            originalOfferIds: offers.map(o => o.id),
            venueId: primaryOffer.venueId,
            venueName: primaryOffer.venueName
          } as TourRequest & { 
            isVenueInitiated: boolean; 
            originalOfferIds: string[];
            venueId: string;
            venueName: string;
          },
          sortKey: `${activityDate}-venue-offers`
        };
        entries.push(groupedOfferEntry);
      }
      
      // Add venue bids as separate entries (they don't group with offers)
      bids.forEach(bid => {
        entries.push({
          id: `venue-bid-${bid.id}`,
          type: 'venue-bid' as const,
          date: activityDate,
          data: bid,
          sortKey: `${activityDate}-venue-bid-${bid.id}`
        });
      });
    });

    console.log('🎯 Created unified venue timeline entries:', entries.filter(e => 
      e.type === 'tour-request' || e.type === 'venue-bid'
    ).length);

  } else {
    // 🎯 ARTIST VIEW: Original logic for artist pages
    // Group offers by date
    const offersByDate = new Map<string, VenueOffer[]>();
    const filteredOffers = venueOffers.filter(offer => offer.status !== 'declined');
    filteredOffers.forEach(offer => {
      const offerDate = extractDateString(offer.proposedDate);
      if (!offersByDate.has(offerDate)) {
        offersByDate.set(offerDate, []);
      }
      offersByDate.get(offerDate)!.push(offer);
    });

    // Create one timeline entry per date, with grouped offers
    offersByDate.forEach((offersForDate, offerDate) => {
      const primaryOffer = offersForDate[0];
      
      const groupedEntry: TimelineEntry = {
        id: `venue-offers-${offerDate}`,
        type: 'tour-request' as const,
        date: offerDate,
        data: {
          id: `venue-offers-${offerDate}`,
          artistId: primaryOffer.artistId,
          title: offersForDate.length > 1 
            ? `${offersForDate.length} venue offers for ${offerDate}`
            : primaryOffer.title,
          artistName: offersForDate.length > 1 
            ? `${offersForDate.length} venues` 
            : primaryOffer.venueName || 'Venue',
          description: offersForDate.length > 1 
            ? `Multiple venue offers for ${offerDate}`
            : primaryOffer.description || `Offer from ${primaryOffer.venueName}`,
          startDate: offerDate,
          endDate: offerDate,
          location: primaryOffer.venue?.location ? 
            `${primaryOffer.venue.location.city}, ${primaryOffer.venue.location.stateProvince}` : 
            primaryOffer.venueName || 'Unknown Location',
          radius: 0,
          flexibility: 'exact-cities' as const,
          genres: [],
          expectedDraw: {
            min: 0,
            max: primaryOffer.capacity || 0,
            description: `Venue capacity: ${primaryOffer.capacity || 'Unknown'}`
          },
          tourStatus: 'exploring-interest' as const,
          ageRestriction: (primaryOffer.ageRestriction as any) || 'flexible',
          equipment: {
            needsPA: false,
            needsMics: false, 
            needsDrums: false,
            needsAmps: false,
            acoustic: false
          },
          acceptsDoorDeals: offersForDate.some(offer => !!offer.doorDeal),
          merchandising: false,
          travelMethod: 'van' as const,
          lodging: 'flexible' as const,
          status: 'active' as const,
          priority: 'medium' as const,
          responses: offersForDate.length,
          createdAt: primaryOffer.createdAt || new Date().toISOString(),
          updatedAt: Math.max(...offersForDate.map(o => new Date(o.updatedAt || o.createdAt || new Date()).getTime())).toString(),
          expiresAt: primaryOffer.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isVenueInitiated: true,
          originalOfferIds: offersForDate.map(o => o.id),
          venueId: primaryOffer.venueId,
          venueName: primaryOffer.venueName
        } as TourRequest & { 
          isVenueInitiated: boolean; 
          originalOfferIds: string[];
          venueId: string;
          venueName: string;
        },
        sortKey: `${offerDate}-venue-offers`
      };
      
      entries.push(groupedEntry);
    });

    // Add venue bids for artist view
    const filteredBids = venueBids.filter(bid => bid.status !== 'declined');
    filteredBids.forEach(bid => {
      console.log(`🎯 Creating timeline entry for venue bid: ${bid.venueName} -> ${bid.artistName} on ${extractDateString(bid.proposedDate)}`);
      entries.push({
        id: `venue-bid-${bid.id}`,
        type: 'venue-bid' as const,
        date: extractDateString(bid.proposedDate),
        data: bid,
        sortKey: `${extractDateString(bid.proposedDate)}-venue-bid-${bid.id}`
      });
    });
  }

  // Sort entries by date and type
  entries.sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;
    return a.sortKey.localeCompare(b.sortKey);
  });

  return entries;
}

/**
 * Groups timeline entries by month
 */
export function groupEntriesByMonth(entries: TimelineEntry[]): MonthGroup[] {
  const monthGroups: { [key: string]: MonthGroup } = {};
  
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
    
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = {
        monthKey,
        monthLabel,
        entries: [],
        count: 0
      };
    }
    
    monthGroups[monthKey].entries.push(entry);
    monthGroups[monthKey].count++;
  });
  
  // Sort months chronologically
  return Object.values(monthGroups).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
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
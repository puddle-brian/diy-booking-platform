import { Show, TourRequest } from '../../types';

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
  billingPosition?: 'headliner' | 'co-headliner' | 'direct-support' | 'opener' | 'local-opener';
  lineupPosition?: number;
  setLength?: number;
  otherActs?: string;
  billingNotes?: string;
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
  billingPosition?: 'headliner' | 'co-headliner' | 'direct-support' | 'opener' | 'local-opener';
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
  type: 'show' | 'tour-request';
  date: string;
  endDate?: string;
  data: Show | TourRequest | VenueBid;
  parentTourRequest?: TourRequest;
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
  venueBids: VenueBid[] = [],
  artistId?: string,
  venueId?: string
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  
  // Add confirmed shows
  shows.forEach(show => {
    entries.push({
      type: 'show',
      date: show.date,
      data: show
    });
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
      
      // 🎯 FIX: Ensure proper date handling - use original proposedDate without conversion
      // Extract just the date part to avoid timezone issues with ISO timestamps
      const offerDate = offer.proposedDate.split('T')[0]; // Extract YYYY-MM-DD from ISO timestamp
      
      // Create synthetic tour request from venue offer
      const syntheticRequest: TourRequest = {
        id: `venue-offer-${offer.id}`, // Prefix to distinguish synthetic requests
        artistId: offer.artistId,
        artistName: offer.artistName || offer.artist?.name || 'Unknown Artist',
        title: offer.title,
        description: offer.description || `Offer from ${offer.venueName}`,
        startDate: offerDate, // 🎯 FIX: Use consistent date without timezone
        endDate: offerDate, // Single date for offers
        isSingleDate: true,
        location: offer.venue?.location ? 
          `${offer.venue.location.city}, ${offer.venue.location.stateProvince}` : 
          offer.venueName || 'Unknown Location',
        radius: 0, // Not applicable for venue offers
        flexibility: 'exact-cities' as const,
        genres: [], // Could be enhanced with venue/artist genre matching
        expectedDraw: {
          min: 0,
          max: offer.capacity || 0,
          description: `Venue capacity: ${offer.capacity || 'Unknown'}`
        },
        tourStatus: 'exploring-interest' as const,
        ageRestriction: (offer.ageRestriction as any) || 'flexible',
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
      } as TourRequest & { 
        isVenueInitiated?: boolean; 
        venueInitiatedBy?: string; 
        originalOfferId?: string; 
      };
      
      entries.push({
        type: 'tour-request',
        date: offerDate, // 🎯 FIX: Use consistent date without timezone
        data: syntheticRequest
      });
    } else {
      console.log('🚫 Filtering out venue offer with status:', status);
    }
  });
  
  // 🎯 NEW: Convert venue bids to synthetic tour requests for venue timeline view ONLY
  // 🎯 FIX: Only create synthetic venue bid requests when viewing venue pages, not when venue users view artist pages
  if (venueId && !artistId && venueBids.length > 0) {
    console.log(`🎯 Processing ${venueBids.length} venue bids for venue timeline`);
    
    // 🎯 FIX: Group bids by showRequestId to avoid creating duplicate request rows
    const uniqueRequestIds = new Set<string>();
    
    venueBids.forEach(bid => {
      const status = bid.status.toLowerCase();
      
      // Only show active bid statuses (same filtering as venue offers)
      if (!['cancelled', 'declined', 'rejected', 'expired'].includes(status)) {
        // 🎯 KEY FIX: Only create timeline entries for bids that belong to the current venue
        if (bid.venueId === venueId && !uniqueRequestIds.has(bid.showRequestId)) {
          uniqueRequestIds.add(bid.showRequestId);
          
          console.log(`🎯 Creating timeline entry for venue bid: ${bid.venueName} -> ${bid.location || 'Unknown Location'} on ${bid.proposedDate.split('T')[0]}`);
          
          const bidDate = bid.proposedDate.split('T')[0];
          
          // Create synthetic tour request from venue bid to show in venue timeline
          const syntheticBidRequest: TourRequest = {
            id: `venue-bid-${bid.id}`, // Use first bid ID for this request
            artistId: (bid as any).artistId || 'unknown', // 🎯 FIX: Use stored artist ID
            artistName: (bid as any).artistName || bid.location || 'Unknown Artist', // 🎯 FIX: Use stored artist name
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
            ageRestriction: 'all-ages' as const,
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
          } as TourRequest & { 
            isVenueBid: boolean; 
            originalBidId: string; 
            originalShowRequestId: string;
            bidStatus: string; 
            bidAmount?: number;
          };
          
          entries.push({
            type: 'tour-request',
            date: bidDate,
            data: syntheticBidRequest
          });
        }
      }
    });
  }
  
  if (artistId) {
    // Add regular artist-initiated tour requests
    tourRequests.forEach(request => {
      if (request.status === 'active') {
        entries.push({
          type: 'tour-request',
          date: request.startDate,
          endDate: request.endDate,
          data: request
        });
      }
    });
  }
  
  // 🎯 NEW: Also add tourRequests to venue timelines (for venue-specific artist requests)
  if (venueId && !artistId) {
    // Add tour requests that are specifically targeted at this venue
    tourRequests.forEach(request => {
      if (request.status === 'active') {
        console.log(`🎯 Adding venue-specific request to timeline: ${request.artistName} -> ${request.title} on ${request.startDate}`);
        entries.push({
          type: 'tour-request',
          date: request.startDate,
          endDate: request.endDate,
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
 * Generates appropriate default active month tab
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
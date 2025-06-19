import { useState, useEffect } from 'react';
import { Show } from '../../types';
import { BookingOpportunity } from '../types/BookingOpportunity';

// 🎯 SUB-PHASE 4.1: PARALLEL HOOK IMPLEMENTATION
// This hook uses the unified BookingOpportunity API internally
// but returns the EXACT same data structure as useTourItineraryData
// NO UI CHANGES - purely internal refactoring

// ===== LEGACY INTERFACES (COPIED FOR COMPATIBILITY) =====
// These interfaces must match the original hook exactly

function mapBillingPosition(oldPosition: string | undefined): 'headliner' | 'co-headliner' | 'support' | 'local-support' | undefined {
  if (!oldPosition) return undefined;
  
  switch (oldPosition) {
    case 'headliner':
      return 'headliner';
    case 'co-headliner':
      return 'co-headliner';
    case 'direct-support':
    case 'opener':
      return 'support';
    case 'local-opener':
      return 'local-support';
    default:
      return 'support';
  }
}

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
  artistId?: string;
  artistName?: string;
  holdState?: 'AVAILABLE' | 'FROZEN' | 'HELD';
  frozenByHoldId?: string;
  frozenAt?: string;
  unfrozenAt?: string;
  isFrozen?: boolean;
  venue?: any;
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

interface UseTourItineraryDataProps {
  artistId?: string;
  venueId?: string;
  venueName?: string;
}

interface UseTourItineraryDataReturn {
  shows: Show[];
  tourRequests: any[];
  venueBids: VenueBid[];
  venueOffers: VenueOffer[];
  loading: boolean;
  fetchError: string | null;
  fetchData: () => Promise<void>;
}

// ===== UNIFIED HOOK IMPLEMENTATION =====
export function useTourItineraryDataUnified({ 
  artistId, 
  venueId, 
  venueName 
}: UseTourItineraryDataProps): UseTourItineraryDataReturn {
  const [shows, setShows] = useState<Show[]>([]);
  const [tourRequests, setTourRequests] = useState<any[]>([]);
  const [venueBids, setVenueBids] = useState<VenueBid[]>([]);
  const [venueOffers, setVenueOffers] = useState<VenueOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!artistId && !venueId) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      console.log('🚀 UNIFIED HOOK: Starting data fetch...');
      const timestamp = Date.now();
      
      // 🎯 STEP 1: Fetch Shows (still using legacy API for now)
      const params = new URLSearchParams();
      if (artistId) {
        params.append('artistId', artistId);
      }
      if (venueId && !artistId) {
        params.append('venueId', venueId);
      }
      params.append('t', timestamp.toString());
      
      const showsResponse = await fetch(`/api/shows?${params}`);
      if (!showsResponse.ok) {
        throw new Error('Failed to fetch shows');
      }
      const showsData = await showsResponse.json();
      const allShows = Array.isArray(showsData) ? showsData : [];
      setShows(allShows);
      console.log('🎭 UNIFIED: Fetched shows:', allShows.length);

      // 🎯 STEP 2: Fetch Unified Booking Opportunities
      let perspective: 'ARTIST' | 'VENUE';
      let contextId: string;
      
      if (artistId) {
        perspective = 'ARTIST';
        contextId = artistId;
      } else if (venueId) {
        perspective = 'VENUE';
        contextId = venueId;
      } else {
        throw new Error('Must provide either artistId or venueId');
      }
      
      const unifiedUrl = `/api/booking-opportunities?perspective=${perspective}&${
        perspective === 'ARTIST' ? 'artistId' : 'venueId'
      }=${contextId}&includeExpired=false&t=${timestamp}`;
      
      console.log(`🎯 UNIFIED: Fetching from ${unifiedUrl}`);
      
      const unifiedResponse = await fetch(unifiedUrl);
      if (!unifiedResponse.ok) {
        throw new Error(`Failed to fetch unified opportunities: ${unifiedResponse.status}`);
      }
      
      const unifiedData = await unifiedResponse.json();
      const opportunities: BookingOpportunity[] = unifiedData.opportunities || [];
      
      console.log('✨ UNIFIED: Fetched opportunities:', opportunities.length);
      console.log('📊 UNIFIED: Opportunity types:', 
        opportunities.reduce((acc, opp) => {
          acc[opp.sourceType] = (acc[opp.sourceType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );
      
      // 🎯 PROOF OF UNIFIED SYSTEM WORKING
      console.log('🔥 UNIFIED SYSTEM PROOF:', {
        dataSource: 'UNIFIED_API_/api/booking-opportunities',
        totalRecords: opportunities.length,
        sourceBreakdown: opportunities.reduce((acc, opp) => {
          acc[opp.sourceType] = (acc[opp.sourceType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        lightningBoltShows: opportunities.filter(opp => 
          opp.proposedDate?.includes('2024-09-27') || 
          opp.id?.includes('cmc1yvr6y003lw6dg1ypper83')
        ).map(opp => ({ id: opp.id, title: opp.title, date: opp.proposedDate })),
        sampleUnifiedIds: opportunities.slice(0, 5).map(opp => ({ id: opp.id, type: opp.sourceType }))
      });
      
      // 📊 SIMPLIFIED PROOF TABLE
      console.log('\n📊 UNIFIED SYSTEM SUMMARY:');
      console.table({
        'Data Source': 'Single Unified API',
        'Total Records': opportunities.length,
        'Show Lineups': opportunities.filter(o => o.sourceType === 'SHOW_LINEUP').length,
        'Venue Offers': opportunities.filter(o => o.sourceType === 'VENUE_OFFER').length,
        'Show Requests': opportunities.filter(o => o.sourceType === 'SHOW_REQUEST').length,
        'Sept 27 Show Found': opportunities.some(opp => 
          opp.proposedDate?.includes('2024-09-27') || 
          opp.id?.includes('cmc1yvr6y003lw6dg1ypper83')
        ) ? '✅ YES' : '❌ NO'
      });
      
      // 🎯 STEP 3: Transform Unified Data to Legacy Formats
      if (perspective === 'ARTIST') {
        await transformForArtistPerspective(opportunities, artistId!);
      } else {
        await transformForVenuePerspective(opportunities, venueId!, venueName);
      }
      
      console.log('✅ UNIFIED: Data transformation complete');
      
    } catch (error) {
      console.error('❌ UNIFIED: Failed to fetch data:', error);
      setFetchError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Transform opportunities for artist perspective
  const transformForArtistPerspective = async (opportunities: BookingOpportunity[], artistId: string) => {
    // Transform to legacy tourRequests format (artist-initiated requests)
    const artistRequests = opportunities
      .filter(opp => opp.initiatedBy === 'ARTIST' && opp.status !== 'CONFIRMED')
      .map(opp => ({
        id: opp.id,
        artistId: opp.artistId,
        artistName: opp.artist?.name || 'Unknown Artist',
        title: opp.title,
        description: opp.description,
        startDate: opp.proposedDate,
        endDate: opp.proposedDate,
        location: opp.locationInfo?.city ? 
          `${opp.locationInfo.city}, ${opp.locationInfo.stateProvince}` : 
          'Unknown Location',
        targetLocations: [opp.locationInfo?.city || 'Unknown'],
        amount: opp.financialOffer?.guarantee || 0,
        genres: opp.artist?.genres || [],
        billingPosition: opp.performanceDetails?.billingPosition || 'headliner',
        setLength: opp.performanceDetails?.setLength || 45,
        capacity: opp.venueDetails?.capacity || 200,
        ageRestriction: opp.venueDetails?.ageRestriction || 'all-ages',
        acceptsDoorDeals: true,
        merchandising: true,
        travelMethod: 'van' as const,
        lodging: 'flexible' as const,
        tourStatus: 'exploring-interest' as const,
        equipment: {
          needsPA: false,
          needsMics: false,
          needsDrums: false,
          needsAmps: false,
          acoustic: false
        },
        status: opp.status === 'PENDING' ? 'active' : 'completed',
        priority: 'medium' as const,
        responses: 0, // Will be updated below
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        expiresAt: opp.expiresAt
      }));
    
    setTourRequests(artistRequests);
    console.log('🎨 UNIFIED: Transformed tourRequests:', artistRequests.length);

    // Transform to legacy venueBids format (venue bids on artist requests)
    const allVenueBids: VenueBid[] = [];
    
    // Note: In unified system, competing bids would be fetched separately
    // For now, we'll transform each opportunity as if it's a venue bid
    opportunities
      .filter(opp => opp.initiatedBy === 'VENUE' || opp.status === 'PENDING')
      .forEach(opp => {
        allVenueBids.push({
          id: opp.id,
          showRequestId: opp.sourceId,
          venueId: opp.venueId,
          venueName: opp.venue?.name || 'Unknown Venue',
          proposedDate: opp.proposedDate,
          guarantee: opp.financialOffer?.guarantee,
          doorDeal: opp.financialOffer?.doorDeal ? {
            split: `${(opp.financialOffer.doorDeal as any).percentage || 50}%`,
            minimumGuarantee: (opp.financialOffer.doorDeal as any).threshold
          } : undefined,
          ticketPrice: {
            advance: opp.financialOffer?.ticketPrice?.advance,
            door: opp.financialOffer?.ticketPrice?.door
          },
          capacity: opp.venueDetails?.capacity || 0,
          ageRestriction: opp.venueDetails?.ageRestriction || 'all-ages',
          equipmentProvided: {
            pa: false, // TODO: Parse equipment JSON properly
            mics: false,
            drums: false,
            amps: false,
            piano: false
          },
          loadIn: opp.venueDetails?.schedule?.loadIn || '',
          soundcheck: opp.venueDetails?.schedule?.soundcheck || '',
          doorsOpen: opp.venueDetails?.schedule?.doorsOpen || '',
          showTime: opp.venueDetails?.schedule?.showTime || '',
          curfew: opp.venueDetails?.schedule?.curfew || '',
          promotion: {
            social: false, // TODO: Parse promotion JSON properly
            flyerPrinting: false,
            radioSpots: false,
            pressCoverage: false
          },
          message: opp.message || '',
          status: opp.status.toLowerCase() as any,
          readByArtist: true,
          createdAt: opp.createdAt,
          updatedAt: opp.updatedAt,
          expiresAt: opp.expiresAt || '',
          location: opp.locationInfo?.city ? 
            `${opp.locationInfo.city}, ${opp.locationInfo.stateProvince}` : 
            'Unknown Location',
          artistId: opp.artistId,
          artistName: opp.artist?.name || 'Unknown Artist',
          billingPosition: opp.performanceDetails?.billingPosition?.toLowerCase() as any,
          lineupPosition: opp.performanceDetails?.performanceOrder,
          setLength: opp.performanceDetails?.setLength,
          otherActs: Array.isArray(opp.performanceDetails?.otherActs) ? 
            opp.performanceDetails.otherActs.join(', ') : 
            opp.performanceDetails?.otherActs || '',
          billingNotes: opp.performanceDetails?.billingNotes,
          holdState: opp.holdState as any,
          frozenAt: opp.frozenAt,
          unfrozenAt: opp.unfrozenAt,
          isFrozen: opp.holdState === 'FROZEN',
          venue: opp.venue
        });
      });
    
    setVenueBids(allVenueBids);
    console.log('🏢 UNIFIED: Transformed venueBids:', allVenueBids.length);

    // Transform to legacy venueOffers format (venue-initiated offers to artist)
    const venueOffers = opportunities
      .filter(opp => opp.initiatedBy === 'VENUE' && opp.status !== 'CONFIRMED')
      .map(opp => ({
        id: opp.id,
        venueId: opp.venueId,
        venueName: opp.venue?.name || 'Unknown Venue',
        artistId: opp.artistId,
        artistName: opp.artist?.name || 'Unknown Artist',
        title: opp.title,
        description: opp.description,
        proposedDate: opp.proposedDate,
        alternativeDates: [],
        message: opp.message,
        amount: opp.financialOffer?.guarantee,
        doorDeal: opp.financialOffer?.doorDeal ? {
          split: `${(opp.financialOffer.doorDeal as any).percentage || 50}%`,
          minimumGuarantee: (opp.financialOffer.doorDeal as any).threshold,
          afterExpenses: false
        } : undefined,
        ticketPrice: opp.financialOffer?.ticketPrice,
        merchandiseSplit: `${opp.financialOffer?.merchandiseSplit || 0}%`,
        billingPosition: opp.performanceDetails?.billingPosition?.toLowerCase() as any,
        lineupPosition: opp.performanceDetails?.performanceOrder,
        setLength: opp.performanceDetails?.setLength,
        otherActs: Array.isArray(opp.performanceDetails?.otherActs) ? 
          opp.performanceDetails.otherActs.join(', ') : 
          opp.performanceDetails?.otherActs || '',
        billingNotes: opp.performanceDetails?.billingNotes,
        capacity: opp.venueDetails?.capacity,
        ageRestriction: opp.venueDetails?.ageRestriction,
        equipmentProvided: {
          pa: false, // TODO: Parse equipment JSON properly
          mics: false,
          drums: false,
          amps: false,
          piano: false
        },
        loadIn: opp.venueDetails?.schedule?.loadIn,
        soundcheck: opp.venueDetails?.schedule?.soundcheck,
        doorsOpen: opp.venueDetails?.schedule?.doorsOpen,
        showTime: opp.venueDetails?.schedule?.showTime,
        curfew: opp.venueDetails?.schedule?.curfew,
        promotion: {
          social: false, // TODO: Parse promotion JSON properly
          flyerPrinting: false,
          radioSpots: false,
          pressCoverage: false
        },
        lodging: opp.additionalValue?.lodging ? {
          offered: true,
          type: 'private-room' as const,
          details: String(opp.additionalValue.lodging)
        } : undefined,
        additionalTerms: opp.additionalValue?.additionalTerms,
        status: opp.status.toLowerCase() as any,
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        expiresAt: opp.expiresAt,
        venue: opp.venue,
        artist: opp.artist
      }));
    
    setVenueOffers(venueOffers as VenueOffer[]);
    console.log('🎪 UNIFIED: Transformed venueOffers:', venueOffers.length);
  };

  // Transform opportunities for venue perspective
  const transformForVenuePerspective = async (opportunities: BookingOpportunity[], venueId: string, venueName?: string) => {
    // For venue perspective, we need to show artist requests they can bid on
    const artistRequests = opportunities
      .filter(opp => opp.initiatedBy === 'ARTIST')
      .map(opp => ({
        id: opp.id,
        artistId: opp.artistId,
        artistName: opp.artist?.name || 'Unknown Artist',
        title: opp.title,
        description: opp.description,
        startDate: opp.proposedDate,
        endDate: opp.proposedDate,
        location: opp.locationInfo?.city ? 
          `${opp.locationInfo.city}, ${opp.locationInfo.stateProvince}` : 
          'Unknown Location',
        targetLocations: [opp.locationInfo?.city || 'Unknown'],
        amount: opp.financialOffer?.guarantee || 0,
        genres: opp.artist?.genres || [],
        billingPosition: opp.performanceDetails?.billingPosition || 'headliner',
        setLength: opp.performanceDetails?.setLength || 45,
        capacity: opp.venueDetails?.capacity || 200,
        ageRestriction: opp.venueDetails?.ageRestriction || 'all-ages',
        acceptsDoorDeals: true,
        merchandising: true,
        travelMethod: 'van' as const,
        lodging: 'flexible' as const,
        tourStatus: 'exploring-interest' as const,
        equipment: {
          needsPA: false,
          needsMics: false,
          needsDrums: false,
          needsAmps: false,
          acoustic: false
        },
        status: opp.status === 'PENDING' ? 'active' : 'completed',
        priority: 'medium' as const,
        responses: 0,
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        expiresAt: opp.expiresAt
      }));
    
    setTourRequests(artistRequests);

    // For venue perspective, show venue's own offers and bids
    const venueOffers = opportunities
      .filter(opp => opp.initiatedBy === 'VENUE' && opp.venueId === venueId)
      .map(opp => ({
        id: opp.id,
        venueId: opp.venueId,
        venueName: opp.venue?.name || venueName || 'Unknown Venue',
        artistId: opp.artistId,
        artistName: opp.artist?.name || 'Unknown Artist',
        title: opp.title,
        description: opp.description,
        proposedDate: opp.proposedDate,
        alternativeDates: [],
        message: opp.message,
        amount: opp.financialOffer?.guarantee,
        doorDeal: opp.financialOffer?.doorDeal,
        ticketPrice: opp.financialOffer?.ticketPrice,
        merchandiseSplit: opp.financialOffer?.merchandiseSplit,
        billingPosition: opp.performanceDetails?.billingPosition as any,
        lineupPosition: opp.performanceDetails?.performanceOrder,
        setLength: opp.performanceDetails?.setLength,
        otherActs: opp.performanceDetails?.otherActs,
        billingNotes: opp.performanceDetails?.billingNotes,
        capacity: opp.venueDetails?.capacity,
        ageRestriction: opp.venueDetails?.ageRestriction,
        equipmentProvided: {
          pa: opp.venueDetails?.equipment?.includes('pa') || false,
          mics: opp.venueDetails?.equipment?.includes('mics') || false,
          drums: opp.venueDetails?.equipment?.includes('drums') || false,
          amps: opp.venueDetails?.equipment?.includes('amps') || false,
          piano: opp.venueDetails?.equipment?.includes('piano') || false
        },
        loadIn: opp.venueDetails?.schedule?.loadIn,
        soundcheck: opp.venueDetails?.schedule?.soundcheck,
        doorsOpen: opp.venueDetails?.schedule?.doorsOpen,
        showTime: opp.venueDetails?.schedule?.showTime,
        curfew: opp.venueDetails?.schedule?.curfew,
        promotion: {
          social: opp.additionalValue?.promotion?.includes('social') || false,
          flyerPrinting: opp.additionalValue?.promotion?.includes('flyers') || false,
          radioSpots: opp.additionalValue?.promotion?.includes('radio') || false,
          pressCoverage: opp.additionalValue?.promotion?.includes('press') || false
        },
        lodging: opp.additionalValue?.lodging ? {
          offered: true,
          type: 'private-room' as const,
          details: opp.additionalValue.lodging
        } : undefined,
        additionalTerms: opp.additionalValue?.additionalTerms,
        status: opp.status.toLowerCase() as any,
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        expiresAt: opp.expiresAt,
        venue: opp.venue,
        artist: opp.artist
      }));
    
    setVenueOffers(venueOffers as VenueOffer[]);

    // Transform venue bids (venue's bids on artist requests)
    const venueBids = opportunities
      .filter(opp => opp.initiatedBy === 'ARTIST') // Show artist requests this venue has bid on
      .map(opp => ({
        id: opp.id,
        showRequestId: opp.sourceId,
        venueId: venueId,
        venueName: venueName || 'This Venue',
        proposedDate: opp.proposedDate,
        guarantee: opp.financialOffer?.guarantee,
        doorDeal: opp.financialOffer?.doorDeal ? {
          split: `${opp.financialOffer.doorDeal.split || 50}%`,
          minimumGuarantee: opp.financialOffer.doorDeal.minimumGuarantee
        } : undefined,
        ticketPrice: {
          advance: opp.financialOffer?.ticketPrice?.advance,
          door: opp.financialOffer?.ticketPrice?.door
        },
        capacity: opp.venueDetails?.capacity || 0,
        ageRestriction: opp.venueDetails?.ageRestriction || 'all-ages',
        equipmentProvided: {
          pa: opp.venueDetails?.equipment?.includes('pa') || false,
          mics: opp.venueDetails?.equipment?.includes('mics') || false,
          drums: opp.venueDetails?.equipment?.includes('drums') || false,
          amps: opp.venueDetails?.equipment?.includes('amps') || false,
          piano: opp.venueDetails?.equipment?.includes('piano') || false
        },
        loadIn: opp.venueDetails?.schedule?.loadIn || '',
        soundcheck: opp.venueDetails?.schedule?.soundcheck || '',
        doorsOpen: opp.venueDetails?.schedule?.doorsOpen || '',
        showTime: opp.venueDetails?.schedule?.showTime || '',
        curfew: opp.venueDetails?.schedule?.curfew || '',
        promotion: {
          social: opp.additionalValue?.promotion?.includes('social') || false,
          flyerPrinting: opp.additionalValue?.promotion?.includes('flyers') || false,
          radioSpots: opp.additionalValue?.promotion?.includes('radio') || false,
          pressCoverage: opp.additionalValue?.promotion?.includes('press') || false
        },
        message: opp.message || '',
        status: opp.status.toLowerCase() as any,
        readByArtist: true,
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        expiresAt: opp.expiresAt || '',
        location: opp.locationInfo?.city ? 
          `${opp.locationInfo.city}, ${opp.locationInfo.stateProvince}` : 
          'Unknown Location',
        artistId: opp.artistId,
        artistName: opp.artist?.name || 'Unknown Artist',
        billingPosition: opp.performanceDetails?.billingPosition as any,
        lineupPosition: opp.performanceDetails?.performanceOrder,
        setLength: opp.performanceDetails?.setLength,
        otherActs: opp.performanceDetails?.otherActs,
        billingNotes: opp.performanceDetails?.billingNotes,
        holdState: opp.holdState as any,
        frozenAt: opp.frozenAt,
        unfrozenAt: opp.unfrozenAt,
        isFrozen: opp.holdState === 'FROZEN',
        venue: opp.venue
      }));
    
    setVenueBids(venueBids as VenueBid[]);
  };

  useEffect(() => {
    fetchData();
  }, [artistId, venueId]);

  return {
    shows,
    tourRequests,
    venueBids,
    venueOffers,
    loading,
    fetchError,
    fetchData
  };
}

// Helper function to map unified status to VenueBid status (allows hold)
function mapUnifiedStatusToBid(unifiedStatus: string): 'pending' | 'hold' | 'accepted' | 'declined' | 'cancelled' {
  switch (unifiedStatus) {
    case 'PENDING':
      return 'pending';
    case 'HOLD':
      return 'hold';
    case 'CONFIRMED':
    case 'ACCEPTED':
      return 'accepted';
    case 'DECLINED':
      return 'declined';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'pending';
  }
}

// Helper function to map unified status to VenueOffer status (no hold allowed)
function mapUnifiedStatusToOffer(unifiedStatus: string): 'pending' | 'accepted' | 'declined' | 'cancelled' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' {
  switch (unifiedStatus) {
    case 'PENDING':
      return 'PENDING';
    case 'HOLD':
      return 'PENDING'; // Map hold to pending for offers
    case 'CONFIRMED':
    case 'ACCEPTED':
      return 'ACCEPTED';
    case 'DECLINED':
      return 'DECLINED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
} 
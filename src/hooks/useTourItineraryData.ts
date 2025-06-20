import { useState, useEffect } from 'react';
import { Show, VenueBid, VenueOffer } from '../../types'; // 🎯 PHASE 1: Use unified types

// 🎵 Helper function to map old billing positions to new simplified system
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
      return 'support'; // Default fallback for unknown values
  }
}

// 🎯 PHASE 1: Removed duplicate VenueBid interface - now using unified type from main types.ts

// 🎯 PHASE 1: Removed duplicate VenueOffer interface - now using unified type from main types.ts

interface UseTourItineraryDataProps {
  artistId?: string;
  venueId?: string;
  venueName?: string;
}

interface UseTourItineraryDataReturn {
  shows: Show[];
  tourRequests: any[]; // 🎯 PHASE 3: Now returns ShowRequest[] instead of TourRequest[]
  venueBids: VenueBid[];
  venueOffers: VenueOffer[];
  loading: boolean;
  fetchError: string | null;
  fetchData: () => Promise<void>;
}

export function useTourItineraryData({ 
  artistId, 
  venueId, 
  venueName 
}: UseTourItineraryDataProps): UseTourItineraryDataReturn {
  const [shows, setShows] = useState<Show[]>([]);
  const [tourRequests, setTourRequests] = useState<any[]>([]); // 🎯 PHASE 4: Updated to any for ShowRequest
  const [venueBids, setVenueBids] = useState<VenueBid[]>([]);
  const [venueOffers, setVenueOffers] = useState<VenueOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!artistId && !venueId) return;
    
    setLoading(true);
    try {
      // Add cache-busting timestamp to prevent stale data during development
      const timestamp = Date.now();
      
      // Fetch shows
      const params = new URLSearchParams();
      if (artistId) {
        params.append('artistId', artistId);
      }
      if (venueId && !artistId) {
        // Only add venueId for shows if we're not viewing an artist page
        params.append('venueId', venueId);
      }
      params.append('t', timestamp.toString()); // Cache-busting parameter
      
      const showsResponse = await fetch(`/api/shows?${params}`);
      if (!showsResponse.ok) {
        throw new Error('Failed to fetch shows');
      }
      const showsData = await showsResponse.json();
      let allShows = Array.isArray(showsData) ? showsData : [];

      // 🧹 CLEANUP: Removed lineup bid fetching - unified offer system handles all invitations

      setShows(allShows);

      // 🎯 NEW UNIFIED API: Fetch show requests (replaces both tour-requests and venue-offers)
      if (artistId) {
        // 🎯 PRIMARY CASE: Viewing artist page (possibly by venue user)
        // Always fetch the artist's requests + bids on them
        const showRequestsResponse = await fetch(`/api/show-requests?artistId=${artistId}&t=${timestamp}`);
        if (showRequestsResponse.ok) {
          const showRequestsData = await showRequestsResponse.json();
          console.log('🎯 Fetched show requests for artist:', showRequestsData.length);
          
          // 🎯 PHASE 3: Return ShowRequests directly instead of converting to legacy format
          const artistInitiatedRequests = showRequestsData
            .filter((req: any) => req.initiatedBy === 'ARTIST')
            .filter((req: any) => req.status !== 'CONFIRMED'); // Hide CONFIRMED requests - they become Shows
          
          setTourRequests(artistInitiatedRequests);

          // Convert ShowRequestBids to legacy VenueBid format
          const allBids: VenueBid[] = [];
          showRequestsData.forEach((req: any) => {
            if (req.bids) {
              req.bids.forEach((bid: any) => {
                // 🎯 FIX: Only skip bids if they have no venueId at all
                if (!bid.venueId) {
                  console.log('🚫 Skipping bid with missing venueId:', bid.id);
                  return;
                }
                
                // 🎯 FIX: Handle venue names more gracefully for competitive bidding display
                let displayVenueName = 'Unknown Venue';
                if (bid.venue?.name) {
                  displayVenueName = bid.venue.name;
                } else if (bid.venueId === venueId && venueName) {
                  // If this is the current venue's bid and we have the venue name
                  displayVenueName = venueName;
                } else if (bid.venueId) {
                  // For other venues, show partial ID if name not available
                  displayVenueName = `Venue ${bid.venueId.slice(-6)}`;
                }
                
                allBids.push({
                  id: bid.id,
                  showRequestId: req.id,
                  venueId: bid.venueId,
                  venueName: displayVenueName,
                  proposedDate: bid.proposedDate || req.requestedDate,
                  guarantee: bid.amount,
                  doorDeal: bid.doorDeal,
                  ticketPrice: {},
                  capacity: bid.venue?.capacity || 0,
                  ageRestriction: 'all-ages',
                  equipmentProvided: {
                    pa: false,
                    mics: false,
                    drums: false,
                    amps: false,
                    piano: false
                  },
                  loadIn: '',
                  soundcheck: '',
                  doorsOpen: '',
                  showTime: '',
                  curfew: '',
                  promotion: {
                    social: false,
                    flyerPrinting: false,
                    radioSpots: false,
                    pressCoverage: false
                  },
                  message: bid.message || '',
                  status: bid.status.toLowerCase() as any,
                  readByArtist: true,
                  createdAt: bid.createdAt,
                  updatedAt: bid.updatedAt,
                  expiresAt: '',
                  location: bid.venue?.location ? 
                    `${bid.venue.location.city}, ${bid.venue.location.stateProvince}` : 
                    'Unknown Location',
                  // 🎯 NEW: Store actual artist information for proper display
                  artistId: req.artistId,
                  artistName: req.artist?.name || 'Unknown Artist',
                  billingPosition: bid.billingPosition,
                  lineupPosition: bid.lineupPosition,
                  setLength: bid.setLength,
                  otherActs: bid.otherActs,
                  billingNotes: bid.billingNotes,
                  // 🔒 CRITICAL: Include hold state fields for frozen state functionality
                  holdState: bid.holdState as 'AVAILABLE' | 'FROZEN' | 'HELD' | undefined,
                  frozenByHoldId: bid.frozenByHoldId,
                  frozenAt: bid.frozenAt,
                  unfrozenAt: bid.unfrozenAt,
                  isFrozen: bid.holdState === 'FROZEN',
                  venue: bid.venue // Include venue object for proper name display
                } as VenueBid & { artistId?: string; artistName?: string });
              });
            }
          });
          setVenueBids(allBids);

          // Convert venue-initiated ShowRequests to legacy VenueOffer format  
          const legacyVenueOffers: VenueOffer[] = showRequestsData
            .filter((req: any) => req.initiatedBy === 'VENUE')
            .filter((req: any) => req.status !== 'CONFIRMED') // 🎯 Hide CONFIRMED offers - they become Shows
            .map((req: any) => ({
              id: req.id,
              venueId: req.venue?.id || req.venueId || 'unknown',
              venueName: req.venue?.name || 'Unknown Venue',
              artistId: req.artistId,
              artistName: req.artist?.name || 'Unknown Artist',
              createdById: req.createdBy || 'unknown', // 🎯 PHASE 1: Add required field
              title: req.title,
              description: req.description,
              proposedDate: req.requestedDate,
              alternativeDates: [],
              message: req.message,
              amount: req.amount,
              doorDeal: req.doorDeal,
              ticketPrice: req.ticketPrice,
              merchandiseSplit: req.merchandiseSplit,
              billingPosition: req.billingPosition as any,
              lineupPosition: req.lineupPosition,
              setLength: req.setLength,
              otherActs: req.otherActs,
              billingNotes: req.billingNotes,
              capacity: req.capacity,
              ageRestriction: req.ageRestriction,
              equipmentProvided: req.equipmentProvided,
              loadIn: req.loadIn,
              soundcheck: req.soundcheck,
              doorsOpen: req.doorsOpen,
              showTime: req.showTime,
              curfew: req.curfew,
              promotion: req.promotion,
              lodging: req.lodging,
              additionalTerms: req.additionalTerms,
              status: req.status === 'OPEN' ? 'pending' : 
                     req.status === 'CONFIRMED' ? 'accepted' :
                     req.status === 'DECLINED' ? 'declined' :
                     req.status === 'CANCELLED' ? 'cancelled' : 'pending',
              createdAt: req.createdAt,
              updatedAt: req.updatedAt,
              expiresAt: req.expiresAt,
              venue: req.venue,
              artist: req.artist
            }));
          
          setVenueOffers(legacyVenueOffers);
          
          // 🎯 FALLBACK: Also fetch from old VenueOffer table for support acts and other offers not yet migrated
          const oldVenueOffersResponse = await fetch(`/api/artists/${artistId}/offers?t=${timestamp}`);
          if (oldVenueOffersResponse.ok) {
            const oldVenueOffersData = await oldVenueOffersResponse.json();
            console.log('🎯 Fetched old venue offers for artist:', oldVenueOffersData.length);
            
            // Convert old venue offers to legacy format and merge with existing
            const oldLegacyVenueOffers: VenueOffer[] = oldVenueOffersData.map((offer: any) => ({
              id: offer.id,
              venueId: offer.venueId,
              venueName: offer.venueName || offer.venue?.name || 'Unknown Venue',
              artistId: offer.artistId,
              artistName: offer.artistName || offer.artist?.name || 'Unknown Artist',
              title: offer.title,
              description: offer.description,
              proposedDate: offer.proposedDate,
              alternativeDates: offer.alternativeDates || [],
              message: offer.message,
              amount: offer.amount,
              doorDeal: offer.doorDeal,
              ticketPrice: offer.ticketPrice,
              merchandiseSplit: offer.merchandiseSplit,
              billingPosition: offer.billingPosition,
              lineupPosition: offer.lineupPosition,
              setLength: offer.setLength,
              otherActs: offer.otherActs,
              billingNotes: offer.billingNotes,
              capacity: offer.capacity,
              ageRestriction: offer.ageRestriction,
              equipmentProvided: offer.equipmentProvided,
              loadIn: offer.loadIn,
              soundcheck: offer.soundcheck,
              doorsOpen: offer.doorsOpen,
              showTime: offer.showTime,
              curfew: offer.curfew,
              promotion: offer.promotion,
              lodging: offer.lodging,
              additionalTerms: offer.additionalTerms,
              status: offer.status.toLowerCase(),
              createdAt: offer.createdAt,
              updatedAt: offer.updatedAt,
              expiresAt: offer.expiresAt,
              venue: offer.venue,
              artist: offer.artist
            }));
            
            // Merge old and new venue offers, avoiding duplicates
            const allVenueOffers = [...legacyVenueOffers];
            oldLegacyVenueOffers.forEach(oldOffer => {
              // ✅ IMPROVED: More robust deduplication logic
              const existsInNew = legacyVenueOffers.some(newOffer => 
                // Primary match: same IDs
                (newOffer.id === oldOffer.id) ||
                // Secondary match: same core booking details
                (newOffer.venueId === oldOffer.venueId && 
                 newOffer.artistId === oldOffer.artistId &&
                 Math.abs(new Date(newOffer.proposedDate).getTime() - new Date(oldOffer.proposedDate).getTime()) < 24 * 60 * 60 * 1000 && // Same day
                 newOffer.title === oldOffer.title)
              );
              
              if (!existsInNew) {
                allVenueOffers.push(oldOffer);
              } else {
                console.log(`🔍 Skipping duplicate offer: ${oldOffer.title} (found in both systems)`);
              }
            });
            
            console.log(`🎯 Merged venue offers: ${legacyVenueOffers.length} from new system + ${oldLegacyVenueOffers.filter(oldOffer => 
              !legacyVenueOffers.some(newOffer => 
                (newOffer.id === oldOffer.id) ||
                (newOffer.venueId === oldOffer.venueId && 
                 newOffer.artistId === oldOffer.artistId &&
                 Math.abs(new Date(newOffer.proposedDate).getTime() - new Date(oldOffer.proposedDate).getTime()) < 24 * 60 * 60 * 1000 &&
                 newOffer.title === oldOffer.title)
              )
            ).length} unique from old system = ${allVenueOffers.length} total`);
            setVenueOffers(allVenueOffers);
          }
        }
      } else if (venueId) {
        // 🎯 SECONDARY CASE: Viewing venue page (venue-only, no artist specified)
        // Get BOTH venue-initiated requests AND artist requests they've bid on
        const venueInitiatedResponse = await fetch(`/api/show-requests?venueId=${venueId}&t=${timestamp}`);
        const allArtistRequestsResponse = await fetch(`/api/show-requests?initiatedBy=ARTIST&t=${timestamp}`);
        
        if (venueInitiatedResponse.ok && allArtistRequestsResponse.ok) {
          const venueInitiatedData = await venueInitiatedResponse.json();
          const allArtistRequestsData = await allArtistRequestsResponse.json();
          
          // 🎯 LAYER 1 FIX: Show ALL artist requests where this venue has bids
          // Filter to only show requests where the venue has actually placed bids
          const availableArtistRequests = allArtistRequestsData.filter((req: any) => {
            if (req.initiatedBy !== 'ARTIST') return false;
            
            // Check if this venue has any bids on this request
            const hasVenueBid = req.bids && req.bids.some((bid: any) => bid.venueId === venueId);
            return hasVenueBid;
          });
          
          const combinedShowRequestsData = [...venueInitiatedData, ...availableArtistRequests];
          
          // Debug logging for venue filtering logic
          
          // 🎯 DEBUG: Log all venue-initiated data
          console.log('🔍 Debug: All venueInitiatedData:', venueInitiatedData.map((req: any) => ({
            id: req.id,
            title: req.title,
            initiatedBy: req.initiatedBy,
            venueId: req.venueId,
            artistName: req.artist?.name
          })));
          
          // 🎯 FIXED: Show ALL artist requests that venues can engage with
          // This includes both venue-specific requests AND general location-based requests
          const allRelevantArtistRequests = [
            // Direct venue-specific requests (artist → specific venue)
            ...venueInitiatedData.filter((req: any) => 
              req.initiatedBy === 'ARTIST' && req.venueId === venueId
            ),
            // General artist requests that venues can bid on (artist → location)
            ...availableArtistRequests
          ];
          

          
          // Convert all relevant artist requests to legacy TourRequest format
          const legacyTourRequests: any[] = allRelevantArtistRequests.map((req: any) => ({ // 🎯 PHASE 4: Updated to any for ShowRequest
            id: req.id,
            artistId: req.artistId,
            artistName: req.artist?.name || 'Unknown Artist',
            title: req.title,
            description: req.description,
            startDate: req.requestedDate.split('T')[0],
            endDate: req.requestedDate.split('T')[0],
            isSingleDate: true,
            location: req.targetLocations?.[0]?.replace(/^venue:\d+:/, '') || req.venue?.name || venueName || 'Unknown Location',
            radius: 50,
            flexibility: 'exact-cities' as const,
            genres: req.genres || [],
            expectedDraw: { min: 0, max: 0, description: '' },
            tourStatus: 'exploring-interest' as const,
            ageRestriction: 'flexible' as const,
            equipment: {
              needsPA: false,
              needsMics: false,
              needsDrums: false,
              needsAmps: false,
              acoustic: false
            },
            acceptsDoorDeals: true,
            merchandising: true,
            travelMethod: 'van' as const,
            lodging: 'flexible' as const,
            status: req.status === 'OPEN' ? 'active' : 'completed',
            priority: 'medium' as const,
            responses: req.bids?.length || 0,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt,
            expiresAt: req.expiresAt
          }));
          
          
          setTourRequests(legacyTourRequests);
          
          // Convert to legacy formats (similar to artist logic but focused on venue perspective)
          const legacyVenueOffers: VenueOffer[] = combinedShowRequestsData
            .filter((req: any) => req.initiatedBy === 'VENUE' && req.venueId === venueId)
            .map((req: any) => ({
              id: req.id,
              venueId: req.venueId || venueId,
              venueName: req.venue?.name || venueName || 'Unknown Venue',
              artistId: req.artistId,
              artistName: req.artist?.name || 'Unknown Artist',
              title: req.title,
              description: req.description,
              proposedDate: req.requestedDate,
              alternativeDates: [],
              message: req.message,
              amount: req.amount,
              doorDeal: req.doorDeal,
              ticketPrice: req.ticketPrice,
              merchandiseSplit: req.merchandiseSplit,
              billingPosition: mapBillingPosition(req.billingPosition),
              lineupPosition: req.lineupPosition,
              setLength: req.setLength,
              otherActs: req.otherActs,
              billingNotes: req.billingNotes,
              capacity: req.capacity,
              ageRestriction: req.ageRestriction,
              equipmentProvided: req.equipmentProvided,
              loadIn: req.loadIn,
              soundcheck: req.soundcheck,
              doorsOpen: req.doorsOpen,
              showTime: req.showTime,
              curfew: req.curfew,
              promotion: req.promotion,
              lodging: req.lodging,
              additionalTerms: req.additionalTerms,
              status: req.status === 'OPEN' ? 'pending' : 
                     req.status === 'CONFIRMED' ? 'accepted' :
                     req.status === 'DECLINED' ? 'declined' :
                     req.status === 'CANCELLED' ? 'cancelled' : 'pending',
              createdAt: req.createdAt,
              updatedAt: req.updatedAt,
              expiresAt: req.expiresAt,
              venue: req.venue,
              artist: req.artist
            }));
          setVenueOffers(legacyVenueOffers);

          // Get venue's bids on artist-initiated requests (now includes ALL artist requests with venue bids)
          const venueBids: VenueBid[] = [];
          combinedShowRequestsData.forEach((req: any) => {
            if (req.initiatedBy === 'ARTIST' && req.bids) {
              // 🎯 COMPETITIVE INTELLIGENCE: Get ALL bids on requests where this venue has participated
              // Check if this venue has bid on this request
              const hasVenueBid = req.bids.some((bid: any) => bid.venueId === venueId);
              
              if (hasVenueBid) {
                // If venue has bid on this request, show ALL bids for competitive intelligence
                req.bids.forEach((bid: any) => {

                  
                  // 🎯 IMPROVED: Get venue name from multiple sources for competitive bids
                  let venueName = 'Unknown Venue';
                  if (bid.venue?.name) {
                    venueName = bid.venue.name;
                  } else if (bid.venueId === venueId) {
                    venueName = venueName || 'This Venue';
                  } else if (bid.venueId) {
                    // For competitor venues, show partial ID if name not available
                    venueName = `Venue ${bid.venueId.slice(-6)}`;
                  }
                  
                  venueBids.push({
                    id: bid.id,
                    showRequestId: req.id,
                    venueId: bid.venueId,
                    venueName: venueName,
                    proposedDate: bid.proposedDate || req.requestedDate,
                    guarantee: bid.amount,
                    doorDeal: bid.doorDeal,
                    ticketPrice: {},
                    capacity: bid.venue?.capacity || 0,
                    ageRestriction: 'all-ages',
                    equipmentProvided: {
                      pa: false,
                      mics: false,
                      drums: false,
                      amps: false,
                      piano: false
                    },
                    loadIn: '',
                    soundcheck: '',
                    doorsOpen: '',
                    showTime: '',
                    curfew: '',
                    promotion: {
                      social: false,
                      flyerPrinting: false,
                      radioSpots: false,
                      pressCoverage: false
                    },
                    message: bid.message || '',
                    status: bid.status.toLowerCase() as any,
                    readByArtist: true,
                    createdAt: bid.createdAt,
                    updatedAt: bid.updatedAt,
                    expiresAt: '',
                    location: bid.venue?.location ? 
                      `${bid.venue.location.city}, ${bid.venue.location.stateProvince}` : 
                      'Unknown Location',
                    // 🎯 NEW: Store actual artist information for proper display
                    artistId: req.artistId,
                    artistName: req.artist?.name || 'Unknown Artist',
                    billingPosition: mapBillingPosition(bid.billingPosition),
                    lineupPosition: bid.lineupPosition,
                    setLength: bid.setLength,
                    otherActs: bid.otherActs,
                    billingNotes: bid.billingNotes,
                    // 🔒 CRITICAL: Include hold state fields for frozen state functionality
                    holdState: bid.holdState as 'AVAILABLE' | 'FROZEN' | 'HELD' | undefined,
                    frozenByHoldId: bid.frozenByHoldId,
                    frozenAt: bid.frozenAt,
                    unfrozenAt: bid.unfrozenAt,
                    isFrozen: bid.holdState === 'FROZEN',
                    venue: bid.venue // Include venue object for proper name display
                  } as VenueBid & { artistId?: string; artistName?: string });
                });
              }
            }
          });
          
          console.log(`🎯 Final venue bids found: ${venueBids.length}`);
          setVenueBids(venueBids);
        }
      }

      console.log('✅ Data fetching completed with unified ShowRequest API');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setFetchError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
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
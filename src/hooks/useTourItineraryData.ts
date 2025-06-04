import { useState, useEffect } from 'react';
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

interface UseTourItineraryDataProps {
  artistId?: string;
  venueId?: string;
  venueName?: string;
}

interface UseTourItineraryDataReturn {
  shows: Show[];
  tourRequests: TourRequest[];
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
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
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
      setShows(Array.isArray(showsData) ? showsData : []);

      // 🎯 NEW UNIFIED API: Fetch show requests (replaces both tour-requests and venue-offers)
      if (artistId) {
        // 🎯 PRIMARY CASE: Viewing artist page (possibly by venue user)
        // Always fetch the artist's requests + bids on them
        const showRequestsResponse = await fetch(`/api/show-requests?artistId=${artistId}&t=${timestamp}`);
        if (showRequestsResponse.ok) {
          const showRequestsData = await showRequestsResponse.json();
          console.log('🎯 Fetched show requests for artist:', showRequestsData.length);
          
          // Convert ShowRequests back to legacy format for compatibility with existing UI
          const legacyTourRequests: TourRequest[] = showRequestsData
            .filter((req: any) => req.initiatedBy === 'ARTIST')
            .map((req: any) => {
              // 🎯 NEW: Handle venue-specific requests properly  
              // Venue-specific requests have both initiatedBy='ARTIST' AND venueId set
              let location = req.targetLocations?.[0] || 'Various Locations';
              let isVenueSpecific = false;
              let venueSpecificId = null;
              let venueSpecificName = null;
              
              // Check if this is a venue-specific request (artist-initiated + venueId set)
              if (req.initiatedBy === 'ARTIST' && req.venueId) {
                isVenueSpecific = true;
                venueSpecificId = req.venueId;
                venueSpecificName = req.venue?.name || 'Unknown Venue';
                
                // Use the venue's actual location if available from the API response
                if (req.venue?.location) {
                  location = `${req.venue.location.city}, ${req.venue.location.stateProvince}`;
                } else {
                  // Fallback to venue name if location not available
                  location = venueSpecificName;
                }
              }
              
              return {
                id: req.id,
                artistId: req.artistId,
                artistName: req.artist?.name || 'Unknown Artist',
                title: req.title,
                description: req.description,
                startDate: req.requestedDate.split('T')[0], // Convert to date string
                endDate: req.requestedDate.split('T')[0],   // Single date for show requests
                isSingleDate: true,
                location: location,
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
                expiresAt: req.expiresAt,
                // 🎯 NEW: Add venue-specific metadata for display logic
                isVenueSpecific: isVenueSpecific,
                venueSpecificId: venueSpecificId,
                venueSpecificName: venueSpecificName
              };
            });
          setTourRequests(legacyTourRequests);

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
                  billingNotes: bid.billingNotes
                } as VenueBid & { artistId?: string; artistName?: string });
              });
            }
          });
          setVenueBids(allBids);

          // Convert venue-initiated ShowRequests to legacy VenueOffer format  
          const legacyVenueOffers: VenueOffer[] = showRequestsData
            .filter((req: any) => req.initiatedBy === 'VENUE')
            .map((req: any) => ({
              id: req.id,
              venueId: req.venue?.id || req.venueId || 'unknown',
              venueName: req.venue?.name || 'Unknown Venue',
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
        }
      } else if (venueId) {
        // 🎯 SECONDARY CASE: Viewing venue page (venue-only, no artist specified)
        // Get BOTH venue-initiated requests AND artist requests they've bid on
        const venueInitiatedResponse = await fetch(`/api/show-requests?venueId=${venueId}&t=${timestamp}`);
        const allArtistRequestsResponse = await fetch(`/api/show-requests?initiatedBy=ARTIST&t=${timestamp}`);
        
        if (venueInitiatedResponse.ok && allArtistRequestsResponse.ok) {
          const venueInitiatedData = await venueInitiatedResponse.json();
          const allArtistRequestsData = await allArtistRequestsResponse.json();
          
          // Combine venue-initiated requests with artist requests that have this venue's bids
          const artistRequestsWithVenueBids = allArtistRequestsData.filter((req: any) => 
            req.bids && req.bids.some((bid: any) => bid.venueId === venueId)
          );
          
          const combinedShowRequestsData = [...venueInitiatedData, ...artistRequestsWithVenueBids];
          
          console.log('🎯 Fetched show requests for venue:');
          console.log(`  - Venue-initiated: ${venueInitiatedData.length}`);
          console.log(`  - Artist requests with venue bids: ${artistRequestsWithVenueBids.length}`);
          console.log(`  - Total combined: ${combinedShowRequestsData.length}`);
          
          // 🎯 DEBUG: Log all venue-initiated data
          console.log('🔍 Debug: All venueInitiatedData:', venueInitiatedData.map((req: any) => ({
            id: req.id,
            title: req.title,
            initiatedBy: req.initiatedBy,
            venueId: req.venueId,
            artistName: req.artist?.name
          })));
          
          // 🎯 NEW: Handle venue-specific artist requests (artist → venue direct requests)
          const venueSpecificArtistRequests = venueInitiatedData.filter((req: any) => 
            req.initiatedBy === 'ARTIST' && req.venueId === venueId
          );
          
          console.log(`  - Venue-specific artist requests: ${venueSpecificArtistRequests.length}`);
          console.log('🔍 Debug: Venue-specific requests:', venueSpecificArtistRequests.map((req: any) => ({
            id: req.id,
            title: req.title,
            artistName: req.artist?.name,
            date: req.requestedDate
          })));
          
          // Convert venue-specific artist requests to legacy TourRequest format
          const legacyTourRequests: TourRequest[] = venueSpecificArtistRequests.map((req: any) => ({
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
          
          console.log('🔄 Debug: Converting venue-specific requests to legacy format:');
          console.log(`  - Input: ${venueSpecificArtistRequests.length} venue-specific requests`);
          console.log(`  - Output: ${legacyTourRequests.length} legacy tour requests`);
          console.log('🔍 Debug: Legacy tour requests:', legacyTourRequests.map((req: any) => ({
            id: req.id,
            artistName: req.artistName,
            title: req.title,
            startDate: req.startDate,
            location: req.location,
            status: req.status
          })));
          
          setTourRequests(legacyTourRequests);
          console.log('✅ Debug: Set tourRequests state with', legacyTourRequests.length, 'requests');
          
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
                  console.log(`🎯 Found ${bid.venueId === venueId ? 'OWN' : 'COMPETITOR'} bid: ${bid.venue?.name || `Venue ${bid.venueId?.slice(-6)}`} -> ${req.artist?.name || 'Unknown Artist'} (${req.title})`);
                  
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
                    billingPosition: bid.billingPosition,
                    lineupPosition: bid.lineupPosition,
                    setLength: bid.setLength,
                    otherActs: bid.otherActs,
                    billingNotes: bid.billingNotes
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
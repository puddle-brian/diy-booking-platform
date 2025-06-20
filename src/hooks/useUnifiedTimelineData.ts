import { useState, useEffect, useMemo } from 'react';
import { Show, VenueBid, VenueOffer, BidStatus } from '../../types';

// 🎯 PHASE 2.1: Unified Timeline Data Interface
// This replaces the synthetic data conversions with a clean, typed interface

export interface TimelineItem {
  id: string;
  type: 'show' | 'venue-bid' | 'venue-offer' | 'show-request';
  date: string;
  endDate?: string;
  
  // Core display properties (computed consistently)
  title: string;
  location: string;
  artistName: string;
  venueName: string;
  status: string;
  
  // Raw data for components that need specifics
  rawData: Show | VenueBid | VenueOffer | any; // ShowRequest when available
  
  // Permissions & context
  isOwner: boolean;
  canEdit: boolean;
  canRespond: boolean;
  
  // Aggregated data for expansion
  relatedBids?: VenueBid[];
  relatedOffers?: VenueOffer[];
}

export interface UnifiedTimelineData {
  items: TimelineItem[];
  shows: Show[];
  venueBids: VenueBid[];
  venueOffers: VenueOffer[];
  showRequests: any[]; // Will be properly typed when ShowRequest is available
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseUnifiedTimelineDataProps {
  artistId?: string;
  venueId?: string;
  viewerType?: 'artist' | 'venue' | 'public';
}

export function useUnifiedTimelineData({
  artistId,
  venueId,
  viewerType = 'public'
}: UseUnifiedTimelineDataProps): UnifiedTimelineData {
  
  // Raw data states
  const [shows, setShows] = useState<Show[]>([]);
  const [venueBids, setVenueBids] = useState<VenueBid[]>([]);
  const [venueOffers, setVenueOffers] = useState<VenueOffer[]>([]);
  const [showRequests, setShowRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎯 PHASE 2.1: Single fetch function that gets all data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [showsRes, showRequestsRes] = await Promise.all([
        fetch(`/api/shows${buildQueryParams({ artistId, venueId })}`),
        fetch(`/api/show-requests${buildQueryParams({ artistId, venueId })}`)
      ]);

      if (!showsRes.ok || !showRequestsRes.ok) {
        throw new Error('Failed to fetch timeline data');
      }

      const [showsData, showRequestsData] = await Promise.all([
        showsRes.json(),
        showRequestsRes.json()
      ]);

      setShows(showsData || []);
      setShowRequests(showRequestsData || []);
      
      // 🎯 PHASE 2.1: Extract bids and offers from show requests  
      // This eliminates the need for synthetic data creation
      const extractedBids: VenueBid[] = [];
      const extractedOffers: VenueOffer[] = [];
      
      showRequestsData?.forEach((request: any) => {
        if (request.bids) {
          extractedBids.push(...request.bids);
        }
        if (request.isVenueInitiated) {
          // Convert venue-initiated show request to venue offer format
          extractedOffers.push({
            id: request.id,
            venueId: request.venueId,
            venueName: request.venueName,
            artistId: request.artistId,
            artistName: request.artistName,
            title: request.title,
            description: request.description,
            proposedDate: request.requestedDate,
            message: request.message,
            status: mapShowRequestStatusToOfferStatus(request.status),
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            expiresAt: request.expiresAt,
            createdById: request.venueId, // Venue is the creator
            amount: request.amount,
            doorDeal: request.doorDeal,
            ticketPrice: request.ticketPrice,
            billingPosition: request.billingPosition,
            capacity: request.capacity,
            ageRestriction: request.ageRestriction,
            equipmentProvided: request.equipmentProvided,
            loadIn: request.loadIn,
            soundcheck: request.soundcheck,
            doorsOpen: request.doorsOpen,
            showTime: request.showTime,
            curfew: request.curfew,
            promotion: request.promotion
          });
        }
      });
      
      setVenueBids(extractedBids);
      setVenueOffers(extractedOffers);
      
    } catch (err) {
      console.error('Error fetching timeline data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 PHASE 2.1: Transform raw data into unified timeline items
  const timelineItems = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Process shows
    shows.forEach(show => {
      items.push({
        id: show.id,
        type: 'show',
        date: show.date,
        title: show.title || generateShowTitle(show),
        location: formatLocation(show),
        artistName: extractArtistName(show),
        venueName: show.venueName || 'Unknown Venue',
        status: show.status,
        rawData: show,
        isOwner: checkShowOwnership(show, artistId, venueId),
        canEdit: checkShowEditPermissions(show, artistId, venueId, viewerType),
        canRespond: false, // Shows don't need responses
        relatedBids: [], // Shows don't have competing bids
        relatedOffers: []
      });
    });

    // Process show requests (non-venue-initiated)
    showRequests
      .filter(request => !request.isVenueInitiated)
      .forEach(request => {
        const relatedBids = venueBids.filter(bid => bid.showRequestId === request.id);
        
        items.push({
          id: request.id,
          type: 'show-request',
          date: request.requestedDate,
          endDate: request.endDate,
          title: request.title,
          location: request.location || formatRequestLocation(request),
          artistName: request.artistName || 'Unknown Artist',
          venueName: relatedBids.length > 0 ? `${relatedBids.length} venue${relatedBids.length !== 1 ? 's' : ''} interested` : 'No responses yet',
          status: request.status,
          rawData: request,
          isOwner: checkRequestOwnership(request, artistId, venueId),
          canEdit: checkRequestEditPermissions(request, artistId, venueId, viewerType),
          canRespond: checkRequestResponsePermissions(request, artistId, venueId, viewerType),
          relatedBids,
          relatedOffers: []
        });
      });

    // Process venue bids (when viewing venue timeline)
    if (venueId) {
      const venueBidsForThisVenue = venueBids.filter(bid => bid.venueId === venueId);
      
      // Group bids by show request to avoid duplicates
      const bidsByRequest = venueBidsForThisVenue.reduce((groups, bid) => {
        const requestId = bid.showRequestId;
        if (!groups[requestId]) {
          groups[requestId] = [];
        }
        groups[requestId].push(bid);
        return groups;
      }, {} as Record<string, VenueBid[]>);

      Object.entries(bidsByRequest).forEach(([requestId, bids]) => {
        const primaryBid = bids[0]; // Use first bid for primary data
        const parentRequest = showRequests.find(req => req.id === requestId);
        
        items.push({
          id: `venue-bid-group-${requestId}`,
          type: 'venue-bid',
          date: primaryBid.proposedDate,
          title: parentRequest?.title || 'Artist Tour Request',
          location: parentRequest?.location || primaryBid.location || 'Unknown Location',
          artistName: primaryBid.artistName || parentRequest?.artistName || 'Unknown Artist',
          venueName: primaryBid.venueName,
          status: primaryBid.status,
          rawData: primaryBid,
          isOwner: true, // Venue owns their bids
          canEdit: true,
          canRespond: false, // Bids are responses, not things to respond to
          relatedBids: bids,
          relatedOffers: []
        });
      });
    }

    // Process venue offers  
    venueOffers.forEach(offer => {
      items.push({
        id: offer.id,
        type: 'venue-offer',
        date: offer.proposedDate,
        title: offer.title,
        location: offer.venueName,
        artistName: offer.artistName,
        venueName: offer.venueName,
        status: offer.status,
        rawData: offer,
        isOwner: checkOfferOwnership(offer, artistId, venueId),
        canEdit: checkOfferEditPermissions(offer, artistId, venueId, viewerType),
        canRespond: checkOfferResponsePermissions(offer, artistId, venueId, viewerType),
        relatedBids: [],
        relatedOffers: []
      });
    });

    // Sort by date (most recent first)
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
  }, [shows, showRequests, venueBids, venueOffers, artistId, venueId, viewerType]);

  useEffect(() => {
    fetchData();
  }, [artistId, venueId]);

  return {
    items: timelineItems,
    shows,
    venueBids,
    venueOffers,
    showRequests,
    loading,
    error,
    refresh: fetchData
  };
}

// 🎯 PHASE 2.1: Helper functions for data processing
function buildQueryParams(params: { artistId?: string; venueId?: string }): string {
  const searchParams = new URLSearchParams();
  if (params.artistId) searchParams.append('artistId', params.artistId);
  if (params.venueId) searchParams.append('venueId', params.venueId);
  return searchParams.toString() ? `?${searchParams.toString()}` : '';
}

function mapShowRequestStatusToOfferStatus(status: string): BidStatus {
  // Map show request status to offer status
  const mapping: Record<string, BidStatus> = {
    'OPEN': 'pending',
    'PENDING': 'pending', 
    'CONFIRMED': 'accepted',
    'CANCELLED': 'cancelled'
  };
  return mapping[status] || 'pending';
}

function generateShowTitle(show: Show): string {
  // Generate a title for shows that don't have one
  return show.venueName ? `Show at ${show.venueName}` : 'Untitled Show';
}

function formatLocation(show: Show): string {
  if (show.city && show.state) {
    return `${show.city}, ${show.state}`;
  }
  return show.venueName || 'Unknown Location';
}

function formatRequestLocation(request: any): string {
  if (request.targetLocations?.length > 0) {
    return request.targetLocations[0];
  }
  return request.location || 'Unknown Location';
}

function extractArtistName(show: Show): string {
  // Extract primary artist name from show
  if (show.lineup && show.lineup.length > 0) {
    const headliner = show.lineup.find(item => item.billingPosition === 'headliner');
    return headliner?.artistName || show.lineup[0].artistName || 'Unknown Artist';
  }
  return 'Unknown Artist';
}

// Permission checking functions
function checkShowOwnership(show: Show, artistId?: string, venueId?: string): boolean {
  if (venueId && show.venueId === venueId) return true;
  if (artistId && show.lineup?.some(item => item.artistId === artistId)) return true;
  return false;
}

function checkShowEditPermissions(show: Show, artistId?: string, venueId?: string, viewerType?: string): boolean {
  if (viewerType === 'public') return false;
  return checkShowOwnership(show, artistId, venueId);
}

function checkRequestOwnership(request: any, artistId?: string, venueId?: string): boolean {
  if (artistId && request.artistId === artistId) return true;
  if (venueId && request.venueId === venueId) return true;
  return false;
}

function checkRequestEditPermissions(request: any, artistId?: string, venueId?: string, viewerType?: string): boolean {
  if (viewerType === 'public') return false;
  return checkRequestOwnership(request, artistId, venueId);
}

function checkRequestResponsePermissions(request: any, artistId?: string, venueId?: string, viewerType?: string): boolean {
  if (viewerType === 'public') return false;
  // Venues can respond to artist requests, artists can respond to venue offers
  if (venueId && !request.isVenueInitiated) return true;
  if (artistId && request.isVenueInitiated && request.artistId === artistId) return true;
  return false;
}

function checkOfferOwnership(offer: VenueOffer, artistId?: string, venueId?: string): boolean {
  if (venueId && offer.venueId === venueId) return true;
  if (artistId && offer.artistId === artistId) return true;
  return false;
}

function checkOfferEditPermissions(offer: VenueOffer, artistId?: string, venueId?: string, viewerType?: string): boolean {
  if (viewerType === 'public') return false;
  return venueId === offer.venueId; // Only venue can edit their offers
}

function checkOfferResponsePermissions(offer: VenueOffer, artistId?: string, venueId?: string, viewerType?: string): boolean {
  if (viewerType === 'public') return false;
  return artistId === offer.artistId; // Only target artist can respond to offers
} 
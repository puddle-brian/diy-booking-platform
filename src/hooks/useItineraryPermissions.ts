import { useMemo } from 'react';

interface VenueBid {
  id: string;
  venueId: string;
  venueName: string;
  status: string;
  showRequestId: string;
}

interface Show {
  id: string;
  artistId: string;
  venueId: string;
}

interface TourRequest {
  id: string;
  artistId: string;
  isVenueInitiated?: boolean;
  originalOfferId?: string;
}

interface UseItineraryPermissionsProps {
  viewerType: 'artist' | 'venue' | 'public';
  editable: boolean;
  artistId?: string;
  venueId?: string;
  venueName?: string;
}

export interface ItineraryPermissions {
  // Core viewer info
  actualViewerType: 'artist' | 'venue' | 'public';
  isOwner: boolean;
  
  // Privacy controls
  canExpandRequest: (request: TourRequest) => boolean;
  canSeeFinancialDetails: (show?: Show, bid?: VenueBid, request?: TourRequest) => boolean;
  
  // Main actions
  canMakeOffers: boolean;
  canCreateRequests: boolean;
  canEditProfile: boolean;
  
  // Show actions
  canViewShowDocument: (show: Show) => boolean;
  canEditShow: (show: Show) => boolean;
  
  // Bid actions
  canAcceptBid: (bid: VenueBid, request?: TourRequest) => boolean;
  canHoldBid: (bid: VenueBid, request?: TourRequest) => boolean;
  canDeclineBid: (bid: VenueBid, request?: TourRequest) => boolean;
  canUndoAcceptBid: (bid: VenueBid, request?: TourRequest) => boolean;
  canViewBidDocument: (bid: VenueBid, request?: TourRequest) => boolean;
  
  // Request actions
  canDeleteRequest: (request: TourRequest, requestBids?: VenueBid[]) => boolean;
  canViewRequestDocument: (request: TourRequest, venueBids: VenueBid[]) => boolean;
  canMakeOfferOnRequest: (request: TourRequest, requestBids?: VenueBid[]) => boolean;
  
  // Venue-specific permissions
  canWithdrawBid: (request: TourRequest) => boolean;
  canCancelOffer: (request: TourRequest) => boolean;
}

export function useItineraryPermissions({
  viewerType,
  editable,
  artistId,
  venueId,
  venueName
}: UseItineraryPermissionsProps): ItineraryPermissions {
  
  // Calculate the actual viewer type based on context
  const actualViewerType = useMemo(() => {
    if (viewerType !== 'public') return viewerType;
    if (editable && artistId) return 'artist';
    if (editable && venueId) return 'venue';
    return 'public';
  }, [viewerType, editable, artistId, venueId]);

  // Determine if this user owns the page being viewed
  const isOwner = useMemo(() => {
    return actualViewerType !== 'public' && editable;
  }, [actualViewerType, editable]);

  // Core action permissions
  const canMakeOffers = useMemo(() => {
    // Artists can always make requests and manage their timeline
    if (actualViewerType === 'artist' && editable) return true;
    
    // Venues can make offers on artist pages (even when editable=false)
    if (actualViewerType === 'venue' && artistId && venueId && venueName) return true;
    
    // Venues can manage their own timeline when editable=true
    if (actualViewerType === 'venue' && venueId && editable) return true;
    
    return false;
  }, [actualViewerType, editable, artistId, venueId, venueName]);

  const canCreateRequests = useMemo(() => {
    return actualViewerType === 'artist' && editable;
  }, [actualViewerType, editable]);

  const canEditProfile = useMemo(() => {
    return isOwner;
  }, [isOwner]);

  // Privacy control functions
  const canExpandRequest = useMemo(() => {
    return (request: TourRequest) => {
      // Artists can expand their own requests
      if (actualViewerType === 'artist' && artistId && request.artistId === artistId) {
        return true;
      }
      // Venues can expand requests where they have bids or venue-initiated offers
      if (actualViewerType === 'venue' && venueId) {
        // Can expand if this is a venue-initiated offer from THEIR venue
        if (request.isVenueInitiated) {
          // Check both venueInitiatedBy (legacy) and venueId (new grouped offers)
          return (request as any).venueInitiatedBy === venueId || (request as any).venueId === venueId;
        }
        // For regular requests, they can expand if they have a bid (checked in component)
        return true; // Component will filter to only show their bids
      }
      return false;
    };
  }, [actualViewerType, artistId, venueId]);

  const canSeeFinancialDetails = useMemo(() => {
    return (show?: Show, bid?: VenueBid, request?: TourRequest) => {
      // Artists can see financial details for their own content
      if (actualViewerType === 'artist' && artistId) {
        if (show?.artistId === artistId) return true;
        if (request?.artistId === artistId) return true;
      }
      // Venues can see financial details for their own content
      if (actualViewerType === 'venue' && venueId) {
        if (show?.venueId === venueId) return true;
        if (bid?.venueId === venueId) return true;
      }
      return false;
    };
  }, [actualViewerType, artistId, venueId]);

  // Show-related permissions
  const canViewShowDocument = useMemo(() => {
    return (show: Show) => {
      // Artists can view documents for their own shows
      if (actualViewerType === 'artist' && artistId && show.artistId === artistId) {
        return true;
      }
      // Venues can view documents for shows at their venue
      if (actualViewerType === 'venue' && venueId && show.venueId === venueId) {
        return true;
      }
      return false;
    };
  }, [actualViewerType, artistId, venueId]);

  const canEditShow = useMemo(() => {
    return (show: Show) => {
      // Only owners can edit shows
      if (!isOwner) return false;
      
      // Artists can edit their own shows
      if (actualViewerType === 'artist' && artistId && show.artistId === artistId) {
        return true;
      }
      // Venues can edit shows at their venue
      if (actualViewerType === 'venue' && venueId && show.venueId === venueId) {
        return true;
      }
      return false;
    };
  }, [actualViewerType, isOwner, artistId, venueId]);

  // Bid-related permissions
  const canAcceptBid = useMemo(() => {
    return (bid: VenueBid, request?: TourRequest) => {
      // Only artists can accept bids, and only on their own requests
      return actualViewerType === 'artist' && editable;
    };
  }, [actualViewerType, editable]);

  const canHoldBid = useMemo(() => {
    return (bid: VenueBid, request?: TourRequest) => {
      // Only artists can hold bids, and only on regular requests (not venue offers)
      if (actualViewerType !== 'artist' || !editable) return false;
      if (Boolean(request?.isVenueInitiated)) return false;
      return true;
    };
  }, [actualViewerType, editable]);

  const canDeclineBid = useMemo(() => {
    return (bid: VenueBid, request?: TourRequest) => {
      // Artists can decline bids on their requests
      return actualViewerType === 'artist' && editable;
    };
  }, [actualViewerType, editable]);

  const canUndoAcceptBid = useMemo(() => {
    return (bid: VenueBid, request?: TourRequest) => {
      // Only artists can undo acceptance, and only on regular requests (not venue offers)
      if (actualViewerType !== 'artist' || !editable) return false;
      if (Boolean(request?.isVenueInitiated)) return false;
      return true;
    };
  }, [actualViewerType, editable]);

  const canViewBidDocument = useMemo(() => {
    return (bid: VenueBid, request?: TourRequest) => {
      // Artists can view bid documents for their own requests
      if (actualViewerType === 'artist' && artistId && request?.artistId === artistId) {
        return true;
      }
      // Venues can view documents for their own bids
      if (actualViewerType === 'venue' && venueId && bid.venueId === venueId) {
        return true;
      }
      return false;
    };
  }, [actualViewerType, artistId, venueId]);

  // Request-related permissions
  const canDeleteRequest = useMemo(() => {
    return (request: TourRequest, requestBids?: VenueBid[]) => {
      if (actualViewerType === 'artist') {
        // Artists can always manage their own requests (delete own requests, decline venue offers)
        return editable && request.artistId === artistId;
      } else if (actualViewerType === 'venue') {
        // ✅ UPDATED: Now that Edit Offer is in child rows, venues can see delete in parent rows
        // Venues can delete/withdraw from any request they're involved with
        return editable && (
          // Can delete their own venue-initiated offers
          (Boolean(request.isVenueInitiated) && (request as any).venueInitiatedBy === venueId) ||
          // Can withdraw from requests where they have bids (will withdraw their bid)
          Boolean(requestBids && requestBids.some(bid => bid.venueId === venueId))
        );
      }
      return false;
    };
  }, [actualViewerType, editable, artistId, venueId]);

  const canViewRequestDocument = useMemo(() => {
    return (request: TourRequest, venueBids: VenueBid[]) => {
      // Artists can view documents for their own requests
      if (actualViewerType === 'artist' && artistId && request.artistId === artistId) {
        return true;
      }
      // Venues can view documents if they have a bid on the request OR if viewing their own venue's itinerary
      if (actualViewerType === 'venue' && venueId) {
        // Can view if they have a bid on the request
        const hasBid = venueBids.some(bid => bid.venueId === venueId);
        // Can also view if this is their own venue's itinerary (requests are specifically for their venue)
        const isOwnVenueItinerary = editable;
        return hasBid || isOwnVenueItinerary;
      }
      return false;
    };
  }, [actualViewerType, artistId, venueId, editable]);

  const canMakeOfferOnRequest = useMemo(() => {
    return (request: TourRequest, requestBids?: VenueBid[]) => {
      // ✅ SIMPLIFIED LOGIC: Venues can make offers when they can logically engage
      if (actualViewerType === 'venue' && venueId && venueName) {
        // ✅ ELEGANT CONTEXT FIX: When viewing an artist page, venues can engage with ALL requests
        // This covers the "Make Offer" buttons on artist requests where venue has no bid yet
        if (artistId && request.artistId === artistId) {
          return true; // Artist page context = can make offers on all of this artist's requests
        }
        
        // ✅ CORE IMPROVEMENT: Can make offers on artist-initiated requests
        if (!Boolean(request.isVenueInitiated)) {
          return true;
        }
        
        // ✅ NEW: Can also edit their existing bids on ANY request (including venue-initiated ones)
        // This handles the case where a venue has a bid on a request they didn't initiate
        if (requestBids) {
          const hasExistingBid = requestBids.some(bid => bid.venueId === venueId);
          if (hasExistingBid) {
            return true;
          }
        }
        
        // Can't make new offers on other venues' offers
        return false;
      }
      return false;
    };
  }, [actualViewerType, venueId, venueName, artistId]);

  const canWithdrawBid = useMemo(() => {
    return (request: TourRequest) => {
      // Venues can withdraw their own bids
      return actualViewerType === 'venue' && editable;
    };
  }, [actualViewerType, editable]);

  const canCancelOffer = useMemo(() => {
    return (request: TourRequest) => {
      // Venues can cancel their own offers
      return actualViewerType === 'venue' && editable && Boolean(request.isVenueInitiated);
    };
  }, [actualViewerType, editable]);

  return {
    actualViewerType,
    isOwner,
    canExpandRequest,
    canSeeFinancialDetails,
    canMakeOffers,
    canCreateRequests,
    canEditProfile,
    canViewShowDocument,
    canEditShow,
    canAcceptBid,
    canHoldBid,
    canDeclineBid,
    canUndoAcceptBid,
    canViewBidDocument,
    canDeleteRequest,
    canViewRequestDocument,
    canMakeOfferOnRequest,
    canWithdrawBid,
    canCancelOffer
  };
} 
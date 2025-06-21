// Type safety utilities for timeline components
// Micro-Phase F: Eliminate 'any' types and improve type safety

import { Show, VenueBid, VenueOffer } from '../../types';

// 🎯 MICRO-PHASE F: Proper ShowRequest interface (replacing 'any')
export interface ShowRequest {
  id: string;
  artistId: string;
  artistName?: string;
  title: string;
  description?: string;
  requestedDate: string;
  startDate: string;
  endDate: string;
  isSingleDate: boolean;
  location: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  initiatedBy: 'ARTIST' | 'VENUE';
  
  // Optional venue-specific fields
  venueId?: string;
  venueName?: string;
  
  // Optional synthetic request fields
  isVenueInitiated?: boolean;
  venueInitiatedBy?: string;
  originalOfferId?: string;
  isVenueBid?: boolean;
  originalBidId?: string;
  originalShowRequestId?: string;
  bidStatus?: string;
  bidAmount?: number;
  isShowBasedRequest?: boolean;
  originalShowId?: string;
}

// 🎯 MICRO-PHASE F: Properly typed TimelineEntry (no more 'any')
export interface TypedTimelineEntry {
  id: string;
  type: 'show' | 'show-request';
  date: string;
  endDate?: string;
  data: Show | ShowRequest | VenueBid;
  parentTourRequest?: ShowRequest;
}

// 🎯 MICRO-PHASE F: Type guard functions for better type safety
export function isShow(data: Show | ShowRequest | VenueBid): data is Show {
  return 'date' in data && !('requestedDate' in data);
}

export function isShowRequest(data: Show | ShowRequest | VenueBid): data is ShowRequest {
  return 'requestedDate' in data && 'initiatedBy' in data;
}

export function isVenueBid(data: Show | ShowRequest | VenueBid): data is VenueBid {
  return 'guarantee' in data && 'venueName' in data;
}

// 🎯 MICRO-PHASE F: Typed helper for offer button logic
export interface OfferButtonRequest {
  isVenueInitiated?: boolean;
  initiatedBy?: 'ARTIST' | 'VENUE';
}

export function shouldShowOfferButton(
  request: OfferButtonRequest,
  artistId?: string,
  venueId?: string
): boolean {
  // When viewing artist pages: show for all requests (maximum discoverability!)
  if (artistId) {
    return true;
  }
  
  // When viewing venue's own timeline: only show for artist-initiated requests
  if (venueId && !artistId) {
    return !request.isVenueInitiated && request.initiatedBy !== 'VENUE';
  }
  
  // Fallback to existing behavior
  return !request.isVenueInitiated && request.initiatedBy !== 'VENUE';
}

// 🎯 MICRO-PHASE F: Typed state organization interfaces
export interface FormRelatedState {
  showTourRequestForm: boolean;
  addDateLoading: boolean;
  showVenueOfferForm: boolean;
}

export interface BidRelatedState {
  bidActions: Map<string, string>;
  declinedBids: Set<string>;
  bidStatusOverrides: Map<string, string>;
}

export interface InteractionState {
  deleteShowLoading: Set<string>;
  recentUndoActions: Set<string>;
} 
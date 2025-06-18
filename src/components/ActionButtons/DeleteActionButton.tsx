'use client';

import React, { useState } from 'react';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { VenueBid } from '../../../types';

interface VenueOffer {
  id: string;
  venueId: string;
  venueName: string;
  artistId: string;
  artistName: string;
  message?: string;
  status: string;
}

interface TourRequest {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  isVenueInitiated?: boolean;
  originalOfferId?: string;
}

interface LineupItem {
  artistId: string;
  artistName: string;
  billingPosition: 'HEADLINER' | 'CO_HEADLINER' | 'SUPPORT' | 'OPENER' | 'LOCAL_SUPPORT';
  performanceOrder: number;
  setLength?: number;
  guarantee?: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
}

interface Show {
  id: string;
  title?: string;
  venueId: string;
  venueName?: string;
  city?: string;
  state?: string;
  date: string;
  notes?: string;
  capacity?: number;
  ageRestriction?: string;
  guarantee?: number;
  doorDeal?: {
    split: string;
    minimumGuarantee?: number;
    afterExpenses?: boolean;
  };
  doorsOpen?: string;
  showTime?: string;
  curfew?: string;
  status: string;
  createdBy?: string;
  lineup?: LineupItem[];
  // Legacy fields for backwards compatibility
  artistId?: string;
  artistName?: string;
}

interface DeleteActionButtonProps {
  // Can be show, request, or neither (for request-specific logic)
  show?: Show;
  request?: TourRequest & {
    isVenueBid?: boolean;
    originalBidId?: string;
    originalShowRequestId?: string;
  };
  permissions: ItineraryPermissions;
  venueId?: string;
  venueOffers: VenueOffer[];
  venueBids: VenueBid[];
  isLoading?: boolean;
  onDeleteShow?: (showId: string, showName: string) => void;
  onDeleteRequest?: (requestId: string, requestName: string) => void;
  onOfferAction?: (offer: VenueOffer, action: string) => void;
  onBidAction?: (bid: VenueBid, action: string, reason?: string) => void;
}

export function DeleteActionButton({
  show,
  request,
  permissions,
  venueId,
  venueOffers,
  venueBids,
  isLoading = false,
  onDeleteShow,
  onDeleteRequest,
  onOfferAction,
  onBidAction
}: DeleteActionButtonProps) {
  // Show delete button logic
  if (show && onDeleteShow) {
    // Generate smart show name using lineup data
    const getShowDisplayName = (show: Show): string => {
      // Try to use the show title first
      if (show.title) {
        return show.title;
      }
      
      // Generate name from lineup
      if (show.lineup && show.lineup.length > 0) {
        const headliner = show.lineup.find(item => item.billingPosition === 'HEADLINER') || show.lineup[0];
        const artistName = headliner.artistName || 'Unknown Artist';
        
        if (show.lineup.length === 1) {
          return `${artistName} at ${show.venueName || show.city}`;
        } else {
          return `${artistName} + ${show.lineup.length - 1} others at ${show.venueName || show.city}`;
        }
      }
      
      // Fallback to legacy fields for backwards compatibility
      if (show.artistName) {
        return `${show.artistName} at ${show.venueName || show.city}`;
      }
      
      // Final fallback
      return `Show at ${show.venueName || show.city}`;
    };
    
    const showName = getShowDisplayName(show);
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteShow(show.id, showName);
        }}
        disabled={isLoading}
        className="inline-flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
        title="Delete show"
      >
        {isLoading ? (
          <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
          </svg>
        )}
      </button>
    );
  }

  // Request delete button logic
  if (request && (onDeleteRequest || onOfferAction || onBidAction)) {
    // ✅ SIMPLIFIED: Use consistent permission logic instead of custom shouldShow
    if (!permissions.canDeleteRequest(request, venueBids)) {
      return null;
    }

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (permissions.actualViewerType === 'artist') {
        // Artist: decline offer or delete request
        if (request.isVenueInitiated && request.originalOfferId) {
          const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
          if (originalOffer) {
            onOfferAction?.(originalOffer, 'decline');
          }
        } else {
          onDeleteRequest?.(request.id, request.title);
        }
      } else if (permissions.actualViewerType === 'venue') {
        // Venue: cancel offer, withdraw bid, or delete request
        if (request.originalOfferId) {
          // Cancel venue-initiated offer
          const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
          if (originalOffer) {
            onOfferAction?.(originalOffer, 'decline');
          }
        } else if (request.isVenueBid && request.originalBidId) {
          // Withdraw venue bid
          const venueBid = venueBids.find(bid => 
            bid.showRequestId === request.originalShowRequestId && 
            bid.venueId === venueId
          );
          if (venueBid) {
            onBidAction?.(venueBid, 'decline', 'Venue withdrew offer');
          }
        } else {
          // Delete regular request
          onDeleteRequest?.(request.id, request.title);
        }
      }
    };

    const getTitle = () => {
      if (permissions.actualViewerType === 'artist') {
        return request.isVenueInitiated ? "Decline venue offer" : "Delete tour request";
      } else if (permissions.actualViewerType === 'venue') {
        if (request.originalOfferId) return "Cancel offer";
        if (request.isVenueBid) return "Withdraw bid";
        return "Delete request";
      }
      return "Delete";
    };

    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="inline-flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
        title={getTitle()}
      >
        {isLoading ? (
          <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
          </svg>
        )}
      </button>
    );
  }

  return null;
} 
'use client';

import React from 'react';
import { VenueBid, VenueOffer, BidStatus } from '../../../types'; // 🎯 PHASE 1.2: Add unified status types
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';

// 🎯 PHASE 1: Removed duplicate interfaces - now using unified types from main types.ts

interface TourRequest {
  id: string;
  artistId: string;
  isVenueInitiated?: boolean;
  originalOfferId?: string;
}

interface BidActionButtonsProps {
  bid: VenueBid;
  request?: TourRequest;
  permissions: ItineraryPermissions;
  bidStatus: BidStatus;
  isLoading?: boolean;
  venueOffers: VenueOffer[];
  onBidAction: (bid: VenueBid, action: string, reason?: string) => Promise<void>;
  onOfferAction: (offer: VenueOffer, action: string) => Promise<void>;
  // NEW: Hold state management
  isFrozenByHold?: boolean;
  activeHoldInfo?: {
    id: string;
    expiresAt: string;
    requesterName: string;
    reason: string;
  };
  // NEW: Current artist ID for ownership check
  currentArtistId?: string;
}

export function BidActionButtons({
  bid,
  request,
  permissions,
  bidStatus,
  isLoading = false,
  venueOffers,
  onBidAction,
  onOfferAction,
  isFrozenByHold = false,
  activeHoldInfo,
  currentArtistId
}: BidActionButtonsProps) {
  // 🎯 NEW: Venue-specific actions for accepted bids
  if (permissions.actualViewerType === 'venue' && bidStatus === 'accepted') {
    const renderVenueActionButton = (action: string, icon: string, bgColor: string, title: string) => (
      <button
        onClick={() => handleAction(action)}
        disabled={isLoading}
        className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white ${bgColor} disabled:opacity-50 transition-colors`}
        title={title}
      >
        {icon}
      </button>
    );
    
    return (
      <div className="flex items-center space-x-0.5 flex-wrap">
        {renderVenueActionButton('confirm-accepted', '✅', 'bg-green-600 hover:bg-green-700', 'Confirm show - finalizes booking')}
        {renderVenueActionButton('decline', '❌', 'bg-red-600 hover:bg-red-700', 'Reject acceptance - venue cannot confirm')}
      </div>
    );
  }

  // Only show action buttons for artists (all other cases)
  if (permissions.actualViewerType !== 'artist') {
    return null;
  }

  // 🎯 NEW: Only show action buttons if current artist owns this bid
  if (currentArtistId) {
    // Check multiple possible sources for the artist ID
    const bidArtistId = bid.artistId || request?.artistId || (bid as any).tourRequest?.artist?.id;
    if (bidArtistId && currentArtistId !== bidArtistId) {
      return null;
    }
  }

  const handleAction = (action: string) => {
    if (request?.isVenueInitiated && request.originalOfferId) {
      // This is a venue offer, use offer action
      const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
      if (originalOffer) {
        onOfferAction(originalOffer, action);
      }
    } else {
      // This is a regular bid, use bid action
      onBidAction(bid, action);
    }
  };

  const renderActionButton = (action: string, icon: string, bgColor: string, title: string, disabled = false) => (
    <button
      onClick={() => handleAction(action)}
      disabled={isLoading || disabled}
      className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white ${bgColor} disabled:opacity-50 transition-colors`}
      title={title}
      style={{ opacity: disabled ? 0.3 : 1 }}
    >
      {icon}
    </button>
  );

  // ❄️ FROZEN: Show decline button only (status badge already shows frozen state)
  if (isFrozenByHold) {
    return (
      <div className="flex items-center space-x-1">
        {renderActionButton(
          'decline', 
          '✕', 
          'bg-red-600 hover:bg-red-700', 
          'Decline this bid (allowed even when frozen)'
        )}
      </div>
    );
  }

  // If bid is frozen by a hold, show locked state
  if (bid.holdState === 'FROZEN' || bid.isFrozen) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
        <span className="text-blue-600 font-medium">🔒 Locked by Hold</span>
        {bid.frozenByHoldId && (
          <span className="text-xs text-blue-500">Hold: {bid.frozenByHoldId.slice(-8)}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-0.5 flex-wrap">
      {bidStatus === 'pending' && (
        <>
          {renderActionButton('accept', '✓', 'bg-green-600 hover:bg-green-700', 'Accept this bid')}
          {renderActionButton(
            'hold', 
            '⏸', 
            'bg-yellow-600 hover:bg-yellow-700', 
            request?.isVenueInitiated ? "Hold not available for offers" : "Place on hold",
            Boolean(request?.isVenueInitiated)
          )}
          {renderActionButton('decline', '✕', 'bg-red-600 hover:bg-red-700', 'Decline this bid')}
        </>
      )}

      {bidStatus === 'hold' && (
        <>
          {renderActionButton('accept', '✓', 'bg-green-600 hover:bg-green-700', 'Accept this bid')}
          {renderActionButton('decline', '✕', 'bg-red-600 hover:bg-red-700', 'Decline this bid')}
        </>
      )}

      {bidStatus === 'accepted' && (
        <>
          {/* Check if this is an auto-held acceptance (new workflow) */}
          {bid.holdState === 'ACCEPTED_HELD' ? (
            <>
              {renderActionButton(
                'confirm-accepted', 
                '✅', 
                'bg-green-600 hover:bg-green-700', 
                'Confirm booking - creates show and finalizes deal'
              )}
              {renderActionButton(
                'undo-accept', 
                '🤔', 
                'bg-yellow-600 hover:bg-yellow-700', 
                'Change mind - cancel acceptance and return to pending'
              )}
            </>
          ) : (
            <>
              {/* Legacy acceptance - just show undo */}
              {renderActionButton(
                'undo-accept', 
                '↶', 
                'bg-orange-600 hover:bg-orange-700', 
                request?.isVenueInitiated ? "Undo not available for offers" : "Undo acceptance - return to pending",
                Boolean(request?.isVenueInitiated)
              )}
            </>
          )}
        </>
      )}
    </div>
  );
} 
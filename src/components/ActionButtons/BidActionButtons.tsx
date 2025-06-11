'use client';

import React from 'react';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';

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
  holdState?: string;
  isFrozen?: boolean;
  frozenByHoldId?: string;
}

interface TourRequest {
  id: string;
  artistId: string;
  isVenueInitiated?: boolean;
  originalOfferId?: string;
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

interface BidActionButtonsProps {
  bid: VenueBid;
  request?: TourRequest;
  permissions: ItineraryPermissions;
  bidStatus: 'pending' | 'hold' | 'accepted' | 'declined' | 'cancelled';
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
  activeHoldInfo
}: BidActionButtonsProps) {
  // Only show action buttons for artists
  if (permissions.actualViewerType !== 'artist') {
    return null;
  }

  // ❄️ FROZEN: Show just snowflake icon when bid is frozen by an active hold
  if (isFrozenByHold) {
    return (
      <div className="flex items-center justify-center">
        <span 
          className="text-xl text-blue-400 cursor-help"
          title={`Frozen by active hold${activeHoldInfo ? ` (${activeHoldInfo.requesterName})` : ''}`}
        >
          ❄️
        </span>
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
          {renderActionButton(
            'undo-accept', 
            '↶', 
            'bg-orange-600 hover:bg-orange-700', 
            request?.isVenueInitiated ? "Undo not available for offers" : "Undo acceptance - return to pending",
            Boolean(request?.isVenueInitiated)
          )}
        </>
      )}
    </div>
  );
} 
'use client';

import React from 'react';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';

interface Show {
  id: string;
  artistId: string;
  venueId: string;
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
  billingPosition?: 'headliner' | 'co-headliner' | 'direct-support' | 'opener' | 'local-opener';
  lineupPosition?: number;
  setLength?: number;
  otherActs?: string;
  billingNotes?: string;
  artistId?: string;
  artistName?: string;
}

interface TourRequest {
  id: string;
  artistId: string;
}

interface DocumentActionButtonProps {
  type: 'show' | 'bid' | 'request';
  show?: Show;
  bid?: VenueBid;
  request?: TourRequest;
  permissions: ItineraryPermissions;
  artistId?: string;
  venueId?: string;
  requestBids?: VenueBid[];
  onShowDocument?: (show: Show) => void;
  onBidDocument?: (bid: VenueBid) => void;
  onRequestDocument?: (request: TourRequest) => void;
}

export function DocumentActionButton({
  type,
  show,
  bid,
  request,
  permissions,
  artistId,
  venueId,
  requestBids = [],
  onShowDocument,
  onBidDocument,
  onRequestDocument
}: DocumentActionButtonProps) {
  
  // Show document button
  if (type === 'show' && show && onShowDocument) {
    const canView = permissions.canViewShowDocument(show);
    
    if (!canView) {
      return <div className="w-8"></div>;
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShowDocument(show);
        }}
        className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-300 rounded-lg transition-colors duration-150"
        title="View detailed show information"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
    );
  }

  // Bid document button (for individual bids)
  if (type === 'bid' && bid && request && onBidDocument) {
    const canView = permissions.canViewBidDocument(bid, request);
    
    if (!canView) {
      return null;
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onBidDocument(bid);
        }}
        className="inline-flex items-center justify-center w-8 h-8 text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 hover:border-yellow-300 rounded-lg transition-colors duration-150"
        title="View detailed bid information"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
    );
  }

  // Request document button (for tour requests)
  if (type === 'request' && request && onRequestDocument && onBidDocument) {
    const canView = permissions.canViewRequestDocument(request, requestBids);
    
    if (!canView) {
      return <div className="w-8"></div>;
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          // For venues, pass their specific bid to the document modal if they have one
          if (permissions.actualViewerType === 'venue' && venueId) {
            const venueBid = requestBids.find(bid => bid.venueId === venueId);
            if (venueBid) {
              onBidDocument(venueBid);
            } else {
              onRequestDocument(request);
            }
          } else {
            onRequestDocument(request);
          }
        }}
        className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors duration-150"
        title="View show document for your bid"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
    );
  }

  return null;
} 
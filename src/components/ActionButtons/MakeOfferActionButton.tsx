'use client';

import React from 'react';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';

interface VenueBid {
  id: string;
  venueId: string;
  venueName: string;
  status: string;
  showRequestId: string;
}

interface TourRequest {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  isVenueInitiated?: boolean;
}

interface MakeOfferActionButtonProps {
  request: TourRequest;
  permissions: ItineraryPermissions;
  venueId?: string;
  venueName?: string;
  requestBids: VenueBid[];
  onMakeOffer: (request: TourRequest) => void;
}

export function MakeOfferActionButton({
  request,
  permissions,
  venueId,
  venueName,
  requestBids,
  onMakeOffer
}: MakeOfferActionButtonProps) {
  // Only show for venues that can make offers on this request
  if (!permissions.canMakeOffers || !permissions.canMakeOfferOnRequest(request, requestBids)) {
    return null;
  }

  const existingBid = venueId ? requestBids.find(bid => bid.venueId === venueId) : null;
  const buttonText = existingBid ? "Edit Offer" : "Make Offer";
  
  // ✅ UX IMPROVEMENT: Visual differentiation between Make Offer vs Edit Offer
  const buttonStyles = existingBid 
    ? "inline-flex items-center justify-center border rounded-lg font-medium transition-colors duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 border-green-600 focus:ring-green-500 whitespace-nowrap"
    : "inline-flex items-center justify-center border rounded-lg font-medium transition-colors duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 px-3 py-1 text-xs bg-white text-blue-600 hover:bg-blue-50 border-blue-600 focus:ring-blue-500 whitespace-nowrap";

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onMakeOffer(request)}
        className={buttonStyles}
      >
        {buttonText}
      </button>
    </div>
  );
} 
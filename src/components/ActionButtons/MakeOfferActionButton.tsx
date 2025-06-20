'use client';

import React from 'react';
import { VenueBid } from '../../../types';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';

interface TourRequest {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
}

interface MakeOfferActionButtonProps {
  request: TourRequest;
  permissions: ItineraryPermissions;
  venueId?: string;
  venueName?: string;
  requestBids: VenueBid[];
  onMakeOffer: (request: TourRequest, existingBid?: VenueBid) => void;
}

export function MakeOfferActionButton({
  request,
  permissions,
  venueId,
  venueName,
  requestBids,
  onMakeOffer
}: MakeOfferActionButtonProps) {
  // 🔍 DEBUG: Log what's happening in MakeOfferActionButton
  console.log('🔍 MakeOfferActionButton Debug:', {
    requestId: request?.id,
    canMakeOffers: permissions.canMakeOffers,
    canMakeOfferOnRequest: permissions.canMakeOfferOnRequest(request, requestBids),
    venueId,
    requestBidsCount: requestBids.length,
    requestBids: requestBids.map(b => ({ id: b.id, venueId: b.venueId, status: b.status }))
  });

  // Only show for venues that can make offers on this request
  if (!permissions.canMakeOffers || !permissions.canMakeOfferOnRequest(request, requestBids)) {
    console.log('🔍 MakeOfferActionButton: Returning null - permissions failed');
    return null;
  }

  // 🐛 BUG FIX: For venue bids, the existing bid is often passed directly via onMakeOffer
  // Check if the request ID matches the pattern for venue bids (venue-bid-{bidId})
  let existingBid = null;
  
  if (request.id.startsWith('venue-bid-')) {
    // This is a synthetic request for a venue bid - the bid ID is embedded in the request ID
    const bidId = request.id.replace('venue-bid-', '');
    existingBid = requestBids.find(bid => bid.id === bidId);
    console.log('🔍 MakeOfferActionButton: Found venue bid by ID extraction:', existingBid?.id);
  } else {
    // Regular request - look for existing bid from this venue on this request
    existingBid = venueId ? requestBids.find(bid => 
      bid.venueId === venueId && bid.showRequestId === request.id
    ) : null;
    console.log('🔍 MakeOfferActionButton: Found regular bid by request match:', existingBid?.id);
  }
  
  // 🎯 NEW: Don't show edit offer button if bid is already accepted
  // Once a bid is accepted, venue should use confirm/reject actions instead
  if (existingBid && existingBid.status.toLowerCase() === 'accepted') {
    console.log('🔍 MakeOfferActionButton: Returning null - bid is accepted');
    return null;
  }
  
  const buttonText = existingBid ? "✎" : "Make Offer";
  
  // ✅ UX IMPROVEMENT: Visual differentiation between Make Offer vs Edit Offer
  const buttonStyles = existingBid 
    ? "px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
    : "inline-flex items-center justify-center border rounded-lg font-medium transition-colors duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 px-3 py-1 text-xs bg-white text-blue-600 hover:bg-blue-50 border-blue-600 focus:ring-blue-500 whitespace-nowrap";

  console.log('🔍 MakeOfferActionButton: Rendering button!', { buttonText, existingBid: !!existingBid });

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onMakeOffer(request, existingBid || undefined)}
        className={buttonStyles}
        title={existingBid ? "Edit offer" : "Make offer"}
      >
        {buttonText}
      </button>
    </div>
  );
} 
'use client';

import React, { useState, useEffect } from 'react';

interface FrozenBidDisplayProps {
  bid: {
    id: string;
    venueName: string;
    venueId: string;
    guarantee?: number;
    doorDeal?: {
      split: string;
      minimumGuarantee?: number;
    };
    message?: string;
    proposedDate: string;
    status: string;
    // Hold-related fields
    frozenByHoldId?: string;
    frozenAt?: string;
  };
  holdInfo?: {
    id: string;
    expiresAt: string;
    requesterName: string;
    reason: string;
  };
  onUnfrozenUpdate?: () => void;
}

export function FrozenBidDisplay({ bid, holdInfo, onUnfrozenUpdate }: FrozenBidDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!holdInfo?.expiresAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(holdInfo.expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeRemaining(null);
        onUnfrozenUpdate?.();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining({
        hours,
        minutes,
        total: difference
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [holdInfo?.expiresAt, onUnfrozenUpdate]);

  const formatTimeRemaining = () => {
    if (!timeRemaining) return 'Expired';
    
    if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    } else {
      return `${timeRemaining.minutes}m`;
    }
  };

  const getUrgencyColor = () => {
    if (!timeRemaining) return 'text-gray-500';
    
    const totalHours = timeRemaining.total / (1000 * 60 * 60);
    
    if (totalHours <= 2) {
      return 'text-red-600'; // Critical
    } else if (totalHours <= 6) {
      return 'text-orange-600'; // Warning
    } else {
      return 'text-blue-600'; // Normal
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-4 opacity-75">
      {/* Frozen State Indicator */}
      <div className="absolute -top-2 -right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1">
        <span>🔒</span>
        <span>FROZEN</span>
      </div>

      {/* Venue Info Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-800">{bid.venueName}</h4>
          <p className="text-sm text-gray-600">
            Proposed: {new Date(bid.proposedDate).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          {bid.guarantee && (
            <div className="text-lg font-bold text-gray-700">${bid.guarantee}</div>
          )}
          {bid.doorDeal && (
            <div className="text-sm text-gray-600">{bid.doorDeal.split}</div>
          )}
        </div>
      </div>

      {/* Hold Information */}
      {holdInfo && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-orange-600">⏱️</span>
              <span className="text-sm font-medium text-orange-800">
                On Hold by {holdInfo.requesterName}
              </span>
            </div>
            <span className={`text-sm font-mono font-bold ${getUrgencyColor()}`}>
              {formatTimeRemaining()} remaining
            </span>
          </div>
          <p className="text-xs text-orange-700">
            <strong>Reason:</strong> {holdInfo.reason}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            Your bid is temporarily locked while they finalize details. 
            {timeRemaining && timeRemaining.total > 0 
              ? " You'll be notified when bidding reopens." 
              : " This hold has expired."}
          </p>
        </div>
      )}

      {/* Bid Message */}
      {bid.message && (
        <div className="text-sm text-gray-600 bg-white bg-opacity-50 p-2 rounded italic">
          "{bid.message}"
        </div>
      )}

      {/* Status Footer */}
      <div className="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between text-xs text-gray-500">
        <span>Bid Status: <span className="font-medium text-gray-700">Temporarily Locked</span></span>
        <span>Frozen: {bid.frozenAt ? new Date(bid.frozenAt).toLocaleString() : 'Recently'}</span>
      </div>
    </div>
  );
}

// Container component to show multiple frozen bids
interface FrozenBidsContainerProps {
  frozenBids: Array<{
    id: string;
    venueName: string;
    venueId: string;
    guarantee?: number;
    doorDeal?: { split: string; minimumGuarantee?: number; };
    message?: string;
    proposedDate: string;
    status: string;
    frozenByHoldId?: string;
    frozenAt?: string;
  }>;
  holdInfo?: {
    id: string;
    expiresAt: string;
    requesterName: string;
    reason: string;
  };
  onBidsUnfrozen?: () => void;
}

export function FrozenBidsContainer({ frozenBids, holdInfo, onBidsUnfrozen }: FrozenBidsContainerProps) {
  if (frozenBids.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header explaining the situation */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-amber-600 text-lg">🔒</span>
          <h3 className="font-semibold text-amber-800">
            {frozenBids.length} Bid{frozenBids.length !== 1 ? 's' : ''} Temporarily Frozen
          </h3>
        </div>
        <p className="text-sm text-amber-700">
          These bids are locked because another venue has an active hold on this date. 
          If the hold expires or is declined, these bids will automatically become available again.
        </p>
        {holdInfo && (
          <p className="text-xs text-amber-600 mt-2">
            Hold expires: <strong>{new Date(holdInfo.expiresAt).toLocaleString()}</strong>
          </p>
        )}
      </div>

      {/* Frozen bids */}
      <div className="space-y-3">
        {frozenBids.map((bid) => (
          <FrozenBidDisplay
            key={bid.id}
            bid={bid}
            holdInfo={holdInfo}
            onUnfrozenUpdate={onBidsUnfrozen}
          />
        ))}
      </div>
    </div>
  );
} 
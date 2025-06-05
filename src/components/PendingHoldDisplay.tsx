'use client';

import React, { useState } from 'react';

interface HoldRequest {
  id: string;
  showId?: string;
  showRequestId?: string;
  requestedById: string;
  respondedById?: string;
  duration: number;
  reason: string;
  customMessage?: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'DECLINED';
  requestedAt: string;
  respondedAt?: string;
  startsAt?: string;
  expiresAt?: string;
  requester_name?: string;
  responder_name?: string;
}

interface PendingHoldDisplayProps {
  holdRequest: HoldRequest;
  otherPartyName: string;
  isOutgoing: boolean; // true if current user requested the hold
  onApprove: () => void;
  onDecline: () => void;
  onCancel: () => void;
  canRespond: boolean;
  canCancel: boolean;
}

export function PendingHoldDisplay({
  holdRequest,
  otherPartyName,
  isOutgoing,
  onApprove,
  onDecline,
  onCancel,
  canRespond,
  canCancel
}: PendingHoldDisplayProps) {
  const [isResponding, setIsResponding] = useState(false);

  const handleResponse = async (action: () => void) => {
    setIsResponding(true);
    try {
      await action();
    } finally {
      setIsResponding(false);
    }
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours < 168) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else {
      return '1 week';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const then = new Date(dateString).getTime();
    const diffMinutes = Math.floor((now - then) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (isOutgoing) {
    // Outgoing hold request - waiting for response
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 rounded-full p-2">
              <span className="text-white text-lg">⏳</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">
                HOLD REQUEST PENDING
              </h3>
              <p className="text-yellow-700 text-sm">
                Waiting for {otherPartyName} to respond
              </p>
            </div>
          </div>
          {canCancel && (
            <button
              onClick={() => handleResponse(onCancel)}
              disabled={isResponding}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {isResponding ? 'Canceling...' : 'Cancel Request'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
          <div>
            <p className="text-yellow-600 mb-1 font-medium">Duration:</p>
            <p className="text-yellow-900">{formatDuration(holdRequest.duration)}</p>
          </div>
          <div>
            <p className="text-yellow-600 mb-1 font-medium">Reason:</p>
            <p className="text-yellow-900">{holdRequest.reason}</p>
          </div>
          <div>
            <p className="text-yellow-600 mb-1 font-medium">Requested:</p>
            <p className="text-yellow-900">{formatTimeAgo(holdRequest.requestedAt)}</p>
          </div>
        </div>

        {holdRequest.customMessage && (
          <div className="bg-yellow-100 rounded-lg p-3 mb-4">
            <p className="text-yellow-600 mb-1 font-medium text-sm">Your message:</p>
            <p className="text-yellow-900 text-sm italic">{holdRequest.customMessage}</p>
          </div>
        )}

        <div className="flex items-start space-x-2 text-sm text-yellow-700">
          <span>📬</span>
          <p>
            Your hold request has been sent to {otherPartyName}. Once approved, 
            this date will be exclusively reserved for your negotiation.
          </p>
        </div>
      </div>
    );
  }

  // Incoming hold request - needs response
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-300 rounded-lg p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-purple-500 rounded-full p-2">
          <span className="text-white text-lg">📥</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-purple-900">
            HOLD REQUEST RECEIVED
          </h3>
          <p className="text-purple-700 text-sm">
            {holdRequest.requester_name || otherPartyName} wants to hold this date for negotiation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
        <div>
          <p className="text-purple-600 mb-1 font-medium">Duration:</p>
          <p className="text-purple-900">{formatDuration(holdRequest.duration)}</p>
        </div>
        <div>
          <p className="text-purple-600 mb-1 font-medium">Reason:</p>
          <p className="text-purple-900">{holdRequest.reason}</p>
        </div>
        <div>
          <p className="text-purple-600 mb-1 font-medium">Requested:</p>
          <p className="text-purple-900">{formatTimeAgo(holdRequest.requestedAt)}</p>
        </div>
      </div>

      {holdRequest.customMessage && (
        <div className="bg-purple-100 rounded-lg p-3 mb-4">
          <p className="text-purple-600 mb-1 font-medium text-sm">Their message:</p>
          <p className="text-purple-900 text-sm italic">{holdRequest.customMessage}</p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-2">
          <span className="text-amber-600 text-sm">⚠️</span>
          <div className="text-sm text-amber-800">
            <strong>Important:</strong> Approving this hold will block all competing offers 
            for this date for {formatDuration(holdRequest.duration)}. Only approve if you're 
            seriously considering this opportunity.
          </div>
        </div>
      </div>

      {canRespond && (
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={() => handleResponse(onDecline)}
            disabled={isResponding}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isResponding ? 'Processing...' : 'Decline'}
          </button>
          <button
            onClick={() => handleResponse(onApprove)}
            disabled={isResponding}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {isResponding ? 'Processing...' : '🔒 Approve Hold'}
          </button>
        </div>
      )}

      {!canRespond && (
        <div className="text-center text-gray-600 text-sm">
          <p>You cannot respond to this hold request</p>
        </div>
      )}
    </div>
  );
} 
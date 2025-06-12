'use client';

import React, { useState, useEffect } from 'react';

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
  // Additional context from joins
  show_title?: string;
  show_date?: string;
  show_request_title?: string;
  show_request_date?: string;
  artist_name?: string;
}

interface HoldNotificationPanelProps {
  venueId?: string;
  currentUserId: string;
  onHoldResponse?: (holdId: string, action: 'approve' | 'decline') => void;
}

export function HoldNotificationPanel({
  venueId,
  currentUserId,
  onHoldResponse
}: HoldNotificationPanelProps) {
  const [incomingHolds, setIncomingHolds] = useState<HoldRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedHold, setExpandedHold] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchIncomingHolds();
  }, [venueId, currentUserId]);

  const fetchIncomingHolds = async () => {
    if (!venueId) return;
    
    try {
      setLoading(true);
      
      // Fetch hold requests where this venue is the target
      const response = await fetch(`/api/hold-requests?status=PENDING&targetVenueId=${venueId}`);
      
      if (response.ok) {
        const holds = await response.json();
        setIncomingHolds(holds.filter((hold: HoldRequest) => 
          hold.status === 'PENDING' && hold.requestedById !== currentUserId
        ));
      }
    } catch (error) {
      console.error('Error fetching incoming holds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHoldResponse = async (holdId: string, action: 'approve' | 'decline') => {
    try {
      setActionLoading(holdId);
      
      const response = await fetch(`/api/hold-requests/${holdId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Remove the hold from the list
        setIncomingHolds(prev => prev.filter(h => h.id !== holdId));
        onHoldResponse?.(holdId, action);
        
        // Reset expanded state if this hold was expanded
        if (expandedHold === holdId) {
          setExpandedHold(null);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to respond to hold:', errorData.error);
      }
    } catch (error) {
      console.error('Error responding to hold:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-600">Checking for hold requests...</span>
        </div>
      </div>
    );
  }

  if (incomingHolds.length === 0) {
    return null; // Don't show anything if no incoming holds
  }

  // Single hold request - show full details
  if (incomingHolds.length === 1) {
    const hold = incomingHolds[0];
    return (
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <h3 className="text-base font-semibold text-amber-900">
              🔒 Hold Request from {hold.artist_name || hold.requester_name}
            </h3>
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
              {getTimeAgo(hold.requestedAt)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleHoldResponse(hold.id, 'decline')}
              disabled={actionLoading === hold.id}
              className="px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {actionLoading === hold.id ? '...' : 'Decline'}
            </button>
            <button
              onClick={() => handleHoldResponse(hold.id, 'approve')}
              disabled={actionLoading === hold.id}
              className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium"
            >
              {actionLoading === hold.id ? '...' : 'Approve'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs text-amber-800 mb-2">
          <div><span className="font-medium">Date:</span> {hold.show_request_date ? formatDate(hold.show_request_date) : 'TBD'}</div>
          <div><span className="font-medium">Duration:</span> {hold.duration}h</div>
          <div><span className="font-medium">Reason:</span> {hold.reason}</div>
        </div>

        {hold.customMessage && (
          <div className="text-xs text-amber-800 bg-amber-100 border border-amber-200 rounded p-2">
            <span className="font-medium">Message:</span> {hold.customMessage}
          </div>
        )}
      </div>
    );
  }

  // Multiple hold requests - show compact summary with expand option
  return (
    <div className="space-y-2">
      {/* Summary header */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <h3 className="text-base font-semibold text-amber-900">
              🔒 {incomingHolds.length} Hold Requests Pending
            </h3>
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-amber-700 hover:text-amber-900 font-medium"
          >
            {showAll ? 'Hide Details' : 'Show All'}
          </button>
        </div>
        
        {!showAll && (
          <div className="mt-2 text-sm text-amber-800">
            Artists: {incomingHolds.map(h => h.artist_name || h.requester_name).join(', ')}
          </div>
        )}
      </div>

      {/* Individual hold requests */}
      {showAll && (
        <div className="space-y-2 ml-4">
          {incomingHolds.map((hold) => (
            <div
              key={hold.id}
              className="bg-white border border-amber-200 rounded-lg p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {hold.artist_name || hold.requester_name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {getTimeAgo(hold.requestedAt)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {hold.show_request_date ? formatDate(hold.show_request_date) : 'TBD'} • {hold.duration}h hold • {hold.reason}
                  </div>

                  {expandedHold === hold.id && hold.customMessage && (
                    <div className="text-sm text-gray-700 mb-2 p-2 bg-gray-50 rounded">
                      <span className="font-medium">Message:</span> {hold.customMessage}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {hold.customMessage && (
                    <button
                      onClick={() => setExpandedHold(expandedHold === hold.id ? null : hold.id)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {expandedHold === hold.id ? '▼' : '▶'}
                    </button>
                  )}
                  <button
                    onClick={() => handleHoldResponse(hold.id, 'decline')}
                    disabled={actionLoading === hold.id}
                    className="px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === hold.id ? '...' : 'Decline'}
                  </button>
                  <button
                    onClick={() => handleHoldResponse(hold.id, 'approve')}
                    disabled={actionLoading === hold.id}
                    className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {actionLoading === hold.id ? '...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
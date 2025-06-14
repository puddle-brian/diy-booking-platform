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
        
        // 🔒 SAFEGUARD: Deduplicate holds by ID to prevent React key errors
        const uniqueHolds = holds.reduce((acc: HoldRequest[], hold: HoldRequest) => {
          const existingIndex = acc.findIndex(h => h.id === hold.id);
          if (existingIndex === -1) {
            acc.push(hold);
          }
          return acc;
        }, []);
        
        console.log(`🔒 HoldNotificationPanel: Received ${holds.length} holds, deduplicated to ${uniqueHolds.length} unique holds`);
        
        setIncomingHolds(uniqueHolds.filter((hold: HoldRequest) => 
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
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (loading) {
    return (
      <div className="text-xs text-gray-500 py-1">
        Checking for hold requests...
      </div>
    );
  }

  if (incomingHolds.length === 0) {
    return null; // Don't show anything if no incoming holds
  }

  // Compact single-line notifications
  return (
    <div className="space-y-1 mb-3">
      {incomingHolds.map((hold, index) => (
        <div
          key={`${hold.id}-${index}`}
          className="bg-amber-50 border-l-2 border-amber-400 px-2 py-1 rounded-sm text-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className="text-amber-600 font-medium truncate">
                Hold Request: {hold.artist_name || hold.requester_name}
              </span>
              <span className="text-gray-500 text-xs">
                {hold.show_request_date ? formatDate(hold.show_request_date) : 'TBD'}
              </span>
              <span className="text-gray-400 text-xs flex-shrink-0">
                {hold.duration}h • {getTimeAgo(hold.requestedAt)}
              </span>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              {hold.customMessage && (
                <button
                  onClick={() => {/* TODO: show message in modal or expand */}}
                  className="text-xs text-gray-500 hover:text-gray-700 px-1"
                  title="View message"
                >
                  +
                </button>
              )}
              <button
                onClick={() => handleHoldResponse(hold.id, 'decline')}
                disabled={actionLoading === hold.id}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                {actionLoading === hold.id ? '...' : 'Decline'}
              </button>
              <button
                onClick={() => handleHoldResponse(hold.id, 'approve')}
                disabled={actionLoading === hold.id}
                className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
              >
                {actionLoading === hold.id ? '...' : 'Approve'}
              </button>
            </div>
          </div>
          
          {/* Optional second line for message if it exists - only shown when expanded */}
          {hold.customMessage && (
            <div className="text-xs text-gray-600 mt-1 truncate" title={hold.customMessage}>
              {hold.reason}: {hold.customMessage}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 
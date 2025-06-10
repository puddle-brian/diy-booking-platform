'use client';

import React, { useState, useEffect } from 'react';
import { HoldRequestForm } from './HoldRequestForm';
import { ActiveHoldDisplay } from './ActiveHoldDisplay';
import { PendingHoldDisplay } from './PendingHoldDisplay';

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

interface HoldRequestPanelProps {
  showId?: string;
  showRequestId?: string;
  currentUserId: string;
  artistId: string;
  venueId?: string;
  artistName: string;
  venueName?: string;
  onHoldChange?: (holdRequest: HoldRequest | null) => void;
}

export function HoldRequestPanel({
  showId,
  showRequestId,
  currentUserId,
  artistId,
  venueId,
  artistName,
  venueName,
  onHoldChange
}: HoldRequestPanelProps) {
  const [holdRequest, setHoldRequest] = useState<HoldRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Check if this is a synthetic ID (venue offers/bids that don't exist in database)
  const isSyntheticId = (id?: string) => {
    return id && (id.startsWith('venue-offer-') || id.startsWith('venue-bid-'));
  };

  // Fetch current hold request for this document
  const fetchHoldRequest = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (showId) params.set('showId', showId);
      if (showRequestId) params.set('showRequestId', showRequestId);
      params.set('status', 'PENDING,ACTIVE'); // Only fetch active/pending holds

      console.log('🔒 HoldRequestPanel: Fetching holds for:', { showId, showRequestId });

      const response = await fetch(`/api/hold-requests?${params}`);
      if (response.ok) {
        const holds = await response.json();
        const activeHold = holds.find((h: HoldRequest) => 
          h.status === 'ACTIVE' || h.status === 'PENDING'
        );
        
        // Only update state and call onHoldChange if the hold actually changed
        const newHoldId = activeHold?.id || null;
        const currentHoldId = holdRequest?.id || null;
        
        if (newHoldId !== currentHoldId) {
          console.log('🔒 HoldRequestPanel: Hold changed from', currentHoldId, 'to', newHoldId);
          setHoldRequest(activeHold || null);
          
          // Only trigger onHoldChange if this is NOT the initial load
          // During initial load, we're just discovering existing holds, not creating new changes
          if (!isInitialLoad) {
            onHoldChange?.(activeHold || null);
          } else {
            console.log('🔒 HoldRequestPanel: Skipping onHoldChange during initial load');
          }
        }
        
        console.log('🔒 HoldRequestPanel: Found holds:', holds.length, 'Active hold:', !!activeHold);
      } else {
        console.error('🔒 HoldRequestPanel: API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching hold request:', error);
      setError('Failed to load hold status');
    } finally {
      setLoading(false);
      setIsInitialLoad(false); // Mark initial load as complete
    }
  };

  useEffect(() => {
    setIsInitialLoad(true); // Reset for new document
    fetchHoldRequest();
  }, [showId, showRequestId]);

  const handleCreateHold = async (formData: {
    duration: number;
    reason: string;
    customMessage?: string;
  }) => {
    try {
      const response = await fetch('/api/hold-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showId,
          showRequestId,
          ...formData
        }),
      });

      if (response.ok) {
        const newHold = await response.json();
        setHoldRequest(newHold);
        setShowForm(false);
        // This is a user-initiated action, always trigger change
        onHoldChange?.(newHold);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create hold request');
      }
    } catch (error) {
      console.error('Error creating hold request:', error);
      setError('Failed to create hold request');
    }
  };

  const handleRespondToHold = async (action: 'approve' | 'decline' | 'cancel') => {
    if (!holdRequest) return;

    try {
      const response = await fetch(`/api/hold-requests/${holdRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const updatedHold = await response.json();
        setHoldRequest(updatedHold);
        // This is a user-initiated action, always trigger change
        onHoldChange?.(updatedHold);
        
        // If declined or cancelled, clear after a moment
        if (action === 'decline' || action === 'cancel') {
          setTimeout(() => {
            setHoldRequest(null);
            // This is also a user-initiated state change
            onHoldChange?.(null);
          }, 3000);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action} hold request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing hold request:`, error);
      setError(`Failed to ${action} hold request`);
    }
  };

  const getOtherPartyName = () => {
    if (!holdRequest) return '';
    
    // If current user requested the hold, show who needs to respond
    if (holdRequest.requestedById === currentUserId) {
      // We requested it, waiting for artist or venue to respond
      if (currentUserId === artistId) {
        return venueName || 'venue';
      } else {
        return artistName || 'artist';
      }
    } else {
      // Someone else requested it from us
      return holdRequest.requester_name || 'other party';
    }
  };

  const canCreateHold = () => {
    // Debug logging to see what's happening
    console.log('🔒 HoldRequestPanel: canCreateHold check:', {
      holdRequest: !!holdRequest,
      currentUserId,
      artistId,
      venueId,
      artistMatch: currentUserId === artistId,
      venueMatch: venueId && currentUserId === venueId
    });
    
    // TEMPORARY FIX: For now, allow hold creation if either artistId or venueId is present
    // TODO: Implement proper venue ownership checking
    const hasArtistAccess = artistId && currentUserId === artistId;
    const hasVenueAccess = venueId && currentUserId.startsWith('debug-'); // Any debug user can access any venue
    
    const canCreate = !holdRequest && (hasArtistAccess || hasVenueAccess);
    
    console.log('🔒 HoldRequestPanel: canCreate result:', canCreate, { hasArtistAccess, hasVenueAccess });
    
    return canCreate;
  };

  const canRespondToHold = () => {
    // Can respond if there's a pending hold and current user didn't create it
    return !!(holdRequest && 
             holdRequest.status === 'PENDING' && 
             holdRequest.requestedById !== currentUserId);
  };

  const canCancelHold = () => {
    // Can cancel if current user created the hold and it's still pending
    return !!(holdRequest && 
             holdRequest.status === 'PENDING' && 
             holdRequest.requestedById === currentUserId);
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-600">Loading hold status...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-red-600 text-sm">⚠️ {error}</span>
          </div>
          <button
            onClick={() => {
              setError(null);
              fetchHoldRequest();
            }}
            className="text-red-600 hover:text-red-800 text-sm underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Active hold state
  if (holdRequest && holdRequest.status === 'ACTIVE') {
    return (
      <ActiveHoldDisplay
        holdRequest={holdRequest}
        otherPartyName={getOtherPartyName()}
        onEndEarly={() => handleRespondToHold('cancel')}
        onExpired={() => {
          setHoldRequest(null);
          // This is an automatic expiration, always trigger change
          onHoldChange?.(null);
        }}
      />
    );
  }

  // Pending hold state
  if (holdRequest && holdRequest.status === 'PENDING') {
    return (
      <PendingHoldDisplay
        holdRequest={holdRequest}
        otherPartyName={getOtherPartyName()}
        isOutgoing={holdRequest.requestedById === currentUserId}
        onApprove={() => handleRespondToHold('approve')}
        onDecline={() => handleRespondToHold('decline')}
        onCancel={() => handleRespondToHold('cancel')}
        canRespond={canRespondToHold()}
        canCancel={canCancelHold()}
      />
    );
  }

  // No hold state - show create hold option
  if (canCreateHold()) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-1">
              🔒 Negotiation Hold Available
            </h3>
            <p className="text-sm text-blue-700">
              Request exclusive negotiation time to finalize details without competing offers
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Request Hold
          </button>
        </div>

        {showForm && (
          <div className="mt-6 pt-6 border-t border-blue-200">
            <HoldRequestForm
              onSubmit={handleCreateHold}
              onCancel={() => setShowForm(false)}
              otherPartyName={getOtherPartyName()}
            />
          </div>
        )}
      </div>
    );
  }

  // No content if user can't create holds
  return null;
} 
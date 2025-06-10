import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import OfferFormCore from './OfferFormCore';
import { parsedOfferToLegacyFormat } from './OfferInput';
import { useAlert } from './UniversalAlertModal';

interface UniversalMakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (offer: any) => void;
  // Optional pre-selected artist (when opened from artist page)
  preSelectedArtist?: {
    id: string;
    name: string;
  };
  // Optional pre-selected date (when opened from tour request)
  preSelectedDate?: string;
  // 🎯 UX IMPROVEMENT: Add request context for dismissal
  tourRequest?: {
    id: string;
    title: string;
    artistName: string;
  };
  // 🎯 UX IMPROVEMENT: Pass existing bid directly - no async detection
  existingBid?: any;
}

interface Venue {
  id: string;
  name: string;
  capacity: number;
  location: {
    city: string;
    stateProvince: string;
  };
}

export default function UniversalMakeOfferModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedArtist,
  preSelectedDate,
  tourRequest,
  existingBid
}: UniversalMakeOfferModalProps) {
  const { user } = useAuth();
  const { confirm } = useAlert();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user's venues when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadUserVenues();
    }
  }, [isOpen, user]);

  const loadUserVenues = async () => {
    try {
      // 🎯 FIX: Go directly to venues API as primary method since members API is unreliable
      console.log('🔧 Loading venues for user:', user?.id);
      
      const venuesResponse = await fetch('/api/venues');
      if (venuesResponse.ok) {
        const allVenues = await venuesResponse.json();
        console.log('🔧 All venues loaded:', allVenues.length);
        
        // 🐛 DEBUG: Log a few venues to see the actual structure
        console.log('🔧 Sample venue structure:', allVenues.slice(0, 2));
        
        // Filter for venues owned by this user (if ownership data exists)
        const ownedVenues = allVenues.filter((v: any) => v.ownerId === user?.id);
        console.log('🔧 User owned venues:', ownedVenues.length);
        
        // 🐛 DEBUG: Also try other possible ownership field names
        const altOwned1 = allVenues.filter((v: any) => v.createdBy === user?.id);
        const altOwned2 = allVenues.filter((v: any) => v.userId === user?.id);
        console.log('🔧 Alt ownership checks - createdBy:', altOwned1.length, 'userId:', altOwned2.length);
        
        if (ownedVenues.length > 0) {
          setVenues(ownedVenues);
          if (ownedVenues.length === 1) {
            setSelectedVenue(ownedVenues[0]);
          }
          console.log('✅ Venues loaded successfully');
          return;
        }
        
        // 🎯 Try alternative ownership patterns
        if (altOwned1.length > 0) {
          setVenues(altOwned1);
          if (altOwned1.length === 1) {
            setSelectedVenue(altOwned1[0]);
          }
          console.log('✅ Venues loaded via createdBy');
          return;
        }
        
        if (altOwned2.length > 0) {
          setVenues(altOwned2);
          if (altOwned2.length === 1) {
            setSelectedVenue(altOwned2[0]);
          }
          console.log('✅ Venues loaded via userId');
          return;
        }
        
        // 🎯 TEMPORARY: For testing, show Lost Bag venue if user is lidz bierenday
        if (user?.id?.startsWith('debug-')) {
          const lostBagVenue = allVenues.find((v: any) => 
            v.name?.toLowerCase().includes('lost bag') || 
            v.name?.toLowerCase().includes('lostbag')
          );
          if (lostBagVenue) {
            console.log('🎯 TEMP: Found Lost Bag venue for testing:', lostBagVenue.name);
            setVenues([lostBagVenue]);
            setSelectedVenue(lostBagVenue);
            return;
          }
        }
      }

      // Secondary: Try members API if direct ownership didn't work
      try {
        const membershipResponse = await fetch(`/api/members?entityType=venue&userId=${user?.id}`);
        
        if (membershipResponse.ok) {
          const memberships = await membershipResponse.json();
          const memberVenues = memberships
            .filter((m: any) => m.venue)
            .map((m: any) => m.venue);
          
          if (memberVenues.length > 0) {
            setVenues(memberVenues);
            if (memberVenues.length === 1) {
              setSelectedVenue(memberVenues[0]);
            }
            return;
          }
        } else {
          console.warn('Members API failed:', membershipResponse.status, await membershipResponse.text());
        }
      } catch (memberError) {
        console.warn('Members API error:', memberError);
      }

      // If we get here, user has no venues
      console.log('❌ No venues found for user');
      setError('You need to be associated with a venue to make offers. Please create a venue first.');
      
    } catch (error) {
      console.error('Failed to load venues:', error);
      setError('Failed to load your venues. You may need to create a venue first.');
    }
  };

  const handleClose = () => {
    setSelectedVenue(null);
    setError('');
    onClose();
  };

  const handleSubmit = async (formData: any) => {
    if (!selectedVenue) {
      throw new Error('No venue selected');
    }

    setLoading(true);
    setError('');

    try {
      // Convert parsed offer to legacy format
      const legacyOffer = parsedOfferToLegacyFormat(formData.offerData);
      
      // 🎯 ALWAYS CHECK FOR EXISTING BIDS: Check if we already have a bid for this artist+venue combination
      // This handles both scenarios: existing show requests and direct offers
      let existingShowRequest = null;
      let foundExistingBid = null;
      
      // First, look for any existing artist-initiated requests for this artist+date
      const checkResponse = await fetch(`/api/show-requests?artistId=${formData.artistId}`);
      if (checkResponse.ok) {
        const existingRequests = await checkResponse.json();
        
        // Look for an existing artist-initiated request on the same date
        existingShowRequest = existingRequests.find((req: any) => 
          req.initiatedBy === 'ARTIST' && 
          req.requestedDate.split('T')[0] === formData.proposedDate
        );
        
        if (existingShowRequest) {
          console.log('🎯 Found existing artist request for this date');
          
          // Check if we already have a bid on this request
          const bidCheckResponse = await fetch(`/api/show-requests/${existingShowRequest.id}/bids?venueId=${selectedVenue.id}`);
          if (bidCheckResponse.ok) {
            const venuesBids = await bidCheckResponse.json();
            if (venuesBids.length > 0) {
              foundExistingBid = venuesBids[0];
              console.log('🔄 Found existing bid on artist request');
            }
          }
        } else {
          // 🎯 NEW: Also check venue-initiated requests (our direct offers)
          const venueInitiatedRequest = existingRequests.find((req: any) => 
            req.initiatedBy === 'VENUE' && 
            req.venueId === selectedVenue.id &&
            req.requestedDate.split('T')[0] === formData.proposedDate
          );
          
          if (venueInitiatedRequest) {
            console.log('🎯 Found existing venue-initiated request (direct offer)');
            // For venue-initiated requests, the "request" itself is our "bid"
            foundExistingBid = {
              id: venueInitiatedRequest.id,
              amount: venueInitiatedRequest.amount,
              message: venueInitiatedRequest.message,
              status: venueInitiatedRequest.status,
              createdAt: venueInitiatedRequest.createdAt,
              updatedAt: venueInitiatedRequest.updatedAt
            };
            existingShowRequest = venueInitiatedRequest; // We'll update this request
          }
        }
      }

      let response;
      
      if (existingShowRequest) {
        if (existingShowRequest.initiatedBy === 'ARTIST') {
          // Create/update bid on existing artist request
          response = await fetch(`/api/show-requests/${existingShowRequest.id}/bids`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              venueId: selectedVenue.id,
              bidderId: user?.id || 'system',
              proposedDate: formData.proposedDate,
              message: formData.message,
              amount: legacyOffer.amount,
            }),
          });
        } else {
          // Update existing venue-initiated request
          response = await fetch(`/api/show-requests/${existingShowRequest.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: legacyOffer.amount,
              message: formData.message,
              requestedDate: formData.proposedDate,
            }),
          });
        }
      } else {
        // Create a new venue-initiated show request (direct offer to artist)
        response = await fetch('/api/show-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artistId: formData.artistId,
            venueId: selectedVenue.id,
            title: `${formData.artistName} - ${new Date(formData.proposedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${selectedVenue.name}`,
            requestedDate: formData.proposedDate,
            initiatedBy: 'VENUE',
            amount: legacyOffer.amount,
            doorDeal: legacyOffer.doorDeal,
            capacity: formData.capacity,
            ageRestriction: formData.ageRestriction,
            message: formData.message,
          }),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create offer');
      }

      // 🎯 SUCCESS FEEDBACK: Let user know what happened
      if (foundExistingBid) {
        console.log('✅ Successfully updated existing bid/offer');
      } else {
        console.log('✅ Successfully created new bid/offer');
      }

      onSuccess(result);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create offer');
      throw err; // Let OfferFormCore handle the error display
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (offer: any) => {
    console.log('Offer created successfully:', offer);
    onSuccess(offer);
    handleClose();
  };

  // 🎯 UX IMPROVEMENT: Delete offer functionality
  const handleDelete = async () => {
    if (!selectedVenue || !existingBid) {
      throw new Error('Cannot delete - missing venue or bid information');
    }

    try {
      console.log('🗑️ Deleting existing bid/offer:', existingBid.id);
      
      // Try deleting as a ShowRequest first (venue-initiated requests)
      let response = await fetch(`/api/show-requests/${existingBid.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Successfully deleted ShowRequest');
        onSuccess({ deleted: true });
        handleClose();
        return;
      } else if (response.status === 404) {
        // Not found as ShowRequest, try as VenueOffer
        console.log('🔄 ShowRequest not found, trying VenueOffer API');
        
        response = await fetch(`/api/venues/${selectedVenue.id}/offers/${existingBid.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('✅ Successfully deleted VenueOffer');
          onSuccess({ deleted: true });
          handleClose();
          return;
        }
      }

      // If we get here, both APIs failed
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete offer');
    } catch (error) {
      console.error('❌ Error deleting offer:', error);
      throw error;
    }
  };

  // 🎯 UX IMPROVEMENT: Dismiss request functionality for venues
  const handleDismissRequest = async () => {
    if (!tourRequest) {
      throw new Error('Cannot dismiss - missing request information');
    }

    try {
      console.log('🙈 Dismissing show request from venue timeline:', tourRequest.id);
      
      // For now, we'll implement this as a local dismissal
      // In a full implementation, you might want to track this in the backend
      // or allow venues to mark requests as "not interested"
      
      onSuccess({ dismissed: true, requestId: tourRequest.id });
      handleClose();
    } catch (error) {
      console.error('❌ Error dismissing request:', error);
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your venue information...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cannot Make Offer</h3>
              <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
                {error}
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                <a
                  href="/venues/create"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Venue
                </a>
              </div>
            </div>
          </div>
        ) : venues.length > 1 && !selectedVenue ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Venue</h3>
            <p className="text-gray-600 mb-4">
              You're a member of multiple venues. Which venue would you like to make this offer from?
            </p>
            <div className="space-y-2 mb-6">
              {venues.map((venue: Venue) => (
                <button
                  key={venue.id}
                  onClick={() => setSelectedVenue(venue)}
                  className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
                >
                  <div className="font-medium text-gray-900">{venue.name}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : selectedVenue ? (
          <OfferFormCore
            venueId={selectedVenue.id}
            venueName={selectedVenue.name}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            onDelete={existingBid ? handleDelete : undefined}
            onDismiss={!existingBid && tourRequest ? handleDismissRequest : undefined}
            confirm={confirm}
            loading={loading}
            error={error}
            preSelectedArtist={preSelectedArtist}
            preSelectedDate={preSelectedDate}
            existingBid={existingBid}
            title="Make Offer to Artist"
            subtitle={`Invite a specific artist to play at ${selectedVenue.name}`}
            submitButtonText="Send Offer"
          />
        ) : null}
      </div>
    </div>
  );
}
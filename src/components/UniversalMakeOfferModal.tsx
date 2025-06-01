import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import OfferFormCore from './OfferFormCore';

interface UniversalMakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (offer: any) => void;
  // Optional pre-selected artist (when opened from artist page)
  preSelectedArtist?: {
    id: string;
    name: string;
  };
}

interface UserVenue {
  id: string;
  name: string;
}

interface Membership {
  entityId: string;
  entityType: string;
}

// Helper function to convert parsed offer to legacy format
function parsedOfferToLegacyFormat(offerData: any) {
  if (!offerData) {
    return { amount: null, doorDeal: null };
  }

  if (offerData.type === 'guarantee') {
    return {
      amount: offerData.amount,
      doorDeal: null
    };
  } else if (offerData.type === 'door') {
    return {
      amount: null,
      doorDeal: {
        split: offerData.split,
        minimumGuarantee: offerData.minimumGuarantee || 0
      }
    };
  } else if (offerData.type === 'mixed') {
    return {
      amount: offerData.guarantee,
      doorDeal: {
        split: offerData.split,
        minimumGuarantee: offerData.guarantee || 0
      }
    };
  }

  return { amount: null, doorDeal: null };
}

export default function UniversalMakeOfferModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedArtist
}: UniversalMakeOfferModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userVenues, setUserVenues] = useState<UserVenue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<UserVenue | null>(null);

  // Fetch user's venues when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchUserVenues();
    }
  }, [isOpen, user]);

  const fetchUserVenues = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get venues where the user is a member
      const venueMemberships = user?.memberships?.filter((m: Membership) => m.entityType === 'venue') || [];
      
      if (venueMemberships.length === 0) {
        setError('You need to be a member of a venue to make offers. Please join a venue or create one first.');
        setLoading(false);
        return;
      }

      // Fetch venue details for all memberships
      const venuePromises = venueMemberships.map(async (membership: Membership) => {
        const response = await fetch(`/api/venues/${membership.entityId}`);
        if (response.ok) {
          const venue = await response.json();
          return {
            id: venue.id,
            name: venue.name
          };
        }
        return null;
      });

      const venues = (await Promise.all(venuePromises)).filter(Boolean) as UserVenue[];
      
      setUserVenues(venues);
      
      // Auto-select if only one venue
      if (venues.length === 1) {
        setSelectedVenue(venues[0]);
      }
      
    } catch (err) {
      console.error('Error fetching user venues:', err);
      setError('Failed to load your venue information. Please try again.');
    } finally {
      setLoading(false);
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
      
      const response = await fetch(`/api/venues/${selectedVenue.id}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId: formData.artistId,
          title: `${formData.artistName} - ${new Date(formData.proposedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${selectedVenue.name}`,
          proposedDate: formData.proposedDate,
          amount: legacyOffer.amount,
          doorDeal: legacyOffer.doorDeal,
          capacity: formData.capacity,
          ageRestriction: formData.ageRestriction,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create offer');
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
        ) : userVenues.length > 1 && !selectedVenue ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Venue</h3>
            <p className="text-gray-600 mb-4">
              You're a member of multiple venues. Which venue would you like to make this offer from?
            </p>
            <div className="space-y-2 mb-6">
              {userVenues.map((venue) => (
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
            loading={loading}
            error={error}
            preSelectedArtist={preSelectedArtist}
            title="Make Offer to Artist"
            subtitle={`Invite a specific artist to play at ${selectedVenue.name}`}
            submitButtonText="Send Offer"
            showCapacityField={true}
          />
        ) : null}
      </div>
    </div>
  );
} 
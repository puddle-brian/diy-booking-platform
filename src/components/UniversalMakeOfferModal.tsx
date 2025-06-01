import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import VenueOfferForm from './VenueOfferForm';

interface UniversalMakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (offer: any) => void;
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

export default function UniversalMakeOfferModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedArtist
}: UniversalMakeOfferModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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
      const venueMemberships = user?.memberships?.filter(m => m.entityType === 'venue') || [];
      
      if (venueMemberships.length === 0) {
        setError('You need to be a member of a venue to make offers. Please join a venue or create one first.');
        setLoading(false);
        return;
      }

      // Fetch venue details for all memberships
      const venuePromises = venueMemberships.map(async (membership) => {
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

  const handleSuccess = (offer: any) => {
    if (onSuccess) {
      onSuccess(offer);
    }
    onClose();
  };

  const handleClose = () => {
    setSelectedVenue(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
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
          <VenueOfferForm
            venueId={selectedVenue.id}
            venueName={selectedVenue.name}
            onSuccess={handleSuccess}
            onCancel={handleClose}
            preSelectedArtist={preSelectedArtist}
          />
        ) : null}
      </div>
    </div>
  );
} 
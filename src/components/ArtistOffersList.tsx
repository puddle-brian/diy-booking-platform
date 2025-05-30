import React, { useState, useEffect } from 'react';

interface VenueOffer {
  id: string;
  title: string;
  proposedDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  venue: {
    name: string;
    location: {
      city: string;
      stateProvince: string;
    };
    capacity?: number;
  };
  amount?: number;
  message: string;
  createdAt: string;
  expiresAt?: string;
}

interface ArtistOffersListProps {
  artistId: string;
  artistName: string;
}

export default function ArtistOffersList({ artistId, artistName }: ArtistOffersListProps) {
  const [offers, setOffers] = useState<VenueOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/artists/${artistId}/offers`);
      if (response.ok) {
        const data = await response.json();
        setOffers(data);
      } else {
        setError('Failed to load offers');
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [artistId]);

  const handleOfferAction = async (offerId: string, action: 'accept' | 'decline', reason?: string) => {
    setActionLoading(offerId);
    try {
      const response = await fetch(`/api/venues/[id]/offers/${offerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} offer`);
      }

      const result = await response.json();
      console.log(`Offer ${action}ed:`, result);
      
      // Refresh offers
      await fetchOffers();
      
      if (action === 'accept') {
        alert('Offer accepted! The show has been confirmed.');
      } else {
        alert('Offer declined.');
      }
    } catch (error) {
      console.error(`Error ${action}ing offer:`, error);
      alert(`Failed to ${action} offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingOffers = offers.filter(offer => offer.status === 'pending' && !isExpired(offer.expiresAt));
  const otherOffers = offers.filter(offer => offer.status !== 'pending' || isExpired(offer.expiresAt));

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Pending Offers */}
      {pendingOffers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Offers ({pendingOffers.length})
          </h3>
          <div className="space-y-4">
            {pendingOffers.map((offer) => (
              <div key={offer.id} className="bg-white border-2 border-blue-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{offer.title}</h4>
                    <p className="text-gray-600">
                      {offer.venue.name} • {offer.venue.location.city}, {offer.venue.location.stateProvince}
                      {offer.venue.capacity && ` • ${offer.venue.capacity} capacity`}
                    </p>
                  </div>
                  {getStatusBadge(offer.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Date</span>
                    <p className="text-gray-900 font-medium">
                      {new Date(offer.proposedDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {offer.amount && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Guarantee</span>
                      <p className="text-gray-900 font-medium">${offer.amount}</p>
                    </div>
                  )}
                  {offer.expiresAt && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Expires</span>
                      <p className="text-gray-900">
                        {new Date(offer.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4 mb-4">
                  <span className="text-sm font-medium text-gray-500">Message from venue</span>
                  <p className="text-gray-700 mt-1">{offer.message}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleOfferAction(offer.id, 'accept')}
                    disabled={actionLoading === offer.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === offer.id ? 'Processing...' : 'Accept Offer'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Optional: Why are you declining this offer?');
                      if (reason !== null) { // User didn't cancel
                        handleOfferAction(offer.id, 'decline', reason || undefined);
                      }
                    }}
                    disabled={actionLoading === offer.id}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Offers */}
      {otherOffers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Previous Offers ({otherOffers.length})
          </h3>
          <div className="space-y-4">
            {otherOffers.map((offer) => (
              <div key={offer.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{offer.title}</h4>
                    <p className="text-gray-600">
                      {offer.venue.name} • {offer.venue.location.city}, {offer.venue.location.stateProvince}
                    </p>
                  </div>
                  {getStatusBadge(offer.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Date</span>
                    <p className="text-gray-900">
                      {new Date(offer.proposedDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {offer.amount && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Guarantee</span>
                      <p className="text-gray-900">${offer.amount}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      {offer.status === 'accepted' ? 'Accepted' : 
                       offer.status === 'declined' ? 'Declined' : 'Updated'}
                    </span>
                    <p className="text-gray-900">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <span className="text-sm font-medium text-gray-500">Message</span>
                  <p className="text-gray-700 mt-1">{offer.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {offers.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
          <p className="text-gray-600">Venues will be able to make targeted offers to you here</p>
        </div>
      )}
    </div>
  );
} 
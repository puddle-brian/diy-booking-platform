import React, { useState, useEffect } from 'react';
import VenueOfferForm from './VenueOfferForm';

interface VenueOffer {
  id: string;
  title: string;
  proposedDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  artist: {
    name: string;
    location: {
      city: string;
      stateProvince: string;
    };
  };
  amount?: number;
  message: string;
  createdAt: string;
}

interface VenueOfferDashboardProps {
  venueId: string;
  venueName: string;
}

export default function VenueOfferDashboard({ venueId, venueName }: VenueOfferDashboardProps) {
  const [offers, setOffers] = useState<VenueOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [error, setError] = useState('');

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/venues/${venueId}/offers`);
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
  }, [venueId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Venue Offers</h2>
          <p className="text-gray-600">Make targeted offers to specific artists</p>
        </div>
        <button
          onClick={() => setShowOfferForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Make New Offer
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Offers List */}
      <div className="space-y-4">
        {offers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-7-4c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
            <p className="text-gray-600 mb-4">Start making targeted offers to artists you want to book</p>
            <button
              onClick={() => setShowOfferForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Make Your First Offer
            </button>
          </div>
        ) : (
          offers.map((offer) => (
            <div key={offer.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                  <p className="text-gray-600">
                    {offer.artist.name} • {offer.artist.location.city}, {offer.artist.location.stateProvince}
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
                  <span className="text-sm font-medium text-gray-500">Created</span>
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
          ))
        )}
      </div>

      {/* Offer Form Modal */}
      {showOfferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <VenueOfferForm
              venueId={venueId}
              venueName={venueName}
              onSuccess={(offer) => {
                console.log('Offer created:', offer);
                setShowOfferForm(false);
                fetchOffers(); // Refresh the list
              }}
              onCancel={() => setShowOfferForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
} 
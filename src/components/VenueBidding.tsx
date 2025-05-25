'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface TourRequest {
  id: string;
  artistId: string;
  artistName: string;
  city: string;
  state: string;
  country: string;
  requestedDate: string;
  genre: string[];
  expectedDraw: string;
  guarantee: number;
  doorSplit: number;
  description: string;
  requirements: string[];
  status: 'active' | 'closed' | 'cancelled';
  createdAt: string;
  deadline: string;
}

interface Bid {
  id: string;
  tourRequestId: string;
  venueId: string;
  venueName: string;
  guarantee: number;
  doorSplit: number;
  additionalTerms: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  submittedAt: string;
  respondedAt?: string;
}

interface VenueBiddingProps {
  venueId: string;
  venueName: string;
  artistFilter?: string; // Optional: filter to show only this artist's requests
}

export default function VenueBidding({ venueId, venueName, artistFilter }: VenueBiddingProps) {
  const { user } = useAuth();
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-bids'>('available');
  const [selectedRequest, setSelectedRequest] = useState<TourRequest | null>(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidForm, setBidForm] = useState({
    guarantee: '',
    doorSplit: '',
    additionalTerms: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTourRequests();
    loadMyBids();
  }, [venueId, artistFilter]);

  const loadTourRequests = async () => {
    try {
      // Load all active tour requests that venues can bid on
      let url = '/api/tour-requests?status=active&forVenues=true';
      
      // If artistFilter is provided, add it to the query
      if (artistFilter) {
        url += `&artistId=${artistFilter}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTourRequests(data);
      }
    } catch (error) {
      console.error('Failed to load tour requests:', error);
    }
  };

  const loadMyBids = async () => {
    try {
      // Load bids submitted by this venue
      const response = await fetch(`/api/venues/${venueId}/bids`);
      if (response.ok) {
        const data = await response.json();
        setMyBids(data);
      }
    } catch (error) {
      console.error('Failed to load my bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tour-requests/${selectedRequest.id}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueId,
          venueName,
          guarantee: parseFloat(bidForm.guarantee),
          doorSplit: parseFloat(bidForm.doorSplit),
          additionalTerms: bidForm.additionalTerms,
          message: bidForm.message,
          submittedBy: user?.id,
        }),
      });

      if (response.ok) {
        // Refresh data
        await loadMyBids();
        setShowBidForm(false);
        setSelectedRequest(null);
        setBidForm({ guarantee: '', doorSplit: '', additionalTerms: '', message: '' });
        alert('Bid submitted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to submit bid: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  const openBidForm = (request: TourRequest) => {
    setSelectedRequest(request);
    setBidForm({
      guarantee: request.guarantee.toString(),
      doorSplit: request.doorSplit.toString(),
      additionalTerms: '',
      message: `Hi ${request.artistName}! We'd love to host your show at ${venueName}. Our venue is perfect for your style and we have experience with ${request.genre.join(', ')} shows.`
    });
    setShowBidForm(true);
  };

  const getMyBidForRequest = (requestId: string) => {
    return myBids.find(bid => bid.tourRequestId === requestId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'declined': return 'text-red-600 bg-red-100';
      case 'withdrawn': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading tour requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🎵 Tour Requests</h2>
          <p className="text-gray-600">
            {artistFilter 
              ? `Bid on shows from this artist` 
              : `Bid on shows from touring artists`
            }
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Venue: {venueName}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Available Shows ({tourRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('my-bids')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-bids'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Bids ({myBids.length})
          </button>
        </nav>
      </div>

      {/* Available Shows Tab */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {tourRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tour requests available</h3>
                <p className="text-gray-600">Check back later for new touring artists looking for venues!</p>
              </div>
            </div>
          ) : (
            tourRequests.map((request) => {
              const myBid = getMyBidForRequest(request.id);
              return (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{request.artistName}</h3>
                      <div className="flex items-center text-gray-600 space-x-4 text-sm">
                        <span>📍 {request.city}, {request.state}</span>
                        <span>📅 {formatDate(request.requestedDate)}</span>
                        <span>👥 {request.expectedDraw} expected</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">${request.guarantee}</div>
                      <div className="text-sm text-gray-500">+ {request.doorSplit}% door</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 mb-2">{request.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {request.genre.map((g) => (
                        <span key={g} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  {request.requirements.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {request.requirements.map((req, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      Deadline: {formatDate(request.deadline)}
                    </div>
                    <div className="flex space-x-3">
                      {myBid ? (
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBidStatusColor(myBid.status)}`}>
                            {myBid.status.charAt(0).toUpperCase() + myBid.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-600">${myBid.guarantee}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => openBidForm(request)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Submit Bid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* My Bids Tab */}
      {activeTab === 'my-bids' && (
        <div className="space-y-4">
          {myBids.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bids submitted yet</h3>
                <p className="text-gray-600">Start bidding on available shows to see them here!</p>
              </div>
            </div>
          ) : (
            myBids.map((bid) => {
              const request = tourRequests.find(r => r.id === bid.tourRequestId);
              return (
                <div key={bid.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {request?.artistName || 'Unknown Artist'}
                      </h3>
                      <div className="flex items-center text-gray-600 space-x-4 text-sm">
                        {request && (
                          <>
                            <span>📍 {request.city}, {request.state}</span>
                            <span>📅 {formatDate(request.requestedDate)}</span>
                          </>
                        )}
                        <span>🕒 Bid submitted {formatDate(bid.submittedAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBidStatusColor(bid.status)}`}>
                        {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Your Offer:</h4>
                      <div className="text-lg font-bold text-green-600">${bid.guarantee}</div>
                      <div className="text-sm text-gray-500">+ {bid.doorSplit}% door split</div>
                    </div>
                    {bid.additionalTerms && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Additional Terms:</h4>
                        <p className="text-sm text-gray-600">{bid.additionalTerms}</p>
                      </div>
                    )}
                  </div>

                  {bid.message && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Your Message:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{bid.message}</p>
                    </div>
                  )}

                  {bid.status === 'pending' && (
                    <div className="pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          // TODO: Implement bid withdrawal
                          console.log('Withdraw bid:', bid.id);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Withdraw Bid
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bid Form Modal */}
      {showBidForm && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Submit Bid for {selectedRequest.artistName}</h3>
                <button
                  onClick={() => setShowBidForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleBidSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guarantee Amount ($)
                    </label>
                    <input
                      type="number"
                      required
                      value={bidForm.guarantee}
                      onChange={(e) => setBidForm(prev => ({ ...prev, guarantee: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Artist requested: ${selectedRequest.guarantee}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Door Split (%)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={bidForm.doorSplit}
                      onChange={(e) => setBidForm(prev => ({ ...prev, doorSplit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="70"
                    />
                    <p className="text-xs text-gray-500 mt-1">Artist requested: {selectedRequest.doorSplit}%</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Terms (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={bidForm.additionalTerms}
                    onChange={(e) => setBidForm(prev => ({ ...prev, additionalTerms: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Free drinks, merch table, parking, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message to Artist
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={bidForm.message}
                    onChange={(e) => setBidForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell them why your venue is perfect for their show..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowBidForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Bid'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
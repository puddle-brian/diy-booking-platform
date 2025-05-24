'use client';

import React, { useState, useEffect } from 'react';
import { Show, TourRequest } from '../../types';
import VenueBidForm from './VenueBidForm';

interface VenueBid {
  id: string;
  tourRequestId: string;
  venueId: string;
  venueName: string;
  proposedDate: string;
  alternativeDates?: string[];
  guarantee?: number;
  doorDeal?: {
    split: string;
    minimumGuarantee?: number;
  };
  ticketPrice: {
    advance?: number;
    door?: number;
  };
  merchandiseSplit?: string;
  capacity: number;
  ageRestriction: string;
  equipmentProvided: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  loadIn: string;
  soundcheck: string;
  doorsOpen: string;
  showTime: string;
  curfew: string;
  promotion: {
    social: boolean;
    flyerPrinting: boolean;
    radioSpots: boolean;
    pressCoverage: boolean;
  };
  lodging?: {
    offered: boolean;
    type: 'floor-space' | 'couch' | 'private-room';
    details?: string;
  };
  message: string;
  additionalTerms?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  readByArtist: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

interface TourItineraryProps {
  artistId?: string;
  venueId?: string;
  title?: string;
  editable?: boolean;
  viewerType?: 'artist' | 'venue' | 'public';
}

interface TimelineEntry {
  type: 'show' | 'tour-request' | 'venue-bid';
  date: string;
  endDate?: string;
  data: Show | TourRequest | VenueBid;
  parentTourRequest?: TourRequest; // For venue bids
}

export default function TourItinerary({ 
  artistId, 
  venueId, 
  title,
  editable = false,
  viewerType = 'public'
}: TourItineraryProps) {
  const [shows, setShows] = useState<Show[]>([]);
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [venueBids, setVenueBids] = useState<VenueBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBids, setExpandedBids] = useState<Set<string>>(new Set());
  const [showBidForm, setShowBidForm] = useState(false);
  const [selectedTourRequest, setSelectedTourRequest] = useState<TourRequest | null>(null);
  
  // Add tour request modal state
  const [showAddTourForm, setShowAddTourForm] = useState(false);
  const [tourRequestForm, setTourRequestForm] = useState({
    location: '',
    radius: 50,
    startDate: '',
    endDate: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, [artistId, venueId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (artistId) params.append('artistId', artistId);
      if (venueId) params.append('venueId', venueId);
      
      // Load shows
      const showsResponse = await fetch(`/api/shows?${params}`);
      if (!showsResponse.ok) {
        throw new Error('Failed to fetch shows');
      }
      const showsData = await showsResponse.json();
      setShows(Array.isArray(showsData) ? showsData : []);

      // Load tour requests (only for artists)
      if (artistId) {
        try {
          console.log('🗺️ Loading tour requests for artist:', artistId);
          const requestsResponse = await fetch(`/api/tour-requests?artistId=${artistId}`);
          console.log('🗺️ Tour requests API response:', requestsResponse.status);
          if (requestsResponse.ok) {
            const requestsData = await requestsResponse.json();
            console.log('🗺️ Tour requests raw data:', requestsData);
            console.log('🗺️ Tour requests array length:', requestsData?.length);
            setTourRequests(Array.isArray(requestsData) ? requestsData : []);
            
            // Load bids for each tour request
            const bidPromises = requestsData.map((request: TourRequest) =>
              fetch(`/api/tour-requests/${request.id}/bids`).then(res => res.ok ? res.json() : [])
            );
            const bidResults = await Promise.all(bidPromises);
            const allBids = bidResults.flat();
            console.log('🗺️ All bids loaded:', allBids.length);
            setVenueBids(Array.isArray(allBids) ? allBids : []);
          } else {
            console.warn('🗺️ Tour requests API failed:', requestsResponse.status);
            setTourRequests([]);
            setVenueBids([]);
          }
        } catch (requestError) {
          console.warn('🗺️ Could not load tour requests:', requestError);
          setTourRequests([]);
          setVenueBids([]);
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Combine shows, tour requests, and bids into unified timeline
  const createTimelineEntries = (): TimelineEntry[] => {
    const entries: TimelineEntry[] = [];
    
    console.log('🗺️ Creating timeline entries...');
    console.log('🗺️ Shows:', shows.length);
    console.log('🗺️ Tour requests:', tourRequests.length);
    console.log('🗺️ Venue bids:', venueBids.length);
    
    // Add confirmed shows
    shows.forEach(show => {
      entries.push({
        type: 'show',
        date: show.date,
        data: show
      });
    });
    
    // Add tour requests as date ranges
    tourRequests.forEach(request => {
      console.log('🗺️ Processing tour request:', request.id, request.title, 'status:', request.status);
      if (request.status === 'active') {
        console.log('🗺️ Adding active tour request to timeline:', request.title);
        entries.push({
          type: 'tour-request',
          date: request.startDate,
          endDate: request.endDate,
          data: request
        });
      } else {
        console.log('🗺️ Skipping tour request - not active:', request.title, request.status);
      }
    });
    
    // Add venue bids (group by tour request)
    if (artistId) {
      venueBids.forEach(bid => {
        const tourRequest = tourRequests.find(req => req.id === bid.tourRequestId);
        if (tourRequest && bid.status === 'pending') {
          entries.push({
            type: 'venue-bid',
            date: bid.proposedDate,
            data: bid,
            parentTourRequest: tourRequest
          });
        }
      });
    }
    
    console.log('🗺️ Total timeline entries created:', entries.length);
    entries.forEach(entry => {
      if (entry.type === 'show') {
        const show = entry.data as Show;
        console.log('🗺️ Entry:', entry.type, entry.date, show.artistName || show.venueName);
      } else if (entry.type === 'tour-request') {
        const request = entry.data as TourRequest;
        console.log('🗺️ Entry:', entry.type, entry.date, request.title);
      } else if (entry.type === 'venue-bid') {
        const bid = entry.data as VenueBid;
        console.log('🗺️ Entry:', entry.type, entry.date, bid.venueName);
      }
    });
    
    // Sort by date
    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const timelineEntries = createTimelineEntries();

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'hold': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleBidExpansion = (bidId: string) => {
    setExpandedBids(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bidId)) {
        newSet.delete(bidId);
      } else {
        newSet.add(bidId);
      }
      return newSet;
    });
  };

  const handleAcceptBid = async (bid: VenueBid) => {
    // TODO: Implement bid acceptance logic
    console.log('Accepting bid:', bid);
    // This would create a confirmed show and decline other bids
  };

  const handleDeclineBid = async (bid: VenueBid) => {
    // TODO: Implement bid decline logic
    console.log('Declining bid:', bid);
  };

  const handleBidSuccess = (bid: any) => {
    setShowBidForm(false);
    setSelectedTourRequest(null);
    // Refresh data to show new bid
    loadData();
  };

  const handlePlaceBid = (tourRequest: TourRequest) => {
    setSelectedTourRequest(tourRequest);
    setShowBidForm(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-center">
          <p>Error loading itinerary: {error}</p>
          <button 
            onClick={loadData}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold">
            {title || (artistId ? 'Tour Dates' : 'Booking Calendar')}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {shows.length} confirmed show{shows.length !== 1 ? 's' : ''}
            {artistId && tourRequests.length > 0 && (
              <span> • {tourRequests.length} active tour request{tourRequests.length !== 1 ? 's' : ''}</span>
            )}
            {artistId && venueBids.filter(b => b.status === 'pending').length > 0 && (
              <span> • {venueBids.filter(b => b.status === 'pending').length} pending bid{venueBids.filter(b => b.status === 'pending').length !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
      </div>

      {timelineEntries.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <p className="mb-2">
            {artistId ? 'No upcoming shows, tour requests, or bids' : 'No upcoming shows'}
          </p>
          <p className="text-sm">
            {artistId 
              ? 'Post a tour request to let venues know you\'re looking for shows'
              : 'Confirmed bookings will appear here'
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm font-medium text-gray-600">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">{artistId ? 'Venue/Request' : 'Artist'}</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Details</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {timelineEntries.map((entry, index) => {
                console.log('🗺️ Rendering table entry:', entry.type, index, entry.data);
                if (entry.type === 'show') {
                  const show = entry.data as Show;
                  return (
                    <tr key={`show-${show.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(show.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(show.date).getFullYear()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{show.city}, {show.state}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {artistId ? show.venueName : show.artistName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {show.capacity} capacity • {show.ageRestriction}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          show.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          show.status === 'hold' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {show.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {show.guarantee && `$${show.guarantee} guarantee`}
                          {show.doorDeal && ` • ${show.doorDeal.split}`}
                        </div>
                        {show.showTime && (
                          <div className="text-sm text-gray-500">
                            Show: {show.showTime}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {/* Actions for shows - could add edit/cancel buttons here */}
                      </td>
                    </tr>
                  );
                } else if (entry.type === 'tour-request') {
                  const request = entry.data as TourRequest;
                  const requestBids = venueBids.filter(bid => bid.tourRequestId === request.id && bid.status === 'pending');
                  
                  return (
                    <React.Fragment key={`request-${request.id}`}>
                      <tr className="hover:bg-blue-50 bg-blue-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-blue-900">
                            {new Date(request.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                            {' - '}
                            {new Date(request.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-blue-600">Tour Request</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-blue-900">
                            {request.cities.length > 0 ? request.cities.join(', ') : request.regions.join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-blue-900">{request.title}</div>
                          <div className="text-sm text-blue-600">
                            {request.expectedDraw.min}-{request.expectedDraw.max} draw
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {request.responses} bid{request.responses !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-blue-900">{request.flexibility.replace('-', ' ')}</div>
                          {request.guaranteeRange && (
                            <div className="text-sm text-blue-600">
                              ${request.guaranteeRange.min}-{request.guaranteeRange.max}
                            </div>
                          )}
                        </td>
                        {viewerType === 'artist' && artistId && (
                          <td className="px-6 py-4">
                            {requestBids.length > 0 && (
                              <button
                                onClick={() => toggleBidExpansion(request.id)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                {expandedBids.has(request.id) ? 'Hide' : 'View'} {requestBids.length} bid{requestBids.length !== 1 ? 's' : ''}
                              </button>
                            )}
                          </td>
                        )}
                        {(viewerType === 'venue' || viewerType === 'public') && (
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handlePlaceBid(request)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700"
                            >
                              Place Bid
                            </button>
                          </td>
                        )}
                      </tr>
                      
                      {/* Show bids for this tour request if expanded */}
                      {artistId && expandedBids.has(request.id) && requestBids.map((bid) => (
                        <tr key={`bid-${bid.id}`} className="bg-yellow-50 border-l-4 border-yellow-400">
                          <td className="px-6 py-4 pl-12">
                            <div className="text-sm font-medium text-yellow-900">
                              {new Date(bid.proposedDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-yellow-600">Venue Bid</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-yellow-900">{bid.venueName}</div>
                            <div className="text-sm text-yellow-600">
                              {bid.capacity} capacity • {bid.ageRestriction}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-yellow-900">
                              {bid.guarantee ? `$${bid.guarantee} guarantee` : 'Door deal only'}
                            </div>
                            {bid.doorDeal && (
                              <div className="text-sm text-yellow-600">
                                {bid.doorDeal.split} split
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              pending
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-yellow-900">
                              {bid.showTime && `Show: ${bid.showTime}`}
                              {bid.ticketPrice.door && ` • $${bid.ticketPrice.door} door`}
                            </div>
                            <div className="text-sm text-yellow-600 truncate max-w-xs">
                              {bid.message}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptBid(bid)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleDeclineBid(bid)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700"
                              >
                                Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                }
                return null;
              })}
              
              {/* Add Tour Request Row - only show for artist view */}
              {viewerType === 'artist' && artistId && (
                <tr className="hover:bg-gray-50">
                  <td colSpan={6} className="px-6 py-4">
                    <button
                      onClick={() => setShowAddTourForm(true)}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add tour request</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Venue Bid Form Modal */}
      {showBidForm && selectedTourRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <VenueBidForm
              tourRequest={selectedTourRequest}
              venueId="demo-venue-123" // In real app, get from auth
              venueName="Demo Venue" // In real app, get from venue profile
              onSuccess={handleBidSuccess}
              onCancel={() => {
                setShowBidForm(false);
                setSelectedTourRequest(null);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Add Tour Request Modal */}
      {showAddTourForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Tour Request</h3>
                <button
                  onClick={() => setShowAddTourForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                // TODO: Implement tour request submission
                console.log('Submitting tour request:', tourRequestForm);
                alert('Tour request created! (Feature in development)');
                setShowAddTourForm(false);
                setTourRequestForm({
                  location: '',
                  radius: 50,
                  startDate: '',
                  endDate: '',
                  description: ''
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={tourRequestForm.location}
                    onChange={(e) => setTourRequestForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Portland, OR or Pacific Northwest"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Radius
                  </label>
                  <select
                    value={tourRequestForm.radius}
                    onChange={(e) => setTourRequestForm(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={25}>25 miles</option>
                    <option value={50}>50 miles</option>
                    <option value={100}>100 miles</option>
                    <option value={200}>200 miles</option>
                    <option value={500}>500 miles (regional)</option>
                    <option value={1000}>1000+ miles (national)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={tourRequestForm.startDate}
                      onChange={(e) => setTourRequestForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={tourRequestForm.endDate}
                      onChange={(e) => setTourRequestForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={tourRequestForm.description}
                    onChange={(e) => setTourRequestForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any additional details about your tour needs..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Create Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTourForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
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
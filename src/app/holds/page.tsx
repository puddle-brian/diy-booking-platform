'use client';

import React, { useState, useEffect } from 'react';

interface HoldRequest {
  id: string;
  showId?: string;
  showRequestId?: string;
  venueOfferId?: string;
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
  // Joined data from API
  show_title?: string;
  show_date?: string;
  show_request_title?: string;
  show_request_date?: string;
  venue_offer_title?: string;
  venue_offer_date?: string;
}

interface ShowRequest {
  id: string;
  title: string;
  artistName: string;
  venueName: string;
  requestedDate: string;
  status: string;
  initiatedBy: 'ARTIST' | 'VENUE';
}

export default function HoldsPage() {
  const [holds, setHolds] = useState<HoldRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newHold, setNewHold] = useState({
    showRequestId: '',
    duration: 48,
    message: ''
  });
  
  // Real data integration
  const [showRequests, setShowRequests] = useState<ShowRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [useRealData, setUseRealData] = useState(false);
  
  // Filtering and sorting state
  const [filters, setFilters] = useState({
    status: 'ALL',
    sortBy: 'requestedAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // Fetch all holds
  const fetchHolds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hold-requests');
      if (response.ok) {
        const data = await response.json();
        setHolds(data);
      } else {
        console.error('Failed to fetch holds:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching holds:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real show requests
  const fetchShowRequests = async () => {
    try {
      setLoadingRequests(true);
      // Fetch both artist-initiated and venue-initiated requests
      const [artistResponse, venueResponse] = await Promise.all([
        fetch('/api/show-requests?initiatedBy=ARTIST'),
        fetch('/api/show-requests?initiatedBy=VENUE')
      ]);
      
      let allRequests: ShowRequest[] = [];
      
      if (artistResponse.ok) {
        const artistData = await artistResponse.json();
        allRequests.push(...artistData.map((req: any) => ({
          ...req,
          initiatedBy: 'ARTIST' as const
        })));
      }
      
      if (venueResponse.ok) {
        const venueData = await venueResponse.json();
        allRequests.push(...venueData.map((req: any) => ({
          ...req,
          initiatedBy: 'VENUE' as const
        })));
      }
      
      // Sort by most recent first
      allRequests.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
      
      setShowRequests(allRequests);
      console.log(`🎯 Loaded ${allRequests.length} real show requests for holds`);
    } catch (error) {
      console.error('Error fetching show requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Create new hold
  const createHold = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/hold-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newHold,
          reason: newHold.message, // Map to existing API field
          customMessage: undefined // Clear this field
        }),
      });

      if (response.ok) {
        const createdHold = await response.json();
        setHolds(prev => [createdHold, ...prev]);
        setNewHold({
          showRequestId: '',
          duration: 48,
          message: ''
        });
      } else if (response.status === 409) {
        // Handle duplicate hold conflict
        const error = await response.json();
        const selectedRequest = showRequests.find(req => req.id === newHold.showRequestId);
        const showTitle = selectedRequest ? selectedRequest.title : 'this show request';
        alert(`⚠️ Hold Already Exists\n\nThere's already an active or pending hold on "${showTitle}".\n\nOnly one hold per show request is allowed at a time. Check the list below to manage existing holds.`);
      } else {
        const error = await response.json();
        alert(`Failed to create hold: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating hold:', error);
      alert('Failed to create hold');
    } finally {
      setCreating(false);
    }
  };

  // Respond to hold
  const respondToHold = async (holdId: string, action: 'approve' | 'decline' | 'cancel') => {
    try {
      const response = await fetch(`/api/hold-requests/${holdId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        fetchHolds(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to ${action} hold: ${error.error}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing hold:`, error);
      alert(`Failed to ${action} hold`);
    }
  };

  // Real-time updates for countdown timers
  useEffect(() => {
    fetchHolds();
    
    // Refresh holds every minute to update timers
    const interval = setInterval(() => {
      fetchHolds();
    }, 60000); // 60 seconds
    
    // Also update the display every 30 seconds for timer accuracy
    const timerInterval = setInterval(() => {
      setHolds(prev => [...prev]); // Force re-render for countdown timers
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, []);

  // Load show requests when real data mode is enabled
  useEffect(() => {
    if (useRealData) {
      fetchShowRequests();
    }
  }, [useRealData]);

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return { expired: true, text: 'EXPIRED', color: 'text-red-600' };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      const color = hours > 12 ? 'text-green-600' : hours > 4 ? 'text-yellow-600' : 'text-red-600';
      return { expired: false, text: `${hours}h ${minutes}m`, color };
    } else {
      const color = minutes > 30 ? 'text-yellow-600' : 'text-red-600';
      return { expired: false, text: `${minutes}m`, color };
    }
  };

  const getStatusBadge = (status: string, expiresAt?: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      DECLINED: 'bg-red-100 text-red-800'
    };
    
    // For ACTIVE holds, show countdown timer
    if (status === 'ACTIVE' && expiresAt) {
      const timeInfo = getTimeRemaining(expiresAt);
      return (
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
            {status}
          </span>
          <span className={`text-sm font-mono font-bold ${timeInfo.color}`}>
            ⏱️ {timeInfo.text}
          </span>
        </div>
      );
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter and sort holds
  const getFilteredAndSortedHolds = () => {
    let filtered = holds;
    
    // Filter by status
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(hold => hold.status === filters.status);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'requestedAt':
          aValue = new Date(a.requestedAt).getTime();
          bValue = new Date(b.requestedAt).getTime();
          break;
        case 'expiresAt':
          aValue = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
          bValue = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'status':
          // Sort by status priority: ACTIVE > PENDING > EXPIRED > DECLINED > CANCELLED
          const statusPriority = { ACTIVE: 5, PENDING: 4, EXPIRED: 3, DECLINED: 2, CANCELLED: 1 };
          aValue = statusPriority[a.status as keyof typeof statusPriority] || 0;
          bValue = statusPriority[b.status as keyof typeof statusPriority] || 0;
          break;
        default:
          aValue = a.requestedAt;
          bValue = b.requestedAt;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading holds...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">🔒 Hold Request System</h1>
            <p className="text-gray-600 mt-1">
              Standalone hold management - testing without document integration
            </p>
          </div>

          {/* Filters and Sorting */}
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">🟢 Active</option>
                  <option value="PENDING">🟡 Pending</option>
                  <option value="EXPIRED">🔴 Expired</option>
                  <option value="DECLINED">❌ Declined</option>
                  <option value="CANCELLED">⚫ Cancelled</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="requestedAt">Date Requested</option>
                  <option value="expiresAt">Expiration Date</option>
                  <option value="duration">Duration</option>
                  <option value="status">Status Priority</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Order:</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                  className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Create New Hold Form */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Create New Hold</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Data Source:
                </label>
                <button
                  onClick={() => setUseRealData(!useRealData)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    useRealData 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {useRealData ? '🎯 Real Data' : '🧪 Test Mode'}
                </button>
                {useRealData && loadingRequests && (
                  <span className="text-xs text-gray-500">Loading...</span>
                )}
              </div>
            </div>
            
            {useRealData && showRequests.length > 0 && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-800 font-medium">🎯 Real Data Mode Active</span>
                    <span className="text-green-700">
                      Loaded {showRequests.length} show requests ({showRequests.filter(r => r.initiatedBy === 'ARTIST').length} artist-initiated, {showRequests.filter(r => r.initiatedBy === 'VENUE').length} venue-initiated)
                    </span>
                  </div>
                  <div className="flex space-x-3 text-xs">
                    {(() => {
                      const withHolds = showRequests.filter(req => 
                        holds.some(hold => 
                          hold.showRequestId === req.id && 
                          ['PENDING', 'ACTIVE'].includes(hold.status)
                        )
                      ).length;
                      const available = showRequests.length - withHolds;
                      return (
                        <>
                          <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full">
                            ✅ {available} Available
                          </span>
                          <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full">
                            🔒 {withHolds} With Holds
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            
            {useRealData && showRequests.length === 0 && !loadingRequests && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm text-yellow-800">
                  ⚠️ No show requests found. Try refreshing or switch back to test mode.
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {useRealData ? 'Show Request' : 'Show Request ID'}
                </label>
                {useRealData ? (
                  <select
                    value={newHold.showRequestId}
                    onChange={(e) => setNewHold(prev => ({ ...prev, showRequestId: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={loadingRequests}
                  >
                    <option value="">Select a show request...</option>
                    {showRequests.map((request) => {
                      const hasHold = holds.some(hold => 
                        hold.showRequestId === request.id && 
                        ['PENDING', 'ACTIVE'].includes(hold.status)
                      );
                      return (
                        <option key={request.id} value={request.id} disabled={hasHold}>
                          {request.initiatedBy === 'ARTIST' ? '🎵' : '🏢'} {request.title} - {request.artistName} @ {request.venueName}
                          {hasHold ? ' 🔒 (Hold Active)' : ''}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newHold.showRequestId}
                    onChange={(e) => setNewHold(prev => ({ ...prev, showRequestId: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter test show request ID"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (hours)</label>
                <select
                  value={newHold.duration}
                  onChange={(e) => setNewHold(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>72 hours</option>
                  <option value={168}>1 week</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={newHold.message}
                  onChange={(e) => setNewHold(prev => ({ ...prev, message: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={2}
                  placeholder="Reason for hold request or additional context..."
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={createHold}
                  disabled={creating || !newHold.showRequestId || !newHold.message}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
                >
                  {creating ? 'Creating...' : 'Create Hold'}
                </button>
              </div>
            </div>
          </div>

          {/* Holds List */}
          <div className="px-6 py-4">
                              <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Hold Requests
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div>
                        Showing {getFilteredAndSortedHolds().length} of {holds.length} holds
                        {filters.status !== 'ALL' && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {filters.status} filter active
                          </span>
                        )}
                      </div>
                      {holds.length > 0 && (
                        <div className="flex space-x-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            🎯 {holds.filter(h => h.show_request_title || h.show_title || h.venue_offer_title).length} Real
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                            🧪 {holds.filter(h => !h.show_request_title && !h.show_title && !h.venue_offer_title).length} Test
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
            
            {getFilteredAndSortedHolds().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {holds.length === 0 
                  ? "No holds found. Create one above to test the system."
                  : `No holds match the current filters. Try changing the status filter.`
                }
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredAndSortedHolds().map((hold) => (
                  <div key={hold.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          Hold #{hold.id.slice(-8)}
                        </h3>
                        {getStatusBadge(hold.status, hold.expiresAt)}
                      </div>
                      <div className="flex space-x-2">
                        {hold.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => respondToHold(hold.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => respondToHold(hold.id, 'decline')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {(hold.status === 'PENDING' || hold.status === 'ACTIVE') && (
                          <button
                            onClick={() => respondToHold(hold.id, 'cancel')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Document:</span>
                        <span className="ml-1 text-gray-600">
                          {hold.show_request_title ? (
                            `${hold.show_request_title} (${hold.showRequestId?.slice(-8)})`
                          ) : hold.show_title ? (
                            `${hold.show_title} (${hold.showId?.slice(-8)})`
                          ) : hold.venue_offer_title ? (
                            `${hold.venue_offer_title} (${hold.venueOfferId?.slice(-8)})`
                          ) : hold.showRequestId ? (
                            `Request ${hold.showRequestId.slice(-8)}`
                          ) : hold.showId ? (
                            `Show ${hold.showId.slice(-8)}`
                          ) : hold.venueOfferId ? (
                            `Offer ${hold.venueOfferId.slice(-8)}`
                          ) : (
                            'Standalone Test'
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <span className="ml-1 text-gray-600">{hold.duration} hours</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Requested:</span>
                        <span className="ml-1 text-gray-600">{formatDate(hold.requestedAt)}</span>
                      </div>
                      {hold.expiresAt && (
                        <div>
                          <span className="font-medium text-gray-700">Expires:</span>
                          <span className="ml-1 text-gray-600">{formatDate(hold.expiresAt)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Message:</span>
                      <span className="ml-1 text-gray-600">{hold.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
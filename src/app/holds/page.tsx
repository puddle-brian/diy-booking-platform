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
}

export default function HoldsPage() {
  const [holds, setHolds] = useState<HoldRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newHold, setNewHold] = useState({
    showRequestId: '',
    duration: 48,
    reason: '',
    customMessage: ''
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

  // Create new hold
  const createHold = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/hold-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHold),
      });

      if (response.ok) {
        const createdHold = await response.json();
        setHolds(prev => [createdHold, ...prev]);
        setNewHold({
          showRequestId: '',
          duration: 48,
          reason: '',
          customMessage: ''
        });
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

  useEffect(() => {
    fetchHolds();
  }, []);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      DECLINED: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

          {/* Create New Hold Form */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Hold</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Show Request ID</label>
                <input
                  type="text"
                  value={newHold.showRequestId}
                  onChange={(e) => setNewHold(prev => ({ ...prev, showRequestId: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter show request ID"
                />
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
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <input
                  type="text"
                  value={newHold.reason}
                  onChange={(e) => setNewHold(prev => ({ ...prev, reason: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Negotiation time needed"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={createHold}
                  disabled={creating || !newHold.showRequestId || !newHold.reason}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
                >
                  {creating ? 'Creating...' : 'Create Hold'}
                </button>
              </div>
            </div>
            {newHold.customMessage !== undefined && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Custom Message (Optional)</label>
                <textarea
                  value={newHold.customMessage}
                  onChange={(e) => setNewHold(prev => ({ ...prev, customMessage: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={2}
                  placeholder="Additional context..."
                />
              </div>
            )}
          </div>

          {/* Holds List */}
          <div className="px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              All Holds ({holds.length})
            </h2>
            
            {holds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No holds found. Create one above to test the system.
              </div>
            ) : (
              <div className="space-y-4">
                {holds.map((hold) => (
                  <div key={hold.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          Hold #{hold.id.slice(-8)}
                        </h3>
                        {getStatusBadge(hold.status)}
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
                          {hold.showId ? `Show ${hold.showId.slice(-8)}` : 
                           hold.showRequestId ? `Request ${hold.showRequestId.slice(-8)}` :
                           hold.venueOfferId ? `Offer ${hold.venueOfferId.slice(-8)}` : 'Unknown'}
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
                      <span className="font-medium text-gray-700">Reason:</span>
                      <span className="ml-1 text-gray-600">{hold.reason}</span>
                    </div>
                    
                    {hold.customMessage && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-700">Message:</span>
                        <span className="ml-1 text-gray-600">{hold.customMessage}</span>
                      </div>
                    )}
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
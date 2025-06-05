'use client';

import React, { useState } from 'react';
import { HoldRequestPanel } from '../../components/HoldRequestPanel';

export default function TestHoldsPage() {
  const [currentTest, setCurrentTest] = useState<'no-hold' | 'pending-out' | 'pending-in' | 'active'>('no-hold');

  // Mock data for testing
  const getMockHoldRequest = () => {
    switch (currentTest) {
      case 'pending-out':
        return {
          id: 'test-hold-123',
          showId: 'test-show-123',
          requestedById: 'user-123',
          targetUserId: 'venue-789',
          status: 'PENDING' as const,
          duration: 48,
          reason: 'Need to confirm opening acts',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        };
      case 'pending-in':
        return {
          id: 'test-hold-456',
          showId: 'test-show-123',
          requestedById: 'venue-789',
          targetUserId: 'user-123',
          status: 'PENDING' as const,
          duration: 48,
          reason: 'Waiting for collective decision',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        };
      case 'active':
        return {
          id: 'test-hold-789',
          showId: 'test-show-123',
          requestedById: 'venue-789',
          targetUserId: 'user-123',
          status: 'ACTIVE' as const,
          duration: 48,
          reason: 'Need to confirm opening acts',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago (1 day into 48 hour hold)
          updatedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // Approved 23 hours ago
          expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000 + 45 * 60 * 1000 + 12 * 1000).toISOString() // 23h 45m 12s from now
        };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔒 Hold Request System Test Page
          </h1>
          <p className="text-gray-600 mb-4">
            Test the document-integrated hold system with different states and scenarios using the actual component.
          </p>
          
          {/* Test Scenario Selector */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentTest('no-hold')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTest === 'no-hold' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              No Hold State
            </button>
            <button
              onClick={() => setCurrentTest('pending-out')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTest === 'pending-out' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending (Outgoing)
            </button>
            <button
              onClick={() => setCurrentTest('pending-in')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTest === 'pending-in' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending (Incoming)
            </button>
            <button
              onClick={() => setCurrentTest('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTest === 'active' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Active Hold
            </button>
          </div>
        </div>

        {/* Mock Show Document */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Document Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  The Midnight Collective at The Underground
                </h2>
                <p className="text-gray-600 mt-1">
                  March 15, 2024 • Show Document Demo
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                  ⏳ Negotiating
                </span>
              </div>
            </div>
          </div>

          {/* Hold Request Panel Integration - Using Real Component */}
          <div className="border-b border-gray-100">
                         <HoldRequestPanel
               showId="test-show-123"
               showRequestId={undefined}
               currentUserId="user-123"
               artistId="artist-456"
               venueId="venue-789"
               artistName="The Midnight Collective"
               venueName="The Underground"
               onHoldChange={(holdRequest) => {
                 console.log('Hold changed:', holdRequest);
               }}
             />
          </div>

          {/* Rest of mock show document */}
          <div className="p-6 space-y-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Show Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <span className="ml-2">March 15, 2024</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Artist:</span>
                  <span className="ml-2">The Midnight Collective</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Venue:</span>
                  <span className="ml-2">The Underground</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Capacity:</span>
                  <span className="ml-2">150 people</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Financial Terms</h3>
              {currentTest === 'active' ? (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-blue-800">
                    🔒 <strong>Exclusive Negotiation Mode:</strong> Use this protected time 
                    to finalize financial terms. No competing offers can be made during the hold period.
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">
                  $400 guarantee + 70/30 door split after costs
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">🔧 How to Test</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>1.</strong> Use the buttons above to switch between different hold states</p>
            <p><strong>2.</strong> Notice how the actual component changes for each scenario</p>
            <p><strong>3.</strong> Try clicking the action buttons to see realistic interactions</p>
            <p><strong>4.</strong> Observe the real-time countdown timer in active state</p>
            <p><strong>5.</strong> See how it integrates seamlessly into show documents</p>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 text-sm">
              <strong>🎉 Now Live!</strong> This hold request system is now integrated into all show documents. 
              Open any show document to see it in action with real data!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
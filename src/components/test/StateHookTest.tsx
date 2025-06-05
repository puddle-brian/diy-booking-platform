'use client';

import React from 'react';
import { useItineraryState } from '../../hooks/useItineraryState';

// Simple test component to verify our state hook works
export default function StateHookTest() {
  const { state, actions } = useItineraryState();

  return (
    <div className="p-4 space-y-4 bg-white border rounded">
      <h3 className="font-bold">State Hook Test</h3>
      
      {/* Test expansion state */}
      <div>
        <h4 className="font-medium">Expansion State:</h4>
        <p>Expanded Bids: {Array.from(state.expandedBids).join(', ') || 'none'}</p>
        <p>Expanded Shows: {Array.from(state.expandedShows).join(', ') || 'none'}</p>
        <button 
          onClick={() => actions.toggleBidExpansion('test-bid-1')}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Toggle Bid 1
        </button>
        <button 
          onClick={() => actions.toggleShowExpansion('test-show-1')}
          className="ml-2 px-2 py-1 bg-green-500 text-white rounded text-sm"
        >
          Toggle Show 1
        </button>
      </div>

      {/* Test modal state */}
      <div>
        <h4 className="font-medium">Modal State:</h4>
        <p>Show Detail Modal: {state.showDetailModal ? 'open' : 'closed'}</p>
        <p>Universal Offer Modal: {state.showUniversalOfferModal ? 'open' : 'closed'}</p>
        <button 
          onClick={() => actions.openShowDetail({ id: 'test', date: '2024-01-01' } as any)}
          className="px-2 py-1 bg-purple-500 text-white rounded text-sm"
        >
          Open Show Detail
        </button>
        <button 
          onClick={() => actions.closeShowDetail()}
          className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-sm"
        >
          Close Show Detail
        </button>
      </div>

      {/* Test loading state */}
      <div>
        <h4 className="font-medium">Loading State:</h4>
        <p>Delete Loading: {state.deleteLoading || 'none'}</p>
        <button 
          onClick={() => actions.setDeleteLoading('test-id')}
          className="px-2 py-1 bg-orange-500 text-white rounded text-sm"
        >
          Set Loading
        </button>
        <button 
          onClick={() => actions.setDeleteLoading(null)}
          className="ml-2 px-2 py-1 bg-gray-500 text-white rounded text-sm"
        >
          Clear Loading
        </button>
      </div>

      {/* Test optimistic state */}
      <div>
        <h4 className="font-medium">Optimistic State:</h4>
        <p>Deleted Shows: {Array.from(state.deletedShows).join(', ') || 'none'}</p>
        <button 
          onClick={() => actions.deleteShowOptimistic('test-show-delete')}
          className="px-2 py-1 bg-red-600 text-white rounded text-sm"
        >
          Delete Show (Optimistic)
        </button>
        <button 
          onClick={() => actions.resetOptimisticState()}
          className="ml-2 px-2 py-1 bg-gray-600 text-white rounded text-sm"
        >
          Reset Optimistic
        </button>
      </div>

      {/* Test active month */}
      <div>
        <h4 className="font-medium">Active Month:</h4>
        <p>Current: {state.activeMonthTab || 'none'}</p>
        <button 
          onClick={() => actions.setActiveMonth('2024-01')}
          className="px-2 py-1 bg-indigo-500 text-white rounded text-sm"
        >
          Set Jan 2024
        </button>
        <button 
          onClick={() => actions.setActiveMonth('2024-02')}
          className="ml-2 px-2 py-1 bg-indigo-500 text-white rounded text-sm"
        >
          Set Feb 2024
        </button>
      </div>
    </div>
  );
} 
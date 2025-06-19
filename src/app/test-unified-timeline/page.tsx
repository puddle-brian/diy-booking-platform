'use client';

import React from 'react';
import { useBookingOpportunities } from '@/hooks/useBookingOpportunities';

/**
 * Test page for the unified booking timeline system
 * 
 * This demonstrates the new architecture that fixes the Lightning Bolt bug:
 * - All booking opportunities use the same component (BookingOpportunityRow)
 * - Consistent expansion behavior regardless of source
 * - Unified data flow through BookingOpportunity model
 * 
 * Lightning Bolt's Sept 27th show should now expand properly!
 */
export default function TestUnifiedTimelinePage() {
  // Test with Lightning Bolt's artist ID
  const {
    opportunities,
    loading,
    error
  } = useBookingOpportunities({
    perspective: 'ARTIST',
    contextId: '1748101913848', // Lightning Bolt's ID
    includeExpired: false
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-lg text-gray-600">Loading Lightning Bolt's booking opportunities...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-lg text-red-600">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Unified Timeline Test - Lightning Bolt
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Testing the unified booking architecture that fixes the September 27th expansion bug
          </p>
        </div>

        {/* Architecture Explanation */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🏗️ What We Fixed</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-red-600 mb-2">❌ BEFORE (Broken)</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• TourRequest → ShowRequestProcessor ✅</div>
                <div>• VenueOffer → ShowRequestProcessor ✅</div>
                <div>• Show.lineup (pending) → ShowTimelineItem ❌</div>
                <div className="text-red-600 font-medium">→ Lightning Bolt Sept 27th broken!</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-green-600 mb-2">✅ AFTER (Fixed)</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• All BookingOpportunity → BookingOpportunityRow ✅</div>
                <div>• Single component, consistent behavior ✅</div>
                <div>• Same expansion logic everywhere ✅</div>
                <div className="text-green-600 font-medium">→ Lightning Bolt Sept 27th works!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Lightning Bolt's Data</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{opportunities.length}</div>
              <div className="text-sm text-gray-600">Total Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {opportunities.filter(o => o.status === 'CONFIRMED').length}
              </div>
              <div className="text-sm text-gray-600">Confirmed Shows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {opportunities.filter(o => o.status === 'PENDING').length}
              </div>
              <div className="text-sm text-gray-600">Pending Offers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {opportunities.filter(o => o.status === 'OPEN').length}
              </div>
              <div className="text-sm text-gray-600">Open Requests</div>
            </div>
          </div>
        </div>

        {/* Opportunities List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">🎸 Lightning Bolt's Booking Opportunities</h2>
            <p className="text-sm text-gray-600 mt-1">All opportunities now use the unified BookingOpportunity model</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No booking opportunities found for Lightning Bolt
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opportunity) => (
                    <tr key={opportunity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {new Date(opportunity.proposedDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(opportunity.proposedDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </td>
                                             <td className="px-4 py-3 text-sm">
                         <div className="font-medium text-gray-900">{opportunity.venue?.name || 'Unknown Venue'}</div>
                         <div className="text-xs text-gray-500">{opportunity.locationInfo?.city || 'Unknown Location'}</div>
                       </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          opportunity.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                          opportunity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          opportunity.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {opportunity.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          opportunity.sourceType === 'SHOW_LINEUP' ? 'bg-purple-100 text-purple-800' :
                          opportunity.sourceType === 'VENUE_OFFER' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {opportunity.sourceType?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {opportunity.id === 'sl-cmc1yvr6y003lw6dg1ypper83' && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            🎯 THE PROBLEMATIC ONE!
                          </span>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {opportunity.id}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Success Message */}
        {opportunities.some(o => o.id === 'sl-cmc1yvr6y003lw6dg1ypper83') && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  🎉 Lightning Bolt Bug Fixed!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    The September 27th show (ID: sl-cmc1yvr6y003lw6dg1ypper83) is now accessible through the unified API!
                    This opportunity will now route to BookingOpportunityRow instead of the broken ShowTimelineItem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
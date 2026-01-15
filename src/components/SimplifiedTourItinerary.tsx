'use client';

import React, { useState } from 'react';
import { useUnifiedTimelineData, TimelineItem } from '../hooks/useUnifiedTimelineData';
import { UnifiedTimelineRow } from './UnifiedTimelineRow';
import { VenueBid, VenueOffer, BidStatus } from '../../types';
import { BidService } from '../services/BidService';
import { useAlert } from './UniversalAlertModal';

interface SimplifiedTourItineraryProps {
  artistId?: string;
  artistName?: string;
  venueId?: string;
  venueName?: string;
  title?: string;
  showTitle?: boolean;
  editable?: boolean;
  viewerType?: 'artist' | 'venue' | 'public';
}

export default function SimplifiedTourItinerary({
  artistId,
  artistName,
  venueId,
  venueName,
  title,
  showTitle = true,
  editable = false,
  viewerType = 'public'
}: SimplifiedTourItineraryProps) {
  
  // 🎯 PHASE 2.1: Use unified data hook - eliminates synthetic data conversions
  const {
    items: timelineItems,
    shows,
    venueBids,
    venueOffers,
    loading,
    error,
    refresh
  } = useUnifiedTimelineData({ artistId, venueId, viewerType });

  // Simple state management
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [bidStatusOverrides, setBidStatusOverrides] = useState<Map<string, BidStatus>>(new Map());

  // Alert system
  const { AlertModal, confirm, error: showError, success: showSuccess, toast } = useAlert();

  // 🎯 PHASE 2.1: Simplified permissions - no complex hooks needed
  const permissions = {
    actualViewerType: viewerType,
    canEdit: editable,
    canBid: viewerType === 'venue' && !venueId, // Venues can bid on artist requests
    canOffer: viewerType === 'venue' && venueId, // Venues can make offers to artists
    canRespond: viewerType === 'artist' || (viewerType === 'venue' && venueId)
  };

  // Group items by month for display
  const itemsByMonth = timelineItems.reduce((groups, item) => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!groups[monthKey]) {
      groups[monthKey] = {
        monthKey,
        monthLabel,
        items: []
      };
    }
    groups[monthKey].items.push(item);
    return groups;
  }, {} as Record<string, { monthKey: string; monthLabel: string; items: TimelineItem[] }>);

  const monthGroups = Object.values(itemsByMonth).sort((a, b) => 
    new Date(b.monthKey + '-01').getTime() - new Date(a.monthKey + '-01').getTime()
  );

  const handleToggleExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleBidAction = async (bid: VenueBid, action: string, reason?: string) => {
    const callbacks = {
      setBidStatusOverrides,
      setDeclinedBids: () => {}, // Simplified - let refresh handle updates
      setBidActions: () => {},
      fetchData: refresh,
      showSuccess,
      showError,
      showInfo: (title: string, message: string) => toast('info', title, message),
      toast,
      confirm
    };

    try {
      await BidService.handleBidAction(
        bid,
        action,
        callbacks,
        bidStatusOverrides,
        shows,
        venueBids,
        venueOffers,
        reason
      );
    } catch (error) {
      console.error('Error handling bid action:', error);
      showError('Action Failed', `Failed to ${action} bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleOfferAction = async (offer: VenueOffer, action: string) => {
    const callbacks = {
      setBidStatusOverrides,
      setDeclinedBids: () => {},
      setBidActions: () => {},
      fetchData: refresh,
      showSuccess,
      showError,
      showInfo: (title: string, message: string) => toast('info', title, message),
      toast,
      confirm,
      deleteRequestOptimistic: () => {} // Simplified - let refresh handle updates
    };

    try {
      await BidService.handleOfferAction(
        offer,
        action,
        callbacks,
        bidStatusOverrides,
        shows,
        venueBids,
        venueOffers
      );
    } catch (error) {
      console.error('Error handling offer action:', error);
      showError('Action Failed', `Failed to ${action} offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 shadow-md rounded-xl p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 shadow-md rounded-xl p-8">
        <div className="text-center">
          <div className="text-status-error mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="font-mono text-text-primary mb-2">// ERROR_LOADING_TIMELINE</h3>
          <p className="text-text-secondary font-mono text-sm mb-4">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center px-4 py-2 border border-text-primary text-text-primary font-mono hover:bg-text-primary hover:text-bg-primary transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            [RETRY]
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {AlertModal}
      <div className="bg-bg-secondary border border-border-primary overflow-hidden">
        {/* Header */}
        {showTitle && (
          <div className="px-6 py-4 border-b border-border-primary bg-bg-tertiary">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-text-primary">
                  &gt;&gt; {(title || (artistId ? 'SHOW_DATES' : 'BOOKING_CALENDAR')).toUpperCase().replace(/ /g, '_')}
                </h3>
                <p className="text-sm text-text-secondary mt-1 font-mono">
                  [{timelineItems.length}] total event{timelineItems.length !== 1 ? 's' : ''}
                  {artistId && (
                    <span> for {artistName || 'artist'}</span>
                  )}
                  {venueId && (
                    <span> at {venueName || 'venue'}</span>
                  )}
                </p>
              </div>
              {editable && (
                <button
                  onClick={refresh}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-mono border border-border-secondary text-text-secondary hover:border-text-primary hover:text-text-primary transition-colors"
                  title="Refresh data to get the latest updates"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  [REFRESH]
                </button>
              )}
            </div>
          </div>
        )}

        {/* Timeline Content */}
        {timelineItems.length === 0 ? (
          <div className="px-6 py-12 text-center bg-bg-primary">
            <div className="text-text-muted mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a4 4 0 118 0v4m-4 16l-4-4m8 0l-4 4m-4-8h8" />
              </svg>
            </div>
            <h3 className="font-mono text-text-primary mb-2">// NO_EVENTS_YET</h3>
            <p className="text-text-secondary font-mono text-sm">
              {artistId 
                ? "Start building your tour by creating show requests or responding to venue offers."
                : "No events found. Create some show requests or check back later."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-primary bg-bg-primary">
            {monthGroups.map((monthGroup) => (
              <div key={monthGroup.monthKey} className="p-6">
                <h4 className="font-mono text-text-primary mb-4">
                  {monthGroup.monthLabel.toUpperCase()}
                  <span className="ml-2 text-sm text-status-active">
                    [{monthGroup.items.length}]
                  </span>
                </h4>
                <div className="space-y-4">
                  {monthGroup.items.map((item) => (
                    <UnifiedTimelineRow
                      key={item.id}
                      item={item}
                      isExpanded={expandedItems.has(item.id)}
                      onToggleExpansion={handleToggleExpansion}
                      onBidAction={handleBidAction}
                      onOfferAction={handleOfferAction}
                      permissions={permissions}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 
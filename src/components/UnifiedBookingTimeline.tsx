import React, { useState, useEffect } from 'react';
import { BookingOpportunity } from '@/types/BookingOpportunity';
import { useBookingOpportunities } from '@/hooks/useBookingOpportunities';
import { BookingOpportunityRow } from './BookingOpportunityRow';
import { useItineraryPermissions } from '../hooks/useItineraryPermissions';
import { useAlert } from './UniversalAlertModal';
import {
  createUnifiedTimelineEntries,
  groupUnifiedEntriesByMonth,
  generateUnifiedStableMonthTabs,
  getUnifiedDefaultActiveMonth,
  extractDateFromOpportunity,
  getTimelineStats,
  UnifiedTimelineEntry,
  UnifiedMonthGroup
} from '../utils/unifiedTimelineUtils';

interface UnifiedBookingTimelineProps {
  artistId?: string;
  artistName?: string;
  venueId?: string;
  venueName?: string;
  title?: string;
  showTitle?: boolean;
  editable?: boolean;
  viewerType?: 'artist' | 'venue' | 'public';
}

/**
 * UnifiedBookingTimeline - THE FUTURE OF TIMELINE RENDERING
 * 
 * This component demonstrates the unified architecture:
 * - Single data source (BookingOpportunity)
 * - Single component (BookingOpportunityRow)
 * - Consistent behavior regardless of opportunity source
 * 
 * FIXES Lightning Bolt Bug:
 * ✅ All booking opportunities route to same component
 * ✅ Consistent expansion behavior
 * ✅ Same status display logic
 * ✅ Unified styling system
 * 
 * REPLACES:
 * - Complex TabbedTourItinerary logic
 * - ShowTimelineItem + ShowRequestProcessor dual system
 * - Synthetic data conversion
 */
export function UnifiedBookingTimeline({
  artistId,
  artistName,
  venueId,
  venueName,
  title,
  showTitle = true,
  editable = false,
  viewerType = 'public'
}: UnifiedBookingTimelineProps) {
  
  // Determine perspective and context
  const perspective: 'ARTIST' | 'VENUE' = artistId ? 'ARTIST' : 'VENUE';
  const contextId = artistId || venueId || '';
  
  // Fetch unified booking opportunities
  const {
    opportunities,
    metadata,
    loading,
    error: fetchError,
    refetch: fetchData
  } = useBookingOpportunities({
    perspective,
    contextId,
    includeExpired: false
  });
  
  // Get permissions
  const permissions = useItineraryPermissions({
    viewerType,
    editable,
    artistId,
    venueId,
    venueName
  });
  
  // Alert system
  const { AlertModal, confirm, error: showError, success: showSuccess, info: showInfo, toast } = useAlert();
  
  // Timeline state
  const [expandedOpportunities, setExpandedOpportunities] = useState<Set<string>>(new Set());
  const [activeMonthTab, setActiveMonthTab] = useState<string>('');
  const [deletingOpportunities, setDeletingOpportunities] = useState<Set<string>>(new Set());
  
  // Create unified timeline entries
  const timelineEntries = createUnifiedTimelineEntries(
    opportunities,
    perspective,
    contextId
  );
  
  // Group by month
  const monthGroups = groupUnifiedEntriesByMonth(timelineEntries);
  const stableMonthTabs = generateUnifiedStableMonthTabs(monthGroups);
  
  // Set default active month
  useEffect(() => {
    if (!activeMonthTab && stableMonthTabs.length > 0) {
      const defaultMonth = getUnifiedDefaultActiveMonth(stableMonthTabs);
      setActiveMonthTab(defaultMonth);
    }
  }, [stableMonthTabs.length, activeMonthTab]);
  
  // Get active month entries
  const activeMonthEntries = stableMonthTabs.find(group => group.monthKey === activeMonthTab)?.entries || [];
  
  // Get timeline statistics
  const stats = getTimelineStats(opportunities);
  
  // Event handlers
  const handleToggleExpansion = (opportunityId: string) => {
    setExpandedOpportunities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(opportunityId)) {
        newSet.delete(opportunityId);
      } else {
        newSet.add(opportunityId);
      }
      return newSet;
    });
  };
  
  const handleAccept = async (opportunity: BookingOpportunity, reason?: string) => {
    try {
      const response = await fetch(`/api/booking-opportunities/${opportunity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CONFIRMED',
          reason
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to accept opportunity');
      }
      
      await fetchData();
      showSuccess('Opportunity Accepted', 'The booking opportunity has been confirmed!');
    } catch (error) {
      console.error('Error accepting opportunity:', error);
      showError('Accept Failed', 'Failed to accept the opportunity. Please try again.');
    }
  };
  
  const handleDecline = async (opportunity: BookingOpportunity, reason?: string) => {
    try {
      const response = await fetch(`/api/booking-opportunities/${opportunity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DECLINED',
          reason
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to decline opportunity');
      }
      
      await fetchData();
      showSuccess('Opportunity Declined', 'The booking opportunity has been declined.');
    } catch (error) {
      console.error('Error declining opportunity:', error);
      showError('Decline Failed', 'Failed to decline the opportunity. Please try again.');
    }
  };
  
  const handleCancel = async (opportunity: BookingOpportunity, reason?: string) => {
    confirm(
      'Cancel Booking',
      `Are you sure you want to cancel "${opportunity.title}"? This action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(`/api/booking-opportunities/${opportunity.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'CANCELLED',
              reason
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to cancel opportunity');
          }
          
          await fetchData();
          showSuccess('Booking Cancelled', 'The booking has been cancelled.');
        } catch (error) {
          console.error('Error cancelling opportunity:', error);
          showError('Cancel Failed', 'Failed to cancel the booking. Please try again.');
        }
      }
    );
  };
  
  const handleDelete = async (opportunityId: string, opportunityName: string) => {
    confirm(
      'Delete Opportunity',
      `Are you sure you want to delete "${opportunityName}"? This action cannot be undone.`,
      async () => {
        setDeletingOpportunities(prev => new Set(prev).add(opportunityId));
        
        try {
          const response = await fetch(`/api/booking-opportunities/${opportunityId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete opportunity');
          }
          
          await fetchData();
          showSuccess('Opportunity Deleted', 'The booking opportunity has been deleted.');
        } catch (error) {
          console.error('Error deleting opportunity:', error);
          showError('Delete Failed', 'Failed to delete the opportunity. Please try again.');
        } finally {
          setDeletingOpportunities(prev => {
            const newSet = new Set(prev);
            newSet.delete(opportunityId);
            return newSet;
          });
        }
      }
    );
  };
  
  const handleShowDocument = (opportunity: BookingOpportunity) => {
    // TODO: Implement document modal
    console.log('Show document for opportunity:', opportunity.id);
  };
  
  const handleMakeCounterOffer = (opportunity: BookingOpportunity) => {
    // TODO: Implement counter offer modal
    console.log('Make counter offer for opportunity:', opportunity.id);
  };
  
  // Group opportunities by date for same-date handling
  const groupedByDate = activeMonthEntries.reduce((acc, entry) => {
    const dateKey = extractDateFromOpportunity(entry.data);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, UnifiedTimelineEntry[]>);
  
  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden">
        <div className="px-6 py-8 text-center">
          <div className="text-gray-500">Loading booking opportunities...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden">
        <div className="px-6 py-8 text-center">
          <div className="text-red-600 mb-4">Error loading booking opportunities</div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden">
      {/* Header */}
      {showTitle && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {title || (artistId ? 'Booking Opportunities' : 'Booking Calendar')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats.total} total opportunities • {stats.confirmed} confirmed • {stats.pending} pending
                {stats.confirmedValue > 0 && (
                  <span> • ${stats.confirmedValue.toLocaleString()} confirmed value</span>
                )}
              </p>
            </div>
            {editable && (
              <button
                onClick={fetchData}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                title="Refresh data to get the latest updates"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            )}
          </div>
        </div>
      )}

      {/* Simple Month Navigation */}
      <div className="px-6 py-3 border-b border-border-primary bg-bg-secondary">
        <div className="flex space-x-1">
          {stableMonthTabs.map((month) => (
            <button
              key={month.monthKey}
              onClick={() => setActiveMonthTab(month.monthKey)}
              className={`px-4 py-2 text-sm font-mono transition-colors ${
                activeMonthTab === month.monthKey
                  ? 'bg-bg-tertiary text-text-primary border border-status-active'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'
              }`}
            >
              {month.monthLabel.toUpperCase()}
              {month.count > 0 && (
                <span className="ml-1 text-status-active">[{month.count}]</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto bg-bg-primary">
        <table className="w-full min-w-[1000px] table-fixed">
          {/* Simple Table Header */}
          <thead className="bg-bg-secondary border-b border-border-primary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-mono text-text-secondary uppercase tracking-wider w-[3%]"></th>
              <th className="px-4 py-3 text-left text-xs font-mono text-text-secondary uppercase tracking-wider w-[12%]">Date</th>
              {!venueId && (
                <th className="px-4 py-3 text-left text-xs font-mono text-text-secondary uppercase tracking-wider w-[14%]">Location</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-mono text-text-secondary uppercase tracking-wider w-[20%]">
                {perspective === 'ARTIST' ? 'Venue' : 'Artist'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-mono text-text-secondary uppercase tracking-wider w-[10%]">Status</th>
              <th className="px-4 py-3 text-left text-xs font-mono text-text-secondary uppercase tracking-wider w-[8%]">Source</th>
              <th className="px-4 py-3 text-left text-xs font-mono text-text-secondary uppercase tracking-wider w-[10%]">Capacity</th>
              <th className="px-4 py-3 text-left text-xs font-mono text-text-secondary uppercase tracking-wider w-[12%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Empty state */}
            {activeMonthEntries.length === 0 && (
              <tr>
                <td colSpan={venueId ? 7 : 8} className="px-6 py-8 text-center text-gray-500">
                  No booking opportunities found for this month.
                </td>
              </tr>
            )}
            
            {/* Render opportunities grouped by date */}
            {Object.entries(groupedByDate).map(([dateKey, dateEntries]) => {
              // Show only the first opportunity for each date (others are competing)
              const primaryEntry = dateEntries[0];
              const competingOpportunities = dateEntries.slice(1).map(entry => entry.data);
              
              return (
                <BookingOpportunityRow
                  key={primaryEntry.data.id}
                  opportunity={primaryEntry.data}
                  perspective={perspective}
                  permissions={permissions}
                  isExpanded={expandedOpportunities.has(primaryEntry.data.id)}
                  isDeleting={deletingOpportunities.has(primaryEntry.data.id)}
                  artistId={artistId}
                  venueId={venueId}
                  onToggleExpansion={handleToggleExpansion}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  onShowDocument={handleShowDocument}
                  onMakeCounterOffer={handleMakeCounterOffer}
                  competingOpportunities={competingOpportunities}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Simple Add Button */}
      {editable && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => console.log('Add opportunity clicked')}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-700 rounded-lg transition-colors"
          >
            + Add Booking Opportunity
          </button>
        </div>
      )}
      
      {/* Alert Modal */}
      {AlertModal}
    </div>
  );
} 
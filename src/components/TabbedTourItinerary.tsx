'use client';

import React, { useState, useEffect } from 'react';
import { Show, VenueBid, VenueOffer } from '../../types'; // 🎯 PHASE 4: Removed TourRequest import
import { TechnicalRequirement, HospitalityRequirement } from '../../types/templates';
import VenueBidForm from './VenueBidForm';
import ShowDetailModal from './ShowDetailModal';
// 🎯 PHASE 4: Removed TourRequestDetailModal - no longer needed
import TemplateSelector from './TemplateSelector';
import TemplateFormRenderer from './TemplateFormRenderer';
import LocationVenueAutocomplete from './LocationVenueAutocomplete';
import UnifiedShowRequestForm from './UnifiedShowRequestForm';
import TechnicalRequirementsTable from './TechnicalRequirementsTable';
import HospitalityRiderTable from './HospitalityRiderTable';

import { InlineOfferDisplay } from './OfferDisplay';
import OfferInput, { ParsedOffer } from './OfferInput';
import ShowDocumentModal from './ShowDocumentModal';
import UniversalMakeOfferModal from './UniversalMakeOfferModal';
import MakeOfferButton from './MakeOfferButton';
import { ItineraryDate } from './DateDisplay';
import OfferFormCore from './OfferFormCore';
import { useAlert } from './UniversalAlertModal';
import { AddSupportActModal } from './modals/AddSupportActModal';

// Import our new custom hooks and utilities
import { useTourItineraryData } from '../hooks/useTourItineraryData';
import { useVenueArtistSearch } from '../hooks/useVenueArtistSearch';
import { useItineraryPermissions } from '../hooks/useItineraryPermissions';
import { useItineraryState } from '../hooks/useItineraryState';
import {
  createTimelineEntries,
  groupEntriesByMonth,
  getDefaultActiveMonth,
  generateStableMonthTabs,
  generateMinimalMonthLabels,
  generateCompactMonthLabels,
  getDefaultActiveMonthStable,
  getMonthKeyFromDate,
  getTimelineBorderClass,
  extractDateFromEntry
} from '../utils/timelineUtils';

// Import action button components
import { BidActionButtons, MakeOfferActionButton, DeleteActionButton, DocumentActionButton } from './ActionButtons';
import { ShowTimelineItem, BidTimelineItem } from './TimelineItems'; // 🎯 PHASE 4: Removed TourRequestTimelineItem
import { generateSmartShowTitle, getBillingPriority } from '../utils/showNaming';
import { BidService } from '../services/BidService';
import { AddDateFormModal } from './forms/AddDateFormModal';

interface TabbedTourItineraryProps {
  artistId?: string;
  artistName?: string;
  venueId?: string;
  venueName?: string;
  title?: string;
  showTitle?: boolean;
  editable?: boolean;
  viewerType?: 'artist' | 'venue' | 'public';
}



interface TimelineEntry {
  type: 'show' | 'show-request'; // 🎯 PHASE 3: Changed 'tour-request' to 'show-request'
  date: string;
  endDate?: string;
  data: Show | any | VenueBid; // 🎯 PHASE 3: Using 'any' for ShowRequest instead of TourRequest
  parentTourRequest?: any; // 🎯 PHASE 3: Will be ShowRequest instead of TourRequest
}

// @ts-nocheck
export default function TabbedTourItinerary({ 
  artistId, 
  artistName, 
  venueId, 
  venueName,
  title,
  showTitle = true,
  editable = false,
  viewerType = 'public'
}: TabbedTourItineraryProps) {
  // Initialize Universal Alert Modal system
  const { AlertModal, confirm, error: showError, success: showSuccess, info: showInfo, toast } = useAlert();

  // 🎯 REFACTORED: Use centralized state management
  const { state, actions, getSavedActiveMonth, isValidSavedMonth } = useItineraryState();

  // 🎯 REFACTORED: Use centralized permissions hook
  const permissions = useItineraryPermissions({
    viewerType,
    editable,
    artistId,
    venueId,
    venueName
  });

  // 🎯 REFACTORED: Use custom hook for data fetching
  const {
    shows,
    tourRequests,
    venueBids,
    venueOffers,
    loading,
    fetchError,
    fetchData
  } = useTourItineraryData({ artistId, venueId, venueName });

  // Keep addDateForm as separate state for now (will refactor later)
  const [addDateForm, setAddDateForm] = useState({
    type: 'offer' as 'request' | 'confirmed' | 'offer',
    date: '',
    startDate: '',
    endDate: '',
    requestDate: '',
    useSingleDate: true,
    location: '',
    artistId: '',
    artistName: '',
    venueId: '',
    venueName: '',
    title: '',
    description: '',
    guarantee: '',
    capacity: '',
    ageRestriction: 'all-ages' as 'all-ages' | '18+' | '21+' | 'flexible',
    loadIn: '',
    soundcheck: '',
    doorsOpen: '',
    showTime: '',
    curfew: '',
    notes: '',
    billingPosition: '' as '' | 'headliner' | 'co-headliner' | 'direct-support' | 'opener' | 'local-opener',
    lineupPosition: '',
    setLength: '',
    otherActs: '',
    billingNotes: '',
    equipment: {
      needsPA: false,
      needsMics: false,
      needsDrums: false,
      needsAmps: false,
      acoustic: false
    },
    technicalRequirements: [] as TechnicalRequirement[],
    hospitalityRequirements: [] as HospitalityRequirement[],
    guaranteeRange: {
      min: 0,
      max: 0
    },
    acceptsDoorDeals: true,
    merchandising: true,
    travelMethod: 'van' as 'van' | 'flying' | 'train' | 'other',
    lodging: 'flexible' as 'floor-space' | 'hotel' | 'flexible',
    priority: 'medium' as 'high' | 'medium' | 'low'
  });

  // 🎯 REFACTORED: Use custom hook for venue/artist search
  const {
    venues,
    artists,
    venueSearchResults,
    artistSearchResults,
    showVenueDropdown,
    showArtistDropdown,
    handleVenueSearch,
    handleArtistSearch,
    selectVenue: selectVenueFromSearch,
    selectArtist: selectArtistFromSearch,
    setShowVenueDropdown,
    setShowArtistDropdown
  } = useVenueArtistSearch({
    onVenueSelect: (venue) => {
      setAddDateForm(prev => ({
        ...prev,
        venueId: venue.id,
        venueName: venue.name,
        location: `${venue.city}, ${venue.state}`,
        capacity: venue.capacity?.toString() || ''
      }));
    },
    onArtistSelect: (artist) => {
      setAddDateForm(prev => ({
        ...prev,
        artistId: artist.id,
        artistName: artist.name
      }));
    }
  });

  // Remaining state management - REMOVE these old useState calls and use centralized state
  // const [expandedBids, setExpandedBids] = useState<Set<string>>(new Set());
  // const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set());
  // const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  // const [showBidForm, setShowBidForm] = useState(false);
  // const [selectedTourRequest, setSelectedTourRequest] = useState<TourRequest | null>(null);
  const [bidActions, setBidActions] = useState<Record<string, boolean>>({});
  // const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<VenueBid | null>(null);
  const [showBidDetailsModal, setShowBidDetailsModal] = useState(false);
  const [showTourRequestForm, setShowTourRequestForm] = useState(false);
  const [showAddDateForm, setShowAddDateForm] = useState(false);
  const [addDateLoading, setAddDateLoading] = useState(false);
  const [deleteShowLoading, setDeleteShowLoading] = useState<string | null>(null);
  const [selectedShowForDetail, setSelectedShowForDetail] = useState<Show | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  // 🎯 PHASE 4: Removed TourRequest modal state - no longer needed
  // const [tourRequestDetailModal, setTourRequestDetailModal] = useState(false);
  // const [selectedTourRequest, setSelectedTourRequest] = useState<any | null>(null);
  
  // Track declined bids locally to avoid flashing
  const [declinedBids, setDeclinedBids] = useState<Set<string>>(new Set());
  
  // Removed local deletedRequests state - now using hook's state.deletedRequests
  
  // Track deleted shows locally to avoid flashing
  // Removed local deletedShows state - now using hook's state.deletedShows
  
  // Add optimistic bid status tracking to prevent blinking during switches
  const [bidStatusOverrides, setBidStatusOverrides] = useState<Map<string, 'pending' | 'accepted' | 'declined'>>(new Map());
  
  // Track recent undo actions to prevent race conditions
  const [recentUndoActions, setRecentUndoActions] = useState<Set<string>>(new Set());
  
  // Add venue offer form state
  const [showVenueOfferForm, setShowVenueOfferForm] = useState(false);
  
  // Show Document Modal state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocumentShow, setSelectedDocumentShow] = useState<Show | null>(null);
  const [selectedDocumentBid, setSelectedDocumentBid] = useState<VenueBid | null>(null);
  const [selectedDocumentTourRequest, setSelectedDocumentTourRequest] = useState<any | null>(null); // 🎯 PHASE 4: Updated to any for ShowRequest
  
  // Add Another Artist Modal state
  const [isAddAnotherArtistModalOpen, setIsAddAnotherArtistModalOpen] = useState(false);
  const [addAnotherArtistDate, setAddAnotherArtistDate] = useState<string>('');
  const [addAnotherArtistShowId, setAddAnotherArtistShowId] = useState<string>('');
  
  // Universal Make Offer Modal state - now managed by centralized state

  // 🎯 REFACTORED: Timeline creation using utility functions
  const filteredShows = shows.filter(show => !state.deletedShows.has(show.id));
  const filteredTourRequests = tourRequests.filter(request => !state.deletedRequests.has(request.id));
  // Filter venue offers - exclude offers whose synthetic request IDs are in deletedRequests
  const filteredVenueOffers = venueOffers.filter(offer => {
    const syntheticRequestId = `venue-offer-${offer.id}`;
    return !state.deletedRequests.has(syntheticRequestId);
  });
  // 🎯 NEW: Filter venue bids - exclude bids whose synthetic request IDs are in deletedRequests
  const filteredVenueBids = venueBids.filter(bid => {
    const syntheticRequestId = `venue-bid-${bid.id}`;
    return !state.deletedRequests.has(syntheticRequestId);
  });
  const timelineEntries = createTimelineEntries(filteredShows, filteredTourRequests, filteredVenueOffers, filteredVenueBids, artistId, venueId);
  const monthGroups = groupEntriesByMonth(timelineEntries);
  
  // 🎯 UX IMPROVEMENT: Generate stable 12-month tabs with compact spacing
  const stableMonthTabs = generateCompactMonthLabels(monthGroups);

  // 🎯 UX IMPROVEMENT: Helper function to determine when venues should see offer buttons
  const shouldShowOfferButton = (request: any & { isVenueInitiated?: boolean }) => { // 🎯 PHASE 4: Updated to any for ShowRequest
    // When viewing artist pages: show for all requests (maximum discoverability!)
    if (artistId) {
      return true;
    }
    
    // When viewing venue's own timeline: only show for artist-initiated requests (preserves existing behavior)
    if (venueId && !artistId) {
      return !request.isVenueInitiated;
    }
    
    // Fallback to existing behavior
    return !request.isVenueInitiated;
  };

  // 🎯 UX IMPROVEMENT: Enhanced active month management with persistence
  useEffect(() => {
    // Try to restore saved month first
    const savedMonth = getSavedActiveMonth();
    
    if (savedMonth && isValidSavedMonth(savedMonth) && !state.activeMonthTab) {
      // Restore saved month if valid and no current selection
      actions.setActiveMonth(savedMonth);
      return;
    }
    
    // If no saved month or invalid, use smart defaults
    if (!state.activeMonthTab && stableMonthTabs.length > 0) {
      const defaultMonth = getDefaultActiveMonthStable(stableMonthTabs);
      actions.setActiveMonth(defaultMonth);
    }
  }, [stableMonthTabs.length, state.activeMonthTab, actions, getSavedActiveMonth, isValidSavedMonth]);

  // 🎯 FIX: Reset optimistic state when switching between venues/artists
  useEffect(() => {
    // Clear all optimistic state when artistId or venueId changes
    actions.resetOptimisticState();
  }, [artistId, venueId, actions.resetOptimisticState]);

  const activeMonthEntries = stableMonthTabs.find(group => group.monthKey === state.activeMonthTab)?.entries || [];

  // Handler functions that are still needed in the component
  const toggleBidExpansion = (requestId: string) => {
    actions.toggleBidExpansion(requestId);
  };

  const toggleShowExpansion = (showId: string) => {
    actions.toggleShowExpansion(showId);
  };

  const toggleRequestExpansion = (requestId: string) => {
    actions.toggleRequestExpansion(requestId);
  };

  const handleBidSuccess = (bid: any) => {
    actions.closeBidForm();
    fetchData();
  };

  // Additional handler functions
  const handlePlaceBid = (tourRequest: any) => { // 🎯 PHASE 4: Updated to any for ShowRequest
    if (venueId && venueName) {
      actions.openBidForm(tourRequest);
      return;
    }
    
    if (permissions.canMakeOffers) {
      // Fix the artist parameter to match the expected signature
      actions.openUniversalOffer({
        id: tourRequest.artistId,
                        name: tourRequest.artist?.name || tourRequest.artistName
      });
      return;
    }
    
    alert('To submit a bid, we need your venue information. Please visit your venue profile page first to set up bidding.');
  };

  const handleDeleteShow = async (showId: string, showName: string) => {
    confirm(
      'Delete Show',
      `Are you sure you want to delete "${showName}"?`,
      async () => {
        try {
          // Check if this is the last item in the current month before deletion
          const currentMonthEntries = activeMonthEntries;
          const showToDelete = currentMonthEntries.find(entry => 
            entry.type === 'show' && (entry.data as Show).id === showId
          );
          const isLastItemInMonth = currentMonthEntries.length === 1 && showToDelete;
          
          // Optimistic update - immediately hide the show
          actions.deleteShowOptimistic(showId);
          
          // 🎯 UX IMPROVEMENT: Stay on current month after deletion to confirm action worked
          // (Removed auto-switching logic that was confusing users)
          
          const response = await fetch(`/api/shows/${showId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete show');
          }

          // Don't call fetchData() to avoid flashing - the optimistic update already handles UI
          showSuccess('Show Deleted', 'Show deleted successfully');
        } catch (error) {
          console.error('Error deleting show:', error);
          
          // Revert optimistic update on error by refreshing data
          await fetchData();
          
          showError('Delete Failed', 'Failed to delete show. Please try again.');
        }
      }
    );
  };

  // Add all the missing handler functions
  
  // Helper function to check for date conflicts when accepting bids/offers
  const checkDateConflict = (proposedDate: string, excludeBidId?: string, excludeOfferId?: string) => {
    return BidService.checkDateConflict(
      proposedDate,
      shows,
      venueBids,
      venueOffers,
      bidStatusOverrides,
      excludeBidId,
      excludeOfferId
    );
  };

  // Helper function to get effective bid status (with optimistic overrides)
  const getEffectiveBidStatus = (bid: VenueBid) => {
    return BidService.getEffectiveBidStatus(bid, bidStatusOverrides);
  };

  // Old bid and offer action logic moved to BidService

  const handleBidAction = async (bid: VenueBid, action: string, reason?: string) => {
    const callbacks = {
      setBidStatusOverrides,
      setDeclinedBids,
      setBidActions,
      fetchData,
      showSuccess,
      showError,
      showInfo,
      toast,
      confirm
    };

    return BidService.handleBidAction(
      bid,
      action,
      callbacks,
      bidStatusOverrides,
      shows,
      venueBids,
      venueOffers,
      reason
    );
  };

  // Optimistic bid action processing now handled by BidService

  // Optimistic offer action processing now handled by BidService

  const handleOfferAction = async (offer: VenueOffer, action: string) => {
    const callbacks = {
      setBidStatusOverrides,
      setDeclinedBids,
      setBidActions,
      fetchData,
      showSuccess,
      showError,
      showInfo,
      toast,
      confirm,
      deleteRequestOptimistic: actions.deleteRequestOptimistic
    };

    return BidService.handleOfferAction(
      offer,
      action,
      callbacks,
      bidStatusOverrides,
      shows,
      venueBids,
      venueOffers
    );
  };

  const getBidStatusBadge = (bid: VenueBid) => {
    return BidService.getBidStatusBadge(bid, bidStatusOverrides);
  };

  const handleTemplateApply = (template: any) => {
    setAddDateForm(prev => ({
      ...prev,
      equipment: {
        needsPA: template.equipment?.needsPA ?? prev.equipment.needsPA,
        needsMics: template.equipment?.needsMics ?? prev.equipment.needsMics,
        needsDrums: template.equipment?.needsDrums ?? prev.equipment.needsDrums,
        needsAmps: template.equipment?.needsAmps ?? prev.equipment.needsAmps,
        acoustic: template.equipment?.acoustic ?? prev.equipment.acoustic
      },
      guaranteeRange: {
        min: template.guaranteeRange?.min ?? prev.guaranteeRange?.min ?? 0,
        max: template.guaranteeRange?.max ?? prev.guaranteeRange?.max ?? 0
      },
      acceptsDoorDeals: template.acceptsDoorDeals ?? prev.acceptsDoorDeals,
      merchandising: template.merchandising ?? prev.merchandising,
      ageRestriction: template.ageRestriction ?? prev.ageRestriction,
      travelMethod: template.travelMethod ?? prev.travelMethod,
      lodging: template.lodging ?? prev.lodging,
      technicalRequirements: template.technicalRequirements ?? prev.technicalRequirements,
      hospitalityRequirements: template.hospitalityRequirements ?? prev.hospitalityRequirements,
      priority: template.priority ?? prev.priority,
      notes: template.notes ? `${prev.notes ? prev.notes + '\n\n' : ''}Template: ${template.name}\n${template.notes}` : prev.notes
    }));
  };

  const handleDeleteShowRequest = async (requestId: string, requestName: string) => {
    confirm(
      'Delete Show Request',
      `Delete "${requestName}"? This will also delete all associated bids and cannot be undone.`,
      async () => {
        actions.setDeleteLoading(requestId);
        
        // Optimistic update - immediately hide the request
        actions.deleteRequestOptimistic(requestId);
        
        // 🎯 UX IMPROVEMENT: Stay on current month after deletion to confirm action worked
        // (Removed auto-switching logic that was confusing users)
        
        try {
          const response = await fetch(`/api/show-requests/${requestId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete tour request');
          }

          // Don't call fetchData() to avoid flashing - the optimistic update already handles UI
          showSuccess('Tour Request Deleted', 'Tour request deleted successfully.');
        } catch (error) {
          console.error('Error deleting tour request:', error);
          
          // Revert optimistic update on error - we'll need to add this to the state
          // For now just refetch data
          await fetchData();
          
          showError('Deletion Failed', `Failed to delete tour request: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          actions.setDeleteLoading(null);
        }
      }
    );
  };

  const handleShowDetailModal = (show: Show) => {
    setSelectedShowForDetail(show);
    setShowDetailModal(true);
  };

  // 🎯 PHASE 4: Removed TourRequest modal handlers - no longer needed
  // const handleTourRequestDetailModal = (request: any) => {
  //   setSelectedTourRequest(request);
  //   setTourRequestDetailModal(true);
  // };

  const handleShowDocumentModal = (show: Show) => {
    setSelectedDocumentShow(show);
    setSelectedDocumentBid(null);
    setSelectedDocumentTourRequest(null);
    setShowDocumentModal(true);
  };

  const handleBidDocumentModal = (bid: VenueBid) => {
    setSelectedDocumentBid(bid);
    setSelectedDocumentShow(null);
    setSelectedDocumentTourRequest(null);
    setShowDocumentModal(true);
  };

  const handleTourRequestDocumentModal = (request: any) => { // 🎯 PHASE 4: Updated to any for ShowRequest
    setSelectedDocumentTourRequest(request);
    setSelectedDocumentShow(null);
    setSelectedDocumentBid(null);
    setShowDocumentModal(true);
  };

  // Handle successful offer creation from AddSupportActModal
  const handleAddAnotherArtistSuccess = (offer: any) => {
    setIsAddAnotherArtistModalOpen(false);
    setAddAnotherArtistDate('');
    setAddAnotherArtistShowId('');
    // Refresh data to show the new offer
    fetchData();
    showSuccess('Artist Offer Sent', 'Your offer has been sent to the artist and will appear in their itinerary.');
  };



  if (loading) {
    return (
      <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6">
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

  if (fetchError) {
    return (
      <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6">
        <div className="text-red-600 text-center">
          <p>Error loading itinerary: {fetchError}</p>
          <button 
            onClick={fetchData}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
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
                {title || (artistId ? 'Show Dates' : 'Booking Calendar')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {filteredShows.length} confirmed show{filteredShows.length !== 1 ? 's' : ''}
                {artistId && filteredTourRequests.length > 0 && (
                  <span> • {filteredTourRequests.length} active show request{filteredTourRequests.length !== 1 ? 's' : ''}</span>
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

      {/* Month Tabs */}
      {/* 🎯 UX IMPROVEMENT: Compact month tabs with optimal spacing */}
      <div className="border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-4 overflow-x-auto">
            {stableMonthTabs.map((group) => (
              <button
                key={group.monthKey}
                onClick={() => actions.setActiveMonth(group.monthKey)}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  state.activeMonthTab === group.monthKey
                    ? 'border-blue-500 text-blue-600'
                    : group.count > 0 
                      ? 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                      : 'border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-200'
                }`}
              >
                {group.monthLabel} {group.count > 0 && `(${group.count})`}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] table-fixed">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium text-gray-600">
              <th className="px-2 py-1 w-[3%]"></th>
              <th className="px-4 py-1 w-[12%]">Date</th>
              {!venueId && <th className="px-4 py-1 w-[14%]">Location</th>}
              <th className={`px-4 py-1 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>{artistId ? 'Venue' : venueId ? 'Artist' : 'Artist'}</th>
              <th className="px-4 py-1 w-[10%]">Status</th>
              <th className="px-4 py-1 w-[7%]">{venueId ? 'Position' : 'Capacity'}</th>
              <th className="px-4 py-1 w-[7%]">Age</th>
              <th className={`px-4 py-1 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>Offers</th>
              <th className="px-4 py-1 w-[8%]">details</th>
              <th className="px-4 py-1 w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Empty state */}
            {activeMonthEntries.length === 0 && (
              <tr>
                <td colSpan={venueId ? 9 : 10} className="px-6 py-8 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📅</span>
                  </div>
                  {stableMonthTabs.every(tab => tab.count === 0) ? (
                    <>
                      <p className="mb-2 font-medium">No shows booked</p>
                      <p className="text-sm">
                        {editable 
                          ? "Get started by adding your first date below"
                          : "Confirmed bookings will appear here"
                        }
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mb-2">No shows this month</p>
                      <p className="text-sm">Check other months for upcoming shows</p>
                    </>
                  )}
                </td>
              </tr>
            )}
            
            {/* Render entries for active month */}
            {activeMonthEntries.map((entry, index) => {
              // 🎯 DATE GROUPING: Check for same-date siblings (following ShowTimelineItem pattern)
              const entryDate = extractDateFromEntry(entry);
              const sameDateSiblings = activeMonthEntries.filter(otherEntry => 
                otherEntry !== entry && 
                extractDateFromEntry(otherEntry) === entryDate
              );
              
              // Only show count badge on first occurrence of each date
              const isFirstOfDate = activeMonthEntries.findIndex(otherEntry => 
                extractDateFromEntry(otherEntry) === entryDate
              ) === index;
              
              // Hide non-first entries - they'll be shown as children when parent is expanded
              if (!isFirstOfDate) {
                return null;
              }
              
              if (entry.type === 'show') {
                const show = entry.data as Show;
                
                return (
                  <ShowTimelineItem
                    key={`show-${show.id}`}
                    show={show}
                    permissions={permissions}
                    isExpanded={state.expandedShows.has(show.id)}
                    isDeleting={state.deleteShowLoading === show.id}
                    artistId={artistId}
                    venueId={venueId}
                    venueOffers={filteredVenueOffers}
                    onToggleExpansion={toggleShowExpansion}
                    onDeleteShow={handleDeleteShow}
                    onShowDocument={handleShowDocumentModal}
                    onShowDetail={handleShowDetailModal}
                    onSupportActAdded={(offer: any) => {
                      // Optimistic update: immediately refresh data to show new support act
                      // This provides the most polished experience with minimal complexity
                      fetchData();
                    }}
                    onSupportActDocument={handleShowDocumentModal}
                    onSupportActAction={async (offer: any, action: string) => {
                      if (action === 'delete') {
                        // Delete the support act offer
                        actions.setDeleteLoading(offer.id);
                        try {
                          const response = await fetch(`/api/show-requests/${offer.id}`, {
                            method: 'DELETE',
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to delete support act');
                          }
                          
                          // Refresh data to show the removal
                          fetchData();
                          alert('✅ Support act removed from lineup');
                        } catch (error) {
                          console.error('Failed to delete support act:', error);
                          alert('Failed to remove support act');
                        } finally {
                          actions.setDeleteLoading(null);
                        }
                      }
                    }}
                  />
                );
              } else if (entry.type === 'show-request') { // 🎯 PHASE 3: Updated to 'show-request'
                const request = entry.data as any & { // 🎯 PHASE 3: Now working with ShowRequest data
                  isVenueInitiated?: boolean; 
                  originalOfferId?: string; 
                  venueInitiatedBy?: string;
                  isVenueBid?: boolean;
                  originalBidId?: string;
                  originalShowRequestId?: string;
                  bidStatus?: string;
                  bidAmount?: number;
                };
                
                // Get bids for this request
                let requestBids: VenueBid[] = [];
                

                
                                                    if (request.isVenueInitiated && request.originalOfferId) {
                    
                    // 🐛 FIX: Even for venue-initiated requests, we need to find ALL competing bids
                    // The venue offer might be one of several competing bids for the same date/artist
                    
                    // Look for other requests with the same date/artist to find the original artist request
                    const potentialOriginalRequests = tourRequests.filter((sr: any) => 
                      !(sr as any).isVenueInitiated && 
                      sr.startDate === request.startDate &&
                      sr.artistId === request.artistId
                    );
                    
                    if (potentialOriginalRequests.length > 0) {
                      const originalShowRequestId = potentialOriginalRequests[0].id;
                      
                      // Find ALL bids for the original request (this will include competing venues)
                      requestBids = venueBids.filter(bid => 
                        bid.showRequestId === originalShowRequestId && 
                        !declinedBids.has(bid.id)
                      );
                    } else {
                    // Fallback: Create synthetic bid for just this venue
                    const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
                    if (originalOffer) {
                      const bidDate = originalOffer.proposedDate.split('T')[0];
                      
                      const syntheticBid: VenueBid = {
                        id: `offer-bid-${originalOffer.id}`,
                        showRequestId: request.id,
                        venueId: originalOffer.venueId,
                        venueName: originalOffer.venueName || originalOffer.venue?.name || 'Unknown Venue',
                        proposedDate: bidDate,
                        guarantee: originalOffer.amount,
                        doorDeal: originalOffer.doorDeal ? {
                          split: originalOffer.doorDeal.split,
                          minimumGuarantee: originalOffer.doorDeal.minimumGuarantee
                        } : undefined,
                        ticketPrice: originalOffer.ticketPrice || {},
                        capacity: originalOffer.capacity || originalOffer.venue?.capacity || 0,
                        ageRestriction: originalOffer.ageRestriction || 'all-ages',
                        equipmentProvided: originalOffer.equipmentProvided || {
                          pa: false, mics: false, drums: false, amps: false, piano: false
                        },
                        loadIn: originalOffer.loadIn || '',
                        soundcheck: originalOffer.soundcheck || '',
                        doorsOpen: originalOffer.doorsOpen || '',
                        showTime: originalOffer.showTime || '',
                        curfew: originalOffer.curfew || '',
                        promotion: originalOffer.promotion || {
                          social: false, flyerPrinting: false, radioSpots: false, pressCoverage: false
                        },
                        message: originalOffer.message || '',
                        status: originalOffer.status.toLowerCase() as 'pending' | 'accepted' | 'declined' | 'cancelled',
                        readByArtist: true,
                        createdAt: originalOffer.createdAt,
                        updatedAt: originalOffer.updatedAt,
                        expiresAt: originalOffer.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        billingPosition: originalOffer.billingPosition,
                        lineupPosition: originalOffer.lineupPosition,
                        setLength: originalOffer.setLength,
                        otherActs: originalOffer.otherActs,
                        billingNotes: originalOffer.billingNotes,
                        // Add missing artist information for show document headers
                        artistId: originalOffer.artistId,
                        artistName: originalOffer.artistName,
                      } as VenueBid & { artistId?: string; artistName?: string };
                      
                      requestBids = [syntheticBid];
                    }
                  }
                // ✅ No special synthetic held bid handling - all bids show in their natural request rows
                } else if (request.isVenueBid && request.originalShowRequestId) {
                  // For synthetic requests from venue bids, use originalShowRequestId to find ALL competing bids
                  const allBidsOnRequest = venueBids.filter(bid => 
                    bid.showRequestId === request.originalShowRequestId && 
                    !declinedBids.has(bid.id)
                  );
                  
                  requestBids = allBidsOnRequest;
                } else {
                  // For regular artist-initiated requests, use normal bid filtering
                  requestBids = venueBids.filter(bid => bid.showRequestId === request.id && !declinedBids.has(bid.id));
                }

                // Determine status for border styling
                const hasAcceptedBid = requestBids.some((bid: VenueBid) => 
                  bid.status === 'accepted' || (bid as any).holdState === 'ACCEPTED_HELD'
                );
                const hasActiveHold = requestBids.some((bid: VenueBid) => 
                  (bid as any).holdState === 'HELD' || (bid as any).holdState === 'FROZEN'
                );
                const isHeldBidRequest = (request as any).isHeldBid;
                
                let requestStatus: 'confirmed' | 'pending' | 'hold' | 'accepted' = 'pending';
                if (hasAcceptedBid) {
                  requestStatus = 'accepted';
                } else if (hasActiveHold || isHeldBidRequest) {
                  requestStatus = 'hold';
                }
                
                const borderClass = getTimelineBorderClass(requestStatus);

                // Generate class names safely
                const baseClasses = "cursor-pointer transition-colors duration-150 hover:shadow-sm";
                const hoverClass = requestStatus === 'accepted' ? 'bg-green-50/30 hover:bg-green-100' :
                                  requestStatus === 'hold' ? 'bg-violet-50/30 hover:bg-violet-100' :
                                  'hover:bg-blue-50';
                const rowClassName = `${baseClasses} ${hoverClass}`;
                
                // Pre-calculate text colors
                const textColorClass = requestStatus === 'accepted' ? 'text-green-900' :
                                      requestStatus === 'hold' ? 'text-violet-900' :
                                      'text-blue-900';
                
                // Pre-calculate expanded section classes
                const expandedBgClass = requestStatus === 'accepted' ? 'bg-green-50 border-l-4 border-green-400' :
                                       requestStatus === 'hold' ? 'bg-violet-50 border-l-4 border-violet-400' :
                                       'bg-yellow-50 border-l-4 border-yellow-400';
                const expandedHeaderClass = requestStatus === 'accepted' ? 'bg-green-100' :
                                           requestStatus === 'hold' ? 'bg-violet-100' :
                                           'bg-yellow-100';
                const expandedTextClass = requestStatus === 'accepted' ? 'text-left text-xs font-medium text-green-700' :
                                         requestStatus === 'hold' ? 'text-left text-xs font-medium text-violet-700' :
                                         'text-left text-xs font-medium text-yellow-700';
                const expandedDividerClass = requestStatus === 'accepted' ? 'divide-y divide-green-200' :
                                            requestStatus === 'hold' ? 'divide-y divide-violet-200' :
                                            'divide-y divide-yellow-200';

                return (
                  <React.Fragment key={`request-${request.id}`}>
                    <tr 
                      className="cursor-pointer transition-colors duration-150 hover:shadow-sm"
                      onClick={() => toggleRequestExpansion(request.id)}
                      title={`Click to ${state.expandedRequests.has(request.id) ? 'hide' : 'view'} bids for this show request`}
                    >
                      <td className={`px-2 py-1 w-[3%] ${borderClass}`}>
                        <div className="flex items-center justify-center text-gray-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d={state.expandedRequests.has(request.id) ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                          </svg>
                        </div>
                      </td>
                      <td className="px-4 py-1 w-[12%]">
                        <ItineraryDate
                          startDate={request.requestedDate?.split('T')[0] || request.startDate} // 🎯 PHASE 3: Use requestedDate from ShowRequest
                          endDate={request.requestedDate?.split('T')[0] || request.endDate}
                          isSingleDate={true} // 🎯 PHASE 3: ShowRequests are always single date
                          className={`text-sm font-medium ${textColorClass}`}
                        />
                      </td>
                      {!venueId && (
                        <td className="px-4 py-1 w-[14%]">
                          <div className={`text-sm truncate ${textColorClass}`}>{request.location}</div>
                        </td>
                      )}
                      <td className={`px-4 py-1 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {(() => {
                            if (artistId) {
                              // For artist pages, show venue information
                              if (request.isVenueInitiated) {
                                // 🐛 FIX: For venue-initiated offers, check if there are competing venues
                                
                                if (requestBids.length > 1) {
                                  // Show count when there are competing venues
                                  return (
                                    <span className="text-gray-600 text-sm">
                                      {requestBids.length} competing venues
                                    </span>
                                  );
                                } else {
                                  // Show single venue name when no competition
                                  const requestAsVenueRequest = request as any & { venueId?: string; venueName?: string };
                                  if (requestAsVenueRequest.venueId && requestAsVenueRequest.venueId !== 'external-venue') {
                                    return (
                                      <a 
                                        href={`/venues/${requestAsVenueRequest.venueId}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                        title="View venue page"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {requestAsVenueRequest.venueName}
                                      </a>
                                    );
                                  } else {
                                    return <span>{requestAsVenueRequest.venueName}</span>;
                                  }
                                }
                              } else {
                                // For artist-initiated requests, show bid count or venue-specific info
                                const requestAsVenueSpecific = request as any & { 
                                  isVenueSpecific?: boolean; 
                                  venueSpecificId?: string; 
                                  venueSpecificName?: string; 
                                };
                                
                                if (requestAsVenueSpecific.isVenueSpecific && requestAsVenueSpecific.venueSpecificId) {
                                  // This is a venue-specific request - show the venue name as clickable link
                                  return (
                                    <a 
                                      href={`/venues/${requestAsVenueSpecific.venueSpecificId}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                      title="View venue page"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {requestAsVenueSpecific.venueSpecificName}
                                    </a>
                                  );
                                } else if (requestBids.length === 0) {
                                  // Regular artist request with no bids yet
                                  return <span className="text-gray-500 text-sm">No bids yet</span>;
                                } else {
                                  // Show venue information based on bid activity
                                  
                                  if (requestBids.length === 1) {
                                    // Show the single venue name as clickable link
                                    const singleBid = requestBids[0];
                                    if (singleBid.venueId && singleBid.venueId !== 'external-venue') {
                                      return (
                                        <a 
                                          href={`/venues/${singleBid.venueId}`}
                                          className="text-blue-600 hover:text-blue-800 hover:underline"
                                          title="View venue page"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {singleBid.venueName}
                                        </a>
                                      );
                                    } else {
                                      return <span>{singleBid.venueName}</span>;
                                    }
                                  } else {

                                    // Show count for multiple competing venues
                                    return (
                                      <span className="text-gray-600 text-sm">
                                        {requestBids.length} competing venues
                                      </span>
                                    );
                                  }
                                }
                              }
                            } else if (venueId) {
                              // 🎯 SMART ARTIST DISPLAY: For venue pages, show intelligent artist lineup
                              
                              // Get all artists for this date (current + same-date siblings)
                              const allSameDateArtists = [entry, ...sameDateSiblings]
                                                                          .filter(e => e.type === 'show-request') // 🎯 PHASE 3: Updated to 'show-request'
                                .map(e => {
                                  const req = e.data as any;
                                  
                                  // 🎯 EXTRACT BILLING POSITION: Look for this artist's billing position in the requestBids
                                  // VenueBid has showRequestId which links to TourRequest.id
                                  const artistBid = requestBids.find(bid => 
                                    bid.showRequestId === req.id
                                  );
                                  
                                  return {
                                    artistName: req.artist?.name || req.artistName || 'Unknown Artist',
                                    artistId: req.artistId,
                                    status: 'accepted' as const,
                                    billingPosition: artistBid?.billingPosition || undefined
                                  };
                                })
                                .filter(artist => artist.artistName !== 'Unknown Artist')
                                // 🎯 SORT BY BILLING POSITION: Use centralized billing priority function
                                .sort((a, b) => {
                                  return getBillingPriority(a) - getBillingPriority(b);
                                });
                              
                              // Generate smart title
                              const smartTitle = (() => {
                                // Safety check for empty artists array
                                if (!allSameDateArtists || allSameDateArtists.length === 0) {
                                  return request.artist?.name || request.artistName || 'Unknown Artist';
                                }
                                
                                if (allSameDateArtists.length === 1) {
                                  // Just one artist - use regular display
                                  const artist = allSameDateArtists[0];
                                  if (artist.artistId && artist.artistId !== 'external-artist') {
                                    return (
                                      <a 
                                        href={`/artists/${artist.artistId}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                        title="View artist page"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {artist.artistName}
                                      </a>
                                    );
                                  } else {
                                    return artist.artistName;
                                  }
                                } else {
                                  // Multiple artists - use smart naming with proper headliner detection
                                  
                                  // 🎯 SMART HEADLINER DETECTION: Use centralized billing priority to find the true headliner
                                  const sortedArtists = [...allSameDateArtists].sort((a, b) => {
                                    return getBillingPriority(a) - getBillingPriority(b);
                                  });
                                  const headlinerArtist = sortedArtists[0];
                                  
                                  // Safety check for headliner artist
                                  if (!headlinerArtist) {
                                    return 'Unknown Artist';
                                  }
                                  
                                  // Get all other artists as support acts (already in correct billing order)
                                  const supportActs = sortedArtists.slice(1);
                                  
                                  const { title, tooltip } = generateSmartShowTitle({
                                    headlinerName: headlinerArtist.artistName || 'Unknown Artist',
                                    supportActs: supportActs.map(artist => ({
                                      artistName: artist.artistName || 'Unknown Artist',
                                      status: 'accepted' as const,
                                      billingPosition: artist.billingPosition || 'support' as const
                                    })),
                                    includeStatusInCount: true
                                  });
                                  
                                  // If headliner has a link, make it clickable
                                  if (headlinerArtist.artistId && headlinerArtist.artistId !== 'external-artist') {
                                    return (
                                      <a 
                                        href={`/artists/${headlinerArtist.artistId}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                        title={tooltip ? `${tooltip} - Click to view ${headlinerArtist.artistName || 'Unknown Artist'} page` : `View ${headlinerArtist.artistName || 'Unknown Artist'} page`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {title}
                                      </a>
                                    );
                                  } else {
                                    return (
                                      <span title={tooltip || undefined}>
                                        {title}
                                      </span>
                                    );
                                  }
                                }
                              })();
                              
                              return smartTitle;
                            } else {
                              // For public/general view, show artist name
                              if (request.artistId && request.artistId !== 'external-artist') {
                                return (
                                  <a 
                                    href={`/artists/${request.artistId}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                    title="View artist page"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {request.artist?.name || request.artistName}
                                  </a>
                                );
                              } else {
                                return request.artist?.name || request.artistName;
                              }
                            }
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-1 w-[10%]">
                        <div className="flex items-center space-x-1">
                          {(() => {
                            // If viewing as a venue, show venue's specific bid status
                            if (venueId && requestBids.length > 0) {
                              const venueBid = requestBids.find(bid => bid.venueId === venueId);
                              if (venueBid) {
                                const statusBadge = getBidStatusBadge(venueBid);
                                return (
                                  <span className={statusBadge.className}>
                                    {statusBadge.text}
                                  </span>
                                );
                              }
                            }
                            
                            // Default logic for artists and venues without bids
                            // 🚀 PRIORITY STATUS LOGIC: Check for accepted bids first (highest priority)
                            const hasAcceptedBid = requestBids.some((bid: VenueBid) => 
                              bid.status === 'accepted' || (bid as any).holdState === 'ACCEPTED_HELD'
                            );
                            
                            if (hasAcceptedBid) {
                              return (
                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  Accepted
                                </span>
                              );
                            }
                            
                            // Check if this request has any active holds (lower priority than accepted)
                            const hasActiveHold = requestBids.some((bid: VenueBid) => 
                              (bid as any).holdState === 'HELD' || (bid as any).holdState === 'FROZEN'
                            );
                            
                            // Check if this is a held bid synthetic request
                            const isHeldBidRequest = (request as any).isHeldBid;
                            
                            if (hasActiveHold || isHeldBidRequest) {
                              return (
                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
                                  Hold
                                </span>
                              );
                            }
                            
                            return (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                Open
                              </span>
                            );
                          })()}
                          
                          {/* 🎯 DATE GROUPING: Show count badge for same-date siblings, but not for venue-initiated requests that show competitor counts */}
                          {isFirstOfDate && sameDateSiblings.length > 0 && !request.isVenueInitiated && (
                            <span 
                              className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                              title={`${sameDateSiblings.length + 1} entries on ${entryDate}`}
                            >
                              +{sameDateSiblings.length}
                            </span>
                          )}

                        </div>
                      </td>
                      <td className="px-4 py-1 w-[7%]"></td>
                      <td className="px-4 py-1 w-[7%]"></td>
                      <td className={`px-4 py-1 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>
                        <div className="flex items-center space-x-2">
                          {/* Offers column - content moved to venue column to avoid redundancy */}
                        </div>
                      </td>
                  <td className="px-4 py-1 w-[8%]">
                    <div className="flex items-center space-x-1">
                      {/* Placeholder to maintain consistent row height with child rows that have document buttons */}
                      <div className="w-6 h-6"></div>
                    </div>
                  </td>
                                        <td className="px-4 py-1 w-[10%]">
                        <div className="flex items-center space-x-2">
                          {/* Delete button for venues - consistent with confirmed shows */}
                          {venueId && (
                            <DeleteActionButton
                              request={request}
                              permissions={permissions}
                              venueId={venueId}
                              venueOffers={venueOffers as any}
                              venueBids={venueBids}
                              isLoading={state.deleteLoading === request.id}
                              onDeleteRequest={handleDeleteShowRequest}
                              onOfferAction={(offer, action) => handleOfferAction(offer as any, action)}
                              onBidAction={(bid, action, reason) => handleBidAction(bid as any, action, reason)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Bids Section */}
                    {state.expandedRequests.has(request.id) && requestBids.length > 0 && permissions.canExpandRequest(request) && (
                      <tr>
                        <td colSpan={venueId ? 9 : 10} className="px-0 py-0">
                          <div className={expandedBgClass}>
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[1000px] table-fixed">
                                <thead className={expandedHeaderClass}>
                                  <tr className={expandedTextClass}>
                                    <th className="px-2 py-1 w-[3%]"></th>
                                    <th className="px-4 py-1 w-[12%]"></th>
                                    {!venueId && <th className="px-4 py-1 w-[14%]">Location</th>}
                                    <th className={`px-4 py-1 ${venueId ? 'w-[26%]' : 'w-[19%]'}`}>{artistId ? 'Venue' : venueId ? 'Artist' : 'Artist'}</th>
                                    <th className="px-4 py-1 w-[10%]">Status</th>
                                    <th className="px-4 py-1 w-[7%]">{venueId ? 'Position' : 'Capacity'}</th>
                                    <th className="px-4 py-1 w-[7%]">Age</th>
                                    <th className={`px-4 py-1 ${venueId ? 'w-[15%]' : 'w-[10%]'}`}>Offers</th>
                                    <th className="px-4 py-1 w-[8%]">Details</th>
                                    <th className="px-4 py-1 w-[10%]">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className={expandedDividerClass}>
                                  {/* Combine parent and sibling bids, then sort by billing position */}
                                  {(() => {
                                    // Collect all bids from parent and siblings
                                    let allBids: Array<{
                                      bid: VenueBid;
                                      request: any;
                                      artistName: string;
                                      billingPosition?: string;
                                    }> = [];
                                    
                                    // Add parent bids
                                    const parentBids = requestBids
                                      .filter((bid: VenueBid) => {
                                        if (['expired', 'declined', 'rejected'].includes(bid.status) || declinedBids.has(bid.id)) {
                                          return false;
                                        }
                                        return permissions.canSeeFinancialDetails(undefined, bid, request);
                                      })
                                      .map((bid: VenueBid) => ({
                                        bid,
                                        request,
                                        artistName: request.artist?.name || request.artistName || 'Unknown',
                                        billingPosition: bid.billingPosition
                                      }));
                                    
                                    allBids.push(...parentBids);
                                    
                                    // Add sibling bids
                                    if (sameDateSiblings.length > 0) {
                                      for (const siblingEntry of sameDateSiblings) {
                                        if (siblingEntry.type === 'show-request') { // 🎯 PHASE 3: Updated to 'show-request'
                                          const siblingRequest = siblingEntry.data as any & { 
                                            isVenueInitiated?: boolean; 
                                            originalOfferId?: string; 
                                            isVenueBid?: boolean;
                                            originalShowRequestId?: string;
                                          };
                                          
                                          // Get bids for this sibling request
                                          let siblingBids: VenueBid[] = [];
                                          if (siblingRequest.isVenueInitiated && siblingRequest.originalOfferId) {
                                            const originalOffer = venueOffers.find(offer => offer.id === siblingRequest.originalOfferId);
                                            if (originalOffer) {
                                              const syntheticBid: VenueBid = {
                                                id: `offer-bid-${originalOffer.id}`,
                                                showRequestId: siblingRequest.id,
                                                venueId: originalOffer.venueId,
                                                venueName: originalOffer.venueName || originalOffer.venue?.name || 'Unknown Venue',
                                                proposedDate: originalOffer.proposedDate.split('T')[0],
                                                guarantee: originalOffer.amount,
                                                doorDeal: originalOffer.doorDeal ? {
                                                  split: originalOffer.doorDeal.split,
                                                  minimumGuarantee: originalOffer.doorDeal.minimumGuarantee
                                                } : undefined,
                                                ticketPrice: originalOffer.ticketPrice || {},
                                                capacity: originalOffer.capacity || originalOffer.venue?.capacity || 0,
                                                ageRestriction: originalOffer.ageRestriction || 'all-ages',
                                                equipmentProvided: originalOffer.equipmentProvided || {
                                                  pa: false, mics: false, drums: false, amps: false, piano: false
                                                },
                                                loadIn: originalOffer.loadIn || '',
                                                soundcheck: originalOffer.soundcheck || '',
                                                doorsOpen: originalOffer.doorsOpen || '',
                                                showTime: originalOffer.showTime || '',
                                                curfew: originalOffer.curfew || '',
                                                promotion: originalOffer.promotion || {
                                                  social: false, flyerPrinting: false, radioSpots: false, pressCoverage: false
                                                },
                                                message: originalOffer.message || '',
                                                status: originalOffer.status.toLowerCase() as 'pending' | 'accepted' | 'declined' | 'cancelled',
                                                readByArtist: true,
                                                createdAt: originalOffer.createdAt,
                                                updatedAt: originalOffer.updatedAt,
                                                expiresAt: originalOffer.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                                                billingPosition: originalOffer.billingPosition,
                                                lineupPosition: originalOffer.lineupPosition,
                                                setLength: originalOffer.setLength,
                                                otherActs: originalOffer.otherActs,
                                                billingNotes: originalOffer.billingNotes,
                                                artistId: originalOffer.artistId,
                                                artistName: originalOffer.artistName,
                                              } as VenueBid & { artistId?: string; artistName?: string };
                                              siblingBids = [syntheticBid];
                                            }
                                          } else if (siblingRequest.isVenueBid && siblingRequest.originalShowRequestId) {
                                            siblingBids = venueBids.filter(bid => 
                                              bid.showRequestId === siblingRequest.originalShowRequestId && 
                                              !declinedBids.has(bid.id)
                                            );
                                          } else {
                                            siblingBids = venueBids.filter(bid => bid.showRequestId === siblingRequest.id && !declinedBids.has(bid.id));
                                          }
                                          
                                          // Filter and add sibling bids
                                          const filteredSiblingBids = siblingBids
                                            .filter((bid: VenueBid) => {
                                              if (['expired', 'declined', 'rejected'].includes(bid.status) || declinedBids.has(bid.id)) {
                                                return false;
                                              }
                                              return permissions.canSeeFinancialDetails(undefined, bid, siblingRequest);
                                            })
                                            .map((bid: VenueBid) => ({
                                              bid,
                                              request: siblingRequest,
                                              artistName: siblingRequest.artist?.name || siblingRequest.artistName || 'Unknown',
                                              billingPosition: bid.billingPosition
                                            }));
                                          
                                          allBids.push(...filteredSiblingBids);
                                        }
                                      }
                                    }
                                    
                                    // Sort all bids by billing position using centralized billing priority function
                                    const sortedBids = allBids.sort((a, b) => {
                                      return getBillingPriority(a) - getBillingPriority(b);
                                    });
                                    
                                    // Render all bids in correct order
                                    return sortedBids.map(({ bid, request: bidRequest }) => {
                                      const isFrozenByHold = (bid as any).holdState === 'FROZEN' || (bid as any).holdState === 'HELD';
                                      
                                      return (
                                        <BidTimelineItem
                                          key={`bid-${bid.id}`}
                                          bid={bid}
                                          request={bidRequest}
                                          permissions={permissions}
                                          isExpanded={false}
                                          isDeleting={false}
                                          venueOffers={venueOffers as any}
                                          venueBids={venueBids}
                                          venueId={venueId}
                                          venueName={venueName}
                                          artistId={artistId}
                                          venues={venues}
                                          effectiveStatus={getEffectiveBidStatus(bid)}
                                          onToggleExpansion={() => {}}
                                          onDeleteBid={() => {}}
                                          onShowDocument={handleBidDocumentModal}
                                          onShowDetail={handleBidDocumentModal}
                                          onAcceptBid={(bid) => handleBidAction(bid, 'accept')}
                                          onDeclineBid={(bid) => handleBidAction(bid, 'decline')}
                                          onOfferAction={handleOfferAction}
                                          onBidAction={handleBidAction}
                                          onMakeOffer={(request, existingBid) => {
                                            const requestWithDates = request as any;
                                            const preSelectedDate = requestWithDates.requestDate || requestWithDates.startDate || null;
                                            
                                            actions.openUniversalOffer(
                                              {
                                                id: request.artistId,
                                                name: request.artist?.name || request.artistName
                                              },
                                              {
                                                id: request.id,
                                                title: request.title,
                                                artistName: request.artist?.name || request.artistName
                                              },
                                              preSelectedDate,
                                              existingBid
                                            );
                                          }}
                                          isFrozenByHold={isFrozenByHold}
                                          activeHoldInfo={isFrozenByHold ? {
                                            id: (bid as any).frozenByHoldId || '',
                                            expiresAt: '',
                                            requesterName: 'Hold Request',
                                            reason: 'Bid locked by active hold'
                                          } : undefined}
                                        />
                                      );
                                    });
                                  })()}
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Add Another Artist Button - shows on any expanded row for venue owners */}
                            {permissions.actualViewerType === 'venue' && permissions.isOwner && (
                              <div className="bg-gray-50 hover:bg-gray-100 transition-colors duration-150 px-4 py-2 border-t border-gray-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Extract date from the current timeline entry
                                    const extractedDate = extractDateFromEntry(request);
                                    setAddAnotherArtistDate(extractedDate);
                                    setAddAnotherArtistShowId(request.id);
                                    setIsAddAnotherArtistModalOpen(true);
                                  }}
                                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-1 px-4 rounded border-2 border-dashed border-yellow-400 transition-colors duration-150 flex items-center justify-center space-x-2 text-sm"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span>Add Artist</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }
              return null;
            })}
            
            {/* Add Date Row */}
            {stableMonthTabs.every(tab => tab.count === 0) && editable && (
              <tr>
                <td colSpan={venueId ? 9 : 10} className="px-6 py-3">
                  <button
                    onClick={() => {
                      if (artistId) {
                        setAddDateForm(prev => ({ ...prev, type: 'request' }));
                      } else if (venueId) {
                        setAddDateForm(prev => ({ ...prev, type: 'offer' }));
                      }
                      setShowAddDateForm(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Date</span>
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add floating Add Date button when there are entries */}
      {stableMonthTabs.some(tab => tab.count > 0) && editable && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              if (artistId) {
                setAddDateForm(prev => ({ ...prev, type: 'request' }));
              } else if (venueId) {
                setAddDateForm(prev => ({ ...prev, type: 'offer' }));
              }
              setShowAddDateForm(true);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Date</span>
          </button>
        </div>
      )}

      {/* All the modals from original component */}
      
      {/* Venue Bid Form Modal */}
      {state.showBidForm && state.selectedTourRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <VenueBidForm
              tourRequest={state.selectedTourRequest}
              venueId={venueId || 'unknown'}
              venueName={venueName || 'Unknown Venue'}
              onSuccess={handleBidSuccess}
              onCancel={() => {
                actions.closeBidForm();
              }}
            />
          </div>
        </div>
      )}

      {/* Show Detail Modal */}
      {showDetailModal && selectedShowForDetail && (
        <ShowDetailModal
          show={selectedShowForDetail}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedShowForDetail(null);
          }}
          viewerType={permissions.actualViewerType}
        />
      )}

      {/* 🎯 PHASE 4: Removed TourRequest Detail Modal - no longer needed */}
      {/* Tour Request Detail Modal removed - using ShowRequest data directly */}

      {/* Show Document Modal */}
      {showDocumentModal && (
        <ShowDocumentModal
          show={selectedDocumentShow || undefined}
          bid={selectedDocumentBid || undefined}
          tourRequest={selectedDocumentTourRequest || undefined}
          isOpen={showDocumentModal}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedDocumentShow(null);
            setSelectedDocumentBid(null);
            setSelectedDocumentTourRequest(null);
          }}
          viewerType={permissions.actualViewerType}
          onUpdate={(data) => {
            console.log('Document updated:', data);
            fetchData();
          }}
        />
      )}

      {/* Universal Make Offer Modal */}
      {state.showUniversalOfferModal && (
        <UniversalMakeOfferModal
          isOpen={state.showUniversalOfferModal}
          onClose={() => {
            actions.closeUniversalOffer();
          }}
          onSuccess={(result) => {
            console.log('Offer/dismissal result:', result);
            
            // Handle dismissal by removing from local state
            if (result.dismissed && result.requestId) {
              actions.deleteRequestOptimistic(result.requestId);
            }
            
            fetchData();
          }}
          preSelectedArtist={state.offerTargetArtist || undefined}
          preSelectedDate={state.offerPreSelectedDate || undefined}
          tourRequest={state.offerTourRequest || undefined}
          existingBid={state.offerExistingBid || undefined}
        />
      )}

      {/* Add Date Form Modal */}
      <AddDateFormModal
        isOpen={showAddDateForm}
        onClose={() => setShowAddDateForm(false)}
        formType={addDateForm.type}
        artistId={artistId}
        artistName={artistName}
        venueId={venueId}
        venueName={venueName}
        loading={addDateLoading}
        onSuccess={fetchData}
        onSetActiveMonth={actions.setActiveMonth}
        confirm={confirm}
      />

      {/* Add Artist Modal */}
      <AddSupportActModal
        isOpen={isAddAnotherArtistModalOpen}
        onClose={() => {
          setIsAddAnotherArtistModalOpen(false);
          setAddAnotherArtistDate('');
          setAddAnotherArtistShowId('');
        }}
        showId={addAnotherArtistShowId}
        showDate={addAnotherArtistDate}
        venueName={venueName || 'Unknown Venue'}
        venueId={venueId || ''}
        onSuccess={handleAddAnotherArtistSuccess}
      />

      {/* Render the Alert Modal */}
      {AlertModal}
    </div>
  );
} 
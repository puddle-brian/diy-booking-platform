'use client';

import React, { useState, useEffect } from 'react';
import { Show, TourRequest, VenueBid, VenueOffer } from '../../types';
import { TechnicalRequirement, HospitalityRequirement } from '../../types/templates';
import VenueBidForm from './VenueBidForm';
import ShowDetailModal from './ShowDetailModal';
import TourRequestDetailModal from './TourRequestDetailModal';
import TemplateSelector from './TemplateSelector';
import TemplateFormRenderer from './TemplateFormRenderer';
import LocationVenueAutocomplete from './LocationVenueAutocomplete';
import UnifiedShowRequestForm from './UnifiedShowRequestForm';
import TechnicalRequirementsTable from './TechnicalRequirementsTable';
import HospitalityRiderTable from './HospitalityRiderTable';
import VenueOfferForm from './VenueOfferForm';
import { InlineOfferDisplay } from './OfferDisplay';
import OfferInput, { ParsedOffer, parsedOfferToLegacyFormat } from './OfferInput';
import ShowDocumentModal from './ShowDocumentModal';
import UniversalMakeOfferModal from './UniversalMakeOfferModal';
import MakeOfferButton from './MakeOfferButton';
import { ItineraryDate } from './DateDisplay';
import OfferFormCore from './OfferFormCore';
import { useAlert } from './UniversalAlertModal';

// Import our new custom hooks and utilities
import { useTourItineraryData } from '../hooks/useTourItineraryData';
import { useVenueArtistSearch } from '../hooks/useVenueArtistSearch';
import { useItineraryPermissions } from '../hooks/useItineraryPermissions';
import { useItineraryState } from '../hooks/useItineraryState';
import {
  createTimelineEntries,
  groupEntriesByMonth,
  getDefaultActiveMonth
} from '../utils/timelineUtils';

// Import action button components
import { BidActionButtons, MakeOfferActionButton, DeleteActionButton, DocumentActionButton } from './ActionButtons';
import { ShowTimelineItem, TourRequestTimelineItem, BidTimelineItem } from './TimelineItems';

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
  type: 'show' | 'tour-request';
  date: string;
  endDate?: string;
  data: Show | TourRequest | VenueBid;
  parentTourRequest?: TourRequest;
}

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
  const { state, actions } = useItineraryState();

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
  const [tourRequestDetailModal, setTourRequestDetailModal] = useState(false);
  const [selectedTourRequest, setSelectedTourRequest] = useState<TourRequest | null>(null);
  
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
  const [selectedDocumentTourRequest, setSelectedDocumentTourRequest] = useState<TourRequest | null>(null);
  
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

  // 🎯 UX IMPROVEMENT: Helper function to determine when venues should see offer buttons
  const shouldShowOfferButton = (request: TourRequest & { isVenueInitiated?: boolean }) => {
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

  // Set active tab to first month with entries, or current month if no entries
  useEffect(() => {
    if (monthGroups.length > 0) {
      const currentTabExists = monthGroups.some(group => group.monthKey === state.activeMonthTab);
      
      if (!state.activeMonthTab || !currentTabExists) {
        const defaultMonth = getDefaultActiveMonth(monthGroups);
        actions.setActiveMonth(defaultMonth);
      }
    } else if (monthGroups.length === 0) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      actions.setActiveMonth(currentMonth);
    }
  }, [monthGroups.length, state.activeMonthTab, actions]);

  // 🎯 FIX: Reset optimistic state when switching between venues/artists
  useEffect(() => {
    // Clear all optimistic state when artistId or venueId changes
    actions.resetOptimisticState();
  }, [artistId, venueId, actions.resetOptimisticState]);

  const activeMonthEntries = monthGroups.find(group => group.monthKey === state.activeMonthTab)?.entries || [];

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
  const handlePlaceBid = (tourRequest: TourRequest) => {
    if (venueId && venueName) {
      actions.openBidForm(tourRequest);
      return;
    }
    
    if (permissions.canMakeOffers) {
      // Fix the artist parameter to match the expected signature
      actions.openUniversalOffer({
        id: tourRequest.artistId,
        name: tourRequest.artistName
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
          
          // If this was the last item in the month, switch to a valid month immediately
          if (isLastItemInMonth && monthGroups.length > 1) {
            // Find the next best month to switch to
            const currentMonthIndex = monthGroups.findIndex(group => group.monthKey === state.activeMonthTab);
            let newActiveMonth: string;
            
            if (currentMonthIndex < monthGroups.length - 1) {
              // Switch to next month
              newActiveMonth = monthGroups[currentMonthIndex + 1].monthKey;
            } else if (currentMonthIndex > 0) {
              // Switch to previous month
              newActiveMonth = monthGroups[currentMonthIndex - 1].monthKey;
            } else {
              // Fallback to current month
              const now = new Date();
              newActiveMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }
            
            actions.setActiveMonth(newActiveMonth);
          }
          
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
    const targetDate = proposedDate.split('T')[0]; // Get just the date part
    
    // Check for accepted bids on the same date (using real backend status for conflict detection)
    const acceptedBid = venueBids.find(bid => 
      bid.status === 'accepted' && 
      bid.proposedDate.split('T')[0] === targetDate &&
      bid.id !== excludeBidId
    );
    
    // Check for accepted offers on the same date
    const acceptedOffer = venueOffers.find(offer => 
      (offer.status === 'accepted' || offer.status === 'ACCEPTED') && 
      offer.proposedDate.split('T')[0] === targetDate &&
      offer.id !== excludeOfferId
    );
    
    return { acceptedBid, acceptedOffer };
  };

  // Helper function to get effective bid status (with optimistic overrides)
  const getEffectiveBidStatus = (bid: VenueBid) => {
    const override = bidStatusOverrides.get(bid.id);
    if (override) {
      return override;
    }
    // Convert legacy 'hold' status to 'pending' since we removed hold functionality
    if (bid.status === 'hold') {
      return 'pending';
    }
    return bid.status;
  };

  // Extract the original bid action logic into a separate function (defined first)
  const proceedWithBidAction = async (bid: VenueBid, action: string, reason?: string) => {
    setBidActions(prev => ({ ...prev, [bid.id]: true }));
    
    // Optimistic update for decline action to avoid flashing
    if (action === 'decline') {
      // Immediately add to declined bids set
      setDeclinedBids(prev => new Set([...prev, bid.id]));
    }
    
    try {
      const response = await fetch(`/api/show-requests/${bid.showRequestId}/bids`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidId: bid.id,
          action,
          reason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} bid`);
      }

      // Only refetch data for non-decline actions
      if (action !== 'decline') {
        await fetchData();
      }
      
      const actionMessages = {
        accept: 'Bid accepted! You can now coordinate with the venue to finalize details.',
        decline: 'Bid declined and removed from your itinerary.'
      };
      
      const message = actionMessages[action as keyof typeof actionMessages] || `Bid ${action}ed successfully.`;
      
      if (action === 'decline') {
        showSuccess('Bid Declined', 'The bid has been removed from your itinerary.');
      }
    } catch (error) {
      console.error(`Error ${action}ing bid:`, error);
      
      // Revert optimistic update on error
      if (action === 'decline') {
        setDeclinedBids(prev => {
          const newSet = new Set(prev);
          newSet.delete(bid.id);
          return newSet;
        });
      }
      
      showError(`${action.charAt(0).toUpperCase() + action.slice(1)} Failed`, `Failed to ${action} bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBidActions(prev => ({ ...prev, [bid.id]: false }));
    }
  };

  // Extract the original offer action logic into a separate function (defined first)
  const proceedWithOfferAction = async (offer: VenueOffer, action: string) => {
    const actionText = action === 'accept' ? 'accept' : action === 'decline' ? 'decline' : action;
    
    // Optimistic update for decline action to avoid flashing
    if (action === 'decline') {
      // Check if this is the last item in the current month before deletion
      const syntheticRequestId = `venue-offer-${offer.id}`;
      const currentMonthEntries = activeMonthEntries;
      const offerToDelete = currentMonthEntries.find(entry => 
        entry.type === 'tour-request' && (entry.data as any).id === syntheticRequestId
      );
      const isLastItemInMonth = currentMonthEntries.length === 1 && offerToDelete;
      
      // Find and hide the synthetic tour request for this offer
      actions.deleteRequestOptimistic(syntheticRequestId);
      
      // If this was the last item in the month, switch to a valid month immediately
      if (isLastItemInMonth && monthGroups.length > 1) {
        // Find the next best month to switch to
        const currentMonthIndex = monthGroups.findIndex(group => group.monthKey === state.activeMonthTab);
        let newActiveMonth: string;
        
        if (currentMonthIndex < monthGroups.length - 1) {
          // Switch to next month
          newActiveMonth = monthGroups[currentMonthIndex + 1].monthKey;
        } else if (currentMonthIndex > 0) {
          // Switch to previous month
          newActiveMonth = monthGroups[currentMonthIndex - 1].monthKey;
        } else {
          // Fallback to current month
          const now = new Date();
          newActiveMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        
        actions.setActiveMonth(newActiveMonth);
      }
    } else if (action === 'accept') {
      // Optimistic update for accept action
      setBidStatusOverrides(prev => new Map(prev).set(offer.id, 'accepted'));
    }
    
    try {
      // 🎯 NEW UNIFIED SYSTEM FIX: Check if this is a ShowRequest (new system) or VenueOffer (old system)
      // ShowRequests from admin reset will have a different ID pattern and need different API endpoints
      let response;
      
      // Try the new ShowRequest API first (for admin-created offers)
      const showRequestResponse = await fetch(`/api/show-requests/${offer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: action === 'decline' ? 'decline' : action,
          status: action === 'decline' ? 'DECLINED' : action === 'accept' ? 'CONFIRMED' : action.toUpperCase()
        }),
      });

      if (showRequestResponse.ok) {
        // This was a ShowRequest from the new system
        response = showRequestResponse;
        console.log(`✅ Successfully updated ShowRequest ${offer.id} via new unified API`);
      } else if (showRequestResponse.status === 404) {
        // Not found as ShowRequest, try the old VenueOffer API
        console.log(`🔄 ShowRequest not found, trying VenueOffer API for ${offer.id}`);
        
        response = await fetch(`/api/venues/${offer.venueId}/offers/${offer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        });

        if (response.ok) {
          console.log(`✅ Successfully updated VenueOffer ${offer.id} via legacy API`);
        }
      } else {
        // Some other error with ShowRequest API
        response = showRequestResponse;
      }

      if (!response.ok) {
        const errorData = await response.json();
        
        // 🎯 NEW: Auto-refresh on 404 errors (stale data detection)
        if (response.status === 404) {
          console.warn('🔄 Stale data detected (404 error), automatically refreshing...');
          showInfo('Data Updated', 'The data has been refreshed to show the latest information.');
          await fetchData(); // Auto-refresh to get fresh data
          return; // Exit early since data was refreshed
        }
        
        throw new Error(errorData.error || `Failed to ${actionText} offer`);
      }

      // Clear optimistic override since backend is now in sync  
      // Don't clear for decline (uses different state)
      if (action !== 'decline') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(offer.id);
          return newMap;
        });
      }
      
      if (action === 'decline') {
        showSuccess('Offer Declined', 'The venue offer has been removed from your itinerary.');
      } else if (action === 'accept') {
        showSuccess('Offer Accepted', 'The venue offer has been accepted and added to your confirmed shows!');

      }
    } catch (error) {
      console.error(`Error ${actionText}ing offer:`, error);
      
      // Revert optimistic updates on error
      if (action === 'accept') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(offer.id);
          return newMap;
        });
      } else if (action === 'decline') {
        // Revert optimistic update on error by refreshing data
        await fetchData();
      }
      
      showError(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Failed`, `Failed to ${actionText} offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBidAction = async (bid: VenueBid, action: string, reason?: string) => {
    // Add conflict validation for accept action
    if (action === 'accept') {
      const { acceptedBid, acceptedOffer } = checkDateConflict(bid.proposedDate, bid.id);
      
      if (acceptedBid || acceptedOffer) {
        const conflictVenue = acceptedBid ? acceptedBid.venueName : acceptedOffer?.venueName;
        const conflictType = acceptedBid ? 'bid' : 'offer';
        
        confirm(
          'Date Conflict',
          `You've already accepted ${conflictType === 'bid' ? 'a bid' : 'an offer'} from ${conflictVenue} for this date. Only one booking can be accepted per date. Switch to ${bid.venueName} instead?`,
          async () => {
            // Show loading toast (brief, auto-dismiss)
            toast('info', 'Switching Bookings', `Switching to ${bid.venueName}...`, 2000);
            
            // Optimistic updates for seamless UX
            try {
              // Immediately update UI state
              if (acceptedBid) {
                setBidStatusOverrides(prev => new Map(prev).set(acceptedBid.id, 'pending'));
              }
              setBidStatusOverrides(prev => new Map(prev).set(bid.id, 'accepted'));
              
              // Perform backend updates
              if (acceptedBid) {
                await fetch(`/api/show-requests/${acceptedBid.showRequestId}/bids`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    bidId: acceptedBid.id,
                    action: 'undo-accept',
                    reason: `Reverted - switched to ${bid.venueName} for same date`
                  }),
                });
              }
              
              if (acceptedOffer) {
                await fetch(`/api/venues/${acceptedOffer.venueId}/offers/${acceptedOffer.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'decline',
                    reason: `Switched to ${bid.venueName} for same date`
                  }),
                });
              }
              
              // Accept the new bid
              await fetch(`/api/show-requests/${bid.showRequestId}/bids`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bidId: bid.id,
                  action: 'accept',
                  reason
                }),
              });
              
              // Refresh data to sync backend state
              await fetchData();
              
              // Show success toast (longer, auto-dismiss)
              toast('success', 'Booking Updated', `Now booked with ${bid.venueName}!`, 4000);
            } catch (error) {
              // Revert optimistic updates on error
              setBidStatusOverrides(prev => {
                const newMap = new Map(prev);
                if (acceptedBid) newMap.delete(acceptedBid.id);
                newMap.delete(bid.id);
                return newMap;
              });
              showError('Switch Failed', 'Failed to switch bookings. Please try again.');
            }
          }
        );
        return; // Exit early to wait for user confirmation
      }
    }
    
    // No conflict or not an accept action, proceed with optimistic update
    return proceedWithBidActionOptimistic(bid, action, reason);
  };

  // Optimistic version of proceedWithBidAction
  const proceedWithBidActionOptimistic = async (bid: VenueBid, action: string, reason?: string) => {
    setBidActions(prev => ({ ...prev, [bid.id]: true }));
    
    // Immediate optimistic update
    if (action === 'accept') {
      setBidStatusOverrides(prev => new Map(prev).set(bid.id, 'accepted'));
    } else if (action === 'undo-accept') {
      setBidStatusOverrides(prev => new Map(prev).set(bid.id, 'pending'));
    } else if (action === 'decline') {
      setDeclinedBids(prev => new Set([...prev, bid.id]));
    }
    
    try {
      const response = await fetch(`/api/show-requests/${bid.showRequestId}/bids`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidId: bid.id,
          action,
          reason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} bid`);
      }

      // Keep optimistic state until next refresh - don't clear immediately
      // This prevents stale data from overriding our optimistic updates
      
      const actionMessages = {
        accept: 'Bid accepted! You can now coordinate with the venue to finalize details.',
        hold: 'Bid placed on hold. You have time to consider other options.',
        decline: 'Bid declined and removed from your itinerary.'
      };
      
      if (action === 'decline') {
        showSuccess('Bid Declined', 'The bid has been removed from your itinerary.');
      }
    } catch (error) {
      console.error(`Error ${action}ing bid:`, error);
      
      // Revert optimistic updates on error
      if (action === 'accept') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(bid.id);
          return newMap;
        });
      } else if (action === 'undo-accept') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(bid.id);
          return newMap;
        });
      } else if (action === 'hold') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(bid.id);
          return newMap;
        });
      } else if (action === 'decline') {
        setDeclinedBids(prev => {
          const newSet = new Set(prev);
          newSet.delete(bid.id);
          return newSet;
        });
      }
      
      showError(`${action.charAt(0).toUpperCase() + action.slice(1)} Failed`, `Failed to ${action} bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBidActions(prev => ({ ...prev, [bid.id]: false }));
    }
  };

  // Optimistic version of proceedWithOfferAction (moved up for proper declaration order)
  const proceedWithOfferActionOptimistic = async (offer: VenueOffer, action: string) => {
    const actionText = action === 'accept' ? 'accept' : action === 'decline' ? 'decline' : action;
    
    // Optimistic update for decline action to avoid flashing
    if (action === 'decline') {
      // Check if this is the last item in the current month before deletion
      const syntheticRequestId = `venue-offer-${offer.id}`;
      const currentMonthEntries = activeMonthEntries;
      const offerToDelete = currentMonthEntries.find(entry => 
        entry.type === 'tour-request' && (entry.data as any).id === syntheticRequestId
      );
      const isLastItemInMonth = currentMonthEntries.length === 1 && offerToDelete;
      
      // Find and hide the synthetic tour request for this offer
      actions.deleteRequestOptimistic(syntheticRequestId);
      
      // If this was the last item in the month, switch to a valid month immediately
      if (isLastItemInMonth && monthGroups.length > 1) {
        // Find the next best month to switch to
        const currentMonthIndex = monthGroups.findIndex(group => group.monthKey === state.activeMonthTab);
        let newActiveMonth: string;
        
        if (currentMonthIndex < monthGroups.length - 1) {
          // Switch to next month
          newActiveMonth = monthGroups[currentMonthIndex + 1].monthKey;
        } else if (currentMonthIndex > 0) {
          // Switch to previous month
          newActiveMonth = monthGroups[currentMonthIndex - 1].monthKey;
        } else {
          // Fallback to current month
          const now = new Date();
          newActiveMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        
        actions.setActiveMonth(newActiveMonth);
      }
    } else if (action === 'accept') {
      // Optimistic update for accept action
      setBidStatusOverrides(prev => new Map(prev).set(offer.id, 'accepted'));
    }
    
    try {
      // 🎯 NEW UNIFIED SYSTEM FIX: Check if this is a ShowRequest (new system) or VenueOffer (old system)
      // ShowRequests from admin reset will have a different ID pattern and need different API endpoints
      let response;
      
      // Try the new ShowRequest API first (for admin-created offers)
      const showRequestResponse = await fetch(`/api/show-requests/${offer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: action === 'decline' ? 'decline' : action,
          status: action === 'decline' ? 'DECLINED' : action === 'accept' ? 'CONFIRMED' : action.toUpperCase()
        }),
      });

      if (showRequestResponse.ok) {
        // This was a ShowRequest from the new system
        response = showRequestResponse;
        console.log(`✅ Successfully updated ShowRequest ${offer.id} via new unified API`);
      } else if (showRequestResponse.status === 404) {
        // Not found as ShowRequest, try the old VenueOffer API
        console.log(`🔄 ShowRequest not found, trying VenueOffer API for ${offer.id}`);
        
        response = await fetch(`/api/venues/${offer.venueId}/offers/${offer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        });

        if (response.ok) {
          console.log(`✅ Successfully updated VenueOffer ${offer.id} via legacy API`);
        }
      } else {
        // Some other error with ShowRequest API
        response = showRequestResponse;
      }

      if (!response.ok) {
        const errorData = await response.json();
        
        // 🎯 NEW: Auto-refresh on 404 errors (stale data detection)
        if (response.status === 404) {
          console.warn('🔄 Stale data detected (404 error), automatically refreshing...');
          showInfo('Data Updated', 'The data has been refreshed to show the latest information.');
          await fetchData(); // Auto-refresh to get fresh data
          return; // Exit early since data was refreshed
        }
        
        throw new Error(errorData.error || `Failed to ${actionText} offer`);
      }

      // Clear optimistic override since backend is now in sync  
      // Don't clear for decline (uses different state)
      if (action !== 'decline') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(offer.id);
          return newMap;
        });
      }
      
      if (action === 'decline') {
        showSuccess('Offer Declined', 'The venue offer has been removed from your itinerary.');
      } else if (action === 'accept') {
        showSuccess('Offer Accepted', 'The venue offer has been accepted and added to your confirmed shows!');
      }
    } catch (error) {
      console.error(`Error ${actionText}ing offer:`, error);
      
      // Revert optimistic updates on error
      if (action === 'accept') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(offer.id);
          return newMap;
        });
      } else if (action === 'decline') {
        // Revert optimistic update on error by refreshing data
        await fetchData();
      }
      
      showError(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Failed`, `Failed to ${actionText} offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleOfferAction = async (offer: VenueOffer, action: string) => {
    // Add conflict validation for accept action
    if (action === 'accept') {
      const { acceptedBid, acceptedOffer } = checkDateConflict(offer.proposedDate, undefined, offer.id);
      
      if (acceptedBid || acceptedOffer) {
        const conflictVenue = acceptedBid ? acceptedBid.venueName : acceptedOffer?.venueName;
        const conflictType = acceptedBid ? 'bid' : 'offer';
        
        confirm(
          'Date Conflict',
          `You've already accepted ${conflictType === 'bid' ? 'a bid' : 'an offer'} from ${conflictVenue} for this date. Only one booking can be accepted per date. Switch to ${offer.venueName} instead?`,
          async () => {
            // Show loading toast (brief, auto-dismiss)
            toast('info', 'Switching Bookings', `Switching to ${offer.venueName}...`, 2000);
            
            // Optimistic updates for seamless UX
            try {
              // Immediately update UI state
              if (acceptedBid) {
                setBidStatusOverrides(prev => new Map(prev).set(acceptedBid.id, 'pending'));
              }
              setBidStatusOverrides(prev => new Map(prev).set(offer.id, 'accepted'));
              
              // Perform backend updates
              if (acceptedBid) {
                await fetch(`/api/show-requests/${acceptedBid.showRequestId}/bids`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    bidId: acceptedBid.id,
                    action: 'undo-accept',
                    reason: `Reverted - switched to ${offer.venueName} for same date`
                  }),
                });
              }
              
              if (acceptedOffer) {
                await fetch(`/api/venues/${acceptedOffer.venueId}/offers/${acceptedOffer.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'decline',
                    reason: `Switched to ${offer.venueName} for same date`
                  }),
                });
              }
              
              // Accept the new offer
              await fetch(`/api/venues/${offer.venueId}/offers/${offer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'accept'
                }),
              });
              
              // Refresh data to sync backend state
              await fetchData();
              
              // Show success toast (longer, auto-dismiss)
              toast('success', 'Booking Updated', `Now booked with ${offer.venueName}!`, 4000);
            } catch (error) {
              // Revert optimistic updates on error
              setBidStatusOverrides(prev => {
                const newMap = new Map(prev);
                if (acceptedBid) newMap.delete(acceptedBid.id);
                newMap.delete(offer.id);
                return newMap;
              });
              showError('Switch Failed', 'Failed to switch bookings. Please try again.');
            }
          }
        );
        return; // Exit early to wait for user confirmation
      }
    }
    
    // No conflict or not an accept action, proceed with optimistic update
    return proceedWithOfferActionOptimistic(offer, action);
  };

  const getBidStatusBadge = (bid: VenueBid) => {
    const effectiveStatus = getEffectiveBidStatus(bid);
    switch (effectiveStatus) {
      case 'pending':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
          text: 'Pending'
        };

      case 'accepted':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800',
          text: 'Accepted'
        };
      case 'declined':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800',
          text: 'Declined'
        };
      case 'cancelled':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
          text: 'Cancelled'
        };
      default:
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
          text: effectiveStatus
        };
    }
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
        
        // Check if this is the last item in the current month before deletion
        const currentMonthEntries = activeMonthEntries;
        const requestToDelete = currentMonthEntries.find(entry => 
          entry.type === 'tour-request' && (entry.data as TourRequest).id === requestId
        );
        const isLastItemInMonth = currentMonthEntries.length === 1 && requestToDelete;
        
        // Optimistic update - immediately hide the request
        actions.deleteRequestOptimistic(requestId);
        
        // If this was the last item in the month, switch to a valid month immediately
        if (isLastItemInMonth && monthGroups.length > 1) {
          // Find the next best month to switch to
          const currentMonthIndex = monthGroups.findIndex(group => group.monthKey === state.activeMonthTab);
          let newActiveMonth: string;
          
          if (currentMonthIndex < monthGroups.length - 1) {
            // Switch to next month
            newActiveMonth = monthGroups[currentMonthIndex + 1].monthKey;
          } else if (currentMonthIndex > 0) {
            // Switch to previous month
            newActiveMonth = monthGroups[currentMonthIndex - 1].monthKey;
          } else {
            // Fallback to current month
            const now = new Date();
            newActiveMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          }
          
          actions.setActiveMonth(newActiveMonth);
        }
        
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

  const handleTourRequestDetailModal = (request: TourRequest) => {
    setSelectedTourRequest(request);
    setTourRequestDetailModal(true);
  };

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

  const handleTourRequestDocumentModal = (request: TourRequest) => {
    setSelectedDocumentTourRequest(request);
    setSelectedDocumentShow(null);
    setSelectedDocumentBid(null);
    setShowDocumentModal(true);
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
      {monthGroups.length > 0 && (
        <div className="border-b border-gray-200">
          <div className="px-6">
            <nav className="flex space-x-8 overflow-x-auto">
              {monthGroups.map((group) => (
                <button
                  key={group.monthKey}
                  onClick={() => actions.setActiveMonth(group.monthKey)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    state.activeMonthTab === group.monthKey
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {group.monthLabel} ({group.entries.length})
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] table-fixed">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium text-gray-600">
              <th className="px-2 py-1.5 w-[3%]"></th>
              <th className="px-4 py-1.5 w-[12%]">Date</th>
              <th className="px-4 py-1.5 w-[14%]">Location</th>
              <th className="px-4 py-1.5 w-[19%]">{artistId ? 'Venue' : venueId ? 'Artist' : 'Artist'}</th>
              <th className="px-4 py-1.5 w-[10%]">Status</th>
              <th className="px-4 py-1.5 w-[7%]">Capacity</th>
              <th className="px-4 py-1.5 w-[7%]">Age</th>
              <th className="px-4 py-1.5 w-[10%]">Offers</th>
              <th className="px-4 py-1.5 w-[8%]">details</th>
              <th className="px-4 py-1.5 w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Empty state */}
            {activeMonthEntries.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📅</span>
                  </div>
                  {monthGroups.length === 0 ? (
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
                    onToggleExpansion={toggleShowExpansion}
                    onDeleteShow={handleDeleteShow}
                    onShowDocument={handleShowDocumentModal}
                    onShowDetail={handleShowDetailModal}
                  />
                );
              } else if (entry.type === 'tour-request') {
                const request = entry.data as TourRequest & { 
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
                  // For synthetic requests from venue offers, convert the venue offer to a bid format
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
                        pa: false,
                        mics: false,
                        drums: false,
                        amps: false,
                        piano: false
                      },
                      loadIn: originalOffer.loadIn || '',
                      soundcheck: originalOffer.soundcheck || '',
                      doorsOpen: originalOffer.doorsOpen || '',
                      showTime: originalOffer.showTime || '',
                      curfew: originalOffer.curfew || '',
                      promotion: originalOffer.promotion || {
                        social: false,
                        flyerPrinting: false,
                        radioSpots: false,
                        pressCoverage: false
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
                    };
                    
                    requestBids = [syntheticBid];
                  }
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

                return (
                  <React.Fragment key={`request-${request.id}`}>
                    <tr 
                      className="bg-blue-50 cursor-pointer transition-colors duration-150 hover:bg-blue-100 hover:shadow-sm border-l-4 border-blue-400 hover:border-blue-500"
                      onClick={() => toggleRequestExpansion(request.id)}
                      title={`Click to ${state.expandedRequests.has(request.id) ? 'hide' : 'view'} bids for this show request`}
                    >
                      <td className="px-2 py-1.5 w-[3%]">
                        <div className="flex items-center justify-center text-gray-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d={state.expandedRequests.has(request.id) ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                          </svg>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 w-[12%]">
                        <ItineraryDate
                          startDate={request.startDate}
                          endDate={request.endDate}
                          isSingleDate={request.isSingleDate}
                          className="text-sm font-medium text-blue-900"
                        />
                      </td>
                      <td className="px-4 py-1.5 w-[14%]">
                        <div className="text-sm text-blue-900 truncate">{request.location}</div>
                      </td>
                      <td className="px-4 py-1.5 w-[19%]">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {(() => {
                            if (artistId) {
                              // For artist pages, show venue information
                              if (request.isVenueInitiated) {
                                // For venue-initiated offers, show the venue name as clickable link
                                const requestAsVenueRequest = request as TourRequest & { venueId?: string; venueName?: string };
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
                              } else {
                                // For artist-initiated requests, show bid count or venue-specific info
                                const requestAsVenueSpecific = request as TourRequest & { 
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
                              // For venue pages, show artist as clickable link
                              if (request.artistId && request.artistId !== 'external-artist') {
                                return (
                                  <a 
                                    href={`/artists/${request.artistId}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                    title="View artist page"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {request.artistName}
                                  </a>
                                );
                              } else {
                                return request.artistName;
                              }
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
                                    {request.artistName}
                                  </a>
                                );
                              } else {
                                return request.artistName;
                              }
                            }
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-1.5 w-[10%]">
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
                            // Check if this request has any active holds
                            const hasActiveHold = requestBids.some((bid: VenueBid) => 
                              (bid as any).holdState === 'HELD' || (bid as any).holdState === 'FROZEN'
                            );
                            
                            if (hasActiveHold) {
                              return (
                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                  Hold
                                </span>
                              );
                            }
                            
                            return (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {requestBids.length > 0 ? 'Bidding' : 'Requested'}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-1.5 w-[7%]"></td>
                      <td className="px-4 py-1.5 w-[7%]"></td>
                      <td className="px-4 py-1.5 w-[10%]">
                        <div className="flex items-center space-x-2">
                          <div className="text-xs">
                            <span className={requestBids.length > 0 ? "text-blue-600 font-medium" : "text-gray-400"}>
                              {requestBids.length} bid{requestBids.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                                        </td>
                  <td className="px-4 py-1.5 w-[8%]">
                    <div className="flex items-center space-x-1">
                      {/* Show document icon for venues and artists (only when 0 bids) */}
                      {(venueId || (artistId && requestBids.length === 0 && permissions.canViewRequestDocument(request, requestBids))) && (
                        <DocumentActionButton
                          type="request"
                          request={request}
                          permissions={permissions}
                          artistId={artistId}
                          venueId={venueId}
                          requestBids={requestBids}
                          onRequestDocument={handleTourRequestDocumentModal}
                          onBidDocument={handleBidDocumentModal}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-1.5 w-[10%]">
                        <div className="flex items-center space-x-2">
                          <MakeOfferActionButton
                            request={request}
                            permissions={permissions}
                            venueId={venueId}
                            venueName={venueName}
                            requestBids={requestBids}
                            onMakeOffer={(request, existingBid) => {
                              // Extract the appropriate date from the request
                              const requestWithDates = request as any;
                              const preSelectedDate = requestWithDates.requestDate || requestWithDates.startDate || null;
                              
                              actions.openUniversalOffer(
                                {
                                  id: request.artistId,
                                  name: request.artistName
                                },
                                {
                                  id: request.id,
                                  title: request.title,
                                  artistName: request.artistName
                                },
                                preSelectedDate,
                                existingBid
                              );
                            }}
                          />

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
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Bids Section */}
                    {state.expandedRequests.has(request.id) && requestBids.length > 0 && permissions.canExpandRequest(request) && (
                      <tr>
                        <td colSpan={10} className="px-0 py-0">
                          <div className="bg-yellow-50 border-l-4 border-yellow-400">
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[1000px] table-fixed">
                                <thead className="bg-yellow-100">
                                  <tr className="text-left text-xs font-medium text-yellow-700">
                                    <th className="px-2 py-1.5 w-[3%]"></th>
                                    <th className="px-4 py-1.5 w-[12%]">Date</th>
                                    <th className="px-4 py-1.5 w-[14%]">Location</th>
                                    <th className="px-4 py-1.5 w-[19%]">Venue</th>
                                    <th className="px-4 py-1.5 w-[10%]">Status</th>
                                    <th className="px-4 py-1.5 w-[7%]">Capacity</th>
                                    <th className="px-4 py-1.5 w-[7%]">Age</th>
                                    <th className="px-4 py-1.5 w-[10%]">Offers</th>
                                    <th className="px-4 py-1.5 w-[8%]">Details</th>
                                    <th className="px-4 py-1.5 w-[10%]">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-yellow-200">
                                                                    {requestBids
                                    .filter((bid: VenueBid) => {
                                      // Apply status filtering
                                      if (['expired', 'declined', 'rejected'].includes(bid.status) || declinedBids.has(bid.id)) {
                                        return false;
                                      }
                                      
                                      // Apply privacy filtering - only show bids user can see financial details for
                                      return permissions.canSeeFinancialDetails(undefined, bid, request);
                                    })
                                    .map((bid: VenueBid) => {
                                      // 🔒 CRITICAL: Check if bid is frozen by an active hold
                                      const isFrozenByHold = (bid as any).holdState === 'FROZEN' || (bid as any).holdState === 'HELD';
                                      
                                      return (
                                        <BidTimelineItem
                                          key={`bid-${bid.id}`}
                                          bid={bid}
                                          request={request}
                                          permissions={permissions}
                                          isExpanded={false}
                                          isDeleting={false}
                                          venueOffers={venueOffers as any}
                                          venueBids={venueBids}
                                          venueId={venueId}
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
                                          isFrozenByHold={isFrozenByHold}
                                          activeHoldInfo={isFrozenByHold ? {
                                            id: (bid as any).frozenByHoldId || '',
                                            expiresAt: '',
                                            requesterName: 'Hold Request',
                                            reason: 'Bid locked by active hold'
                                          } : undefined}
                                        />
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
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
            {monthGroups.length === 0 && editable && (
              <tr>
                <td colSpan={10} className="px-6 py-3">
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
      {monthGroups.length > 0 && editable && (
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

      {/* Tour Request Detail Modal */}
      {tourRequestDetailModal && selectedTourRequest && (
        <TourRequestDetailModal
          tourRequest={selectedTourRequest}
          isOpen={tourRequestDetailModal}
          onClose={() => {
            setTourRequestDetailModal(false);
            setSelectedTourRequest(null);
          }}
          onPlaceBid={() => {
            setTourRequestDetailModal(false);
            actions.openBidForm(selectedTourRequest);
          }}
          viewerType={permissions.actualViewerType}
        />
      )}

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
      {showAddDateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          {addDateForm.type === 'offer' && venueId && venueName ? (
            // Use OfferFormCore for consistent offer experience
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <OfferFormCore
                venueId={venueId}
                venueName={venueName}
                onSubmit={async (formData: any) => {
                  try {
                    const legacyOffer = parsedOfferToLegacyFormat(formData.offerData);
                    const [year, month, day] = formData.proposedDate.split('-').map(Number);
                    const dateForTitle = new Date(year, month - 1, day);
                    
                    const requestBody: any = {
                      artistId: formData.artistId,
                      venueId: venueId,
                      title: `${formData.artistName} - ${dateForTitle.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${venueName}`,
                      requestedDate: formData.proposedDate,
                      initiatedBy: 'VENUE',
                      capacity: formData.capacity,
                      ageRestriction: formData.ageRestriction,
                      message: formData.message.trim() || `Hey! We'd love to have you play at ${venueName}. We think you'd be a great fit for our space and audience. Let us know if you're interested!`,
                    };

                    if (legacyOffer.amount !== null && legacyOffer.amount !== undefined) {
                      requestBody.amount = legacyOffer.amount;
                    }
                    if (legacyOffer.doorDeal !== null && legacyOffer.doorDeal !== undefined) {
                      requestBody.doorDeal = legacyOffer.doorDeal;
                    }
                    
                    const response = await fetch('/api/show-requests', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(requestBody),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result.error || 'Failed to create offer');
                    }
                    
                    setShowAddDateForm(false);
                    await fetchData();
                  } catch (error) {
                    console.error('Error creating venue offer:', error);
                    throw error;
                  }
                }}
                onCancel={() => setShowAddDateForm(false)}
                confirm={confirm}
                title="Make Offer to Artist"
                subtitle="Invite a specific artist to play at your venue on this date"
                submitButtonText="Send Offer"
              />
            </div>
          ) : (
            // Use UnifiedShowRequestForm for requests and confirmed shows
            <UnifiedShowRequestForm
              formType={addDateForm.type}
              artistId={artistId}
              artistName={artistName}
              venueId={venueId}
              venueName={venueName}
              onSubmit={async (formData: any) => {
                try {
                  if (addDateForm.type === 'confirmed') {
                    // Handle confirmed shows
                    let showTitle = formData.title.trim();
                    if (!showTitle) {
                      if (artistId && formData.venueName) {
                        showTitle = `${artistName} at ${formData.venueName}`;
                      } else if (venueId && formData.artistName) {
                        showTitle = `${formData.artistName} at ${venueName}`;
                      } else {
                        showTitle = `Show on ${new Date(formData.date).toLocaleDateString()}`;
                      }
                    }

                    const showData = {
                      date: formData.date,
                      title: showTitle,
                      notes: formData.description?.trim() || undefined,
                      status: 'confirmed',
                      createdBy: artistId ? 'artist' : 'venue',
                      guarantee: formData.guarantee ? parseInt(formData.guarantee) : undefined,
                      ageRestriction: formData.ageRestriction,
                      doorsOpen: formData.doorsOpen || undefined,
                      showTime: formData.showTime || undefined,
                    };

                    if (artistId) {
                      if (!formData.venueName?.trim()) {
                        throw new Error('Please enter a venue name.');
                      }
                      
                      Object.assign(showData, {
                        artistId: artistId,
                        artistName: artistName,
                        venueId: formData.venueId || 'external-venue',
                        venueName: formData.venueName.trim(),
                        city: formData.location.split(',')[0]?.trim() || formData.venueName.split(',')[0]?.trim() || 'Unknown',
                        state: formData.location.split(',')[1]?.trim() || formData.venueName.split(',')[1]?.trim() || 'Unknown'
                      });
                    } else if (venueId) {
                      if (!formData.artistName?.trim()) {
                        throw new Error('Please enter an artist name.');
                      }
                      
                      Object.assign(showData, {
                        artistId: formData.artistId || 'external-artist',
                        artistName: formData.artistName.trim(),
                        venueId: venueId,
                        venueName: venueName,
                        city: formData.location.split(',')[0]?.trim() || 'Unknown',
                        state: formData.location.split(',')[1]?.trim() || 'Unknown'
                      });
                    }

                    const response = await fetch('/api/shows', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(showData),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result.error || 'Failed to create show');
                    }
                  } else if (addDateForm.type === 'request') {
                    // Handle show requests
                    const title = formData.title.trim() || `${artistName} Show Request`;

                    const showRequestData: any = {
                      artistId: artistId,
                      title: title,
                      description: formData.description,
                      requestedDate: formData.requestDate,
                      initiatedBy: 'ARTIST',
                      targetLocations: [formData.location],
                      genres: []
                    };

                    const response = await fetch('/api/show-requests', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(showRequestData),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result.error || 'Failed to create show request');
                    }
                  }

                  setShowAddDateForm(false);
                  await fetchData();
                } catch (error) {
                  console.error('Error in form submission:', error);
                  throw error; // Re-throw so UnifiedShowRequestForm can handle it
                }
              }}
              onCancel={() => setShowAddDateForm(false)}
              loading={addDateLoading}
            />
          )}
        </div>
      )}

      {/* Render the Alert Modal */}
      {AlertModal}
    </div>
  );
} 
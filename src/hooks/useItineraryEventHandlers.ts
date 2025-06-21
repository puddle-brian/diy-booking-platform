import { useCallback } from 'react';
import { Show, VenueBid, VenueOffer } from '../../types';
import { BidService } from '../services/BidService';

interface UseItineraryEventHandlersParams {
  actions: any;
  fetchData: () => Promise<void>;
  shows: Show[];
  venueBids: VenueBid[];
  venueOffers: VenueOffer[];
  bidStatusOverrides: Map<string, any>;
  setBidStatusOverrides: any;
  setDeclinedBids: any;
  setBidActions: any;
  activeMonthEntries: any[];
  venueId?: string;
  venueName?: string;
  permissions: any;
  confirm: any;
  showSuccess: any;
  showError: any;
  showInfo: any;
  toast: any;
  setAddDateForm: any;
}

export interface ItineraryEventHandlers {
  toggleBidExpansion: (requestId: string) => void;
  toggleShowExpansion: (showId: string) => void;
  toggleRequestExpansion: (requestId: string) => void;
  handleBidSuccess: (bid: any) => void;
  handlePlaceBid: (tourRequest: any) => void;
  handleDeleteShow: (showId: string, showName: string) => Promise<void>;
  checkDateConflict: (proposedDate: string, excludeBidId?: string, excludeOfferId?: string) => any;
  getEffectiveBidStatus: (bid: VenueBid) => string;
  handleBidAction: (bid: VenueBid, action: string, reason?: string) => Promise<any>;
  handleOfferAction: (offer: VenueOffer, action: string) => Promise<any>;
  getBidStatusBadge: (bid: VenueBid) => any;
  handleTemplateApply: (template: any) => void;
  handleDeleteShowRequest: (requestId: string, requestName: string) => Promise<void>;
  handleAddAnotherArtistSuccess: (offer: any) => void;
}

/**
 * 🎯 MICRO-PHASE C: Simplified Parameter Setup for Event Handlers
 * 
 * Creates properly configured parameters for useItineraryEventHandlers
 * by moving complex callback setup logic from the component to here.
 * 
 * This reduces component complexity while maintaining exact same hook interface.
 */
export function createEventHandlerParams(config: {
  actions: any;
  fetchData: () => Promise<void>;
  shows: Show[];
  venueBids: VenueBid[];
  venueOffers: VenueOffer[];
  bidStatusOverrides: Map<string, any>;
  setBidStatusOverride: (key: string, value: any) => void;
  addDeclinedBid: (bidId: string) => void;
  declinedBids: Set<string>;
  setBidActions: any;
  activeMonthEntries: any[];
  venueId?: string;
  venueName?: string;
  permissions: any;
  confirm: any;
  showSuccess: any;
  showError: any;
  showInfo: any;
  toast: any;
  addDateForm: any;
  addDateFormActions: any;
}): UseItineraryEventHandlersParams {
  return {
    actions: config.actions,
    fetchData: config.fetchData,
    shows: config.shows,
    venueBids: config.venueBids,
    venueOffers: config.venueOffers,
    bidStatusOverrides: config.bidStatusOverrides,
    // 🎯 MICRO-PHASE C: Create complex state wrapper internally
    setBidStatusOverrides: (setValue: any) => {
      if (typeof setValue === 'function') {
        const newMap = setValue(config.bidStatusOverrides);
        // Handle Map updates by iterating through changes
        newMap.forEach((value: any, key: string) => {
          if (!config.bidStatusOverrides.has(key) || config.bidStatusOverrides.get(key) !== value) {
            config.setBidStatusOverride(key, value);
          }
        });
      } else {
        console.warn('setBidStatusOverrides called with non-function');
      }
    },
    setDeclinedBids: (setValue: any) => {
      if (typeof setValue === 'function') {
        const currentSet = config.declinedBids;
        const newSet = setValue(currentSet);
        // Handle Set updates by finding differences
        newSet.forEach((bidId: string) => {
          if (!currentSet.has(bidId)) {
            config.addDeclinedBid(bidId);
          }
        });
      } else {
        console.warn('setDeclinedBids called with non-function');
      }
    },
    setBidActions: config.setBidActions,
    activeMonthEntries: config.activeMonthEntries,
    venueId: config.venueId,
    venueName: config.venueName,
    permissions: config.permissions,
    confirm: config.confirm,
    showSuccess: config.showSuccess,
    showError: config.showError,
    showInfo: config.showInfo,
    toast: config.toast,
    // 🎯 MICRO-PHASE C: Create form state wrapper internally
    setAddDateForm: (updateFunction: any) => {
      const currentForm = config.addDateForm;
      const updatedForm = updateFunction(currentForm);
      config.addDateFormActions.updateForm(updatedForm);
    }
  };
}

/**
 * 🎯 MICRO-PHASE C: Event Handler Consolidation Hook
 * 
 * Consolidates all event handling logic from TabbedTourItinerary
 * to reduce component complexity and improve maintainability.
 * 
 * Extracted event handlers:
 * - Expansion toggles
 * - Bid/offer actions 
 * - CRUD operations
 * - Template handling
 * - Date conflict checking
 */
export function useItineraryEventHandlers(params: UseItineraryEventHandlersParams): ItineraryEventHandlers {
  const {
    actions,
    fetchData,
    shows,
    venueBids,
    venueOffers,
    bidStatusOverrides,
    setBidStatusOverrides,
    setDeclinedBids,
    setBidActions,
    activeMonthEntries,
    venueId,
    venueName,
    permissions,
    confirm,
    showSuccess,
    showError,
    showInfo,
    toast,
    setAddDateForm
  } = params;

  const toggleBidExpansion = useCallback((requestId: string) => {
    actions.toggleBidExpansion(requestId);
  }, [actions]);

  const toggleShowExpansion = useCallback((showId: string) => {
    actions.toggleShowExpansion(showId);
  }, [actions]);

  const toggleRequestExpansion = useCallback((requestId: string) => {
    actions.toggleRequestExpansion(requestId);
  }, [actions]);

  const handleBidSuccess = useCallback((bid: any) => {
    actions.closeBidForm();
    fetchData();
  }, [actions, fetchData]);

  const handlePlaceBid = useCallback((tourRequest: any) => {
    if (venueId && venueName) {
      actions.openBidForm(tourRequest);
      return;
    }
    
    if (permissions.canMakeOffers) {
      actions.openUniversalOffer({
        id: tourRequest.artistId,
        name: tourRequest.artist?.name || tourRequest.artistName
      });
      return;
    }
    
    alert('To submit a bid, we need your venue information. Please visit your venue profile page first to set up bidding.');
  }, [venueId, venueName, permissions, actions]);

  const handleDeleteShow = useCallback(async (showId: string, showName: string) => {
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
          
          const response = await fetch(`/api/shows/${showId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete show');
          }

          showSuccess('Show Deleted', 'Show deleted successfully');
        } catch (error) {
          console.error('Error deleting show:', error);
          
          // Revert optimistic update on error by refreshing data
          await fetchData();
          
          showError('Delete Failed', 'Failed to delete show. Please try again.');
        }
      }
    );
  }, [confirm, activeMonthEntries, actions, showSuccess, showError, fetchData]);

  const checkDateConflict = useCallback((proposedDate: string, excludeBidId?: string, excludeOfferId?: string) => {
    return BidService.checkDateConflict(
      proposedDate,
      shows,
      venueBids,
      venueOffers,
      bidStatusOverrides,
      excludeBidId,
      excludeOfferId
    );
  }, [shows, venueBids, venueOffers, bidStatusOverrides]);

  const getEffectiveBidStatus = useCallback((bid: VenueBid) => {
    return BidService.getEffectiveBidStatus(bid, bidStatusOverrides);
  }, [bidStatusOverrides]);

  const handleBidAction = useCallback(async (bid: VenueBid, action: string, reason?: string) => {
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
  }, [setBidStatusOverrides, setDeclinedBids, setBidActions, fetchData, showSuccess, showError, showInfo, toast, confirm, actions, bidStatusOverrides, shows, venueBids, venueOffers]);

  const handleOfferAction = useCallback(async (offer: VenueOffer, action: string) => {
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
  }, [setBidStatusOverrides, setDeclinedBids, setBidActions, fetchData, showSuccess, showError, showInfo, toast, confirm, actions, bidStatusOverrides, shows, venueBids, venueOffers]);

  const getBidStatusBadge = useCallback((bid: VenueBid) => {
    return BidService.getBidStatusBadge(bid, bidStatusOverrides);
  }, [bidStatusOverrides]);

  const handleTemplateApply = useCallback((template: any) => {
    setAddDateForm((prev: any) => ({
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
  }, [setAddDateForm]);

  const handleDeleteShowRequest = useCallback(async (requestId: string, requestName: string) => {
    confirm(
      'Delete Show Request',
      `Delete "${requestName}"? This will also delete all associated bids and cannot be undone.`,
      async () => {
        actions.setDeleteLoading(requestId);
        
        // Optimistic update - immediately hide the request
        actions.deleteRequestOptimistic(requestId);
        
        try {
          const response = await fetch(`/api/show-requests/${requestId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete show request');
          }
          
          showSuccess('Request Deleted', 'Show request deleted successfully.');
        } catch (error) {
          console.error('Error deleting show request:', error);
          
          // Revert optimistic update on error
          await fetchData();
          
          showError('Delete Failed', 'Failed to delete show request. Please try again.');
        } finally {
          actions.setDeleteLoading(null);
        }
      }
    );
  }, [confirm, actions, showSuccess, showError, fetchData]);

  const handleAddAnotherArtistSuccess = useCallback((offer: any) => {
    fetchData();
  }, [fetchData]);

  return {
    toggleBidExpansion,
    toggleShowExpansion,
    toggleRequestExpansion,
    handleBidSuccess,
    handlePlaceBid,
    handleDeleteShow,
    checkDateConflict,
    getEffectiveBidStatus,
    handleBidAction,
    handleOfferAction,
    getBidStatusBadge,
    handleTemplateApply,
    handleDeleteShowRequest,
    handleAddAnotherArtistSuccess
  };
} 
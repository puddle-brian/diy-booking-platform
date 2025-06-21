/**
 * 🎯 MICRO-PHASE E: State Management Simplification Utilities
 * 
 * This utility provides simple functions to consolidate and organize
 * the existing state management without requiring new hooks or major refactoring.
 * 
 * BENEFITS:
 * - Reduces visual complexity by grouping related state
 * - Makes state dependencies more explicit
 * - Easier to debug and maintain
 * - No breaking changes to existing interfaces
 */

/**
 * Consolidates UI state variables into logical groups
 * This helps reduce the visual complexity of component state management
 */
export function createUIStateGroups(state: {
  bidActions: any;
  showTourRequestForm: boolean;
  addDateLoading: boolean;
  deleteShowLoading: string | null;
  declinedBids: Set<string>;
  bidStatusOverrides: Map<string, any>;
  recentUndoActions: any[];
  showVenueOfferForm: boolean;
}) {
  return {
    // Form-related state
    forms: {
      showTourRequestForm: state.showTourRequestForm,
      showVenueOfferForm: state.showVenueOfferForm,
      addDateLoading: state.addDateLoading,
    },
    
    // Bid-related state
    bids: {
      bidActions: state.bidActions,
      declinedBids: state.declinedBids,
      bidStatusOverrides: state.bidStatusOverrides,
    },
    
    // Loading and interaction state
    interactions: {
      deleteShowLoading: state.deleteShowLoading,
      recentUndoActions: state.recentUndoActions,
    }
  };
}

/**
 * Consolidates action functions into logical groups
 * This helps organize the large number of action functions
 */
export function createActionGroups(actions: {
  setBidActions: any;
  setShowTourRequestForm: any;
  setAddDateLoading: any;
  setDeleteShowLoading: any;
  addDeclinedBid: any;
  removeDeclinedBid: any;
  setBidStatusOverride: any;
  removeBidStatusOverride: any;
  addRecentUndoAction: any;
  removeRecentUndoAction: any;
  setShowVenueOfferForm: any;
  resetAllUIState: any;
}) {
  return {
    // Form actions
    forms: {
      setShowTourRequestForm: actions.setShowTourRequestForm,
      setShowVenueOfferForm: actions.setShowVenueOfferForm,
      setAddDateLoading: actions.setAddDateLoading,
    },
    
    // Bid actions
    bids: {
      setBidActions: actions.setBidActions,
      addDeclinedBid: actions.addDeclinedBid,
      removeDeclinedBid: actions.removeDeclinedBid,
      setBidStatusOverride: actions.setBidStatusOverride,
      removeBidStatusOverride: actions.removeBidStatusOverride,
    },
    
    // Interaction actions
    interactions: {
      setDeleteShowLoading: actions.setDeleteShowLoading,
      addRecentUndoAction: actions.addRecentUndoAction,
      removeRecentUndoAction: actions.removeRecentUndoAction,
    },
    
    // Global actions
    global: {
      resetAllUIState: actions.resetAllUIState,
    }
  };
}

/**
 * Creates a simplified interface for timeline data access
 * This reduces the number of variables that need to be managed directly
 */
export function createTimelineDataInterface(data: {
  shows: any[];
  tourRequests: any[];
  venueBids: any[];
  venueOffers: any[];
  filteredShows: any[];
  filteredTourRequests: any[];
  filteredVenueBids: any[];
  filteredVenueOffers: any[];
  timelineEntries: any[];
  monthGroups: any[];
  stableMonthTabs: any[];
  loading: boolean;
  fetchError: any;
  fetchData: () => void;
}) {
  return {
    // Raw data (for backwards compatibility)
    raw: {
      shows: data.shows,
      tourRequests: data.tourRequests,
      venueBids: data.venueBids,
      venueOffers: data.venueOffers,
    },
    
    // Filtered/processed data (primary interface)
    processed: {
      shows: data.filteredShows,
      requests: data.filteredTourRequests,
      bids: data.filteredVenueBids,
      offers: data.filteredVenueOffers,
      entries: data.timelineEntries,
      monthGroups: data.monthGroups,
      monthTabs: data.stableMonthTabs,
    },
    
    // Loading state
    status: {
      loading: data.loading,
      error: data.fetchError,
      refresh: data.fetchData,
    }
  };
}

/**
 * Helper to validate state consistency
 * Useful for debugging state management issues
 */
export function validateStateConsistency(timelineData: any, uiState: any) {
  const warnings: string[] = [];
  
  // Check for common state inconsistencies
  if (uiState.deleteShowLoading && !timelineData.processed.shows.find((s: any) => s.id === uiState.deleteShowLoading)) {
    warnings.push('deleteShowLoading references non-existent show');
  }
  
  if (uiState.declinedBids.size > timelineData.processed.bids.length) {
    warnings.push('More declined bids than total bids');
  }
  
  return warnings;
} 
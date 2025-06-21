'use client';

import React from 'react';

// 🎯 MICRO-PHASE I: Consolidated imports for dramatic complexity reduction (65+ imports → 4 groups)
import {
  // React hooks and core types
  useState, useEffect, 
  Show, VenueBid, VenueOffer, BidStatus, ShowRequest,
  TechnicalRequirement, HospitalityRequirement,
  
  // UI Components
  VenueBidForm, ShowDetailModal, TemplateSelector, TemplateFormRenderer,
  LocationVenueAutocomplete, UnifiedShowRequestForm, TechnicalRequirementsTable,
  HospitalityRiderTable, InlineOfferDisplay, OfferInput, ParsedOffer,
  ShowDocumentModal, UniversalMakeOfferModal, MakeOfferButton, ItineraryDate,
  OfferFormCore, useAlert, AddSupportActModal,
  
  // Action components and timeline items
  BidActionButtons, MakeOfferActionButton, DeleteActionButton, DocumentActionButton,
  ShowTimelineItem, BidTimelineItem, ShowRequestRow, MonthTabNavigation,
  ItineraryTableHeader, ItineraryEmptyState, AddDateButtons, ExpandedBidsSection,
  ShowRequestProcessor, TimelineRow, ModalContainer, ItineraryModalContainer,
  ItineraryHeader, ItineraryTableContent, ItineraryLoadingStates, AddDateFormModal,
  
  // Hooks, services, and utilities
  useToggleTourItinerary, useVenueArtistSearch, useItineraryPermissions,
  useItineraryState, useConsolidatedTimelineData, useModalState,
  useTimelineEntryProcessor, useItineraryEventHandlers, useItineraryUIState,
  useAddDateForm, getDefaultActiveMonth, generateStableMonthTabs,
  generateMinimalMonthLabels, getDefaultActiveMonthStable, getMonthKeyFromDate,
  getTimelineBorderClass, extractDateFromEntry, processTimelineEntries,
  createBidStatusOverridesCallback, createDeclinedBidsCallback,
  createAddDateFormCallback, generateSmartShowTitle, getBillingPriority, BidService
} from './TabbedTourItinerary/imports';

// 🎯 MICRO-PHASE J: Modal consolidation utilities
import { buildConsolidatedModalProps } from '../utils/modalConsolidation';
import { EnhancedItineraryModalContainer } from './EnhancedItineraryModalContainer';

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



// 🎯 MICRO-PHASE F: Improved TimelineEntry with proper types (replacing 'any')
interface TimelineEntry {
  id: string;
  type: 'show' | 'show-request';
  date: string;
  endDate?: string;
  data: Show | ShowRequest | VenueBid; // 🎯 MICRO-PHASE F: Replaced 'any' with proper ShowRequest type
  parentTourRequest?: ShowRequest; // 🎯 MICRO-PHASE F: Replaced 'any' with ShowRequest type
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

  // 🎯 REFACTORED: Use centralized modal state management
  const { modals, modalData, handlers } = useModalState();

  // 🎯 REFACTORED: Use centralized state management
  const { state, actions, getSavedActiveMonth, isValidSavedMonth } = useItineraryState();

  // 🎯 PHASE 1.1: ULTRA-SAFE consolidated hook (perfect interface match)
  const {
    shows,
    tourRequests,
    venueBids,
    venueOffers,
    loading,
    fetchError,
    fetchData,
    filteredShows,
    filteredTourRequests,
    filteredVenueBids,
    filteredVenueOffers,
    timelineEntries,
    monthGroups,
    stableMonthTabs
  } = useConsolidatedTimelineData({
    artistId,
    venueId,
    venueName,
    viewerType,
    deletedShows: state.deletedShows,
    deletedRequests: state.deletedRequests
  });

  // 🎯 REFACTORED: Use centralized permissions hook
  const permissions = useItineraryPermissions({
    viewerType,
    editable,
    artistId,
    venueId,
    venueName
  });

  // 🎯 STEP E7: Replace massive form state with clean consolidated hook
  const [addDateForm, addDateFormActions, setAddDateForm] = useAddDateForm();

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
      addDateFormActions.setVenueFromSearch(venue);
    },
    onArtistSelect: (artist) => {
      addDateFormActions.setArtistFromSearch(artist);
    }
  });

  // 🎯 MICRO-PHASE E: Simplified state organization (just documentation improvements)
  const [uiState, uiActions] = useItineraryUIState();
  
  // 🎯 STATE ORGANIZATION: Form-related state
  const {
    showTourRequestForm,
    addDateLoading,
    showVenueOfferForm
  } = uiState;
  
  // 🎯 STATE ORGANIZATION: Bid-related state  
  const {
    bidActions,
    declinedBids,
    bidStatusOverrides
  } = uiState;
  
  // 🎯 STATE ORGANIZATION: Loading/interaction state
  const {
    deleteShowLoading,
    recentUndoActions
  } = uiState;
  
  // 🎯 ACTION ORGANIZATION: Form actions
  const {
    setShowTourRequestForm,
    setAddDateLoading,
    setShowVenueOfferForm
  } = uiActions;
  
  // 🎯 ACTION ORGANIZATION: Bid actions
  const {
    setBidActions,
    addDeclinedBid,
    removeDeclinedBid,
    setBidStatusOverride,
    removeBidStatusOverride
  } = uiActions;
  
  // 🎯 ACTION ORGANIZATION: Interaction actions
  const {
    setDeleteShowLoading,
    addRecentUndoAction,
    removeRecentUndoAction,
    resetAllUIState
  } = uiActions;



  // 🎯 MICRO-PHASE F: Improved helper function with proper typing
  const shouldShowOfferButton = (request: ShowRequest | (ShowRequest & { isVenueInitiated?: boolean })) => {
    // When viewing artist pages: show for all requests (maximum discoverability!)
    if (artistId) {
      return true;
    }
    
    // When viewing venue's own timeline: only show for artist-initiated requests
    if (venueId && !artistId) {
      return !request.isVenueInitiated && request.initiatedBy !== 'VENUE';
    }
    
    // Fallback to existing behavior
    return !request.isVenueInitiated && request.initiatedBy !== 'VENUE';
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

  // 🎯 STEP B5: Use timeline processing utility function
  const processedEntries = processTimelineEntries(activeMonthEntries);

  // 🎯 MICRO-PHASE C: Simplified event handler setup using helper utilities
  const eventHandlers = useItineraryEventHandlers({
    actions,
    fetchData,
    shows,
    venueBids,
    venueOffers,
    bidStatusOverrides,
    setBidStatusOverrides: createBidStatusOverridesCallback(bidStatusOverrides, setBidStatusOverride),
    setDeclinedBids: createDeclinedBidsCallback(declinedBids, addDeclinedBid),
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
    setAddDateForm: createAddDateFormCallback(addDateForm, addDateFormActions)
  });

  // 🎯 STEP C3: Use event handlers from hook
  const {
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
  } = eventHandlers;



  return (
    <ItineraryLoadingStates
      loading={loading}
      fetchError={fetchError}
      onRetry={fetchData}
    >
    <div className="bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden">
      {/* Header */}
      <ItineraryHeader
        showTitle={showTitle}
        title={title}
        artistId={artistId}
        filteredShows={filteredShows}
        filteredTourRequests={filteredTourRequests}
        editable={editable}
        onRefresh={fetchData}
      />

      {/* Month Tabs */}
      <MonthTabNavigation
        stableMonthTabs={stableMonthTabs}
        activeMonthTab={state.activeMonthTab}
        onMonthChange={actions.setActiveMonth}
      />

      {/* Table Content */}
      <ItineraryTableContent
        venueId={venueId}
        artistId={artistId}
        activeMonthEntries={activeMonthEntries}
        processedEntries={processedEntries}
        stableMonthTabs={stableMonthTabs}
        editable={editable}
        permissions={permissions}
        state={state}
        handlers={handlers}
        venueName={venueName}
        toggleShowExpansion={toggleShowExpansion}
        toggleRequestExpansion={toggleRequestExpansion}
        handleDeleteShow={handleDeleteShow}
        venueBids={venueBids}
        venueOffers={venueOffers}
        declinedBids={declinedBids}
        tourRequests={tourRequests}
        actions={actions}
        getBidStatusBadge={getBidStatusBadge}
        handleDeleteShowRequest={handleDeleteShowRequest}
        handleOfferAction={handleOfferAction}
        handleBidAction={handleBidAction}
        getEffectiveBidStatus={getEffectiveBidStatus}
        venues={venues}
      />

      <AddDateButtons
        stableMonthTabs={stableMonthTabs}
        editable={editable}
        venueId={venueId}
        artistId={artistId}
        onAddDate={() => {
          if (artistId) {
            addDateFormActions.setFormType('request');
          } else if (venueId) {
            addDateFormActions.setFormType('offer');
          }
          handlers.openAddDateForm();
        }}
      />

 

      {/* 🎯 MICRO-PHASE J: Dramatically simplified modal container with consolidated props */}
      <EnhancedItineraryModalContainer
        consolidatedProps={buildConsolidatedModalProps({
          // Bid props
          showBidForm: state.showBidForm,
          selectedTourRequest: state.selectedTourRequest,
          onBidSuccess: handleBidSuccess,
          onCloseBidForm: () => actions.closeBidForm(),
          
          // Show props
          showDetailModal: modals.showDetailModal,
          selectedShowForDetail: modalData.selectedShowForDetail,
          onCloseShowDetailModal: handlers.closeShowDetailModal,
          showDocumentModal: modals.showDocumentModal,
          selectedDocumentShow: modalData.selectedDocumentShow,
          selectedDocumentBid: modalData.selectedDocumentBid,
          selectedDocumentTourRequest: modalData.selectedDocumentTourRequest,
          onCloseShowDocumentModal: handlers.closeShowDocumentModal,
          onDocumentUpdate: fetchData,
          
          // Offer props
          showUniversalOfferModal: state.showUniversalOfferModal,
          offerTargetArtist: state.offerTargetArtist,
          offerPreSelectedDate: state.offerPreSelectedDate || undefined,
          offerTourRequest: state.offerTourRequest,
          offerExistingBid: state.offerExistingBid,
          onCloseUniversalOffer: () => actions.closeUniversalOffer(),
          onUniversalOfferSuccess: fetchData,
          onDeleteRequestOptimistic: actions.deleteRequestOptimistic,
          
          // Form props
          showAddDateForm: modals.showAddDateForm,
          addDateFormType: addDateForm.type === 'confirmed' ? 'request' : addDateForm.type,
          addDateLoading: addDateLoading,
          onCloseAddDateForm: handlers.closeAddDateForm,
          onAddDateSuccess: fetchData,
          onSetActiveMonth: actions.setActiveMonth,
          isAddAnotherArtistModalOpen: modals.isAddAnotherArtistModalOpen,
          addAnotherArtistShowId: modalData.addAnotherArtistShowId,
          addAnotherArtistDate: modalData.addAnotherArtistDate,
          onCloseAddAnotherArtistModal: handlers.closeAddAnotherArtistModal,
          onAddAnotherArtistSuccess: handleAddAnotherArtistSuccess,
          
          // Context props
          venueId: venueId,
          venueName: venueName,
          artistId: artistId,
          artistName: artistName,
          actualViewerType: permissions.actualViewerType,
          fetchData: fetchData,
          confirm: confirm,
          AlertModal: AlertModal
        })}
      />
    </div>
    </ItineraryLoadingStates>
  );
} 
'use client';

import React, { useState, useEffect } from 'react';
import { Show, VenueBid, VenueOffer, BidStatus } from '../../types'; // 🎯 PHASE 1.2: Add unified BidStatus type
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
import { useToggleTourItinerary } from '../hooks/useToggleTourItinerary';
import { useVenueArtistSearch } from '../hooks/useVenueArtistSearch';
import { useItineraryPermissions } from '../hooks/useItineraryPermissions';
import { useItineraryState } from '../hooks/useItineraryState';
import { useConsolidatedTimelineData } from '../hooks/useConsolidatedTimelineData';
import {
  getDefaultActiveMonth,
  generateStableMonthTabs,
  generateMinimalMonthLabels,
  getDefaultActiveMonthStable,
  getMonthKeyFromDate,
  getTimelineBorderClass,
  extractDateFromEntry
} from '../utils/timelineUtils';
import { processTimelineEntries } from '../utils/timelineProcessing';
import { createBidStatusOverridesCallback, createDeclinedBidsCallback, createAddDateFormCallback } from '../utils/eventHandlerHelpers';

// Import action button components
import { BidActionButtons, MakeOfferActionButton, DeleteActionButton, DocumentActionButton } from './ActionButtons';
import { ShowTimelineItem, BidTimelineItem } from './TimelineItems'; // 🎯 PHASE 4: Removed TourRequestTimelineItem
import { ShowRequestRow } from './TimelineItems/ShowRequestRow';
import { MonthTabNavigation } from './MonthTabNavigation';
import { ItineraryTableHeader } from './ItineraryTableHeader';
import { ItineraryEmptyState } from './ItineraryEmptyState';
import { AddDateButtons } from './AddDateButtons';
import { ExpandedBidsSection } from './TimelineItems/ExpandedBidsSection';
import { ShowRequestProcessor } from './TimelineItems/ShowRequestProcessor';
import { TimelineRow } from './TimelineItems/TimelineRow';
import { ModalContainer } from './ModalContainer';
import { ItineraryModalContainer } from './ItineraryModalContainer';
import { ItineraryHeader } from './ItineraryHeader';
import { ItineraryTableContent } from './ItineraryTableContent';
import { ItineraryLoadingStates } from './ItineraryLoadingStates';
import { generateSmartShowTitle, getBillingPriority } from '../utils/showNaming';
import { BidService } from '../services/BidService';
import { AddDateFormModal } from './forms/AddDateFormModal';
import { useModalState } from '../hooks/useModalState';
import { useTimelineEntryProcessor } from '../hooks/useTimelineEntryProcessor';
import { useItineraryEventHandlers } from '../hooks/useItineraryEventHandlers';
import { useItineraryUIState } from '../hooks/useItineraryUIState';
import { useAddDateForm } from '../hooks/useAddDateForm';

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
  id: string; // 🎯 PHASE 4: Added id field for TimelineEntryCommon compatibility
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

  // 🎯 STEP D5: Replace all individual UI state with consolidated hook
  const [uiState, uiActions] = useItineraryUIState();
  
  // Extract consolidated UI state for cleaner access
  const {
    bidActions,
    showTourRequestForm,
    addDateLoading,
    deleteShowLoading,
    declinedBids,
    bidStatusOverrides,
    recentUndoActions,
    showVenueOfferForm
  } = uiState;
  
  const {
    setBidActions,
    setShowTourRequestForm,
    setAddDateLoading,
    setDeleteShowLoading,
    addDeclinedBid,
    removeDeclinedBid,
    setBidStatusOverride,
    removeBidStatusOverride,
    addRecentUndoAction,
    removeRecentUndoAction,
    setShowVenueOfferForm,
    resetAllUIState
  } = uiActions;



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

 

      {/* All Modals */}
      <ItineraryModalContainer
        showBidForm={state.showBidForm}
        selectedTourRequest={state.selectedTourRequest}
        venueId={venueId}
        venueName={venueName}
        onBidSuccess={handleBidSuccess}
        onCloseBidForm={() => actions.closeBidForm()}
        showDetailModal={modals.showDetailModal}
        selectedShowForDetail={modalData.selectedShowForDetail}
        onCloseShowDetailModal={handlers.closeShowDetailModal}
        showDocumentModal={modals.showDocumentModal}
        selectedDocumentShow={modalData.selectedDocumentShow}
        selectedDocumentBid={modalData.selectedDocumentBid}
        selectedDocumentTourRequest={modalData.selectedDocumentTourRequest}
        onCloseShowDocumentModal={handlers.closeShowDocumentModal}
        onDocumentUpdate={fetchData}
        showUniversalOfferModal={state.showUniversalOfferModal}
        offerTargetArtist={state.offerTargetArtist}
        offerPreSelectedDate={state.offerPreSelectedDate || undefined}
        offerTourRequest={state.offerTourRequest}
        offerExistingBid={state.offerExistingBid}
        onCloseUniversalOffer={() => actions.closeUniversalOffer()}
        onUniversalOfferSuccess={fetchData}
        onDeleteRequestOptimistic={actions.deleteRequestOptimistic}
        showAddDateForm={modals.showAddDateForm}
        addDateFormType={addDateForm.type === 'confirmed' ? 'request' : addDateForm.type}
        artistId={artistId}
        artistName={artistName}
        addDateLoading={addDateLoading}
        onCloseAddDateForm={handlers.closeAddDateForm}
        onAddDateSuccess={fetchData}
        onSetActiveMonth={actions.setActiveMonth}
        confirm={confirm}
        isAddAnotherArtistModalOpen={modals.isAddAnotherArtistModalOpen}
        addAnotherArtistShowId={modalData.addAnotherArtistShowId}
        addAnotherArtistDate={modalData.addAnotherArtistDate}
        onCloseAddAnotherArtistModal={handlers.closeAddAnotherArtistModal}
        onAddAnotherArtistSuccess={handleAddAnotherArtistSuccess}
        AlertModal={AlertModal}
        actualViewerType={permissions.actualViewerType}
        fetchData={fetchData}
      />
    </div>
    </ItineraryLoadingStates>
  );
} 
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
import { useTourItineraryData } from '../hooks/useTourItineraryData';
import { useVenueArtistSearch } from '../hooks/useVenueArtistSearch';
import { useItineraryPermissions } from '../hooks/useItineraryPermissions';
import { useItineraryState } from '../hooks/useItineraryState';
import { useCleanTimelineData } from '../hooks/useCleanTimelineData';
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
import { ItineraryLoadingStates } from './ItineraryLoadingStates';
import { generateSmartShowTitle, getBillingPriority } from '../utils/showNaming';
import { BidService } from '../services/BidService';
import { AddDateFormModal } from './forms/AddDateFormModal';
import { useModalState } from '../hooks/useModalState';
import { useTimelineEntryProcessor } from '../hooks/useTimelineEntryProcessor';
import { useItineraryEventHandlers } from '../hooks/useItineraryEventHandlers';

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

  // 🎯 REFACTORED: Use centralized data fetching
  const {
    shows,
    tourRequests,
    venueBids,
    venueOffers,
    loading,
    fetchError,
    fetchData
  } = useTourItineraryData({ artistId, venueId, venueName });



  // 🎯 REFACTORED: Use centralized permissions hook
  const permissions = useItineraryPermissions({
    viewerType,
    editable,
    artistId,
    venueId,
    venueName
  });



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
  const [showTourRequestForm, setShowTourRequestForm] = useState(false);
  const [addDateLoading, setAddDateLoading] = useState(false);
  const [deleteShowLoading, setDeleteShowLoading] = useState<string | null>(null);
  // 🎯 PHASE 4: Removed TourRequest modal state - no longer needed
  // const [tourRequestDetailModal, setTourRequestDetailModal] = useState(false);
  // const [selectedTourRequest, setSelectedTourRequest] = useState<any | null>(null);
  
  // Track declined bids locally to avoid flashing
  const [declinedBids, setDeclinedBids] = useState<Set<string>>(new Set());
  
  // Removed local deletedRequests state - now using hook's state.deletedRequests
  
  // Track deleted shows locally to avoid flashing
  // Removed local deletedShows state - now using hook's state.deletedShows
  
  // Add optimistic bid status tracking to prevent blinking during switches
  const [bidStatusOverrides, setBidStatusOverrides] = useState<Map<string, BidStatus>>(new Map()); // 🎯 PHASE 1.2: Use unified BidStatus type
  
  // Track recent undo actions to prevent race conditions
  const [recentUndoActions, setRecentUndoActions] = useState<Set<string>>(new Set());
  
  // Add venue offer form state
  const [showVenueOfferForm, setShowVenueOfferForm] = useState(false);
  
  // 🎯 REFACTORED: Modal states now managed by useModalState hook
  
  // Universal Make Offer Modal state - now managed by centralized state

  // 🎯 STEP A5: Replace existing logic with clean hook
  const cleanTimelineData = useCleanTimelineData({
    shows,
    tourRequests,
    venueBids,
    venueOffers,
    deletedShows: state.deletedShows,
    deletedRequests: state.deletedRequests,
    artistId,
    venueId
  });

  // Extract clean data from hook
  const {
    filteredShows,
    filteredTourRequests,
    filteredVenueOffers,
    filteredVenueBids,
    timelineEntries,
    monthGroups,
    stableMonthTabs
  } = cleanTimelineData;



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

  // 🎯 STEP C2: Test event handlers hook alongside existing logic
  const eventHandlers = useItineraryEventHandlers({
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
      <MonthTabNavigation
        stableMonthTabs={stableMonthTabs}
        activeMonthTab={state.activeMonthTab}
        onMonthChange={actions.setActiveMonth}
      />

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] table-fixed">
          <ItineraryTableHeader venueId={venueId} artistId={artistId} />
          <tbody className="divide-y divide-gray-100">
            {/* Empty state */}
            {activeMonthEntries.length === 0 && (
              <ItineraryEmptyState
                venueId={venueId}
                stableMonthTabs={stableMonthTabs}
                editable={editable}
              />
            )}
            
            {/* Render entries for active month */}
            {processedEntries.map(({ entry, index, entryDate, sameDateSiblings, isFirstOfDate }) => {
              // Hide non-first entries - they'll be shown as children when parent is expanded
              if (!isFirstOfDate) {
                return null;
              }
              
              // 🎯 PHASE 4: Unified timeline rendering with single TimelineRow component
              return (
                <TimelineRow
                  key={`${entry.type}-${entry.data.id}`}
                  entry={{...entry, id: entry.data.id}}
                  permissions={permissions}
                  state={state}
                  handlers={handlers}
                  artistId={artistId}
                  venueId={venueId}
                  venueName={venueName}
                  onToggleExpansion={toggleShowExpansion}
                  toggleRequestExpansion={toggleRequestExpansion}
                  onDeleteShow={handleDeleteShow}
                  onShowDocument={handlers.handleShowDocumentModal}
                  onShowDetail={handlers.handleShowDetailModal}
                  onSupportActAdded={(offer: any) => {
                    fetchData();
                  }}
                  venueBids={venueBids}
                  venueOffers={venueOffers}
                  declinedBids={declinedBids}
                  tourRequests={tourRequests}
                  sameDateSiblings={sameDateSiblings}
                  isFirstOfDate={isFirstOfDate}
                  entryDate={entryDate}
                  actions={actions}
                  getBidStatusBadge={getBidStatusBadge}
                  handleDeleteShowRequest={handleDeleteShowRequest}
                  handleOfferAction={handleOfferAction}
                  handleBidAction={handleBidAction}
                  getEffectiveBidStatus={getEffectiveBidStatus}
                  venues={venues}
                />
              );
              return null;
            })}
            
                      </tbody>
        </table>
      </div>

      <AddDateButtons
        stableMonthTabs={stableMonthTabs}
        editable={editable}
        venueId={venueId}
        artistId={artistId}
        onAddDate={() => {
          if (artistId) {
            setAddDateForm(prev => ({ ...prev, type: 'request' }));
          } else if (venueId) {
            setAddDateForm(prev => ({ ...prev, type: 'offer' }));
          }
          handlers.openAddDateForm();
        }}
      />

 

      {/* All Modals */}
      <ModalContainer
        // Venue Bid Form Modal
        showBidForm={state.showBidForm}
        selectedTourRequest={state.selectedTourRequest}
        venueId={venueId}
        venueName={venueName}
        onBidSuccess={handleBidSuccess}
        onCloseBidForm={() => actions.closeBidForm()}
        
        // Show Detail Modal
        showDetailModal={modals.showDetailModal}
        selectedShowForDetail={modalData.selectedShowForDetail}
        onCloseShowDetailModal={handlers.closeShowDetailModal}
        
        // Show Document Modal
        showDocumentModal={modals.showDocumentModal}
        selectedDocumentShow={modalData.selectedDocumentShow}
        selectedDocumentBid={modalData.selectedDocumentBid}
        selectedDocumentTourRequest={modalData.selectedDocumentTourRequest}
        onCloseShowDocumentModal={handlers.closeShowDocumentModal}
        onDocumentUpdate={fetchData}
        
        // Universal Make Offer Modal
        showUniversalOfferModal={state.showUniversalOfferModal}
        offerTargetArtist={state.offerTargetArtist}
                 offerPreSelectedDate={state.offerPreSelectedDate || undefined}
        offerTourRequest={state.offerTourRequest}
        offerExistingBid={state.offerExistingBid}
        onCloseUniversalOffer={() => actions.closeUniversalOffer()}
        onUniversalOfferSuccess={fetchData}
        onDeleteRequestOptimistic={actions.deleteRequestOptimistic}
        
        // Add Date Form Modal
        showAddDateForm={modals.showAddDateForm}
                 addDateFormType={addDateForm.type === 'confirmed' ? 'request' : addDateForm.type}
        artistId={artistId}
        artistName={artistName}
        addDateLoading={addDateLoading}
        onCloseAddDateForm={handlers.closeAddDateForm}
        onAddDateSuccess={fetchData}
        onSetActiveMonth={actions.setActiveMonth}
        confirm={confirm}
        
        // Add Artist Modal
        isAddAnotherArtistModalOpen={modals.isAddAnotherArtistModalOpen}
        addAnotherArtistShowId={modalData.addAnotherArtistShowId}
        addAnotherArtistDate={modalData.addAnotherArtistDate}
        onCloseAddAnotherArtistModal={handlers.closeAddAnotherArtistModal}
        onAddAnotherArtistSuccess={handleAddAnotherArtistSuccess}
        
        // Alert Modal
        AlertModal={AlertModal}
        
        // Shared props
        actualViewerType={permissions.actualViewerType}
        fetchData={fetchData}
      />
    </div>
    </ItineraryLoadingStates>
  );
} 
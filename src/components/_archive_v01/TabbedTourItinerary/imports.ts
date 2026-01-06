/**
 * 🎯 MICRO-PHASE I: Import Consolidation for TabbedTourItinerary
 * 
 * Reduces component complexity by consolidating 65+ import statements
 * into organized, re-exported groups.
 * 
 * BEFORE: 65+ individual import statements scattered throughout component
 * AFTER: 4 organized import groups
 * 
 * Complexity Reduction: ~65 import lines → 4 consolidated imports
 */

// 🎯 GROUP 1: React and Core Types
export { useState, useEffect } from 'react';
export type { Show, VenueBid, VenueOffer, BidStatus } from '../../../types';
export type { TechnicalRequirement, HospitalityRequirement } from '../../../types/templates';
export type { ShowRequest } from '../../utils/typeHelpers';

// 🎯 GROUP 2: UI Components (Forms, Modals, Displays)
export { default as VenueBidForm } from '../VenueBidForm';
export { default as ShowDetailModal } from '../ShowDetailModal';
export { default as TemplateSelector } from '../TemplateSelector';
export { default as TemplateFormRenderer } from '../TemplateFormRenderer';
export { default as LocationVenueAutocomplete } from '../LocationVenueAutocomplete';
export { default as UnifiedShowRequestForm } from '../UnifiedShowRequestForm';
export { default as TechnicalRequirementsTable } from '../TechnicalRequirementsTable';
export { default as HospitalityRiderTable } from '../HospitalityRiderTable';
export { InlineOfferDisplay } from '../OfferDisplay';
export { default as OfferInput } from '../OfferInput';
export type { ParsedOffer } from '../OfferInput';
export { default as ShowDocumentModal } from '../ShowDocumentModal';
export { default as UniversalMakeOfferModal } from '../UniversalMakeOfferModal';
export { default as MakeOfferButton } from '../MakeOfferButton';
export { ItineraryDate } from '../DateDisplay';
export { default as OfferFormCore } from '../OfferFormCore';
export { useAlert } from '../UniversalAlertModal';
export { AddSupportActModal } from '../modals/AddSupportActModal';

// 🎯 GROUP 3: Action Components and Timeline Items
export { 
  BidActionButtons, 
  MakeOfferActionButton, 
  DeleteActionButton, 
  DocumentActionButton 
} from '../ActionButtons';
export { ShowTimelineItem, BidTimelineItem } from '../TimelineItems';
export { ShowRequestRow } from '../TimelineItems/ShowRequestRow';
export { MonthTabNavigation } from '../MonthTabNavigation';
export { ItineraryTableHeader } from '../ItineraryTableHeader';
export { ItineraryEmptyState } from '../ItineraryEmptyState';
export { AddDateButtons } from '../AddDateButtons';
export { ExpandedBidsSection } from '../TimelineItems/ExpandedBidsSection';
export { ShowRequestProcessor } from '../TimelineItems/ShowRequestProcessor';
export { TimelineRow } from '../TimelineItems/TimelineRow';
export { ModalContainer } from '../ModalContainer';
export { ItineraryModalContainer } from '../ItineraryModalContainer';
export { ItineraryHeader } from '../ItineraryHeader';
export { ItineraryTableContent } from '../ItineraryTableContent';
export { ItineraryLoadingStates } from '../ItineraryLoadingStates';
export { AddDateFormModal } from '../forms/AddDateFormModal';

// 🎯 GROUP 4: Hooks, Services, and Utilities
export { useToggleTourItinerary } from '../../hooks/useToggleTourItinerary';
export { useVenueArtistSearch } from '../../hooks/useVenueArtistSearch';
export { useItineraryPermissions } from '../../hooks/useItineraryPermissions';
export { useItineraryState } from '../../hooks/useItineraryState';
export { useConsolidatedTimelineData } from '../../hooks/useConsolidatedTimelineData';
export { useModalState } from '../../hooks/useModalState';
export { useTimelineEntryProcessor } from '../../hooks/useTimelineEntryProcessor';
export { useItineraryEventHandlers } from '../../hooks/useItineraryEventHandlers';
export { useItineraryUIState } from '../../hooks/useItineraryUIState';
export { useAddDateForm } from '../../hooks/useAddDateForm';

export {
  getDefaultActiveMonth,
  generateStableMonthTabs,
  generateMinimalMonthLabels,
  getDefaultActiveMonthStable,
  getMonthKeyFromDate,
  getTimelineBorderClass,
  extractDateFromEntry
} from '../../utils/timelineUtils';
export { processTimelineEntries } from '../../utils/timelineProcessing';
export { 
  createBidStatusOverridesCallback, 
  createDeclinedBidsCallback, 
  createAddDateFormCallback 
} from '../../utils/eventHandlerHelpers';
export { generateSmartShowTitle, getBillingPriority } from '../../utils/showNaming';
export { BidService } from '../../services/BidService'; 
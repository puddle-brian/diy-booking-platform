/**
 * 🎯 MICRO-PHASE J: Modal Container Consolidation
 * 
 * Reduces TabbedTourItinerary complexity by consolidating the massive 25+ modal props
 * passed to ItineraryModalContainer into organized, logical groups.
 * 
 * BEFORE: 25+ individual props scattered across component call
 * AFTER: 5 organized modal groups with clear responsibilities
 * 
 * Complexity Reduction: ~25 lines of prop passing → 5 organized groups
 */

// 🎯 GROUP 1: Bid-related modals
export interface BidModalProps {
  showBidForm: boolean;
  selectedTourRequest: any;
  onBidSuccess: () => void;
  onCloseBidForm: () => void;
}

// 🎯 GROUP 2: Show-related modals (detail & document)
export interface ShowModalProps {
  showDetailModal: boolean;
  selectedShowForDetail: any;
  onCloseShowDetailModal: () => void;
  showDocumentModal: boolean;
  selectedDocumentShow: any;
  selectedDocumentBid: any;
  selectedDocumentTourRequest: any;
  onCloseShowDocumentModal: () => void;
  onDocumentUpdate: () => void;
}

// 🎯 GROUP 3: Offer-related modals
export interface OfferModalProps {
  showUniversalOfferModal: boolean;
  offerTargetArtist: any;
  offerPreSelectedDate?: string;
  offerTourRequest: any;
  offerExistingBid: any;
  onCloseUniversalOffer: () => void;
  onUniversalOfferSuccess: () => void;
  onDeleteRequestOptimistic: (id: string) => void;
}

// 🎯 GROUP 4: Form-related modals (add date & add artist)
export interface FormModalProps {
  showAddDateForm: boolean;
  addDateFormType: 'request' | 'offer';
  addDateLoading: boolean;
  onCloseAddDateForm: () => void;
  onAddDateSuccess: () => void;
  onSetActiveMonth: (month: string) => void;
  isAddAnotherArtistModalOpen: boolean;
  addAnotherArtistShowId: string;
  addAnotherArtistDate: string;
  onCloseAddAnotherArtistModal: () => void;
  onAddAnotherArtistSuccess: () => void;
}

// 🎯 GROUP 5: Context & shared props
export interface ModalContextProps {
  venueId?: string;
  venueName?: string;
  artistId?: string;
  artistName?: string;
  actualViewerType: 'artist' | 'venue' | 'public';
  fetchData: () => void;
  confirm: (message: string) => Promise<boolean>;
  AlertModal: React.ReactNode;
}

// 🎯 CONSOLIDATED INTERFACE: All modal props organized into logical groups
export interface ConsolidatedModalProps {
  bidModals: BidModalProps;
  showModals: ShowModalProps;
  offerModals: OfferModalProps;
  formModals: FormModalProps;
  context: ModalContextProps;
}

/**
 * 🎯 BUILDER FUNCTION: Creates consolidated modal props from individual props
 * 
 * This allows TabbedTourItinerary to pass organized groups instead of 25+ individual props
 */
export function buildConsolidatedModalProps(props: {
  // Bid props
  showBidForm: boolean;
  selectedTourRequest: any;
  onBidSuccess: () => void;
  onCloseBidForm: () => void;
  
  // Show props
  showDetailModal: boolean;
  selectedShowForDetail: any;
  onCloseShowDetailModal: () => void;
  showDocumentModal: boolean;
  selectedDocumentShow: any;
  selectedDocumentBid: any;
  selectedDocumentTourRequest: any;
  onCloseShowDocumentModal: () => void;
  onDocumentUpdate: () => void;
  
  // Offer props
  showUniversalOfferModal: boolean;
  offerTargetArtist: any;
  offerPreSelectedDate?: string;
  offerTourRequest: any;
  offerExistingBid: any;
  onCloseUniversalOffer: () => void;
  onUniversalOfferSuccess: () => void;
  onDeleteRequestOptimistic: (id: string) => void;
  
  // Form props
  showAddDateForm: boolean;
  addDateFormType: 'request' | 'offer';
  addDateLoading: boolean;
  onCloseAddDateForm: () => void;
  onAddDateSuccess: () => void;
  onSetActiveMonth: (month: string) => void;
  isAddAnotherArtistModalOpen: boolean;
  addAnotherArtistShowId: string;
  addAnotherArtistDate: string;
  onCloseAddAnotherArtistModal: () => void;
  onAddAnotherArtistSuccess: () => void;
  
  // Context props
  venueId?: string;
  venueName?: string;
  artistId?: string;
  artistName?: string;
  actualViewerType: 'artist' | 'venue' | 'public';
  fetchData: () => void;
  confirm: (message: string) => Promise<boolean>;
  AlertModal: React.ReactNode;
}): ConsolidatedModalProps {
  return {
    bidModals: {
      showBidForm: props.showBidForm,
      selectedTourRequest: props.selectedTourRequest,
      onBidSuccess: props.onBidSuccess,
      onCloseBidForm: props.onCloseBidForm
    },
    showModals: {
      showDetailModal: props.showDetailModal,
      selectedShowForDetail: props.selectedShowForDetail,
      onCloseShowDetailModal: props.onCloseShowDetailModal,
      showDocumentModal: props.showDocumentModal,
      selectedDocumentShow: props.selectedDocumentShow,
      selectedDocumentBid: props.selectedDocumentBid,
      selectedDocumentTourRequest: props.selectedDocumentTourRequest,
      onCloseShowDocumentModal: props.onCloseShowDocumentModal,
      onDocumentUpdate: props.onDocumentUpdate
    },
    offerModals: {
      showUniversalOfferModal: props.showUniversalOfferModal,
      offerTargetArtist: props.offerTargetArtist,
      offerPreSelectedDate: props.offerPreSelectedDate,
      offerTourRequest: props.offerTourRequest,
      offerExistingBid: props.offerExistingBid,
      onCloseUniversalOffer: props.onCloseUniversalOffer,
      onUniversalOfferSuccess: props.onUniversalOfferSuccess,
      onDeleteRequestOptimistic: props.onDeleteRequestOptimistic
    },
    formModals: {
      showAddDateForm: props.showAddDateForm,
      addDateFormType: props.addDateFormType,
      addDateLoading: props.addDateLoading,
      onCloseAddDateForm: props.onCloseAddDateForm,
      onAddDateSuccess: props.onAddDateSuccess,
      onSetActiveMonth: props.onSetActiveMonth,
      isAddAnotherArtistModalOpen: props.isAddAnotherArtistModalOpen,
      addAnotherArtistShowId: props.addAnotherArtistShowId,
      addAnotherArtistDate: props.addAnotherArtistDate,
      onCloseAddAnotherArtistModal: props.onCloseAddAnotherArtistModal,
      onAddAnotherArtistSuccess: props.onAddAnotherArtistSuccess
    },
    context: {
      venueId: props.venueId,
      venueName: props.venueName,
      artistId: props.artistId,
      artistName: props.artistName,
      actualViewerType: props.actualViewerType,
      fetchData: props.fetchData,
      confirm: props.confirm,
      AlertModal: props.AlertModal
    }
  };
} 
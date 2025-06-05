'use client';

import { useReducer, useCallback, useMemo } from 'react';
import { Show, TourRequest, VenueBid, VenueOffer } from '../../types';

// State shape - consolidate all the scattered useState calls
interface ItineraryState {
  // Expansion state
  expandedBids: Set<string>;
  expandedShows: Set<string>;
  expandedRequests: Set<string>;
  
  // Modal state
  showBidForm: boolean;
  showTourRequestForm: boolean;
  showAddDateForm: boolean;
  showDetailModal: boolean;
  tourRequestDetailModal: boolean;
  showDocumentModal: boolean;
  showUniversalOfferModal: boolean;
  showVenueOfferForm: boolean;
  
  // Selected items
  selectedTourRequest: TourRequest | null;
  selectedBid: VenueBid | null;
  selectedShowForDetail: Show | null;
  selectedDocumentShow: Show | null;
  selectedDocumentBid: VenueBid | null;
  selectedDocumentTourRequest: TourRequest | null;
  offerTargetArtist: { id: string; name: string } | null;
  offerTourRequest: { id: string; title: string; artistName: string } | null;
  offerPreSelectedDate: string | null;
  offerExistingBid: any;
  
  // Loading states
  holdActions: Record<string, boolean>;
  bidActions: Record<string, boolean>;
  deleteLoading: string | null;
  addDateLoading: boolean;
  deleteShowLoading: string | null;
  
  // Optimistic updates
  declinedBids: Set<string>;
  deletedRequests: Set<string>;
  deletedShows: Set<string>;
  bidStatusOverrides: Map<string, 'pending' | 'accepted' | 'hold' | 'declined'>;
  recentUndoActions: Set<string>;
  
  // Form state
  holdNotes: Record<string, string>;
  activeMonthTab: string;
}

// Action types - all possible state changes
type ItineraryAction =
  // Expansion actions
  | { type: 'TOGGLE_BID_EXPANSION'; requestId: string }
  | { type: 'TOGGLE_SHOW_EXPANSION'; showId: string }
  | { type: 'TOGGLE_REQUEST_EXPANSION'; requestId: string }
  
  // Modal actions
  | { type: 'OPEN_BID_FORM'; request: TourRequest }
  | { type: 'CLOSE_BID_FORM' }
  | { type: 'OPEN_SHOW_DETAIL'; show: Show }
  | { type: 'CLOSE_SHOW_DETAIL' }
  | { type: 'OPEN_DOCUMENT_MODAL'; show?: Show; bid?: VenueBid; request?: TourRequest }
  | { type: 'CLOSE_DOCUMENT_MODAL' }
  | { type: 'OPEN_UNIVERSAL_OFFER'; artist: { id: string; name: string }; tourRequest?: { id: string; title: string; artistName: string }; preSelectedDate?: string; existingBid?: any }
  | { type: 'CLOSE_UNIVERSAL_OFFER' }
  
  // Loading actions
  | { type: 'SET_BID_ACTION_LOADING'; bidId: string; loading: boolean }
  | { type: 'SET_HOLD_ACTION_LOADING'; bidId: string; loading: boolean }
  | { type: 'SET_DELETE_LOADING'; requestId: string | null }
  | { type: 'SET_DELETE_SHOW_LOADING'; showId: string | null }
  
  // Optimistic updates
  | { type: 'DECLINE_BID_OPTIMISTIC'; bidId: string }
  | { type: 'DELETE_REQUEST_OPTIMISTIC'; requestId: string }
  | { type: 'DELETE_SHOW_OPTIMISTIC'; showId: string }
  | { type: 'SET_BID_STATUS_OVERRIDE'; bidId: string; status: 'pending' | 'accepted' | 'hold' | 'declined' }
  | { type: 'CLEAR_BID_STATUS_OVERRIDE'; bidId: string }
  
  // Form actions
  | { type: 'SET_HOLD_NOTE'; bidId: string; note: string }
  | { type: 'SET_ACTIVE_MONTH'; monthKey: string }
  
  // Reset actions
  | { type: 'RESET_OPTIMISTIC_STATE' }
  | { type: 'RESET_ALL_STATE' }
  
  // Tour request detail actions  
  | { type: 'OPEN_TOUR_REQUEST_DETAIL'; request: TourRequest }
  | { type: 'CLOSE_TOUR_REQUEST_DETAIL' };

// Initial state
const initialState: ItineraryState = {
  expandedBids: new Set(),
  expandedShows: new Set(),
  expandedRequests: new Set(),
  showBidForm: false,
  showTourRequestForm: false,
  showAddDateForm: false,
  showDetailModal: false,
  tourRequestDetailModal: false,
  showDocumentModal: false,
  showUniversalOfferModal: false,
  showVenueOfferForm: false,
  selectedTourRequest: null,
  selectedBid: null,
  selectedShowForDetail: null,
  selectedDocumentShow: null,
  selectedDocumentBid: null,
  selectedDocumentTourRequest: null,
  offerTargetArtist: null,
  offerTourRequest: null,
  offerPreSelectedDate: null,
  offerExistingBid: null,
  holdActions: {},
  bidActions: {},
  deleteLoading: null,
  addDateLoading: false,
  deleteShowLoading: null,
  declinedBids: new Set(),
  deletedRequests: new Set(),
  deletedShows: new Set(),
  bidStatusOverrides: new Map(),
  recentUndoActions: new Set(),
  holdNotes: {},
  activeMonthTab: ''
};

// Reducer function - single source of truth for state updates
function itineraryReducer(state: ItineraryState, action: ItineraryAction): ItineraryState {
  switch (action.type) {
    case 'TOGGLE_BID_EXPANSION': {
      const newExpanded = new Set(state.expandedBids);
      if (newExpanded.has(action.requestId)) {
        newExpanded.delete(action.requestId);
      } else {
        newExpanded.add(action.requestId);
      }
      return { ...state, expandedBids: newExpanded };
    }
    
    case 'TOGGLE_SHOW_EXPANSION': {
      const newExpanded = new Set(state.expandedShows);
      if (newExpanded.has(action.showId)) {
        newExpanded.delete(action.showId);
      } else {
        newExpanded.add(action.showId);
      }
      return { ...state, expandedShows: newExpanded };
    }
    
    case 'TOGGLE_REQUEST_EXPANSION': {
      const newExpanded = new Set(state.expandedRequests);
      if (newExpanded.has(action.requestId)) {
        newExpanded.delete(action.requestId);
      } else {
        newExpanded.add(action.requestId);
      }
      return { ...state, expandedRequests: newExpanded };
    }
    
    case 'OPEN_BID_FORM':
      return {
        ...state,
        showBidForm: true,
        selectedTourRequest: action.request
      };
      
    case 'CLOSE_BID_FORM':
      return {
        ...state,
        showBidForm: false,
        selectedTourRequest: null
      };
      
    case 'OPEN_SHOW_DETAIL':
      return {
        ...state,
        showDetailModal: true,
        selectedShowForDetail: action.show
      };
      
    case 'CLOSE_SHOW_DETAIL':
      return {
        ...state,
        showDetailModal: false,
        selectedShowForDetail: null
      };
      
    case 'OPEN_DOCUMENT_MODAL':
      return {
        ...state,
        showDocumentModal: true,
        selectedDocumentShow: action.show || null,
        selectedDocumentBid: action.bid || null,
        selectedDocumentTourRequest: action.request || null
      };
      
    case 'CLOSE_DOCUMENT_MODAL':
      return {
        ...state,
        showDocumentModal: false,
        selectedDocumentShow: null,
        selectedDocumentBid: null,
        selectedDocumentTourRequest: null
      };
      
    case 'OPEN_UNIVERSAL_OFFER':
      return {
        ...state,
        showUniversalOfferModal: true,
        offerTargetArtist: action.artist,
        offerTourRequest: action.tourRequest || null,
        offerPreSelectedDate: action.preSelectedDate || null,
        offerExistingBid: action.existingBid || null
      };
      
    case 'CLOSE_UNIVERSAL_OFFER':
      return {
        ...state,
        showUniversalOfferModal: false,
        offerTargetArtist: null,
        offerTourRequest: null,
        offerPreSelectedDate: null,
        offerExistingBid: null
      };
      
    case 'SET_BID_ACTION_LOADING':
      return {
        ...state,
        bidActions: {
          ...state.bidActions,
          [action.bidId]: action.loading
        }
      };
      
    case 'SET_HOLD_ACTION_LOADING':
      return {
        ...state,
        holdActions: {
          ...state.holdActions,
          [action.bidId]: action.loading
        }
      };
      
    case 'SET_DELETE_LOADING':
      return {
        ...state,
        deleteLoading: action.requestId
      };
      
    case 'SET_DELETE_SHOW_LOADING':
      return {
        ...state,
        deleteShowLoading: action.showId
      };
      
    case 'DECLINE_BID_OPTIMISTIC': {
      const newSet = new Set(state.declinedBids);
      newSet.add(action.bidId);
      return { ...state, declinedBids: newSet };
    }
    
    case 'DELETE_REQUEST_OPTIMISTIC': {
      const newSet = new Set(state.deletedRequests);
      newSet.add(action.requestId);
      return { ...state, deletedRequests: newSet };
    }
    
    case 'DELETE_SHOW_OPTIMISTIC': {
      const newSet = new Set(state.deletedShows);
      newSet.add(action.showId);
      return { ...state, deletedShows: newSet };
    }
    
    case 'SET_BID_STATUS_OVERRIDE': {
      const newMap = new Map(state.bidStatusOverrides);
      newMap.set(action.bidId, action.status);
      return { ...state, bidStatusOverrides: newMap };
    }
    
    case 'CLEAR_BID_STATUS_OVERRIDE': {
      const newMap = new Map(state.bidStatusOverrides);
      newMap.delete(action.bidId);
      return { ...state, bidStatusOverrides: newMap };
    }
    
    case 'SET_HOLD_NOTE':
      return {
        ...state,
        holdNotes: {
          ...state.holdNotes,
          [action.bidId]: action.note
        }
      };
      
    case 'SET_ACTIVE_MONTH':
      return {
        ...state,
        activeMonthTab: action.monthKey
      };
      
    case 'RESET_OPTIMISTIC_STATE':
      return {
        ...state,
        declinedBids: new Set(),
        deletedRequests: new Set(),
        deletedShows: new Set(),
        bidStatusOverrides: new Map(),
        recentUndoActions: new Set()
      };
      
    case 'RESET_ALL_STATE':
      return initialState;
      
    case 'OPEN_TOUR_REQUEST_DETAIL':
      return {
        ...state,
        tourRequestDetailModal: true,
        selectedTourRequest: action.request
      };
      
    case 'CLOSE_TOUR_REQUEST_DETAIL':
      return {
        ...state,
        tourRequestDetailModal: false,
        selectedTourRequest: null
      };
      
    default:
      return state;
  }
}

// Custom hook to manage itinerary state
export function useItineraryState() {
  const [state, dispatch] = useReducer(itineraryReducer, initialState);
  
  // Action creators - memoized to prevent infinite re-renders
  const actions = useMemo(() => ({
    toggleBidExpansion: (requestId: string) => 
      dispatch({ type: 'TOGGLE_BID_EXPANSION', requestId }),
    
    toggleShowExpansion: (showId: string) => 
      dispatch({ type: 'TOGGLE_SHOW_EXPANSION', showId }),
    
    toggleRequestExpansion: (requestId: string) => 
      dispatch({ type: 'TOGGLE_REQUEST_EXPANSION', requestId }),
    
    openBidForm: (request: TourRequest) => 
      dispatch({ type: 'OPEN_BID_FORM', request }),
    
    closeBidForm: () => 
      dispatch({ type: 'CLOSE_BID_FORM' }),
    
    openShowDetail: (show: Show) => 
      dispatch({ type: 'OPEN_SHOW_DETAIL', show }),
    
    closeShowDetail: () => 
      dispatch({ type: 'CLOSE_SHOW_DETAIL' }),
    
    openDocumentModal: (params: { show?: Show; bid?: VenueBid; request?: TourRequest }) => 
      dispatch({ type: 'OPEN_DOCUMENT_MODAL', ...params }),
    
    closeDocumentModal: () => 
      dispatch({ type: 'CLOSE_DOCUMENT_MODAL' }),
    
    openUniversalOffer: (artist: { id: string; name: string }, tourRequest?: { id: string; title: string; artistName: string }, preSelectedDate?: string, existingBid?: any) => 
      dispatch({ type: 'OPEN_UNIVERSAL_OFFER', artist, tourRequest, preSelectedDate, existingBid }),
    
    closeUniversalOffer: () => 
      dispatch({ type: 'CLOSE_UNIVERSAL_OFFER' }),
    
    setBidActionLoading: (bidId: string, loading: boolean) => 
      dispatch({ type: 'SET_BID_ACTION_LOADING', bidId, loading }),
    
    setDeleteLoading: (requestId: string | null) => 
      dispatch({ type: 'SET_DELETE_LOADING', requestId }),
    
    declineBidOptimistic: (bidId: string) => 
      dispatch({ type: 'DECLINE_BID_OPTIMISTIC', bidId }),
    
    deleteRequestOptimistic: (requestId: string) => 
      dispatch({ type: 'DELETE_REQUEST_OPTIMISTIC', requestId }),
    
    deleteShowOptimistic: (showId: string) => 
      dispatch({ type: 'DELETE_SHOW_OPTIMISTIC', showId }),
    
    setBidStatusOverride: (bidId: string, status: 'pending' | 'accepted' | 'hold' | 'declined') => 
      dispatch({ type: 'SET_BID_STATUS_OVERRIDE', bidId, status }),
    
    setActiveMonth: (monthKey: string) => 
      dispatch({ type: 'SET_ACTIVE_MONTH', monthKey }),
    
    resetOptimisticState: () => 
      dispatch({ type: 'RESET_OPTIMISTIC_STATE' }),
    
    openTourRequestDetail: (request: TourRequest) => 
      dispatch({ type: 'OPEN_TOUR_REQUEST_DETAIL', request }),
    
    closeTourRequestDetail: () => 
      dispatch({ type: 'CLOSE_TOUR_REQUEST_DETAIL' }),
  }), []); // Empty dependency array since dispatch is stable
  
  return { state, actions };
} 
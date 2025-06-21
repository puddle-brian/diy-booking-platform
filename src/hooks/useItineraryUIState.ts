import { useState, useCallback } from 'react';

export interface ItineraryUIState {
  bidActions: Record<string, boolean>;
  showTourRequestForm: boolean;
  addDateLoading: boolean;
  deleteShowLoading: string | null;
  declinedBids: Set<string>;
  bidStatusOverrides: Map<string, any>;
  recentUndoActions: Set<string>;
  showVenueOfferForm: boolean;
}

export interface ItineraryUIActions {
  setBidActions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setShowTourRequestForm: React.Dispatch<React.SetStateAction<boolean>>;
  setAddDateLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteShowLoading: React.Dispatch<React.SetStateAction<string | null>>;
  setDeclinedBids: React.Dispatch<React.SetStateAction<Set<string>>>;
  setBidStatusOverrides: React.Dispatch<React.SetStateAction<Map<string, any>>>;
  setRecentUndoActions: React.Dispatch<React.SetStateAction<Set<string>>>;
  setShowVenueOfferForm: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Utility actions
  addDeclinedBid: (bidId: string) => void;
  removeDeclinedBid: (bidId: string) => void;
  setBidStatusOverride: (bidId: string, status: any) => void;
  removeBidStatusOverride: (bidId: string) => void;
  addRecentUndoAction: (actionId: string) => void;
  removeRecentUndoAction: (actionId: string) => void;
  resetAllUIState: () => void;
}

/**
 * 🎯 MICRO-PHASE D: UI State Consolidation Hook
 * 
 * Consolidates all remaining UI state management from TabbedTourItinerary
 * to reduce component complexity and improve state management.
 * 
 * Consolidated states:
 * - Loading states (bids, dates, shows)
 * - Form visibility states
 * - Optimistic UI state (declined bids, status overrides)
 * - Action tracking (recent undos)
 */
export function useItineraryUIState(): [ItineraryUIState, ItineraryUIActions] {
  const [bidActions, setBidActions] = useState<Record<string, boolean>>({});
  const [showTourRequestForm, setShowTourRequestForm] = useState(false);
  const [addDateLoading, setAddDateLoading] = useState(false);
  const [deleteShowLoading, setDeleteShowLoading] = useState<string | null>(null);
  const [declinedBids, setDeclinedBids] = useState<Set<string>>(new Set());
  const [bidStatusOverrides, setBidStatusOverrides] = useState<Map<string, any>>(new Map());
  const [recentUndoActions, setRecentUndoActions] = useState<Set<string>>(new Set());
  const [showVenueOfferForm, setShowVenueOfferForm] = useState(false);

  // Utility actions for common operations
  const addDeclinedBid = useCallback((bidId: string) => {
    setDeclinedBids(prev => new Set([...prev, bidId]));
  }, []);

  const removeDeclinedBid = useCallback((bidId: string) => {
    setDeclinedBids(prev => {
      const newSet = new Set(prev);
      newSet.delete(bidId);
      return newSet;
    });
  }, []);

  const setBidStatusOverride = useCallback((bidId: string, status: any) => {
    setBidStatusOverrides(prev => new Map([...prev, [bidId, status]]));
  }, []);

  const removeBidStatusOverride = useCallback((bidId: string) => {
    setBidStatusOverrides(prev => {
      const newMap = new Map(prev);
      newMap.delete(bidId);
      return newMap;
    });
  }, []);

  const addRecentUndoAction = useCallback((actionId: string) => {
    setRecentUndoActions(prev => new Set([...prev, actionId]));
  }, []);

  const removeRecentUndoAction = useCallback((actionId: string) => {
    setRecentUndoActions(prev => {
      const newSet = new Set(prev);
      newSet.delete(actionId);
      return newSet;
    });
  }, []);

  const resetAllUIState = useCallback(() => {
    setBidActions({});
    setShowTourRequestForm(false);
    setAddDateLoading(false);
    setDeleteShowLoading(null);
    setDeclinedBids(new Set());
    setBidStatusOverrides(new Map());
    setRecentUndoActions(new Set());
    setShowVenueOfferForm(false);
  }, []);

  const state: ItineraryUIState = {
    bidActions,
    showTourRequestForm,
    addDateLoading,
    deleteShowLoading,
    declinedBids,
    bidStatusOverrides,
    recentUndoActions,
    showVenueOfferForm
  };

  const actions: ItineraryUIActions = {
    setBidActions,
    setShowTourRequestForm,
    setAddDateLoading,
    setDeleteShowLoading,
    setDeclinedBids,
    setBidStatusOverrides,
    setRecentUndoActions,
    setShowVenueOfferForm,
    addDeclinedBid,
    removeDeclinedBid,
    setBidStatusOverride,
    removeBidStatusOverride,
    addRecentUndoAction,
    removeRecentUndoAction,
    resetAllUIState
  };

  return [state, actions];
} 
/**
 * 🎯 MICRO-PHASE K: Table Content Consolidation
 * 
 * Reduces TabbedTourItinerary complexity by consolidating the massive 20+ table content props
 * passed to ItineraryTableContent into organized, logical groups.
 * 
 * BEFORE: 20+ individual props scattered across component call
 * AFTER: 4 organized prop groups with clear responsibilities
 * 
 * Complexity Reduction: ~20 lines of prop passing → 4 organized groups
 */

// 🎯 GROUP 1: Core data props
export interface TableDataProps {
  venueId?: string;
  artistId?: string;
  activeMonthEntries: any[];
  processedEntries: any[];
  stableMonthTabs: any[];
  venueBids: any[];
  venueOffers: any[];
  declinedBids: Set<string>;
  tourRequests: any[];
  venues: any[];
}

// 🎯 GROUP 2: State and permissions
export interface TableStateProps {
  editable: boolean;
  permissions: any;
  state: any;
  venueName?: string;
}

// 🎯 GROUP 3: Event handlers
export interface TableHandlerProps {
  handlers: any;
  toggleShowExpansion: (showId: string) => void;
  toggleRequestExpansion: (requestId: string) => void;
  handleDeleteShow: (showId: string) => void;
  getBidStatusBadge: (bid: any) => string;
  handleDeleteShowRequest: (requestId: string) => void;
  handleOfferAction: (offer: any) => void;
  handleBidAction: (bid: any) => void;
  getEffectiveBidStatus: (bid: any) => any;
}

// 🎯 GROUP 4: Action functions
export interface TableActionProps {
  actions: any;
}

// 🎯 CONSOLIDATED INTERFACE: All table props organized into logical groups
export interface ConsolidatedTableProps {
  data: TableDataProps;
  state: TableStateProps;
  handlers: TableHandlerProps;
  actions: TableActionProps;
}

/**
 * 🎯 BUILDER FUNCTION: Creates consolidated table props from individual props
 * 
 * This allows TabbedTourItinerary to pass organized groups instead of 20+ individual props
 */
export function buildConsolidatedTableProps(props: {
  // Data props
  venueId?: string;
  artistId?: string;
  activeMonthEntries: any[];
  processedEntries: any[];
  stableMonthTabs: any[];
  venueBids: any[];
  venueOffers: any[];
  declinedBids: Set<string>;
  tourRequests: any[];
  venues: any[];
  
  // State props
  editable: boolean;
  permissions: any;
  state: any;
  venueName?: string;
  
  // Handler props
  handlers: any;
  toggleShowExpansion: (showId: string) => void;
  toggleRequestExpansion: (requestId: string) => void;
  handleDeleteShow: (showId: string) => void;
  getBidStatusBadge: (bid: any) => string;
  handleDeleteShowRequest: (requestId: string) => void;
  handleOfferAction: (offer: any) => void;
  handleBidAction: (bid: any) => void;
  getEffectiveBidStatus: (bid: any) => any;
  
  // Action props
  actions: any;
}): ConsolidatedTableProps {
  return {
    data: {
      venueId: props.venueId,
      artistId: props.artistId,
      activeMonthEntries: props.activeMonthEntries,
      processedEntries: props.processedEntries,
      stableMonthTabs: props.stableMonthTabs,
      venueBids: props.venueBids,
      venueOffers: props.venueOffers,
      declinedBids: props.declinedBids,
      tourRequests: props.tourRequests,
      venues: props.venues
    },
    state: {
      editable: props.editable,
      permissions: props.permissions,
      state: props.state,
      venueName: props.venueName
    },
    handlers: {
      handlers: props.handlers,
      toggleShowExpansion: props.toggleShowExpansion,
      toggleRequestExpansion: props.toggleRequestExpansion,
      handleDeleteShow: props.handleDeleteShow,
      getBidStatusBadge: props.getBidStatusBadge,
      handleDeleteShowRequest: props.handleDeleteShowRequest,
      handleOfferAction: props.handleOfferAction,
      handleBidAction: props.handleBidAction,
      getEffectiveBidStatus: props.getEffectiveBidStatus
    },
    actions: {
      actions: props.actions
    }
  };
} 
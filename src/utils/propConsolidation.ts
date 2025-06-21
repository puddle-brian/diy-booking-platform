// 🎯 MICRO-PHASE H: Component Prop Consolidation
// Reduces 25+ individual props to organized prop groups

// 🎯 CORE DATA PROPS: Essential timeline data
export interface TimelineDataProps {
  venueId?: string;
  artistId?: string;
  venueName?: string;
  activeMonthEntries: any[];
  processedEntries: any[];
  stableMonthTabs: any[];
  venueBids: any[];
  venueOffers: any[];
  declinedBids: Set<string>;
  tourRequests: any[];
  venues: any[];
}

// 🎯 INTERACTION PROPS: Event handlers and actions
export interface TimelineInteractionProps {
  toggleShowExpansion: (showId: string) => void;
  toggleRequestExpansion: (requestId: string) => void;
  handleDeleteShow: (showId: string) => void;
  handleDeleteShowRequest: (id: string, name: string) => Promise<void>;
  handleOfferAction: (offer: any, action: string) => Promise<void>;
  handleBidAction: (bid: any, action: string, reason?: string) => Promise<void>;
  getBidStatusBadge: (bidId: string) => any;
  getEffectiveBidStatus: (bidId: string) => string;
}

// 🎯 STATE PROPS: UI state and permissions
export interface TimelineStateProps {
  editable: boolean;
  permissions: any;
  state: any;
  handlers: any;
  actions: any;
}

// 🎯 CONSOLIDATED PROPS: Single interface combining all prop groups
export interface ConsolidatedTimelineProps extends 
  TimelineDataProps, 
  TimelineInteractionProps, 
  TimelineStateProps {}

// 🎯 PROP EXTRACTION UTILITIES: Helper functions to extract prop groups
export function extractDataProps(props: ConsolidatedTimelineProps): TimelineDataProps {
  return {
    venueId: props.venueId,
    artistId: props.artistId,
    venueName: props.venueName,
    activeMonthEntries: props.activeMonthEntries,
    processedEntries: props.processedEntries,
    stableMonthTabs: props.stableMonthTabs,
    venueBids: props.venueBids,
    venueOffers: props.venueOffers,
    declinedBids: props.declinedBids,
    tourRequests: props.tourRequests,
    venues: props.venues
  };
}

export function extractInteractionProps(props: ConsolidatedTimelineProps): TimelineInteractionProps {
  return {
    toggleShowExpansion: props.toggleShowExpansion,
    toggleRequestExpansion: props.toggleRequestExpansion,
    handleDeleteShow: props.handleDeleteShow,
    handleDeleteShowRequest: props.handleDeleteShowRequest,
    handleOfferAction: props.handleOfferAction,
    handleBidAction: props.handleBidAction,
    getBidStatusBadge: props.getBidStatusBadge,
    getEffectiveBidStatus: props.getEffectiveBidStatus
  };
}

export function extractStateProps(props: ConsolidatedTimelineProps): TimelineStateProps {
  return {
    editable: props.editable,
    permissions: props.permissions,
    state: props.state,
    handlers: props.handlers,
    actions: props.actions
  };
} 
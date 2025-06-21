// 🎯 MICRO-PHASE H: Safe Component Prop Organization
// Helper functions to organize timeline props without changing existing interfaces

// 🎯 CORE DATA PROPS: Essential timeline data
export interface TimelineDataGroup {
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
export interface TimelineInteractionGroup {
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
export interface TimelineStateGroup {
  editable: boolean;
  permissions: any;
  state: any;
  handlers: any;
  actions: any;
}

/**
 * 🎯 MICRO-PHASE H: Extract data-related props from a large prop object
 * Reduces visual complexity by grouping related props together
 */
export function extractTimelineDataProps(props: any): TimelineDataGroup {
  return {
    venueId: props.venueId,
    artistId: props.artistId,
    venueName: props.venueName,
    activeMonthEntries: props.activeMonthEntries || [],
    processedEntries: props.processedEntries || [],
    stableMonthTabs: props.stableMonthTabs || [],
    venueBids: props.venueBids || [],
    venueOffers: props.venueOffers || [],
    declinedBids: props.declinedBids || new Set(),
    tourRequests: props.tourRequests || [],
    venues: props.venues || []
  };
}

/**
 * 🎯 MICRO-PHASE H: Extract interaction-related props from a large prop object
 * Centralizes event handlers for better organization
 */
export function extractTimelineInteractionProps(props: any): TimelineInteractionGroup {
  return {
    toggleShowExpansion: props.toggleShowExpansion || (() => {}),
    toggleRequestExpansion: props.toggleRequestExpansion || (() => {}),
    handleDeleteShow: props.handleDeleteShow || (() => {}),
    handleDeleteShowRequest: props.handleDeleteShowRequest || (() => Promise.resolve()),
    handleOfferAction: props.handleOfferAction || (() => Promise.resolve()),
    handleBidAction: props.handleBidAction || (() => Promise.resolve()),
    getBidStatusBadge: props.getBidStatusBadge || (() => ({ className: '', text: '' })),
    getEffectiveBidStatus: props.getEffectiveBidStatus || (() => 'pending')
  };
}

/**
 * 🎯 MICRO-PHASE H: Extract state-related props from a large prop object
 * Groups permissions, state, and UI controls together
 */
export function extractTimelineStateProps(props: any): TimelineStateGroup {
  return {
    editable: props.editable || false,
    permissions: props.permissions || {},
    state: props.state || {},
    handlers: props.handlers || {},
    actions: props.actions || {}
  };
}

/**
 * 🎯 MICRO-PHASE H: Create organized prop groups for timeline components
 * Reduces the visual complexity of passing 25+ individual props
 */
export function organizeTimelineProps(props: any) {
  return {
    data: extractTimelineDataProps(props),
    interactions: extractTimelineInteractionProps(props),
    state: extractTimelineStateProps(props)
  };
}

/**
 * 🎯 MICRO-PHASE H: Flatten organized props back to individual props
 * Allows gradual migration - organize props but still pass them individually
 */
export function flattenTimelineProps(organized: {
  data: TimelineDataGroup;
  interactions: TimelineInteractionGroup;
  state: TimelineStateGroup;
}) {
  return {
    ...organized.data,
    ...organized.interactions,
    ...organized.state
  };
} 
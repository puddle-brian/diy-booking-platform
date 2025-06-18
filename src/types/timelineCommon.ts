// Common interfaces that both ShowTimelineItem and ShowRequestProcessor will use
// Phase 1: Pure type definitions - no component changes yet

export interface TimelineEntryCommon {
  id: string;
  type: 'show' | 'show-request';
  date: string;
  endDate?: string;
}

export interface TimelineDisplayProps {
  artistId?: string;
  venueId?: string;
  venueName?: string;
  permissions: any;
  state: any;
  handlers: any;
}

export interface TimelineTableStructure {
  hasLocationColumn: boolean;
  mainColumnWidth: string;
  columns: {
    expansion: string;
    date: string;
    location?: string;
    main: string;
    status: string;
    actions: string;
  };
}

// Common styling variants for timeline rows
export type TimelineRowVariant = 'confirmed' | 'open' | 'hold' | 'accepted';

// Interface for common row data that both systems eventually need
export interface TimelineRowCommon {
  id: string;
  variant: TimelineRowVariant;
  date: string;
  endDate?: string;
  displayName: string;
  location?: string;
  isExpanded: boolean;
} 
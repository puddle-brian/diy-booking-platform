import React from 'react';
import { ItineraryTableHeader } from './ItineraryTableHeader';
import { ItineraryEmptyState } from './ItineraryEmptyState';
import { SpecializedTimelineGroupRow } from './TimelineItems/SpecializedTimelineGroupRow';
import { groupProcessedEntriesByDate } from '../utils/timelineProcessing';
// 🎯 MICRO-PHASE H: Import safe prop organization helpers
import { organizeTimelineProps, flattenTimelineProps } from '../utils/propHelpers';

// 🎯 MICRO-PHASE H: Keep existing interface for compatibility
interface ItineraryTableContentProps {
  venueId?: string;
  artistId?: string;
  activeMonthEntries: any[];
  processedEntries: any[];
  stableMonthTabs: any[];
  editable: boolean;
  permissions: any;
  state: any;
  handlers: any;
  venueName?: string;
  toggleShowExpansion: (showId: string) => void;
  toggleRequestExpansion: (requestId: string) => void;
  handleDeleteShow: (showId: string) => void;
  venueBids: any[];
  venueOffers: any[];
  declinedBids: Set<string>;
  tourRequests: any[];
  actions: any;
  getBidStatusBadge: (bidId: string) => any;
  handleDeleteShowRequest: (id: string, name: string) => Promise<void>;
  handleOfferAction: (offer: any, action: string) => Promise<void>;
  handleBidAction: (bid: any, action: string, reason?: string) => Promise<void>;
  getEffectiveBidStatus: (bidId: string) => string;
  venues: any[];
}

// 🎯 MICRO-PHASE H: Use prop organization helpers for cleaner code
export function ItineraryTableContent(props: ItineraryTableContentProps) {
  // 🎯 MICRO-PHASE H: Organize props for better readability
  const { data, interactions, state } = organizeTimelineProps(props);
  return (
    <div className="overflow-x-auto bg-bg-primary">
      <table className="w-full min-w-[1000px] table-fixed">
        <ItineraryTableHeader venueId={data.venueId} artistId={data.artistId} />
        <tbody className="divide-y divide-border-primary">
          {/* Empty state */}
          {data.activeMonthEntries.length === 0 && (
            <ItineraryEmptyState
              venueId={data.venueId}
              stableMonthTabs={data.stableMonthTabs}
              editable={state.editable}
            />
          )}
          
          {/* 🎯 MICRO-PHASE H: Organized props passed to specialized components */}
          {groupProcessedEntriesByDate(data.processedEntries).map(({ groupDate, groupEntries }) => (
            <SpecializedTimelineGroupRow
              key={groupDate}
              groupDate={groupDate}
              groupEntries={groupEntries}
              {...state}
              {...data}
              {...interactions}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
} 
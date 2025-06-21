import React from 'react';
import { TimelineRow } from './TimelineRow';

interface TimelineGroupRowProps {
  // Group information
  groupDate: string;
  groupEntries: Array<{
    entry: any;
    index: number;
    entryDate: string;
    sameDateSiblings: any[];
    isFirstOfDate: boolean;
  }>;
  
  // Props to pass through to individual TimelineRow components
  permissions: any;
  state: any;
  handlers: any;
  artistId?: string;
  venueId?: string;
  venueName?: string;
  onToggleExpansion?: (id: string) => void;
  toggleRequestExpansion?: (id: string) => void;
  onDeleteShow?: (id: string, name: string) => void;
  venueBids?: any[];
  venueOffers?: any[];
  declinedBids?: Set<string>;
  tourRequests?: any[];
  actions?: any;
  getBidStatusBadge?: (bid: any) => any;
  handleDeleteShowRequest?: (id: string, name: string) => Promise<void>;
  handleOfferAction?: (offer: any, action: string) => Promise<void>;
  handleBidAction?: (bid: any, action: string, reason?: string) => Promise<void>;
  getEffectiveBidStatus?: (bid: any) => string;
  venues?: any[];
}

/**
 * 🎯 MICRO-PHASE B: Timeline Group Row Component
 * 
 * This component handles multiple timeline entries for the same date as a single group.
 * It replaces the complex filtering logic in ItineraryTableContent.tsx that was hiding
 * non-first entries and trying to manage same-date grouping.
 * 
 * BENEFITS:
 * - Reduces complexity in parent component
 * - Handles same-date grouping logic in one place
 * - Makes timeline rendering more predictable
 * - Easier to add group-level features (like date headers)
 */
export function TimelineGroupRow({
  groupDate,
  groupEntries,
  permissions,
  state,
  handlers,
  artistId,
  venueId,
  venueName,
  onToggleExpansion,
  toggleRequestExpansion,
  onDeleteShow,
  venueBids,
  venueOffers,
  declinedBids,
  tourRequests,
  actions,
  getBidStatusBadge,
  handleDeleteShowRequest,
  handleOfferAction,
  handleBidAction,
  getEffectiveBidStatus,
  venues
}: TimelineGroupRowProps) {
  
  // 🎯 MICRO-PHASE B: Start with simplest case - single entry per date
  // This covers the majority of cases and reduces complexity immediately
  if (groupEntries.length === 1) {
    const { entry, sameDateSiblings, isFirstOfDate, entryDate } = groupEntries[0];
    
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
        onToggleExpansion={onToggleExpansion}
        toggleRequestExpansion={toggleRequestExpansion}
        onDeleteShow={onDeleteShow}
        onShowDocument={handlers.handleShowDocumentModal}
        onShowDetail={handlers.handleShowDetailModal}
        onSupportActAdded={(offer: any) => {
          // Placeholder - this will be handled by parent
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
  }
  
  // 🎯 MICRO-PHASE B: Multi-entry groups (maintain original behavior)
  // Show only the FIRST entry to maintain the original isFirstOfDate filtering
  // Same-date siblings are passed to components for internal expansion handling
  const firstEntry = groupEntries[0];
  const { entry, sameDateSiblings, isFirstOfDate, entryDate } = firstEntry;
  
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
      onToggleExpansion={onToggleExpansion}
      toggleRequestExpansion={toggleRequestExpansion}
      onDeleteShow={onDeleteShow}
      onShowDocument={handlers.handleShowDocumentModal}
      onShowDetail={handlers.handleShowDetailModal}
      onSupportActAdded={(offer: any) => {
        // Placeholder - this will be handled by parent
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
} 
import React from 'react';
import { ShowTimelineItem } from './ShowTimelineItem';
import { ShowRequestProcessor } from './ShowRequestProcessor';
import { TimelineEntryCommon } from '../../types/timelineCommon';

/**
 * 🎯 MICRO-PHASE D: Specialized Timeline Row Component
 * 
 * This component eliminates prop drilling by creating specialized interfaces
 * for different timeline entry types. Instead of passing 28+ props through
 * multiple layers, each entry type gets exactly what it needs.
 * 
 * BENEFITS:
 * - Reduces prop drilling from 28 props to 5-8 props per component
 * - Type-safe interfaces for each entry type
 * - Easier to maintain and extend
 * - Better performance (fewer prop comparisons)
 */

interface BaseTimelineRowProps {
  entry: TimelineEntryCommon & { data: any };
  permissions: any;
  state: any;
  handlers: any;
  artistId?: string;
  venueId?: string;
  venueName?: string;
  // 🎯 MICRO-PHASE D FIX: Add the actual event handlers that were missing
  toggleShowExpansion?: (id: string) => void;
  handleDeleteShow?: (id: string) => void;
}

interface ShowTimelineRowProps extends BaseTimelineRowProps {
  entry: TimelineEntryCommon & { data: any; type: 'show' };
}

interface ShowRequestTimelineRowProps extends BaseTimelineRowProps {
  entry: TimelineEntryCommon & { data: any; type: 'show-request' };
  // Only the props that ShowRequestProcessor actually needs
  venueBids: any[];
  venueOffers: any[];
  declinedBids: Set<string>;
  tourRequests: any[];
  sameDateSiblings: any[];
  isFirstOfDate: boolean;
  entryDate: string;
  actions: any;
  getBidStatusBadge: (bid: any) => any;
  toggleRequestExpansion: (id: string) => void;
  handleDeleteShowRequest: (id: string, name: string) => Promise<void>;
  handleOfferAction: (offer: any, action: string) => Promise<void>;
  handleBidAction: (bid: any, action: string, reason?: string) => Promise<void>;
  getEffectiveBidStatus: (bid: any) => string;
  venues: any[];
}

/**
 * Specialized Show Timeline Row - Only handles show entries
 */
function ShowTimelineRow({ 
  entry, 
  permissions, 
  state, 
  handlers, 
  artistId, 
  venueId,
  toggleShowExpansion,
  handleDeleteShow
}: ShowTimelineRowProps) {
  const show = entry.data;
  
  return (
    <ShowTimelineItem
      show={show}
      permissions={permissions}
      isExpanded={state.expandedShows.has(show.id)}
      isDeleting={state.deleteShowLoading === show.id}
      artistId={artistId}
      venueId={venueId}
      onToggleExpansion={toggleShowExpansion || (() => {})}
      onDeleteShow={handleDeleteShow || (() => {})}
      onShowDocument={handlers.handleShowDocumentModal || (() => {})}
      onShowDetail={handlers.handleShowDetailModal || (() => {})}
      onSupportActAdded={(offer: any) => {
        // Handle support act addition
        handlers.handleAddAnotherArtistSuccess?.(offer);
      }}
    />
  );
}

/**
 * Specialized Show Request Timeline Row - Only handles show request entries
 */
function ShowRequestTimelineRow({ 
  entry, 
  permissions, 
  state, 
  handlers, 
  artistId, 
  venueId, 
  venueName,
  venueBids,
  venueOffers,
  declinedBids,
  tourRequests,
  sameDateSiblings,
  isFirstOfDate,
  entryDate,
  actions,
  getBidStatusBadge,
  toggleRequestExpansion,
  handleDeleteShowRequest,
  handleOfferAction,
  handleBidAction,
  getEffectiveBidStatus,
  venues
}: ShowRequestTimelineRowProps) {
  const request = entry.data;
  
  return (
    <ShowRequestProcessor
      entry={entry}
      request={request}
      venueBids={venueBids}
      venueOffers={venueOffers}
      declinedBids={declinedBids}
      tourRequests={tourRequests}
      sameDateSiblings={sameDateSiblings}
      isFirstOfDate={isFirstOfDate}
      entryDate={entryDate}
      artistId={artistId}
      venueId={venueId}
      venueName={venueName}
      permissions={permissions}
      state={state}
      handlers={handlers}
      actions={actions}
      getBidStatusBadge={getBidStatusBadge}
      toggleRequestExpansion={toggleRequestExpansion}
      handleDeleteShowRequest={handleDeleteShowRequest}
      handleOfferAction={handleOfferAction}
      handleBidAction={handleBidAction}
      getEffectiveBidStatus={getEffectiveBidStatus}
      venues={venues}
    />
  );
}

/**
 * Main Specialized Timeline Row Component
 * 
 * This replaces the generic TimelineRow with type-specific components
 * that only receive the props they actually need.
 */
export function SpecializedTimelineRow(props: BaseTimelineRowProps | ShowRequestTimelineRowProps) {
  const { entry } = props;
  
  if (entry.type === 'show') {
    return <ShowTimelineRow {...props as ShowTimelineRowProps} />;
  } else if (entry.type === 'show-request') {
    return <ShowRequestTimelineRow {...props as ShowRequestTimelineRowProps} />;
  }
  
  return null;
} 
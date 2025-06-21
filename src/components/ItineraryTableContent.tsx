import React from 'react';
import { ItineraryTableHeader } from './ItineraryTableHeader';
import { ItineraryEmptyState } from './ItineraryEmptyState';
import { TimelineGroupRow } from './TimelineItems/TimelineGroupRow';
import { groupProcessedEntriesByDate } from '../utils/timelineProcessing';

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

export function ItineraryTableContent({
  venueId,
  artistId,
  activeMonthEntries,
  processedEntries,
  stableMonthTabs,
  editable,
  permissions,
  state,
  handlers,
  venueName,
  toggleShowExpansion,
  toggleRequestExpansion,
  handleDeleteShow,
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
}: ItineraryTableContentProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] table-fixed">
        <ItineraryTableHeader venueId={venueId} artistId={artistId} />
        <tbody className="divide-y divide-gray-100">
          {/* Empty state */}
          {activeMonthEntries.length === 0 && (
            <ItineraryEmptyState
              venueId={venueId}
              stableMonthTabs={stableMonthTabs}
              editable={editable}
            />
          )}
          
          {/* 🎯 MICRO-PHASE B: Group entries by date (maintains original behavior) */}
          {groupProcessedEntriesByDate(processedEntries).map(({ groupDate, groupEntries }) => (
            <TimelineGroupRow
              key={groupDate}
              groupDate={groupDate}
              groupEntries={groupEntries}
              permissions={permissions}
              state={state}
              handlers={handlers}
              artistId={artistId}
              venueId={venueId}
              venueName={venueName}
              onToggleExpansion={toggleShowExpansion}
              toggleRequestExpansion={toggleRequestExpansion}
              onDeleteShow={handleDeleteShow}
              venueBids={venueBids}
              venueOffers={venueOffers}
              declinedBids={declinedBids}
              tourRequests={tourRequests}
              actions={actions}
              getBidStatusBadge={getBidStatusBadge}
              handleDeleteShowRequest={handleDeleteShowRequest}
              handleOfferAction={handleOfferAction}
              handleBidAction={handleBidAction}
              getEffectiveBidStatus={getEffectiveBidStatus}
              venues={venues}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
} 
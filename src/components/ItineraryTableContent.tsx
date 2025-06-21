import React from 'react';
import { ItineraryTableHeader } from './ItineraryTableHeader';
import { ItineraryEmptyState } from './ItineraryEmptyState';
import { TimelineRow } from './TimelineItems/TimelineRow';

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
          
          {/* Render entries for active month */}
          {processedEntries.map(({ entry, index, entryDate, sameDateSiblings, isFirstOfDate }) => {
            // Hide non-first entries - they'll be shown as children when parent is expanded
            if (!isFirstOfDate) {
              return null;
            }
            
            // 🎯 PHASE 4: Unified timeline rendering with single TimelineRow component
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
                onToggleExpansion={toggleShowExpansion}
                toggleRequestExpansion={toggleRequestExpansion}
                onDeleteShow={handleDeleteShow}
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
          })}
        </tbody>
      </table>
    </div>
  );
} 
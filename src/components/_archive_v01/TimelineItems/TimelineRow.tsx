import React from 'react';
import { ShowTimelineItem } from './ShowTimelineItem';
import { ShowRequestProcessor } from './ShowRequestProcessor';
import { TimelineEntryCommon } from '../../types/timelineCommon';

interface TimelineRowProps {
  entry: TimelineEntryCommon & { data: any };
  
  // All the existing props that both components might need
  permissions: any;
  state: any;
  handlers: any;
  artistId?: string;
  venueId?: string;
  venueName?: string;
  
  // Props specific to ShowTimelineItem
  isDeleting?: boolean;
  onToggleExpansion?: (id: string) => void;
  onDeleteShow?: (id: string, name: string) => void;
  onShowDocument?: (show: any) => void;
  onShowDetail?: (show: any) => void;
  onSupportActAdded?: (offer: any) => void;
  
  // Props specific to ShowRequestProcessor
  venueBids?: any[];
  venueOffers?: any[];
  declinedBids?: Set<string>;
  tourRequests?: any[];
  sameDateSiblings?: any[];
  isFirstOfDate?: boolean;
  entryDate?: string;
  actions?: any;
  getBidStatusBadge?: (bid: any) => any;
  toggleRequestExpansion?: (id: string) => void;
  handleDeleteShowRequest?: (id: string, name: string) => Promise<void>;
  handleOfferAction?: (offer: any, action: string) => Promise<void>;
  handleBidAction?: (bid: any, action: string, reason?: string) => Promise<void>;
  getEffectiveBidStatus?: (bid: any) => string;
  venues?: any[];
}

export function TimelineRow({ entry, ...props }: TimelineRowProps) {
  // Pure delegation - exact same logic as the original conditional in TabbedTourItinerary
  if (entry.type === 'show') {
    const show = entry.data;
    
    return (
      <ShowTimelineItem
        show={show}
        permissions={props.permissions}
        isExpanded={props.state.expandedShows.has(show.id)}
        isDeleting={props.state.deleteShowLoading === show.id}
        artistId={props.artistId}
        venueId={props.venueId}
        onToggleExpansion={props.onToggleExpansion || (() => {})}
        onDeleteShow={props.onDeleteShow || (() => {})}
        onShowDocument={props.onShowDocument || (() => {})}
        onShowDetail={props.onShowDetail || (() => {})}
        onSupportActAdded={props.onSupportActAdded || (() => {})}
      />
    );
  } else if (entry.type === 'show-request') {
    const request = entry.data;
    
    return (
      <ShowRequestProcessor
        entry={entry}
        request={request}
        venueBids={props.venueBids || []}
        venueOffers={props.venueOffers || []}
        declinedBids={props.declinedBids || new Set()}
        tourRequests={props.tourRequests || []}
        sameDateSiblings={props.sameDateSiblings || []}
        isFirstOfDate={props.isFirstOfDate || false}
        entryDate={props.entryDate || ''}
        artistId={props.artistId}
        venueId={props.venueId}
        venueName={props.venueName}
        permissions={props.permissions}
        state={props.state}
        handlers={props.handlers}
        actions={props.actions}
        getBidStatusBadge={props.getBidStatusBadge || (() => ({ className: '', text: '' }))}
        toggleRequestExpansion={props.toggleRequestExpansion || (() => {})}
        handleDeleteShowRequest={props.handleDeleteShowRequest || (() => Promise.resolve())}
        handleOfferAction={props.handleOfferAction || (() => Promise.resolve())}
        handleBidAction={props.handleBidAction || (() => Promise.resolve())}
        getEffectiveBidStatus={props.getEffectiveBidStatus || (() => 'pending')}
        venues={props.venues || []}
      />
    );
  }
  
  return null;
} 
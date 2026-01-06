import React from 'react';
import { SpecializedTimelineRow } from './SpecializedTimelineRow';

/**
 * 🎯 MICRO-PHASE D: Specialized Timeline Group Row
 * 
 * This component replaces TimelineGroupRow by using specialized timeline
 * components that only receive the props they actually need. This eliminates
 * the massive prop drilling problem (28+ props) and creates cleaner interfaces.
 * 
 * BENEFITS:
 * - Reduces prop drilling from 28+ props to type-specific prop sets
 * - Cleaner, more maintainable component interfaces  
 * - Better performance (fewer unnecessary prop passes)
 * - Type safety for different entry types
 */

interface BaseGroupRowProps {
  // Group information
  groupDate: string;
  groupEntries: Array<{
    entry: any;
    index: number;
    entryDate: string;
    sameDateSiblings: any[];
    isFirstOfDate: boolean;
  }>;
  
  // Common props needed by all timeline entries
  permissions: any;
  state: any;
  handlers: any;
  artistId?: string;
  venueId?: string;
  venueName?: string;
  actions: any;
  
  // 🎯 MICRO-PHASE D FIX: Add missing event handlers for shows
  toggleShowExpansion?: (id: string) => void;
  handleDeleteShow?: (id: string) => void;
}

interface ShowRequestSpecificProps {
  // Props only needed by show request entries
  venueBids: any[];
  venueOffers: any[];
  declinedBids: Set<string>;
  tourRequests: any[];
  getBidStatusBadge: (bid: any) => any;
  toggleRequestExpansion: (id: string) => void;
  handleDeleteShowRequest: (id: string, name: string) => Promise<void>;
  handleOfferAction: (offer: any, action: string) => Promise<void>;
  handleBidAction: (bid: any, action: string, reason?: string) => Promise<void>;
  getEffectiveBidStatus: (bid: any) => string;
  venues: any[];
}

type SpecializedTimelineGroupRowProps = BaseGroupRowProps & Partial<ShowRequestSpecificProps>;

export function SpecializedTimelineGroupRow({
  groupDate,
  groupEntries,
  permissions,
  state,
  handlers,
  artistId,
  venueId,
  venueName,
  actions,
  // Show specific props
  toggleShowExpansion,
  handleDeleteShow,
  // Show request specific props (optional)
  venueBids = [],
  venueOffers = [],
  declinedBids = new Set(),
  tourRequests = [],
  getBidStatusBadge = () => ({ className: '', text: '' }),
  toggleRequestExpansion = () => {},
  handleDeleteShowRequest = () => Promise.resolve(),
  handleOfferAction = () => Promise.resolve(),
  handleBidAction = () => Promise.resolve(),
  getEffectiveBidStatus = () => 'pending',
  venues = []
}: SpecializedTimelineGroupRowProps) {
  
  // 🎯 MICRO-PHASE D: Handle single entries (most common case)
  if (groupEntries.length === 1) {
    const { entry, sameDateSiblings, isFirstOfDate, entryDate } = groupEntries[0];
    
    // Create base props that all entries need
    const baseProps = {
      entry: {...entry, id: entry.data.id},
      permissions,
      state,
      handlers,
      artistId,
      venueId,
      venueName
    };
    
    // For show entries, pass base props + show-specific handlers
    if (entry.type === 'show') {
      return (
        <SpecializedTimelineRow
          key={`${entry.type}-${entry.data.id}`}
          {...baseProps}
          toggleShowExpansion={toggleShowExpansion}
          handleDeleteShow={handleDeleteShow}
        />
      );
    }
    
    // For show request entries, add the specific props they need
    if (entry.type === 'show-request') {
      return (
        <SpecializedTimelineRow
          key={`${entry.type}-${entry.data.id}`}
          {...baseProps}
          venueBids={venueBids}
          venueOffers={venueOffers}
          declinedBids={declinedBids}
          tourRequests={tourRequests}
          sameDateSiblings={sameDateSiblings}
          isFirstOfDate={isFirstOfDate}
          entryDate={entryDate}
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
  }
  
  // 🎯 MICRO-PHASE D: Multi-entry groups (maintain original behavior)
  // Show only the FIRST entry to maintain the original isFirstOfDate filtering
  const firstEntry = groupEntries[0];
  const { entry, sameDateSiblings, isFirstOfDate, entryDate } = firstEntry;
  
  // Create base props
  const baseProps = {
    entry: {...entry, id: entry.data.id},
    permissions,
    state,
    handlers,
    artistId,
    venueId,
    venueName
  };
  
  // Handle first entry based on type
  if (entry.type === 'show') {
    return (
      <SpecializedTimelineRow
        key={`${entry.type}-${entry.data.id}`}
        {...baseProps}
        toggleShowExpansion={toggleShowExpansion}
        handleDeleteShow={handleDeleteShow}
      />
    );
  }
  
  if (entry.type === 'show-request') {
    return (
      <SpecializedTimelineRow
        key={`${entry.type}-${entry.data.id}`}
        {...baseProps}
        venueBids={venueBids}
        venueOffers={venueOffers}
        declinedBids={declinedBids}
        tourRequests={tourRequests}
        sameDateSiblings={sameDateSiblings}
        isFirstOfDate={isFirstOfDate}
        entryDate={entryDate}
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
  
  return null;
} 
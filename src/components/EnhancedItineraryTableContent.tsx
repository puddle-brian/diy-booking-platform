/**
 * 🎯 MICRO-PHASE K: Enhanced Table Content with Consolidated Props
 * 
 * This component replaces the prop-drilling nightmare of ItineraryTableContent
 * by accepting organized prop groups instead of 20+ individual props.
 * 
 * BEFORE: 20+ individual props scattered across component interface
 * AFTER: 4 organized prop groups with clear responsibilities
 */

import React from 'react';
import { ItineraryTableContent } from './ItineraryTableContent';
import { ConsolidatedTableProps } from '../utils/tableContentConsolidation';

interface EnhancedItineraryTableContentProps {
  consolidatedProps: ConsolidatedTableProps;
}

export function EnhancedItineraryTableContent({ 
  consolidatedProps 
}: EnhancedItineraryTableContentProps) {
  const { data, state, handlers, actions } = consolidatedProps;
  
  return (
    <ItineraryTableContent
      // 🎯 GROUP 1: Core data props
      venueId={data.venueId}
      artistId={data.artistId}
      activeMonthEntries={data.activeMonthEntries}
      processedEntries={data.processedEntries}
      stableMonthTabs={data.stableMonthTabs}
      venueBids={data.venueBids}
      venueOffers={data.venueOffers}
      declinedBids={data.declinedBids}
      tourRequests={data.tourRequests}
      venues={data.venues}
      
      // 🎯 GROUP 2: State and permissions
      editable={state.editable}
      permissions={state.permissions}
      state={state.state}
      venueName={state.venueName}
      
      // 🎯 GROUP 3: Event handlers
      handlers={handlers.handlers}
      toggleShowExpansion={handlers.toggleShowExpansion}
      toggleRequestExpansion={handlers.toggleRequestExpansion}
      handleDeleteShow={handlers.handleDeleteShow}
      getBidStatusBadge={handlers.getBidStatusBadge}
      handleDeleteShowRequest={handlers.handleDeleteShowRequest}
      handleOfferAction={handlers.handleOfferAction}
      handleBidAction={handlers.handleBidAction}
      getEffectiveBidStatus={handlers.getEffectiveBidStatus}
      
      // 🎯 GROUP 4: Action functions
      actions={actions.actions}
    />
  );
} 
/**
 * 🎯 MICRO-PHASE J: Enhanced Modal Container with Consolidated Props
 * 
 * This component replaces the prop-drilling nightmare of ItineraryModalContainer
 * by accepting organized modal groups instead of 25+ individual props.
 * 
 * BEFORE: 25+ individual props scattered across component interface
 * AFTER: 5 organized modal groups with clear responsibilities
 */

import React from 'react';
import { ModalContainer } from './ModalContainer';
import { ConsolidatedModalProps } from '../utils/modalConsolidation';

interface EnhancedItineraryModalContainerProps {
  consolidatedProps: ConsolidatedModalProps;
}

export function EnhancedItineraryModalContainer({ 
  consolidatedProps 
}: EnhancedItineraryModalContainerProps) {
  const { bidModals, showModals, offerModals, formModals, context } = consolidatedProps;
  
  return (
    <ModalContainer
      // 🎯 GROUP 1: Bid-related modals
      showBidForm={bidModals.showBidForm}
      selectedTourRequest={bidModals.selectedTourRequest}
      onBidSuccess={bidModals.onBidSuccess}
      onCloseBidForm={bidModals.onCloseBidForm}
      
      // 🎯 GROUP 2: Show-related modals
      showDetailModal={showModals.showDetailModal}
      selectedShowForDetail={showModals.selectedShowForDetail}
      onCloseShowDetailModal={showModals.onCloseShowDetailModal}
      showDocumentModal={showModals.showDocumentModal}
      selectedDocumentShow={showModals.selectedDocumentShow}
      selectedDocumentBid={showModals.selectedDocumentBid}
      selectedDocumentTourRequest={showModals.selectedDocumentTourRequest}
      onCloseShowDocumentModal={showModals.onCloseShowDocumentModal}
      onDocumentUpdate={showModals.onDocumentUpdate}
      
      // 🎯 GROUP 3: Offer-related modals
      showUniversalOfferModal={offerModals.showUniversalOfferModal}
      offerTargetArtist={offerModals.offerTargetArtist}
      offerPreSelectedDate={offerModals.offerPreSelectedDate}
      offerTourRequest={offerModals.offerTourRequest}
      offerExistingBid={offerModals.offerExistingBid}
      onCloseUniversalOffer={offerModals.onCloseUniversalOffer}
      onUniversalOfferSuccess={offerModals.onUniversalOfferSuccess}
      onDeleteRequestOptimistic={offerModals.onDeleteRequestOptimistic}
      
      // 🎯 GROUP 4: Form-related modals
      showAddDateForm={formModals.showAddDateForm}
      addDateFormType={formModals.addDateFormType}
      addDateLoading={formModals.addDateLoading}
      onCloseAddDateForm={formModals.onCloseAddDateForm}
      onAddDateSuccess={formModals.onAddDateSuccess}
      onSetActiveMonth={formModals.onSetActiveMonth}
      isAddAnotherArtistModalOpen={formModals.isAddAnotherArtistModalOpen}
      addAnotherArtistShowId={formModals.addAnotherArtistShowId}
      addAnotherArtistDate={formModals.addAnotherArtistDate}
      onCloseAddAnotherArtistModal={formModals.onCloseAddAnotherArtistModal}
      onAddAnotherArtistSuccess={formModals.onAddAnotherArtistSuccess}
      
      // 🎯 GROUP 5: Context & shared props
      venueId={context.venueId}
      venueName={context.venueName}
      artistId={context.artistId}
      artistName={context.artistName}
      actualViewerType={context.actualViewerType}
      fetchData={context.fetchData}
      confirm={context.confirm}
      AlertModal={context.AlertModal}
    />
  );
} 
import React from 'react';
import { ModalContainer } from './ModalContainer';

interface ItineraryModalContainerProps {
  // Venue Bid Form Modal
  showBidForm: boolean;
  selectedTourRequest: any;
  venueId?: string;
  venueName?: string;
  onBidSuccess: () => void;
  onCloseBidForm: () => void;
  
  // Show Detail Modal
  showDetailModal: boolean;
  selectedShowForDetail: any;
  onCloseShowDetailModal: () => void;
  
  // Show Document Modal
  showDocumentModal: boolean;
  selectedDocumentShow: any;
  selectedDocumentBid: any;
  selectedDocumentTourRequest: any;
  onCloseShowDocumentModal: () => void;
  onDocumentUpdate: () => void;
  
  // Universal Make Offer Modal
  showUniversalOfferModal: boolean;
  offerTargetArtist: any;
  offerPreSelectedDate?: string;
  offerTourRequest: any;
  offerExistingBid: any;
  onCloseUniversalOffer: () => void;
  onUniversalOfferSuccess: () => void;
  onDeleteRequestOptimistic: (id: string) => void;
  
  // Add Date Form Modal
  showAddDateForm: boolean;
  addDateFormType: 'request' | 'offer';
  artistId?: string;
  artistName?: string;
  addDateLoading: boolean;
  onCloseAddDateForm: () => void;
  onAddDateSuccess: () => void;
  onSetActiveMonth: (month: string) => void;
  confirm: (message: string) => Promise<boolean>;
  
  // Add Artist Modal
  isAddAnotherArtistModalOpen: boolean;
  addAnotherArtistShowId: string;
  addAnotherArtistDate: string;
  onCloseAddAnotherArtistModal: () => void;
  onAddAnotherArtistSuccess: () => void;
  
  // Alert Modal
  AlertModal: React.ComponentType<any>;
  
  // Shared props
  actualViewerType: 'artist' | 'venue' | 'public';
  fetchData: () => void;
}

export function ItineraryModalContainer(props: ItineraryModalContainerProps) {
  return (
    <ModalContainer
      // Venue Bid Form Modal
      showBidForm={props.showBidForm}
      selectedTourRequest={props.selectedTourRequest}
      venueId={props.venueId}
      venueName={props.venueName}
      onBidSuccess={props.onBidSuccess}
      onCloseBidForm={props.onCloseBidForm}
      
      // Show Detail Modal
      showDetailModal={props.showDetailModal}
      selectedShowForDetail={props.selectedShowForDetail}
      onCloseShowDetailModal={props.onCloseShowDetailModal}
      
      // Show Document Modal
      showDocumentModal={props.showDocumentModal}
      selectedDocumentShow={props.selectedDocumentShow}
      selectedDocumentBid={props.selectedDocumentBid}
      selectedDocumentTourRequest={props.selectedDocumentTourRequest}
      onCloseShowDocumentModal={props.onCloseShowDocumentModal}
      onDocumentUpdate={props.onDocumentUpdate}
      
      // Universal Make Offer Modal
      showUniversalOfferModal={props.showUniversalOfferModal}
      offerTargetArtist={props.offerTargetArtist}
      offerPreSelectedDate={props.offerPreSelectedDate}
      offerTourRequest={props.offerTourRequest}
      offerExistingBid={props.offerExistingBid}
      onCloseUniversalOffer={props.onCloseUniversalOffer}
      onUniversalOfferSuccess={props.onUniversalOfferSuccess}
      onDeleteRequestOptimistic={props.onDeleteRequestOptimistic}
      
      // Add Date Form Modal
      showAddDateForm={props.showAddDateForm}
      addDateFormType={props.addDateFormType}
      artistId={props.artistId}
      artistName={props.artistName}
      addDateLoading={props.addDateLoading}
      onCloseAddDateForm={props.onCloseAddDateForm}
      onAddDateSuccess={props.onAddDateSuccess}
      onSetActiveMonth={props.onSetActiveMonth}
      confirm={props.confirm}
      
      // Add Artist Modal
      isAddAnotherArtistModalOpen={props.isAddAnotherArtistModalOpen}
      addAnotherArtistShowId={props.addAnotherArtistShowId}
      addAnotherArtistDate={props.addAnotherArtistDate}
      onCloseAddAnotherArtistModal={props.onCloseAddAnotherArtistModal}
      onAddAnotherArtistSuccess={props.onAddAnotherArtistSuccess}
      
      // Alert Modal
      AlertModal={<props.AlertModal />}
      
      // Shared props
      actualViewerType={props.actualViewerType}
      fetchData={props.fetchData}
    />
  );
} 
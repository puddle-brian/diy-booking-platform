import React from 'react';
import VenueBidForm from './VenueBidForm';
import ShowDetailModal from './ShowDetailModal';
import ShowDocumentModal from './ShowDocumentModal';
import UniversalMakeOfferModal from './UniversalMakeOfferModal';
import { AddDateFormModal } from './forms/AddDateFormModal';
import { AddSupportActModal } from './modals/AddSupportActModal';

interface ModalContainerProps {
  // Venue Bid Form Modal
  showBidForm: boolean;
  selectedTourRequest: any;
  venueId?: string;
  venueName?: string;
  onBidSuccess: (bid: any) => void;
  onCloseBidForm: () => void;

  // Show Detail Modal
  showDetailModal: boolean;
  selectedShowForDetail: any;
  onCloseShowDetailModal: () => void;
  
  // Show Document Modal
  showDocumentModal: boolean;
  selectedDocumentShow?: any;
  selectedDocumentBid?: any;
  selectedDocumentTourRequest?: any;
  onCloseShowDocumentModal: () => void;
  onDocumentUpdate: (data: any) => void;
  
  // Universal Make Offer Modal
  showUniversalOfferModal: boolean;
  offerTargetArtist?: any;
  offerPreSelectedDate?: string;
  offerTourRequest?: any;
  offerExistingBid?: any;
  onCloseUniversalOffer: () => void;
  onUniversalOfferSuccess: (result: any) => void;
  onDeleteRequestOptimistic: (requestId: string) => void;
  
  // Add Date Form Modal
  showAddDateForm: boolean;
  addDateFormType: 'request' | 'offer';
  artistId?: string;
  artistName?: string;
  addDateLoading: boolean;
  onCloseAddDateForm: () => void;
  onAddDateSuccess: () => void;
  onSetActiveMonth: (month: string) => void;
  confirm: any;
  
  // Add Artist Modal
  isAddAnotherArtistModalOpen: boolean;
  addAnotherArtistShowId?: string;
  addAnotherArtistDate?: string;
  onCloseAddAnotherArtistModal: () => void;
  onAddAnotherArtistSuccess: (offer: any) => void;
  
  // Alert Modal
  AlertModal: React.ReactNode;
  
  // Shared props
  actualViewerType: 'artist' | 'venue' | 'public';
  fetchData: () => void;
}

export function ModalContainer({
  // Venue Bid Form Modal
  showBidForm,
  selectedTourRequest,
  venueId,
  venueName,
  onBidSuccess,
  onCloseBidForm,

  // Show Detail Modal
  showDetailModal,
  selectedShowForDetail,
  onCloseShowDetailModal,
  
  // Show Document Modal
  showDocumentModal,
  selectedDocumentShow,
  selectedDocumentBid,
  selectedDocumentTourRequest,
  onCloseShowDocumentModal,
  onDocumentUpdate,
  
  // Universal Make Offer Modal
  showUniversalOfferModal,
  offerTargetArtist,
  offerPreSelectedDate,
  offerTourRequest,
  offerExistingBid,
  onCloseUniversalOffer,
  onUniversalOfferSuccess,
  onDeleteRequestOptimistic,
  
  // Add Date Form Modal
  showAddDateForm,
  addDateFormType,
  artistId,
  artistName,
  addDateLoading,
  onCloseAddDateForm,
  onAddDateSuccess,
  onSetActiveMonth,
  confirm,
  
  // Add Artist Modal
  isAddAnotherArtistModalOpen,
  addAnotherArtistShowId,
  addAnotherArtistDate,
  onCloseAddAnotherArtistModal,
  onAddAnotherArtistSuccess,
  
  // Alert Modal
  AlertModal,
  
  // Shared props
  actualViewerType,
  fetchData
}: ModalContainerProps) {
  return (
    <>
      {/* Venue Bid Form Modal */}
      {showBidForm && selectedTourRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <VenueBidForm
              tourRequest={selectedTourRequest}
              venueId={venueId || 'unknown'}
              venueName={venueName || 'Unknown Venue'}
              onSuccess={onBidSuccess}
              onCancel={onCloseBidForm}
            />
          </div>
        </div>
      )}

      {/* Show Detail Modal */}
      {showDetailModal && selectedShowForDetail && (
        <ShowDetailModal
          show={selectedShowForDetail}
          isOpen={showDetailModal}
          onClose={onCloseShowDetailModal}
          viewerType={actualViewerType}
        />
      )}

      {/* Show Document Modal */}
      {showDocumentModal && (
        <ShowDocumentModal
          show={selectedDocumentShow || undefined}
          bid={selectedDocumentBid || undefined}
          tourRequest={selectedDocumentTourRequest || undefined}
          isOpen={showDocumentModal}
          onClose={onCloseShowDocumentModal}
          viewerType={actualViewerType}
          onUpdate={(data) => {
            console.log('Document updated:', data);
            onDocumentUpdate(data);
          }}
        />
      )}

      {/* Universal Make Offer Modal */}
      {showUniversalOfferModal && (
        <UniversalMakeOfferModal
          isOpen={showUniversalOfferModal}
          onClose={onCloseUniversalOffer}
          onSuccess={(result) => {
            console.log('Offer/dismissal result:', result);
            
            // Handle dismissal by removing from local state
            if (result.dismissed && result.requestId) {
              onDeleteRequestOptimistic(result.requestId);
            }
            
            onUniversalOfferSuccess(result);
          }}
          preSelectedArtist={offerTargetArtist || undefined}
          preSelectedDate={offerPreSelectedDate || undefined}
          tourRequest={offerTourRequest || undefined}
          existingBid={offerExistingBid || undefined}
        />
      )}

      {/* Add Date Form Modal */}
      <AddDateFormModal
        isOpen={showAddDateForm}
        onClose={onCloseAddDateForm}
        formType={addDateFormType}
        artistId={artistId}
        artistName={artistName}
        venueId={venueId}
        venueName={venueName}
        loading={addDateLoading}
        onSuccess={onAddDateSuccess}
        onSetActiveMonth={onSetActiveMonth}
        confirm={confirm}
      />

      {/* Add Artist Modal */}
      <AddSupportActModal
        isOpen={isAddAnotherArtistModalOpen}
        onClose={onCloseAddAnotherArtistModal}
        showId={addAnotherArtistShowId || ''}
        showDate={addAnotherArtistDate || ''}
        venueName={venueName || 'Unknown Venue'}
        venueId={venueId || ''}
        onSuccess={onAddAnotherArtistSuccess}
      />

      {/* Render the Alert Modal */}
      {AlertModal}
    </>
  );
} 
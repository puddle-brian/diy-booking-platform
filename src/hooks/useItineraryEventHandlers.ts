import { VenueBid, VenueOffer } from '../../types';

interface UseItineraryEventHandlersProps {
  artistId?: string;
  venueId?: string;
  venueName?: string;
  fetchData: () => void;
  actions: any;
  showSuccess: (title: string, message: string) => void;
  showError: (message: string) => void;
  confirm: (message: string) => Promise<boolean>;
}

export function useItineraryEventHandlers({
  artistId,
  venueId,
  venueName,
  fetchData,
  actions,
  showSuccess,
  showError,
  confirm
}: UseItineraryEventHandlersProps) {

  const shouldShowOfferButton = (request: any & { isVenueInitiated?: boolean }) => {
    if (!venueId) return false;
    if (request.isVenueInitiated) return false;
    return request.status === 'OPEN' || request.status === 'open';
  };

  const toggleBidExpansion = (requestId: string) => {
    actions.toggleBidExpansion(requestId);
  };

  const toggleShowExpansion = (showId: string) => {
    actions.toggleShowExpansion(showId);
  };

  const toggleRequestExpansion = (requestId: string) => {
    actions.toggleRequestExpansion(requestId);
  };

  const handleBidSuccess = (bid: any) => {
    console.log('Bid placed successfully:', bid);
    actions.closeBidForm();
    fetchData();
  };

  const handlePlaceBid = (tourRequest: any) => {
    actions.openBidForm(tourRequest);
  };

  const handleDeleteShow = async (showId: string, showName: string) => {
    const confirmed = await confirm(`Are you sure you want to delete "${showName}"? This action cannot be undone.`);
    if (!confirmed) return;

    actions.setDeleteLoading(showId);
    try {
      const response = await fetch(`/api/shows/${showId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete show');
      }

      // Remove from local state immediately for better UX
      actions.deleteShowOptimistic(showId);
      
      // Then refresh to ensure consistency
      fetchData();
      
      showSuccess('Show Deleted', `"${showName}" has been successfully deleted.`);
    } catch (error) {
      console.error('Failed to delete show:', error);
      showError('Failed to delete show. Please try again.');
    } finally {
      actions.setDeleteLoading(null);
    }
  };

  const checkDateConflict = (proposedDate: string, excludeBidId?: string, excludeOfferId?: string) => {
    // Implementation would go here - this is a placeholder
    return false;
  };

  const getEffectiveBidStatus = (bid: VenueBid) => {
    if ((bid as any).holdState === 'HELD') return 'held';
    return bid.status;
  };

  const handleBidAction = async (bid: VenueBid, action: string, reason?: string) => {
    try {
      const response = await fetch(`/api/venue-bids/${bid.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} bid`);
      }

      fetchData();
      showSuccess(`Bid ${action}ed`, `The bid has been ${action}ed successfully.`);
    } catch (error) {
      console.error(`Failed to ${action} bid:`, error);
      showError(`Failed to ${action} bid. Please try again.`);
    }
  };

  const handleOfferAction = async (offer: VenueOffer, action: string) => {
    try {
      const response = await fetch(`/api/venue-offers/${offer.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} offer`);
      }

      fetchData();
      showSuccess(`Offer ${action}ed`, `The offer has been ${action}ed successfully.`);
    } catch (error) {
      console.error(`Failed to ${action} offer:`, error);
      showError(`Failed to ${action} offer. Please try again.`);
    }
  };

  const getBidStatusBadge = (bid: VenueBid) => {
    return getEffectiveBidStatus(bid);
  };

  const handleTemplateApply = (template: any) => {
    console.log('Applying template:', template);
    // Template application logic would go here
  };

  const handleDeleteShowRequest = async (requestId: string, requestName: string) => {
    const confirmed = await confirm(`Are you sure you want to delete "${requestName}"? This action cannot be undone.`);
    if (!confirmed) return;

    actions.setDeleteLoading(requestId);
    try {
      const response = await fetch(`/api/show-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete show request');
      }

      // Remove from local state immediately for better UX
      actions.deleteRequestOptimistic(requestId);
      
      // Then refresh to ensure consistency
      fetchData();
      
      showSuccess('Show Request Deleted', `"${requestName}" has been successfully deleted.`);
    } catch (error) {
      console.error('Failed to delete show request:', error);
      showError('Failed to delete show request. Please try again.');
    } finally {
      actions.setDeleteLoading(null);
    }
  };

  const handleAddAnotherArtistSuccess = (offer: any) => {
    console.log('Artist offer sent:', offer);
    fetchData();
    showSuccess('Artist Offer Sent', 'Your offer has been sent to the artist and will appear in their itinerary.');
  };

  return {
    shouldShowOfferButton,
    toggleBidExpansion,
    toggleShowExpansion,
    toggleRequestExpansion,
    handleBidSuccess,
    handlePlaceBid,
    handleDeleteShow,
    checkDateConflict,
    getEffectiveBidStatus,
    handleBidAction,
    handleOfferAction,
    getBidStatusBadge,
    handleTemplateApply,
    handleDeleteShowRequest,
    handleAddAnotherArtistSuccess
  };
} 
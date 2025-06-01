import React, { useState } from 'react';
import OfferFormCore from './OfferFormCore';

interface Artist {
  id: string;
  name: string;
  genres: string[];
  city: string;
  state: string;
  country: string;
}

interface VenueOfferFormProps {
  venueId: string;
  venueName: string;
  onSuccess: (offer: any) => void;
  onCancel: () => void;
  // Optional pre-selected artist (when opened from artist page)
  preSelectedArtist?: {
    id: string;
    name: string;
  };
}

// Helper function to convert parsed offer to legacy format
function parsedOfferToLegacyFormat(offerData: any) {
  if (!offerData) {
    return { amount: null, doorDeal: null };
  }

  // Handle different offer types from OfferInput
  if (offerData.type === 'guarantee') {
    return {
      amount: offerData.amount,
      doorDeal: null
    };
  } else if (offerData.type === 'door') {
    return {
      amount: null,
      doorDeal: {
        split: offerData.split,
        minimumGuarantee: offerData.minimumGuarantee || 0
      }
    };
  } else if (offerData.type === 'mixed') {
    return {
      amount: offerData.guarantee,
      doorDeal: {
        split: offerData.split,
        minimumGuarantee: offerData.guarantee || 0
      }
    };
  }

  return { amount: null, doorDeal: null };
}

export default function VenueOfferForm({ 
  venueId, 
  venueName, 
  onSuccess, 
  onCancel,
  preSelectedArtist
}: VenueOfferFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError('');

    try {
      // Convert parsed offer to legacy format
      const legacyOffer = parsedOfferToLegacyFormat(formData.offerData);
      
      const response = await fetch(`/api/venues/${venueId}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId: formData.artistId,
          title: `${formData.artistName} - ${new Date(formData.proposedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${venueName}`,
          proposedDate: formData.proposedDate,
          amount: legacyOffer.amount,
          doorDeal: legacyOffer.doorDeal,
          capacity: formData.capacity,
          ageRestriction: formData.ageRestriction,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create offer');
      }

      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OfferFormCore
      venueId={venueId}
      venueName={venueName}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      loading={loading}
      error={error}
      preSelectedArtist={preSelectedArtist}
      title="Make Offer to Artist"
      subtitle={`Invite a specific artist to play at ${venueName}`}
      submitButtonText="Send Offer"
      showCapacityField={true}
    />
  );
} 
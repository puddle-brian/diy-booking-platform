import React, { useState } from 'react';
import OfferFormCore from './OfferFormCore';
import { parsedOfferToLegacyFormat } from './OfferInput';

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
  // 🎯 UX IMPROVEMENT: Global alert system integration
  confirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export default function VenueOfferForm({ 
  venueId, 
  venueName, 
  onSuccess, 
  onCancel,
  preSelectedArtist,
  confirm
}: VenueOfferFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError('');

    try {
      // Convert parsed offer to legacy format
      const legacyOffer = parsedOfferToLegacyFormat(formData.offerData);
      
      // 🎯 UNIFIED SYSTEM: Use new ShowRequest endpoint instead of old VenueOffer endpoint
      const response = await fetch('/api/show-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId: formData.artistId,
          venueId: venueId,
          title: `${formData.artistName} - ${new Date(formData.proposedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${venueName}`,
          requestedDate: formData.proposedDate,
          initiatedBy: 'VENUE',
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
      confirm={confirm}
    />
  );
} 
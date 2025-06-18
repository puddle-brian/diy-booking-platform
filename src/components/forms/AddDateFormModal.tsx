import React from 'react';
import OfferFormCore from '../OfferFormCore';
import UnifiedShowRequestForm from '../UnifiedShowRequestForm';
import { parsedOfferToLegacyFormat } from '../OfferInput';
import { getMonthKeyFromDate } from '../../utils/timelineUtils';

interface AddDateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formType: 'offer' | 'request' | 'confirmed';
  artistId?: string;
  artistName?: string;
  venueId?: string;
  venueName?: string;
  loading?: boolean;
  onSuccess: () => void;
  onSetActiveMonth: (monthKey: string) => void;
  confirm: any;
}

export function AddDateFormModal({
  isOpen,
  onClose,
  formType,
  artistId,
  artistName,
  venueId,
  venueName,
  loading,
  onSuccess,
  onSetActiveMonth,
  confirm
}: AddDateFormModalProps) {
  if (!isOpen) return null;

  const handleFormSubmit = async (formData: any) => {
    try {
      if (formType === 'offer' && venueId && venueName) {
        // Handle venue offers
        const legacyOffer = parsedOfferToLegacyFormat(formData.offerData);
        const [year, month, day] = formData.proposedDate.split('-').map(Number);
        const dateForTitle = new Date(year, month - 1, day);
        
        const requestBody: any = {
          artistId: formData.artistId,
          venueId: venueId,
          title: `${formData.artistName} - ${dateForTitle.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${venueName}`,
          requestedDate: formData.proposedDate,
          initiatedBy: 'VENUE',
          capacity: formData.capacity,
          ageRestriction: formData.ageRestriction,
          message: formData.message.trim() || `Hey! We'd love to have you play at ${venueName}. We think you'd be a great fit for our space and audience. Let us know if you're interested!`,
        };

        if (legacyOffer.amount !== null && legacyOffer.amount !== undefined) {
          requestBody.amount = legacyOffer.amount;
        }
        if (legacyOffer.doorDeal !== null && legacyOffer.doorDeal !== undefined) {
          requestBody.doorDeal = legacyOffer.doorDeal;
        }
        
        const response = await fetch('/api/show-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create offer');
        }
        
        onClose();
        onSuccess();
        
        // Auto-focus on the month with the new content
        const targetMonth = getMonthKeyFromDate(formData.proposedDate);
        onSetActiveMonth(targetMonth);
        
      } else if (formType === 'confirmed') {
        // Handle confirmed shows
        let showTitle = formData.title.trim();
        if (!showTitle) {
          if (artistId && formData.venueName) {
            showTitle = `${artistName} at ${formData.venueName}`;
          } else if (venueId && formData.artistName) {
            showTitle = `${formData.artistName} at ${venueName}`;
          } else {
            showTitle = `Show on ${new Date(formData.date).toLocaleDateString()}`;
          }
        }

        const showData = {
          date: formData.date,
          title: showTitle,
          notes: formData.description?.trim() || undefined,
          status: 'confirmed',
          createdBy: artistId ? 'artist' : 'venue',
          guarantee: formData.guarantee ? parseInt(formData.guarantee) : undefined,
          ageRestriction: formData.ageRestriction,
          doorsOpen: formData.doorsOpen || undefined,
          showTime: formData.showTime || undefined,
        };

        if (artistId) {
          if (!formData.venueName?.trim()) {
            throw new Error('Please enter a venue name.');
          }
          
          Object.assign(showData, {
            artistId: artistId,
            artistName: artistName,
            venueId: formData.venueId || 'external-venue',
            venueName: formData.venueName.trim(),
            city: formData.location.split(',')[0]?.trim() || formData.venueName.split(',')[0]?.trim() || 'Unknown',
            state: formData.location.split(',')[1]?.trim() || formData.venueName.split(',')[1]?.trim() || 'Unknown'
          });
        } else if (venueId) {
          if (!formData.artistName?.trim()) {
            throw new Error('Please enter an artist name.');
          }
          
          Object.assign(showData, {
            artistId: formData.artistId || 'external-artist',
            artistName: formData.artistName.trim(),
            venueId: venueId,
            venueName: venueName,
            city: formData.location.split(',')[0]?.trim() || 'Unknown',
            state: formData.location.split(',')[1]?.trim() || 'Unknown'
          });
        }

        const response = await fetch('/api/shows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(showData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create show');
        }
        
        onClose();
        onSuccess();
        
        // Auto-focus on the month with the new content
        const targetMonth = getMonthKeyFromDate(formData.date);
        onSetActiveMonth(targetMonth);
        
      } else if (formType === 'request') {
        // Handle show requests
        const title = formData.title.trim() || `${artistName} Show Request`;

        const showRequestData: any = {
          artistId: artistId,
          title: title,
          description: formData.description,
          requestedDate: formData.requestDate,
          initiatedBy: 'ARTIST',
          targetLocations: [formData.location],
          genres: []
        };

        const response = await fetch('/api/show-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(showRequestData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create show request');
        }
        
        onClose();
        onSuccess();
        
        // Auto-focus on the month with the new content
        const targetMonth = getMonthKeyFromDate(formData.requestDate);
        onSetActiveMonth(targetMonth);
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      throw error; // Re-throw so the form can handle it
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      {formType === 'offer' && venueId && venueName ? (
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <OfferFormCore
            venueId={venueId}
            venueName={venueName}
            onSubmit={handleFormSubmit}
            onCancel={onClose}
            confirm={confirm}
            title="Make Offer to Artist"
            subtitle="Invite a specific artist to play at your venue on this date"
            submitButtonText="Send Offer"
          />
        </div>
      ) : (
        <UnifiedShowRequestForm
          formType={formType}
          artistId={artistId}
          artistName={artistName}
          venueId={venueId}
          venueName={venueName}
          onSubmit={handleFormSubmit}
          onCancel={onClose}
          loading={loading}
        />
      )}
    </div>
  );
} 
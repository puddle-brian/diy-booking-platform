import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UnifiedShowRequestForm from './UnifiedShowRequestForm';

interface RequestShowButtonProps {
  targetVenue: {
    id: string;
    name: string;
  };
  preSelectedDate?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'inline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
  onSuccess?: (request: any) => void;
}

export default function RequestShowButton({
  targetVenue,
  preSelectedDate,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  onSuccess
}: RequestShowButtonProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current user's artist information from memberships
  const getUserArtistInfo = () => {
    if (!user?.memberships) {
      return { artistId: null, artistName: null };
    }
    
    // Find first artist membership
    const artistMembership = user.memberships.find(m => m.entityType === 'artist');
    
    return {
      artistId: artistMembership?.entityId || null,
      artistName: artistMembership?.entityName || null
    };
  };

  const { artistId, artistName } = getUserArtistInfo();

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center border rounded-lg font-medium transition-colors duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    // Size classes - Match MessageButton exactly
    const sizeClasses = {
      xs: 'px-3 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    // Variant classes - Match MessageButton styling
    const variantClasses = {
      primary: 'bg-green-600 text-white hover:bg-green-700 border-green-600 focus:ring-green-500',
      secondary: 'text-green-600 bg-green-100 hover:bg-green-200 border-green-100 focus:ring-green-500',
      outline: 'bg-white text-green-600 hover:bg-green-50 border-green-600 focus:ring-green-500 whitespace-nowrap',
      inline: 'text-white bg-green-600 hover:bg-green-700 border border-transparent whitespace-nowrap focus:ring-green-500'
    };
    
    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);

    try {
      if (!artistId || !artistName) {
        throw new Error('You must be a member of an artist to request shows. Please join or create an artist profile first.');
      }

      const title = formData.title.trim() || `${artistName} Show Request`;

      const showRequestData = {
        artistId: artistId,
        title: title,
        description: formData.description,
        requestedDate: formData.requestDate,
        initiatedBy: 'ARTIST',
        targetLocations: [formData.location], // This handles both venue:id:name and regular locations
        genres: []
      };

      const response = await fetch('/api/show-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(showRequestData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Show request submitted successfully:', result);
        
        // Close the modal
        setShowModal(false);
        
        // Trigger success callback to refresh data
        if (onSuccess) {
          onSuccess(result);
        }
        
        // Force page refresh to update the venue's itinerary
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit show request');
      }
    } catch (err) {
      console.error('Error submitting show request:', err);
      setError('Failed to submit show request');
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if user doesn't have artist membership
  if (!artistId || !artistName) {
    return null;
  }

  const defaultContent = targetVenue ? `Request Show at ${targetVenue.name}` : 'Request Show';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={getButtonClasses()}
      >
        {children || defaultContent}
      </button>

      {/* Unified Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <UnifiedShowRequestForm
            formType="request"
            preSelectedVenue={targetVenue}
            preSelectedDate={preSelectedDate}
            artistId={artistId}
            artistName={artistName}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
            loading={loading}
          />
        </div>
      )}
    </>
  );
} 
import React, { useState } from 'react';
import UniversalMakeOfferModal from './UniversalMakeOfferModal';

interface MakeOfferButtonProps {
  // Optional pre-selected artist
  targetArtist?: {
    id: string;
    name: string;
  };
  // Button styling options
  variant?: 'primary' | 'secondary' | 'inline' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
  onSuccess?: (offer: any) => void;
}

export default function MakeOfferButton({
  targetArtist,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  onSuccess
}: MakeOfferButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center border rounded-lg font-medium transition-colors duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    // Size classes - Match MessageButton exactly
    const sizeClasses = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    // Variant classes - Match MessageButton styling
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 focus:ring-blue-500',
      secondary: 'text-blue-600 bg-blue-100 hover:bg-blue-200 border-blue-100 focus:ring-blue-500',
      outline: 'bg-white text-blue-600 hover:bg-blue-50 border-blue-600 focus:ring-blue-500 whitespace-nowrap',
      inline: 'text-white bg-blue-600 hover:bg-blue-700 border border-transparent whitespace-nowrap focus:ring-blue-500'
    };
    
    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  const defaultContent = targetArtist ? `Make Offer to ${targetArtist.name}` : 'Make Offer';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={getButtonClasses()}
      >
        {children || defaultContent}
      </button>

      <UniversalMakeOfferModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(offer) => {
          setShowModal(false);
          if (onSuccess) {
            onSuccess(offer);
          }
        }}
        preSelectedArtist={targetArtist}
      />
    </>
  );
} 
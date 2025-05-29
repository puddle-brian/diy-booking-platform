'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InlineMessagePanel from './InlineMessagePanel';

interface MessageButtonProps {
  recipientId: string;
  recipientName: string;
  recipientType: 'artist' | 'venue' | 'user';
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  onMessagesRead?: () => void;
  context?: {
    fromPage: string;
    entityName: string;
    entityType: string;
  };
  // Optional: if parent component already knows ownership status
  isOwnEntity?: boolean;
}

export default function MessageButton({
  recipientId,
  recipientName,
  recipientType,
  className = '',
  variant = 'primary',
  size = 'md',
  children,
  onMessagesRead,
  context,
  isOwnEntity: propIsOwnEntity
}: MessageButtonProps) {
  const { user } = useAuth();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOwnEntity, setIsOwnEntity] = useState(propIsOwnEntity || false);
  const [checkingOwnership, setCheckingOwnership] = useState(propIsOwnEntity === undefined);

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600';
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600';
      case 'outline':
        return 'bg-white text-blue-600 hover:bg-blue-50 border-blue-600';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  // Check if user is trying to message their own entity (only if not provided as prop)
  useEffect(() => {
    if (propIsOwnEntity !== undefined) {
      setIsOwnEntity(propIsOwnEntity);
      setCheckingOwnership(false);
      return;
    }

    const checkOwnership = async () => {
      if (!user || recipientType === 'user') {
        setCheckingOwnership(false);
        return;
      }

      try {
        // For artist/venue types, check if the current user owns this entity
        const endpoint = recipientType === 'artist' ? 'artists' : 'venues';
        const response = await fetch(`/api/${endpoint}/${recipientId}`);
        
        if (response.ok) {
          const entityData = await response.json();
          // Check if the current user is the owner (submittedById)
          const isOwner = entityData.submittedById === user.id;
          setIsOwnEntity(isOwner);
        }
      } catch (error) {
        console.error('Error checking entity ownership:', error);
      } finally {
        setCheckingOwnership(false);
      }
    };

    checkOwnership();
  }, [user, recipientId, recipientType, propIsOwnEntity]);

  // Don't render the button if user is trying to message their own entity
  if (checkingOwnership) {
    // Show a placeholder while checking
    return (
      <div className={`inline-flex items-center justify-center border rounded-lg font-medium transition-colors duration-200 ${getSizeClasses()} bg-gray-100 text-gray-400 border-gray-300`}>
        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Loading...
      </div>
    );
  }

  if (isOwnEntity) {
    // Don't show message button for own entities
    return null;
  }

  // Debug: Log user state when component renders
  console.log('🔐 MessageButton: User state:', user ? { id: user.id, name: user.name } : 'No user');

  const handleClick = async () => {
    if (!user) {
      // Redirect to login or show login modal
      alert('Please log in to send messages');
      return;
    }

    console.log('🔐 User authenticated:', { id: user.id, name: user.name, email: user.email });
    
    // Open the inline messaging panel
    setIsPanelOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center
          border rounded-lg font-medium
          transition-colors duration-200
          hover:shadow-md
          ${getVariantClasses()}
          ${getSizeClasses()}
          ${className}
        `}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {children || 'Message'}
      </button>

      {/* Inline Message Panel */}
      <InlineMessagePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        recipientId={recipientId}
        recipientName={recipientName}
        recipientType={recipientType}
        onMessagesRead={onMessagesRead}
        context={context}
      />
    </>
  );
} 
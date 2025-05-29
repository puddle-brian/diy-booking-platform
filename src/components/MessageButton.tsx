'use client';

import { useState } from 'react';
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
  context
}: MessageButtonProps) {
  const { user } = useAuth();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
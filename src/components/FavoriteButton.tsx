'use client';

import { useState } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';

interface FavoriteButtonProps {
  entityType: 'VENUE' | 'ARTIST';
  entityId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function FavoriteButton({ 
  entityType, 
  entityId, 
  className = '',
  size = 'md'
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert('Please log in to save favorites');
      return;
    }

    setIsLoading(true);
    try {
      await toggleFavorite(entityType, entityId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const favorited = isFavorited(entityId);
  
  // Terminal-style size configurations
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 text-sm',
    lg: 'w-8 h-8 text-base'
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        bg-bg-secondary/90 border border-border-subtle
        hover:border-border-default hover:bg-bg-tertiary
        transition-all duration-100
        flex items-center justify-center
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isLoading ? (
        <span className="animate-pulse">○</span>
      ) : (
        <span className={`transition-colors duration-100 ${
          favorited 
            ? 'text-status-error' 
            : 'text-text-muted hover:text-status-error'
        }`}>
          {favorited ? '♥' : '♡'}
        </span>
      )}
    </button>
  );
}

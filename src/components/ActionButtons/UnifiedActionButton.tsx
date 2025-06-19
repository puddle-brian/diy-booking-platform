import React from 'react';

export type ActionButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
export type ActionButtonSize = 'sm' | 'md';

interface UnifiedActionButtonProps {
  variant: ActionButtonVariant;
  size: ActionButtonSize;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  className?: string;
}

/**
 * Unified action button system for consistent styling and behavior
 */
export function UnifiedActionButton({
  variant,
  size,
  children,
  onClick,
  disabled = false,
  loading = false,
  title,
  className = ''
}: UnifiedActionButtonProps) {
  
  const getVariantStyles = (variant: ActionButtonVariant) => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
    };
    
    return variants[variant];
  };
  
  const getSizeStyles = (size: ActionButtonSize) => {
    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm'
    };
    
    return sizes[size];
  };
  
  const baseClasses = "inline-flex items-center justify-center rounded font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses = getVariantStyles(variant);
  const sizeClasses = getSizeStyles(size);
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && !loading) {
      onClick();
    }
  };
  
  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      title={title}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Common button configurations for timeline actions
 */
export const timelineButtonConfigs = {
  accept: {
    variant: 'success' as ActionButtonVariant,
    size: 'sm' as ActionButtonSize,
    title: 'Accept',
    children: '✓'
  },
  decline: {
    variant: 'danger' as ActionButtonVariant,
    size: 'sm' as ActionButtonSize,
    title: 'Decline',
    children: '✕'
  },
  delete: {
    variant: 'danger' as ActionButtonVariant,
    size: 'sm' as ActionButtonSize,
    title: 'Delete',
    children: '×'
  },
  edit: {
    variant: 'secondary' as ActionButtonVariant,
    size: 'sm' as ActionButtonSize,
    title: 'Edit',
    children: '✎'
  },
  hold: {
    variant: 'primary' as ActionButtonVariant,
    size: 'sm' as ActionButtonSize,
    title: 'Place Hold',
    children: '🔒'
  },
  release: {
    variant: 'primary' as ActionButtonVariant,
    size: 'sm' as ActionButtonSize,
    title: 'Release Hold',
    children: '🔓'
  }
}; 
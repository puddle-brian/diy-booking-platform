import React from 'react';

export type StatusType = 
  | 'confirmed' 
  | 'pending' 
  | 'declined' 
  | 'accepted' 
  | 'open' 
  | 'cancelled'
  | 'hold'
  | 'frozen';

interface StatusBadgeProps {
  status: StatusType;
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * Universal status badge component with consistent styling
 * Maintains semantic color meaning while ensuring visual consistency
 */
export function StatusBadge({ 
  status, 
  variant = 'default', 
  className = '' 
}: StatusBadgeProps) {
  
  const getStatusConfig = (status: StatusType) => {
    const configs = {
      confirmed: {
        className: 'bg-green-100 text-green-800 border-green-300',
        text: 'Confirmed'
      },
      accepted: {
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        text: 'Accepted'
      },
      pending: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        text: 'Pending'
      },
      open: {
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        text: 'Open'
      },
      declined: {
        className: 'bg-red-100 text-red-800 border-red-300',
        text: 'Declined'
      },
      cancelled: {
        className: 'bg-gray-100 text-gray-800 border-gray-300',
        text: 'Cancelled'
      },
      hold: {
        className: 'bg-violet-100 text-violet-800 border-violet-300',
        text: 'On Hold'
      },
      frozen: {
        className: 'bg-slate-100 text-slate-800 border-slate-300',
        text: 'Frozen'
      }
    };
    
    return configs[status] || configs.pending;
  };
  
  const statusConfig = getStatusConfig(status);
  
  const sizeClasses = {
    default: 'px-2 py-1 text-xs',
    compact: 'px-1.5 py-0.5 text-xs'
  };
  
  const baseClasses = "inline-flex items-center font-medium rounded-full border";
  const sizeClass = sizeClasses[variant];
  
  return (
    <span className={`${baseClasses} ${sizeClass} ${statusConfig.className} ${className}`}>
      {statusConfig.text}
    </span>
  );
} 
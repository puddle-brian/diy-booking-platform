import React from 'react';

export type StatusType = 
  | 'confirmed' 
  | 'pending' 
  | 'declined' 
  | 'accepted' 
  | 'open' 
  | 'cancelled'
  | 'hold'
  | 'frozen'
  | 'expired';

interface StatusBadgeProps {
  status?: StatusType;
  type?: StatusType;
  text?: string;
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * Terminal-style status badge component
 * Uses Gibson Swarm status colors for semantic meaning
 */
export function StatusBadge({ 
  status,
  type,
  text,
  variant = 'default', 
  className = '' 
}: StatusBadgeProps) {
  
  // Support both 'status' and 'type' props for backwards compatibility
  const statusValue = status || type || 'pending';
  
  const getStatusConfig = (s: StatusType) => {
    const configs: Record<StatusType, { color: string; text: string; dotColor: string }> = {
      confirmed: {
        color: 'text-status-active border-status-active/30',
        text: 'CONFIRMED',
        dotColor: 'bg-status-active'
      },
      accepted: {
        color: 'text-status-active border-status-active/30',
        text: 'ACCEPTED',
        dotColor: 'bg-status-active'
      },
      pending: {
        color: 'text-status-warning border-status-warning/30',
        text: 'PENDING',
        dotColor: 'bg-status-warning'
      },
      open: {
        color: 'text-status-info border-status-info/30',
        text: 'OPEN',
        dotColor: 'bg-status-info'
      },
      declined: {
        color: 'text-status-error border-status-error/30',
        text: 'DECLINED',
        dotColor: 'bg-status-error'
      },
      cancelled: {
        color: 'text-text-muted border-border-subtle',
        text: 'CANCELLED',
        dotColor: 'bg-text-muted'
      },
      hold: {
        color: 'text-status-info border-status-info/30',
        text: 'ON HOLD',
        dotColor: 'bg-status-info'
      },
      frozen: {
        color: 'text-text-secondary border-border-default',
        text: 'FROZEN',
        dotColor: 'bg-text-secondary'
      },
      expired: {
        color: 'text-text-muted border-border-subtle',
        text: 'EXPIRED',
        dotColor: 'bg-text-muted'
      }
    };
    
    return configs[s] || configs.pending;
  };
  
  const statusConfig = getStatusConfig(statusValue);
  const displayText = text || statusConfig.text;
  
  const sizeClasses = {
    default: 'px-2 py-1 text-2xs',
    compact: 'px-1.5 py-0.5 text-2xs'
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1.5
      uppercase tracking-wider font-medium
      bg-bg-tertiary border
      ${sizeClasses[variant]}
      ${statusConfig.color}
      ${className}
    `}>
      <span className={`w-1.5 h-1.5 ${statusConfig.dotColor}`}></span>
      {displayText}
    </span>
  );
}

// Default export for backwards compatibility
export default StatusBadge;

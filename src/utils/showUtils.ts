// Show utilities for the new lineup-first architecture
// This replaces the legacy "headliner + support acts" pattern

// Use the lineup item structure from the existing Show interface
export interface LineupItem {
  artistId: string;
  artistName: string;
  billingPosition: 'HEADLINER' | 'CO_HEADLINER' | 'SUPPORT' | 'OPENER' | 'LOCAL_SUPPORT';
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  performanceOrder: number;
  setLength?: number;
  guarantee?: number;
}

// Legacy title generation functions removed - now using unified system in showNaming.ts

/**
 * Calculate aggregate status from all lineup items
 * This replaces the legacy Show.status approach
 * 
 * IMPORTANT: For confirmed shows (shows that exist in the database), 
 * the show itself is confirmed even if individual lineup items are pending.
 * This function should be used with context about whether the show is confirmed.
 */
export function getAggregateStatus(lineup: LineupItem[], isConfirmedShow: boolean = true): {
  status: 'CONFIRMED' | 'PARTIAL' | 'PENDING' | 'CANCELLED';
  description: string;
} {
  if (!lineup?.length) {
    return { status: isConfirmedShow ? 'CONFIRMED' : 'PENDING', description: isConfirmedShow ? 'No lineup yet' : 'No artists' };
  }
  
  const confirmedCount = lineup.filter(item => item.status === 'CONFIRMED').length;
  const pendingCount = lineup.filter(item => item.status === 'PENDING').length;
  const cancelledCount = lineup.filter(item => item.status === 'CANCELLED').length;
  const totalCount = lineup.length;
  
  // All cancelled
  if (cancelledCount === totalCount) {
    return { status: 'CANCELLED', description: 'All cancelled' };
  }
  
  // For confirmed shows, treat pending lineup items as "being finalized" rather than "pending show"
  if (isConfirmedShow) {
    // All confirmed
    if (confirmedCount === totalCount) {
      return { status: 'CONFIRMED', description: 'Confirmed' };
    }
    
    // Mix of confirmed and pending - show is confirmed, just finalizing lineup
    if (confirmedCount > 0 && pendingCount > 0) {
      return { status: 'PARTIAL', description: `${confirmedCount}/${totalCount} confirmed` };
    }
    
    // All pending but show is confirmed - lineup being finalized
    if (pendingCount === totalCount) {
      return { status: 'PARTIAL', description: `${confirmedCount}/${totalCount} confirmed` };
    }
    
    // Mixed with cancellations
    const activeCount = confirmedCount + pendingCount;
    return { status: 'PARTIAL', description: `${confirmedCount}/${activeCount} confirmed` };
  }
  
  // For unconfirmed shows (show requests), use original logic
  // All confirmed
  if (confirmedCount === totalCount) {
    return { status: 'CONFIRMED', description: 'All confirmed' };
  }
  
  // Mix of confirmed and pending
  if (confirmedCount > 0 && pendingCount > 0) {
    return { status: 'PARTIAL', description: `${confirmedCount}/${totalCount} confirmed` };
  }
  
  // All pending
  if (pendingCount === totalCount) {
    return { status: 'PENDING', description: 'All pending' };
  }
  
  // Mixed with cancellations
  const activeCount = confirmedCount + pendingCount;
  return { status: 'PARTIAL', description: `${confirmedCount}/${activeCount} confirmed` };
}

/**
 * Get status badge styling for show-level status
 */
export function getAggregateStatusBadge(lineup: LineupItem[], isConfirmedShow: boolean = true) {
  const { status, description } = getAggregateStatus(lineup, isConfirmedShow);
  
  switch (status) {
    case 'CONFIRMED':
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
        text: 'Confirmed'
      };
    case 'PARTIAL':
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
        text: description.replace(' confirmed', '')
      };
    case 'PENDING':
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
        text: 'Pending'
      };
    case 'CANCELLED':
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800',
        text: 'Cancelled'
      };
    default:
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
        text: 'Unknown'
      };
  }
}

/**
 * Get status badge styling for individual lineup items
 */
export function getLineupItemStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
        text: 'Confirmed'
      };
    case 'pending':
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
        text: 'Pending'
      };
    case 'cancelled':
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800',
        text: 'Cancelled'
      };
    default:
      return {
        className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
        text: status || 'Unknown'
      };
  }
}

/**
 * Get billing position badge for lineup items
 */
export function getBillingPositionBadge(billingPosition: string) {
  const abbreviations: Record<string, string> = {
    'HEADLINER': 'HL',
    'CO_HEADLINER': 'CH',
    'SUPPORT': 'SP',
    'OPENER': 'OP',
    'LOCAL_SUPPORT': 'LS'
  };

  const abbr = abbreviations[billingPosition] || billingPosition.slice(0, 2);
  
  // Use consistent blue styling for billing positions
  return {
    className: 'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300 ml-2 flex-shrink-0',
    text: abbr
  };
} 
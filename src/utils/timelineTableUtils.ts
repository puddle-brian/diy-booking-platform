// Phase 2: Extract common logic that's duplicated between timeline systems
// This utilities file will be used by both ShowTimelineItem and ShowRequestProcessor eventually

import { TimelineTableStructure, TimelineRowVariant } from '../types/timelineCommon';

/**
 * Extract the table structure logic that's duplicated between timeline systems
 * Based on whether we're on a venue page (venueId exists) or not
 */
export function getTimelineTableStructure(venueId?: string): TimelineTableStructure {
  const hasLocationColumn = !venueId;
  
  return {
    hasLocationColumn,
    mainColumnWidth: venueId ? 'w-[26%]' : 'w-[19%]',
    columns: {
      expansion: 'w-[3%]',
      date: 'w-[12%]',
      location: hasLocationColumn ? 'w-[14%]' : undefined,
      main: venueId ? 'w-[26%]' : 'w-[19%]',
      status: 'w-[10%]',
      actions: 'w-[8%]'
    }
  };
}

/**
 * Extract common row styling logic that varies by timeline row variant
 * This consolidates the styling that's duplicated across components
 */
export function getTimelineRowStyling(variant: TimelineRowVariant, customBorderClass?: string): string {
  const baseClass = "cursor-pointer transition-colors duration-150 hover:shadow-sm";
  
  switch (variant) {
    case 'confirmed':
      return `${baseClass} bg-green-50/30 hover:bg-green-100 border-l-4 border-green-400`;
    case 'accepted':
      return `${baseClass} bg-green-50/30 hover:bg-green-100 border-l-4 border-green-400`;
    case 'hold':
      return `${baseClass} bg-violet-50/30 hover:bg-violet-100 border-l-4 border-violet-400`;
    case 'open':
    default:
      return `${baseClass} ${customBorderClass || 'border-l-4 border-blue-400'} hover:bg-blue-50`;
  }
}

/**
 * Extract common text styling logic that varies by timeline row variant
 * This consolidates the text color logic that's duplicated across components
 */
export function getTimelineTextStyling(variant: TimelineRowVariant, customTextColorClass?: string): string {
  switch (variant) {
    case 'confirmed':
    case 'accepted':
      return 'text-green-900';
    case 'hold':
      return 'text-violet-900';
    case 'open':
    default:
      return customTextColorClass || 'text-blue-900';
  }
}

/**
 * Extract common expansion section styling logic
 * This consolidates the expansion background/border styling that's duplicated
 */
export function getTimelineExpansionStyling(variant: TimelineRowVariant) {
  switch (variant) {
    case 'confirmed':
    case 'accepted':
      return {
        bgClass: 'bg-green-50 border-l-4 border-green-400',
        headerClass: 'bg-green-100',
        textClass: 'text-left text-xs font-medium text-green-700',
        dividerClass: 'divide-y divide-green-200'
      };
    case 'hold':
      return {
        bgClass: 'bg-violet-50 border-l-4 border-violet-400',
        headerClass: 'bg-violet-100',
        textClass: 'text-left text-xs font-medium text-violet-700',
        dividerClass: 'divide-y divide-violet-200'
      };
    case 'open':
    default:
      return {
        bgClass: 'bg-yellow-50 border-l-4 border-yellow-400',
        headerClass: 'bg-yellow-100',
        textClass: 'text-left text-xs font-medium text-yellow-700',
        dividerClass: 'divide-y divide-yellow-200'
      };
  }
}

/**
 * Determine the timeline row variant based on bid/show status
 * This consolidates the status determination logic that's duplicated
 */
export function determineTimelineVariant(
  hasAcceptedBid: boolean,
  hasActiveHold: boolean,
  isConfirmedShow: boolean = false
): TimelineRowVariant {
  if (isConfirmedShow || hasAcceptedBid) {
    return 'confirmed';
  } else if (hasActiveHold) {
    return 'hold';
  } else {
    return 'open';
  }
}

/**
 * Get expansion arrow direction based on expanded state
 * This consolidates the arrow icon logic that's used in both systems
 */
export function getExpansionArrowPath(isExpanded: boolean): string {
  return isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7";
}

/**
 * Calculate column span for expansion rows based on table structure
 */
export function getExpansionColSpan(venueId?: string): number {
  return venueId ? 9 : 10;
} 
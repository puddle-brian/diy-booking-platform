import { BookingOpportunity } from '../types/BookingOpportunity';

export interface TimelineEntry {
  type: 'booking-opportunity';
  date: string;
  data: BookingOpportunity;
}

/**
 * UNIFIED TIMELINE LOGIC - THE ELEGANT SOLUTION
 * 
 * This replaces the complex triple-source timeline logic with a single,
 * simple function that handles ALL booking opportunities uniformly.
 * 
 * NO MORE:
 * - Synthetic TourRequest conversion
 * - ShowRequestProcessor vs ShowTimelineItem routing
 * - Complex status mapping between different models
 * 
 * JUST:
 * - Single data source (BookingOpportunity)
 * - Single component (BookingOpportunityRow)
 * - Consistent behavior everywhere
 */
export function createUnifiedTimelineEntries(
  bookingOpportunities: BookingOpportunity[],
  perspective: 'ARTIST' | 'VENUE',
  contextId: string, // artistId or venueId
  filters?: {
    status?: string[];
    dateRange?: { start: Date; end: Date };
    includeExpired?: boolean;
  }
): TimelineEntry[] {
  
  return bookingOpportunities
    // FILTER BY PERSPECTIVE
    .filter(opportunity => {
      if (perspective === 'ARTIST') {
        return opportunity.artistId === contextId;
      } else {
        return opportunity.venueId === contextId;
      }
    })
    
    // APPLY FILTERS
    .filter(opportunity => {
      // Status filter
      if (filters?.status && filters.status.length > 0) {
        if (!filters.status.includes(opportunity.status)) {
          return false;
        }
      }
      
      // Date range filter
      if (filters?.dateRange) {
        const oppDate = new Date(opportunity.proposedDate);
        if (oppDate < filters.dateRange.start || oppDate > filters.dateRange.end) {
          return false;
        }
      }
      
      // Expired filter
      if (!filters?.includeExpired && opportunity.status === 'EXPIRED') {
        return false;
      }
      
      return true;
    })
    
    // CONVERT TO TIMELINE ENTRIES
    .map(opportunity => ({
      type: 'booking-opportunity' as const,
      date: opportunity.proposedDate,
      data: opportunity
    }))
    
    // SORT BY DATE
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * SMART EXPANSION: Get competing opportunities for the same date
 * 
 * When an opportunity is expanded, show competing opportunities
 * to help with decision making.
 */
export function getCompetingOpportunities(
  opportunities: BookingOpportunity[],
  targetOpportunity: BookingOpportunity,
  perspective: 'ARTIST' | 'VENUE'
): BookingOpportunity[] {
  
  const targetDate = targetOpportunity.proposedDate.split('T')[0]; // Get date part only
  
  return opportunities.filter(opp => {
    // Same date, different opportunity
    if (opp.id === targetOpportunity.id) return false;
    if (opp.proposedDate.split('T')[0] !== targetDate) return false;
    
    // Same artist (if viewing from artist perspective)
    if (perspective === 'ARTIST') {
      return opp.artistId === targetOpportunity.artistId;
    }
    
    // Same venue (if viewing from venue perspective) 
    if (perspective === 'VENUE') {
      return opp.venueId === targetOpportunity.venueId;
    }
    
    return false;
  });
}

/**
 * GET TIMELINE STATISTICS
 * 
 * Provides useful metrics for the timeline header.
 */
export function getTimelineStats(opportunities: BookingOpportunity[]) {
  const stats = {
    total: opportunities.length,
    open: 0,
    pending: 0,
    confirmed: 0,
    declined: 0,
    expired: 0,
    cancelled: 0,
    
    // Financial stats
    totalGuarantees: 0,
    averageGuarantee: 0,
    confirmedValue: 0,
    
    // Date range
    earliestDate: null as Date | null,
    latestDate: null as Date | null
  };
  
  opportunities.forEach(opp => {
    // Status counts
    stats[opp.status.toLowerCase() as keyof typeof stats]++;
    
    // Financial calculations
    if (opp.financialOffer?.guarantee) {
      stats.totalGuarantees += opp.financialOffer.guarantee;
      if (opp.status === 'CONFIRMED') {
        stats.confirmedValue += opp.financialOffer.guarantee;
      }
    }
    
    // Date range
    const oppDate = new Date(opp.proposedDate);
    if (!stats.earliestDate || oppDate < stats.earliestDate) {
      stats.earliestDate = oppDate;
    }
    if (!stats.latestDate || oppDate > stats.latestDate) {
      stats.latestDate = oppDate;
    }
  });
  
  // Calculate averages
  const guaranteedOpps = opportunities.filter(opp => opp.financialOffer?.guarantee);
  if (guaranteedOpps.length > 0) {
    stats.averageGuarantee = stats.totalGuarantees / guaranteedOpps.length;
  }
  
  return stats;
}

/**
 * GROUP OPPORTUNITIES BY DATE
 * 
 * For better visual organization in timeline display.
 */
export function groupOpportunitiesByDate(
  opportunities: BookingOpportunity[]
): Map<string, BookingOpportunity[]> {
  
  const grouped = new Map<string, BookingOpportunity[]>();
  
  opportunities.forEach(opp => {
    const dateKey = opp.proposedDate.split('T')[0]; // YYYY-MM-DD format
    
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    
    grouped.get(dateKey)!.push(opp);
  });
  
  // Sort opportunities within each date group by status priority
  grouped.forEach(opps => {
    opps.sort((a, b) => {
      const statusPriority = {
        'CONFIRMED': 0,
        'PENDING': 1, 
        'OPEN': 2,
        'DECLINED': 3,
        'CANCELLED': 4,
        'EXPIRED': 5
      };
      
      return statusPriority[a.status] - statusPriority[b.status];
    });
  });
  
  return grouped;
} 
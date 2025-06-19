import { BookingOpportunity } from '../types/BookingOpportunity';

export interface UnifiedTimelineEntry {
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
): UnifiedTimelineEntry[] {
  
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
 * GROUP UNIFIED TIMELINE ENTRIES BY MONTH
 * 
 * Similar to existing groupEntriesByMonth but for unified entries.
 */
export interface UnifiedMonthGroup {
  monthKey: string;
  monthLabel: string;
  entries: UnifiedTimelineEntry[];
  count: number;
}

export function groupUnifiedEntriesByMonth(entries: UnifiedTimelineEntry[]): UnifiedMonthGroup[] {
  const monthGroups: { [key: string]: UnifiedMonthGroup & { uniqueDates: Set<string> } } = {};
  
  entries.forEach(entry => {
    // Timezone-safe date parsing
    let date: Date;
    
    if (typeof entry.date === 'string') {
      if (entry.date.includes('T') || entry.date.includes('Z')) {
        // ISO string with time - parse normally
        date = new Date(entry.date);
      } else {
        // Date-only string (e.g., "2025-08-01") - treat as local date
        const parts = entry.date.split('-');
        if (parts.length === 3) {
          // Create date in local timezone to avoid UTC conversion
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          date = new Date(entry.date);
        }
      }
    } else {
      date = new Date(entry.date);
    }
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    // Extract date string for uniqueness tracking
    const dateString = entry.date.split('T')[0]; // Gets "2025-08-15" from "2025-08-15" or "2025-08-15T10:00:00Z"
    
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = {
        monthKey,
        monthLabel,
        entries: [],
        count: 0,
        uniqueDates: new Set<string>()
      };
    }
    
    monthGroups[monthKey].entries.push(entry);
    
    // Only increment count for unique dates
    if (!monthGroups[monthKey].uniqueDates.has(dateString)) {
      monthGroups[monthKey].uniqueDates.add(dateString);
      monthGroups[monthKey].count++;
    }
  });
  
  // Sort months chronologically and remove the uniqueDates helper
  return Object.values(monthGroups).map(group => ({
    monthKey: group.monthKey,
    monthLabel: group.monthLabel,
    entries: group.entries,
    count: group.count
  })).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
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
    const statusKey = opp.status.toLowerCase() as keyof typeof stats;
    if (typeof stats[statusKey] === 'number') {
      (stats[statusKey] as number)++;
    }
    
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

/**
 * GENERATE STABLE MONTH TABS FOR UNIFIED TIMELINE
 * 
 * Similar to existing generateCompactMonthLabels but for unified timeline.
 */
export function generateUnifiedStableMonthTabs(monthGroups: UnifiedMonthGroup[]): UnifiedMonthGroup[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const stableMonths: UnifiedMonthGroup[] = [];
  
  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(currentYear, currentMonth + i, 1);
    const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
    const yearSuffix = targetDate.getFullYear() !== currentYear ? ` '${String(targetDate.getFullYear()).slice(-2)}` : '';
    const monthLabel = `${monthName}${yearSuffix}`;
    
    const existingMonth = monthGroups.find(group => group.monthKey === monthKey);
    
    stableMonths.push({
      monthKey,
      monthLabel,
      entries: existingMonth?.entries || [],
      count: existingMonth?.count || 0
    });
  }
  
  return stableMonths;
}

/**
 * GET DEFAULT ACTIVE MONTH FOR UNIFIED TIMELINE
 * 
 * Similar to existing getDefaultActiveMonthStable but for unified timeline.
 */
export function getUnifiedDefaultActiveMonth(stableMonthTabs: UnifiedMonthGroup[]): string {
  // Find the soonest month with confirmed opportunities
  const monthWithConfirmed = stableMonthTabs.find(group => 
    group.entries.some(entry => entry.data.status === 'CONFIRMED')
  );
  
  if (monthWithConfirmed) {
    return monthWithConfirmed.monthKey;
  }
  
  // Find the soonest month with any content
  const monthWithContent = stableMonthTabs.find(group => group.count > 0);
  if (monthWithContent) {
    return monthWithContent.monthKey;
  }
  
  // Default to current month
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * EXTRACT DATE FROM BOOKING OPPORTUNITY
 * 
 * Consistent date extraction for unified timeline.
 */
export function extractDateFromOpportunity(opportunity: BookingOpportunity): string {
  return opportunity.proposedDate.split('T')[0]; // Gets "2025-08-15" from "2025-08-15T10:00:00Z"
} 
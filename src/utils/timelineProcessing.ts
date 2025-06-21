import { extractDateFromEntry } from './timelineUtils';

export interface ProcessedTimelineEntry {
  entry: any;
  index: number;
  entryDate: string;
  sameDateSiblings: any[];
  isFirstOfDate: boolean;
}

/**
 * 🎯 MICRO-PHASE B: Timeline Processing Utility
 * 
 * Processes timeline entries to determine date grouping, siblings,
 * and first-of-date logic for rendering.
 * 
 * Extracted from TabbedTourItinerary to reduce component complexity.
 */
export function processTimelineEntries(entries: any[]): ProcessedTimelineEntry[] {
  return entries.map((entry, index) => {
    // 🎯 DATE GROUPING: Check for same-date siblings (following ShowTimelineItem pattern)
    const entryDate = extractDateFromEntry(entry);
    const sameDateSiblings = entries.filter(otherEntry => 
      otherEntry !== entry && 
      extractDateFromEntry(otherEntry) === entryDate
    );
    
    // 🔍 DEBUG: Log date grouping for August 29th
    if (entryDate === '2025-08-29') {
      console.log('🔍 Aug 29 Debug - Entry:', entry.data.artist?.name || entry.data.artistName);
      console.log('🔍 Aug 29 Debug - Entry ID:', entry.data.id);
      console.log('🔍 Aug 29 Debug - Current Index:', index);
      console.log('🔍 Aug 29 Debug - EntryDate:', entryDate);
      console.log('🔍 Aug 29 Debug - SameDateSiblings:', sameDateSiblings.length);
      console.log('🔍 Aug 29 Debug - All Aug 29 entries with IDs:', 
        entries
          .filter(e => extractDateFromEntry(e) === '2025-08-29')
          .map((e, i) => `${i}: ${e.data.artist?.name || e.data.artistName} (ID: ${e.data.id})`));
    }
    
    // Only show count badge on first occurrence of each date
    const firstIndexOfDate = entries.findIndex(otherEntry => 
      extractDateFromEntry(otherEntry) === entryDate
    );
    const isFirstOfDate = firstIndexOfDate === index;
    
    // 🔍 DEBUG: Log first-of-date logic for August 29th
    if (entryDate === '2025-08-29') {
      console.log('🔍 Aug 29 Debug - FirstIndexOfDate:', firstIndexOfDate, 'CurrentIndex:', index);
      console.log('🔍 Aug 29 Debug - IsFirstOfDate:', isFirstOfDate, 'for', entry.data.artist?.name || entry.data.artistName);
    }
    
    return {
      entry,
      index,
      entryDate,
      sameDateSiblings,
      isFirstOfDate
    };
  });
} 
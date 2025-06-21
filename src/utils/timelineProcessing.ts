import { extractDateFromEntry } from './timelineUtils';

export interface ProcessedTimelineEntry {
  entry: any;
  index: number;
  entryDate: string;
  sameDateSiblings: any[];
  isFirstOfDate: boolean;
}

export interface TimelineGroupEntry {
  groupDate: string;
  groupEntries: ProcessedTimelineEntry[];
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
    
    // Only show count badge on first occurrence of each date
    const firstIndexOfDate = entries.findIndex(otherEntry => 
      extractDateFromEntry(otherEntry) === entryDate
    );
    const isFirstOfDate = firstIndexOfDate === index;
    
    return {
      entry,
      index,
      entryDate,
      sameDateSiblings,
      isFirstOfDate
    };
  });
}

/**
 * 🎯 MICRO-PHASE B: Group processed entries by date
 * 
 * Takes processed timeline entries and groups them by date for 
 * the TimelineGroupRow component. This reduces complexity in
 * the parent component and centralizes date grouping logic.
 */
export function groupProcessedEntriesByDate(processedEntries: ProcessedTimelineEntry[]): TimelineGroupEntry[] {
  const groups: { [date: string]: ProcessedTimelineEntry[] } = {};
  
  // Group entries by date
  processedEntries.forEach(processedEntry => {
    const { entryDate } = processedEntry;
    if (!groups[entryDate]) {
      groups[entryDate] = [];
    }
    groups[entryDate].push(processedEntry);
  });
  
  // Convert to array format sorted by date
  return Object.keys(groups)
    .sort() // Chronological order
    .map(groupDate => ({
      groupDate,
      groupEntries: groups[groupDate]
    }));
} 
import React from 'react';

interface TimelineDateProps {
  date?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  isSingleDate?: boolean;
  className?: string;
}

/**
 * Timeline-optimized date component with perfect alignment
 * 
 * Uses CSS Grid instead of monospace fonts to achieve:
 * - Perfect vertical alignment of dates
 * - Consistent typography with rest of timeline
 * - Professional scanability
 * - Compact appearance
 */
export function TimelineDate({ 
  date, 
  startDate, 
  endDate, 
  isSingleDate = true, 
  className = "" 
}: TimelineDateProps) {
  
  // Determine the actual date to format
  const actualDate = date || startDate;
  if (!actualDate) {
    return <span className={className}>—</span>;
  }

  // Parse date safely using same logic as ItineraryDate
  let dateObj: Date;
  try {
    if (typeof actualDate === 'string') {
      if (actualDate.includes('T') || actualDate.includes('Z')) {
        dateObj = new Date(actualDate);
      } else {
        const parts = actualDate.split('-');
        if (parts.length === 3) {
          dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          dateObj = new Date(actualDate);
        }
      }
    } else {
      dateObj = actualDate;
    }

    if (isNaN(dateObj.getTime())) {
      return <span className={className}>Invalid</span>;
    }
  } catch (error) {
    return <span className={className}>Error</span>;
  }

  // Format exactly like ItineraryDate but with grid structure
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const day = dateObj.getDate();

  return (
    <span className={`timeline-date ${className}`}>
      <span className="timeline-date-weekday">{weekday}</span>
      <span className="timeline-date-day">{day}</span>
    </span>
  );
}

// Drop-in replacement for ItineraryDate in timeline contexts
export const ItineraryDateTimeline = TimelineDate; 
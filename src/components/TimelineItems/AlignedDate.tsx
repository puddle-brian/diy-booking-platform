import React from 'react';

interface AlignedDateProps {
  date?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  isSingleDate?: boolean;
  className?: string;
}

/**
 * Date component with perfect column alignment
 * 
 * Splits "Wed, Dec 15" into:
 * - Fixed-width weekday column: "Wed"
 * - Aligned month-day column: "Dec 15"
 * 
 * This ensures the month always starts at the same position,
 * which makes the day numbers perfectly aligned vertically.
 */
export function AlignedDate({ 
  date, 
  startDate, 
  endDate, 
  isSingleDate = true, 
  className = "" 
}: AlignedDateProps) {
  
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

  // Get the parts separately for perfect alignment
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const day = dateObj.getDate();

  return (
    <span className={`timeline-date-aligned ${className}`}>
      <span className="timeline-date-weekday">{weekday},</span>
      <span className="timeline-date-month-day">{month} {day}</span>
    </span>
  );
} 
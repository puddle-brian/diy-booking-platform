import React from 'react';
import { formatDate } from '../DateDisplay';

interface TimelineDateProps {
  date?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  isSingleDate?: boolean;
  className?: string;
}

/**
 * Timeline-optimized date component with enhanced scanability
 * 
 * Design Features:
 * - Tabular numbers for consistent digit alignment
 * - Fixed-width weekday abbreviations 
 * - Optimized spacing for vertical scanning
 * - Professional typography hierarchy
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

  // Parse date safely
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

  // Get weekday and day with consistent formatting
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });

  return (
    <div className={`flex flex-col leading-tight ${className}`}>
      {/* Weekday - Fixed width for alignment */}
      <div className="text-xs font-medium text-gray-500 w-8 text-center font-mono tracking-wider">
        {weekday}
      </div>
      
      {/* Date - Tabular numbers for digit alignment */}
      <div className="text-sm font-semibold text-gray-900 w-8 text-center font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {day}
      </div>
      
      {/* Month - Subtle context */}
      <div className="text-xs text-gray-400 w-8 text-center font-mono">
        {month}
      </div>
    </div>
  );
} 
'use client';

import React from 'react';

// Centralized date formatting utilities
export const formatDate = (
  date: string | Date, 
  options: {
    includeWeekday?: boolean;
    includeYear?: boolean;
    format?: 'short' | 'long' | 'minimal';
  } = {}
) => {
  const { 
    includeWeekday = true, 
    includeYear = false, 
    format = 'short' 
  } = options;

  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Handle string dates carefully to avoid timezone issues
      if (date.includes('T') || date.includes('Z')) {
        // ISO string with time - parse normally
        dateObj = new Date(date);
      } else {
        // Date-only string (e.g., "2025-06-12") - treat as local date
        const parts = date.split('-');
        if (parts.length === 3) {
          // Create date in local timezone to avoid UTC conversion
          dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          dateObj = new Date(date);
        }
      }
    } else {
      dateObj = date;
    }
    
    // Check for invalid dates
    if (isNaN(dateObj.getTime())) {
      console.warn('DateDisplay: Invalid date provided:', date);
      return 'Invalid Date';
    }
    
    if (format === 'minimal') {
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: format === 'long' ? 'long' : 'short',
      day: 'numeric'
    };

    if (includeWeekday) {
      formatOptions.weekday = 'short';
    }

    if (includeYear) {
      formatOptions.year = 'numeric';
    }

    return dateObj.toLocaleDateString('en-US', formatOptions);
  } catch (error) {
    console.error('DateDisplay: Error formatting date:', date, error);
    return 'Error';
  }
};

export const formatDateRange = (
  startDate: string | Date,
  endDate: string | Date,
  options: {
    includeWeekday?: boolean;
    includeYear?: boolean;
    format?: 'short' | 'long' | 'minimal';
  } = {}
) => {
  // Use the same timezone-safe parsing logic as formatDate
  const parseDate = (date: string | Date): Date => {
    if (typeof date === 'string') {
      if (date.includes('T') || date.includes('Z')) {
        return new Date(date);
      } else {
        const parts = date.split('-');
        if (parts.length === 3) {
          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          return new Date(date);
        }
      }
    } else {
      return date;
    }
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  // If same date, just show once
  if (start.toDateString() === end.toDateString()) {
    return formatDate(startDate, options);
  }

  // If same month, optimize display
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    const startFormatted = formatDate(startDate, { ...options, includeYear: false });
    const endDay = end.getDate();
    return `${startFormatted} - ${endDay}`;
  }

  // Different months/years - show full range
  return `${formatDate(startDate, options)} - ${formatDate(endDate, options)}`;
};

interface DateDisplayProps {
  date?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  isSingleDate?: boolean;
  includeWeekday?: boolean;
  includeYear?: boolean;
  format?: 'short' | 'long' | 'minimal';
  className?: string;
}

export default function DateDisplay({
  date,
  startDate,
  endDate,
  isSingleDate = true,
  includeWeekday = true,
  includeYear = false,
  format = 'short',
  className = ''
}: DateDisplayProps) {
  const options = { includeWeekday, includeYear, format };

  // Single date display
  if (date) {
    return (
      <span className={className}>
        {formatDate(date, options)}
      </span>
    );
  }

  // Range or single date from startDate/endDate
  if (startDate) {
    if (isSingleDate || !endDate) {
      return (
        <span className={className}>
          {formatDate(startDate, options)}
        </span>
      );
    } else {
      return (
        <span className={className}>
          {formatDateRange(startDate, endDate, options)}
        </span>
      );
    }
  }

  // Fallback - no valid date provided
  return <span className={className}>-</span>;
}

// Specialized variants for common use cases
export const ItineraryDate = ({ date, startDate, endDate, isSingleDate, className }: {
  date?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  isSingleDate?: boolean;
  className?: string;
}) => (
  <DateDisplay
    date={date}
    startDate={startDate}
    endDate={endDate}
    isSingleDate={isSingleDate}
    includeWeekday={true}
    includeYear={false}
    format="short"
    className={className}
  />
);

export const DocumentDate = ({ date, startDate, endDate, isSingleDate, className }: {
  date?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  isSingleDate?: boolean;
  className?: string;
}) => (
  <DateDisplay
    date={date}
    startDate={startDate}
    endDate={endDate}
    isSingleDate={isSingleDate}
    includeWeekday={true}
    includeYear={true}
    format="long"
    className={className}
  />
);

export const CompactDate = ({ date, startDate, endDate, isSingleDate, className }: {
  date?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  isSingleDate?: boolean;
  className?: string;
}) => (
  <DateDisplay
    date={date}
    startDate={startDate}
    endDate={endDate}
    isSingleDate={isSingleDate}
    includeWeekday={false}
    includeYear={false}
    format="minimal"
    className={className}
  />
); 
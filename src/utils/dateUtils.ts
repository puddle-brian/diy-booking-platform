/**
 * Date utilities for consistent timezone handling in DIY booking platform
 * 
 * Key principle: For show dates, we care about the DATE, not the exact time.
 * All show dates should be normalized to avoid timezone conversion issues.
 */

/**
 * Extract date string (YYYY-MM-DD) from any date input
 * Avoids timezone conversion issues by working with date strings
 */
export function extractDateString(dateInput: string | Date): string {
  if (typeof dateInput === 'string') {
    return dateInput.split('T')[0]; // Extract YYYY-MM-DD from ISO string
  }
  
  // For Date objects, convert to ISO and extract date part
  return dateInput.toISOString().split('T')[0];
}

/**
 * Create a normalized UTC datetime from a date string
 * Sets time to noon UTC to avoid timezone edge cases
 */
export function createNormalizedDateTime(dateString: string): Date {
  const normalizedDateString = extractDateString(dateString);
  return new Date(normalizedDateString + 'T12:00:00.000Z');
}

/**
 * Compare two date inputs for same date (ignoring time/timezone)
 */
export function isSameDate(date1: string | Date, date2: string | Date): boolean {
  return extractDateString(date1) === extractDateString(date2);
}

/**
 * Format date for display in local timezone
 */
export function formatDisplayDate(dateInput: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // Use UTC to avoid timezone shifts
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  if (typeof dateInput === 'string') {
    // For ISO strings, create date object with normalized time
    const normalizedDate = createNormalizedDateTime(dateInput);
    return normalizedDate.toLocaleDateString('en-US', finalOptions);
  }
  
  return dateInput.toLocaleDateString('en-US', finalOptions);
} 
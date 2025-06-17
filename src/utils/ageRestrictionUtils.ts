/**
 * Age Restriction Display Utilities
 * 
 * Provides consistent formatting for age restrictions across the application.
 * Handles both enum values (ALL_AGES, EIGHTEEN_PLUS, TWENTY_ONE_PLUS) and legacy string values.
 */

export type AgeRestrictionEnum = 'ALL_AGES' | 'EIGHTEEN_PLUS' | 'TWENTY_ONE_PLUS';
export type AgeRestrictionLegacy = 'all-ages' | '18+' | '21+' | 'flexible';
export type AgeRestrictionValue = AgeRestrictionEnum | AgeRestrictionLegacy | string | null | undefined;

/**
 * Formats age restriction for consistent display
 * Converts all formats to standardized display strings
 */
export function formatAgeRestriction(ageRestriction: AgeRestrictionValue): string {
  if (!ageRestriction) return 'all-ages';
  
  const value = String(ageRestriction).toUpperCase();
  
  switch (value) {
    case 'ALL_AGES':
    case 'ALL-AGES':
    case 'ALLAGES':
      return 'all-ages';
      
    case 'EIGHTEEN_PLUS':
    case 'EIGHTEEN-PLUS':
    case '18+':
    case '18PLUS':
      return '18+';
      
    case 'TWENTY_ONE_PLUS':
    case 'TWENTY-ONE-PLUS':
    case '21+':
    case '21PLUS':
      return '21+';
      
    case 'FLEXIBLE':
      return 'flexible';
      
    default:
      // Handle any other formats by attempting to extract the essence
      if (value.includes('18')) return '18+';
      if (value.includes('21')) return '21+';
      return 'all-ages'; // Default fallback
  }
}

/**
 * Converts display format back to database enum format
 * Used when saving data to ensure consistency
 */
export function normalizeAgeRestriction(ageRestriction: AgeRestrictionValue): AgeRestrictionEnum {
  const formatted = formatAgeRestriction(ageRestriction);
  
  switch (formatted) {
    case '18+':
      return 'EIGHTEEN_PLUS';
    case '21+':
      return 'TWENTY_ONE_PLUS';
    case 'all-ages':
    case 'flexible':
    default:
      return 'ALL_AGES';
  }
}

/**
 * Gets a user-friendly label for age restrictions
 */
export function getAgeRestrictionLabel(ageRestriction: AgeRestrictionValue): string {
  const formatted = formatAgeRestriction(ageRestriction);
  
  switch (formatted) {
    case 'all-ages':
      return 'All Ages';
    case '18+':
      return '18+';
    case '21+':
      return '21+';
    case 'flexible':
      return 'Flexible';
    default:
      return 'All Ages';
  }
} 
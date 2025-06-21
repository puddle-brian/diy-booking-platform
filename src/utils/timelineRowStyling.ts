export interface TimelineRowStylingVariant {
  variant: 'confirmed' | 'open' | 'hold';
  status?: 'pending' | 'accepted' | 'declined';
}

/**
 * Unified row styling system for timeline components
 * Maintains semantic distinction while ensuring visual consistency
 */
export const getTimelineRowStyling = (
  variant: 'confirmed' | 'open' | 'hold',
  isHovered: boolean = false
) => {
  const baseClasses = "transition-colors duration-150 cursor-pointer border-b border-gray-100";
  
  const variantClasses = {
    confirmed: {
      base: "bg-green-50 hover:bg-green-100"
    },
    open: {
      base: "bg-blue-50 hover:bg-blue-100"
    },
    hold: {
      base: "bg-violet-50 hover:bg-violet-100"
    }
  };
  
  return `${baseClasses} ${variantClasses[variant].base}`;
};

/**
 * Get text color classes for timeline row content
 */
export const getTimelineTextStyling = (variant: 'confirmed' | 'open' | 'hold') => {
  const textVariants = {
    confirmed: 'text-green-900',
    open: 'text-blue-900',
    hold: 'text-violet-900'
  };
  
  return textVariants[variant];
};

/**
 * Standardized typography classes for timeline components
 */
export const timelineTypography = {
  title: "text-sm font-medium text-gray-900",
  subtitle: "text-xs text-gray-600", 
  status: "text-xs font-medium",
  link: "text-blue-600 hover:text-blue-800 hover:underline",
  muted: "text-xs text-gray-500",
  date: "text-sm font-medium text-gray-900", // ✅ Will be used with AlignedDate component
  dateEnhanced: "text-sm font-medium text-gray-900 font-mono" // ✅ Enhanced version for future use
};

/**
 * Get expansion container styling
 */
export const getExpansionContainerStyling = (variant: 'confirmed' | 'open' | 'hold') => {
  const expansionVariants = {
    confirmed: "bg-green-50/30",
    open: "bg-blue-50/30",
    hold: "bg-violet-50/30"
  };
  
  return `${expansionVariants[variant]} overflow-x-auto`;
};

/**
 * Get expansion header styling
 */
export const getExpansionHeaderStyling = (variant: 'confirmed' | 'open' | 'hold') => {
  const headerVariants = {
    confirmed: "bg-green-100",
    open: "bg-blue-100", 
    hold: "bg-violet-100"
  };
  
  return headerVariants[variant];
};

/**
 * Get expansion text styling
 */
export const getExpansionTextStyling = (variant: 'confirmed' | 'open' | 'hold') => {
  const textVariants = {
    confirmed: "text-left text-xs font-medium text-green-700",
    open: "text-left text-xs font-medium text-blue-700",
    hold: "text-left text-xs font-medium text-violet-700"
  };
  
  return textVariants[variant];
};

/**
 * Get divider styling for expansion content
 */
export const getExpansionDividerStyling = (variant: 'confirmed' | 'open' | 'hold') => {
  const dividerVariants = {
    confirmed: "divide-y divide-green-200",
    open: "divide-y divide-blue-200",
    hold: "divide-y divide-violet-200"
  };
  
  return dividerVariants[variant];
}; 
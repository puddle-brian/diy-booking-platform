/**
 * Standardized interactive states for timeline components
 * Ensures consistent hover, focus, and loading behavior
 */

export const timelineInteractiveStates = {
  hover: {
    row: "hover:bg-opacity-80 hover:shadow-sm",
    button: "hover:bg-opacity-90 hover:scale-105",
    link: "hover:text-blue-800 hover:underline"
  },
  focus: {
    button: "focus:outline-none focus:ring-2 focus:ring-offset-2",
    link: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  },
  active: {
    button: "active:scale-95",
    row: "active:bg-opacity-90"
  },
  loading: {
    spinner: "animate-spin w-4 h-4",
    skeleton: "animate-pulse bg-gray-200 rounded",
    disabled: "opacity-50 cursor-not-allowed"
  }
};

/**
 * Get consistent hover effects for timeline rows
 */
export const getTimelineRowHoverStates = (variant: 'confirmed' | 'open' | 'hold') => {
  const baseHover = "transition-colors duration-150 hover:shadow-sm";
  
  const variantHovers = {
    confirmed: "hover:bg-green-100",
    open: "hover:bg-blue-100", 
    hold: "hover:bg-violet-100"
  };
  
  return `${baseHover} ${variantHovers[variant]}`;
};

/**
 * Get consistent focus states
 */
export const getFocusStates = (element: 'button' | 'link' | 'input') => {
  const focusStates = {
    button: "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    link: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded",
    input: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  };
  
  return focusStates[element];
};

/**
 * Get consistent loading states
 */
export const getLoadingStates = (type: 'button' | 'row' | 'skeleton') => {
  const loadingStates = {
    button: "opacity-50 cursor-not-allowed",
    row: "opacity-75 pointer-events-none",
    skeleton: "animate-pulse bg-gray-200 rounded"
  };
  
  return loadingStates[type];
};

/**
 * Loading spinner configuration (to be used in React components)
 */
export const getLoadingSpinnerClasses = () => timelineInteractiveStates.loading.spinner;

/**
 * Get consistent keyboard navigation styles
 */
export const getKeyboardNavigationStates = () => {
  return {
    focusVisible: "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
    tabIndex: "tabindex='0'",
    ariaLabel: "aria-label"
  };
}; 
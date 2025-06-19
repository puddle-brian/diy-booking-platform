import React from 'react';

interface ExpansionIndicatorProps {
  isExpanded: boolean;
  className?: string;
  title?: string;
}

/**
 * Unified expansion indicator for consistent UX patterns across timeline components
 * Uses right-pointing chevron that rotates 90° when expanded (same as ShowHeaderRow)
 */
export function ExpansionIndicator({ 
  isExpanded, 
  className = "text-gray-400 hover:text-gray-600",
  title 
}: ExpansionIndicatorProps) {
  return (
    <button
      className={`transition-colors ${className}`}
      title={title || (isExpanded ? "Collapse" : "Expand")}
      type="button"
    >
      <svg 
        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 5l7 7-7 7" 
        />
      </svg>
    </button>
  );
} 
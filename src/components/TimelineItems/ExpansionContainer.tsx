import React from 'react';
import { getExpansionContainerStyling } from '../../utils/timelineRowStyling';

interface ExpansionContainerProps {
  variant: 'confirmed' | 'open' | 'hold';
  children: React.ReactNode;
  colSpan: number;
}

/**
 * Unified expansion container for consistent expansion styling
 * Maintains variant distinction while ensuring visual harmony
 */
export function ExpansionContainer({ 
  variant, 
  children, 
  colSpan 
}: ExpansionContainerProps) {
  
  const containerStyles = getExpansionContainerStyling(variant);
  
  return (
    <tr>
      <td colSpan={colSpan} className="px-0 py-0">
        <div className={containerStyles}>
          {children}
        </div>
      </td>
    </tr>
  );
} 
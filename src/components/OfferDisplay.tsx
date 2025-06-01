'use client';

import React from 'react';
import { ParsedOffer, legacyFormatToParsedOffer } from './OfferInput';

interface OfferDisplayProps {
  // Can accept either a ParsedOffer or legacy format
  offer?: ParsedOffer | null;
  amount?: number | null;
  doorDeal?: any;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

export default function OfferDisplay({
  offer,
  amount,
  doorDeal,
  className = "",
  size = 'sm',
  showBreakdown = false
}: OfferDisplayProps) {
  // Convert legacy format to ParsedOffer if needed
  const parsedOffer = offer || legacyFormatToParsedOffer(amount || null, doorDeal);
  
  if (!parsedOffer) {
    return <span className={`text-gray-400 ${className}`}>-</span>;
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'guarantee':
        return '💰';
      case 'percentage':
        return '📊';
      case 'guarantee-plus-percentage':
        return '💰+';
      default:
        return '📝';
    }
  };

  const getOfferColor = (type: string) => {
    switch (type) {
      case 'guarantee':
        return 'text-green-700';
      case 'percentage':
        return 'text-blue-700';
      case 'guarantee-plus-percentage':
        return 'text-purple-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className={`${className}`}>
      <div className={`flex items-center space-x-1 ${sizeClasses[size]}`}>
        <span className={`${sizeClasses[size]} ${getOfferColor(parsedOffer.type)} font-medium`}>
          {parsedOffer.displayText}
        </span>
      </div>
      
      {showBreakdown && parsedOffer.type !== 'custom' && (
        <div className={`mt-1 ${sizeClasses[size]} text-gray-600 space-y-0.5`}>
          {parsedOffer.guarantee && (
            <div>Base: ${parsedOffer.guarantee}</div>
          )}
          {parsedOffer.percentage && (
            <div>Split: {parsedOffer.percentage.artistPercentage}/{parsedOffer.percentage.venuePercentage}</div>
          )}
          {parsedOffer.percentage?.minimumGuarantee && (
            <div>Min: ${parsedOffer.percentage.minimumGuarantee}</div>
          )}
        </div>
      )}
    </div>
  );
}

// Ultra-compact utility component for inline offer display in tables
export function InlineOfferDisplay({ 
  amount, 
  doorDeal, 
  className = "" 
}: { 
  amount?: number | null; 
  doorDeal?: any; 
  className?: string; 
}) {
  const parsedOffer = legacyFormatToParsedOffer(amount || null, doorDeal);
  
  if (!parsedOffer) {
    return <span className={`text-gray-400 ${className}`}>-</span>;
  }

  // Ultra-compact format that fits in narrow table columns
  const renderCompactOffer = () => {
    switch (parsedOffer.type) {
      case 'guarantee':
        return (
          <div className="flex items-center gap-0.5" title={`Artist receives $${parsedOffer.guarantee} guaranteed payment`}>
            <span className="text-green-700 font-medium">${parsedOffer.guarantee}</span>
            <span className="text-gray-500 text-xs">flat</span>
          </div>
        );
      
      case 'percentage':
        const pct = parsedOffer.percentage!;
        return (
          <div className="flex items-center gap-1 text-xs" title={
            pct.minimumGuarantee 
              ? `Artist receives ${pct.artistPercentage}% of door revenue, minimum $${pct.minimumGuarantee} guaranteed`
              : `Artist receives ${pct.artistPercentage}% of door revenue, venue keeps ${pct.venuePercentage}%`
          }>
            <span className="text-blue-700 font-medium">{pct.artistPercentage}%</span>
            {pct.minimumGuarantee ? (
              <>
                <span className="text-gray-500">≥</span>
                <span className="text-blue-700 font-medium">${pct.minimumGuarantee}</span>
              </>
            ) : (
              <span className="text-gray-500">door</span>
            )}
          </div>
        );
      
      case 'guarantee-plus-percentage':
        return (
          <div className="flex items-center gap-0.5 text-xs" title={`$${parsedOffer.guarantee} guaranteed upfront + ${parsedOffer.bonusPercentage}% of profits after venue covers costs`}>
            <span className="text-purple-700 font-medium">${parsedOffer.guarantee}+{parsedOffer.bonusPercentage}%</span>
          </div>
        );
      
      default:
        // Custom/fallback - show raw text but truncated
        return (
          <div className="text-gray-700 text-xs truncate" title={parsedOffer.displayText}>
            {parsedOffer.displayText}
          </div>
        );
    }
  };

  return (
    <div className={`text-xs leading-tight ${className}`}>
      {renderCompactOffer()}
    </div>
  );
} 
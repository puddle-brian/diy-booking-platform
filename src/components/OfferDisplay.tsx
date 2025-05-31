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

// Utility component for inline offer display in tables
export function InlineOfferDisplay({ 
  amount, 
  doorDeal, 
  className = "" 
}: { 
  amount?: number | null; 
  doorDeal?: any; 
  className?: string; 
}) {
  return (
    <OfferDisplay 
      amount={amount} 
      doorDeal={doorDeal} 
      className={className}
      size="sm"
    />
  );
} 
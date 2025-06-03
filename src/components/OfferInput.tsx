'use client';

import React, { useState, useEffect } from 'react';

export interface ParsedOffer {
  type: 'guarantee' | 'percentage' | 'guarantee-plus-percentage' | 'custom';
  displayText: string;
  guarantee?: number;
  percentage?: {
    artistPercentage: number;
    venuePercentage: number;
    minimumGuarantee?: number;
    afterExpenses?: number;
  };
  bonusPercentage?: number;
  afterExpenses?: number;
  rawInput: string;
}

interface OfferInputProps {
  value?: ParsedOffer | null;
  onChange: (offer: ParsedOffer | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showPresets?: boolean;
  label?: string;
  required?: boolean;
}

type OfferType = 'guarantee' | 'split' | 'guarantee-plus-split';

export default function OfferInput({
  value,
  onChange,
  placeholder = "Enter offer details",
  className = "",
  disabled = false,
  showPresets = true,
  label,
  required = false
}: OfferInputProps) {
  // Internal state for the separate inputs
  const [offerType, setOfferType] = useState<OfferType>('guarantee');
  const [guaranteeAmount, setGuaranteeAmount] = useState('500'); // Default to $500
  const [artistPercent, setArtistPercent] = useState('70');
  const [minimumAmount, setMinimumAmount] = useState('');
  const [bonusPercent, setBonusPercent] = useState('80');
  const [afterExpenses, setAfterExpenses] = useState('');

  // Initialize from existing value
  useEffect(() => {
    if (value) {
      console.log('🔄 OfferInput: Initializing from existing value:', value);
      switch (value.type) {
        case 'guarantee':
          setOfferType('guarantee');
          setGuaranteeAmount(value.guarantee?.toString() || '');
          console.log('✅ OfferInput: Set guarantee amount to:', value.guarantee);
          break;
        case 'percentage':
          setOfferType('split');
          setArtistPercent(value.percentage?.artistPercentage?.toString() || '70');
          setMinimumAmount(value.percentage?.minimumGuarantee?.toString() || '');
          setAfterExpenses(value.percentage?.afterExpenses?.toString() || '');
          break;
        case 'guarantee-plus-percentage':
          setOfferType('guarantee-plus-split');
          setGuaranteeAmount(value.guarantee?.toString() || '');
          setBonusPercent(value.bonusPercentage?.toString() || '80');
          setAfterExpenses(value.afterExpenses?.toString() || '');
          break;
      }
    }
  }, [value]);

  // Generate ParsedOffer from current inputs
  const generateOffer = (): ParsedOffer | null => {
    switch (offerType) {
      case 'guarantee': {
        if (!guaranteeAmount || isNaN(Number(guaranteeAmount))) return null;
        const amount = Number(guaranteeAmount);
        return {
          type: 'guarantee',
          displayText: `$${amount} guarantee`,
          guarantee: amount,
          rawInput: `$${amount} guarantee`
        };
      }

      case 'split': {
        if (!artistPercent || isNaN(Number(artistPercent))) return null;
        const artistPct = Number(artistPercent);
        const venuePct = 100 - artistPct;
        const minimum = minimumAmount ? Number(minimumAmount) : undefined;
        const expenses = afterExpenses ? Number(afterExpenses) : undefined;
        
        let displayText = `${artistPct}/${venuePct} split`;
        if (minimum) displayText += `, $${minimum} min`;
        if (expenses) displayText += `, after $${expenses}`;
        
        return {
          type: 'percentage',
          displayText,
          percentage: {
            artistPercentage: artistPct,
            venuePercentage: venuePct,
            minimumGuarantee: minimum,
            afterExpenses: expenses
          },
          rawInput: displayText
        };
      }

      case 'guarantee-plus-split': {
        if (!guaranteeAmount || !bonusPercent || isNaN(Number(guaranteeAmount)) || isNaN(Number(bonusPercent))) return null;
        const baseAmount = Number(guaranteeAmount);
        const bonus = Number(bonusPercent);
        const expensesAmount = afterExpenses ? Number(afterExpenses) : undefined;
        
        let displayText = `$${baseAmount} + ${bonus}%`;
        if (expensesAmount) displayText += ` after $${expensesAmount}`;
        else displayText += ' after costs';
        
        return {
          type: 'guarantee-plus-percentage',
          displayText,
          guarantee: baseAmount,
          bonusPercentage: bonus,
          afterExpenses: expensesAmount,
          rawInput: displayText
        };
      }

      default:
        return null;
    }
  };

  // Update parent when inputs change
  useEffect(() => {
    const offer = generateOffer();
    onChange(offer);
  }, [offerType, guaranteeAmount, artistPercent, minimumAmount, bonusPercent, afterExpenses]);

  // Initialize default value on mount (only if no existing value provided)
  useEffect(() => {
    if (!value) {
      console.log('🔄 OfferInput: No existing value, initializing with defaults');
      const offer = generateOffer();
      if (offer) {
        onChange(offer);
      }
    }
  }, []); // Only run on mount

  // Set defaults when switching offer types
  const handleOfferTypeChange = (newType: OfferType) => {
    setOfferType(newType);
    
    // Set sensible defaults for each type
    switch (newType) {
      case 'guarantee':
        if (!guaranteeAmount) setGuaranteeAmount('500');
        break;
      case 'split':
        if (!artistPercent) setArtistPercent('70');
        break;
      case 'guarantee-plus-split':
        if (!guaranteeAmount) setGuaranteeAmount('300');
        if (!bonusPercent) setBonusPercent('80');
        break;
    }
  };

  const currentOffer = generateOffer();

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Compact Type Selector + Main Input */}
      <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
        {/* Type Dropdown - Clearly styled */}
        <select 
          value={offerType} 
          onChange={(e) => handleOfferTypeChange(e.target.value as OfferType)}
          disabled={disabled}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="guarantee">Pay</option>
          <option value="split">Split</option>
          <option value="guarantee-plus-split">Pay + Split</option>
        </select>

        {/* Main Input Based on Type */}
        {offerType === 'guarantee' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <span className="text-gray-500 text-sm font-medium">$</span>
              <input
                type="number"
                value={guaranteeAmount}
                onChange={(e) => setGuaranteeAmount(e.target.value)}
                placeholder="500"
                step="50"
                min="0"
                disabled={disabled}
                required={required}
                className="w-20 text-sm bg-transparent border-0 focus:outline-none text-center text-gray-900 font-medium"
              />
            </div>
            <span className="text-gray-600 text-sm">flat payment</span>
          </div>
        )}

        {offerType === 'split' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <input
                type="number"
                value={artistPercent}
                onChange={(e) => setArtistPercent(e.target.value)}
                placeholder="70"
                step="5"
                min="0"
                max="100"
                disabled={disabled}
                required={required}
                className="w-16 text-sm bg-transparent border-0 focus:outline-none text-center text-gray-900 font-medium"
              />
              <span className="text-gray-500 text-sm font-medium">%</span>
            </div>
            <span className="text-gray-600 text-sm">of door revenue</span>
            
            {/* Optional minimum - consistent styling */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">min</span>
              <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <span className="text-gray-500 text-sm font-medium">$</span>
                <input
                  type="number"
                  value={minimumAmount}
                  onChange={(e) => setMinimumAmount(e.target.value)}
                  placeholder="0"
                  step="25"
                  min="0"
                  disabled={disabled}
                  className="w-16 text-sm bg-transparent border-0 focus:outline-none text-center text-gray-900 font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {offerType === 'guarantee-plus-split' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <span className="text-gray-500 text-sm font-medium">$</span>
              <input
                type="number"
                value={guaranteeAmount}
                onChange={(e) => setGuaranteeAmount(e.target.value)}
                placeholder="300"
                step="50"
                min="0"
                disabled={disabled}
                required={required}
                className="w-20 text-sm bg-transparent border-0 focus:outline-none text-center text-gray-900 font-medium"
              />
            </div>
            
            <span className="text-gray-500 text-sm">+</span>
            
            <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <input
                type="number"
                value={bonusPercent}
                onChange={(e) => setBonusPercent(e.target.value)}
                placeholder="80"
                step="5"
                min="0"
                max="100"
                disabled={disabled}
                required={required}
                className="w-16 text-sm bg-transparent border-0 focus:outline-none text-center text-gray-900 font-medium"
              />
              <span className="text-gray-500 text-sm font-medium">%</span>
            </div>
            
            <span className="text-gray-600 text-sm">after costs</span>
          </div>
        )}
      </div>

      {/* Compact Preview - Only if offer exists */}
      {currentOffer && (
        <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded border border-blue-200">
          <strong className="text-blue-900">{currentOffer.displayText}</strong>
          <span className="text-xs text-blue-700 ml-2">
            → {getArtistPayoutDescription(currentOffer)}
          </span>
        </div>
      )}
    </div>
  );
}

// Helper function to describe what the artist gets
function getArtistPayoutDescription(offer: ParsedOffer): string {
  switch (offer.type) {
    case 'guarantee':
      return `$${offer.guarantee} guaranteed`;
    
    case 'percentage':
      if (offer.percentage?.minimumGuarantee) {
        return `$${offer.percentage.minimumGuarantee}+ guaranteed`;
      }
      return `${offer.percentage?.artistPercentage}% of door`;
    
    case 'guarantee-plus-percentage':
      return `$${offer.guarantee}+ guaranteed`;
    
    default:
      return 'Custom terms';
  }
}

// Helper to convert ParsedOffer back to legacy format for database compatibility
export function parsedOfferToLegacyFormat(offer: ParsedOffer | null) {
  if (!offer) return { amount: null, doorDeal: null };

  switch (offer.type) {
    case 'guarantee':
      return {
        amount: offer.guarantee,
        doorDeal: null
      };
    
    case 'percentage':
      return {
        amount: offer.percentage?.minimumGuarantee || null,
        doorDeal: {
          split: `${offer.percentage?.artistPercentage}/${offer.percentage?.venuePercentage}`,
          minimumGuarantee: offer.percentage?.minimumGuarantee,
          afterExpenses: offer.percentage?.afterExpenses
        }
      };
    
    case 'guarantee-plus-percentage':
      return {
        amount: offer.guarantee,
        doorDeal: {
          split: `${offer.bonusPercentage}/0`, // Custom format for bonus percentage
          afterExpenses: offer.afterExpenses
        }
      };
    
    default:
      return {
        amount: null,
        doorDeal: { split: offer.rawInput }
      };
  }
}

// Helper to convert legacy format back to ParsedOffer
export function legacyFormatToParsedOffer(amount: number | null, doorDeal: any): ParsedOffer | null {
  if (!amount && !doorDeal) {
    return null;
  }

  // Simple guarantee
  if (amount && !doorDeal) {
    return {
      type: 'guarantee',
      displayText: `$${amount} guarantee`,
      guarantee: amount,
      rawInput: `$${amount} guarantee`
    };
  }

  // Door deal with or without guarantee
  if (doorDeal) {
    // Handle both string and object formats for split
    let splitString = '';
    if (typeof doorDeal.split === 'string') {
      splitString = doorDeal.split;
    } else if (typeof doorDeal === 'string') {
      // Handle case where entire doorDeal is a string
      splitString = doorDeal;
    } else if (doorDeal.artistPercentage && doorDeal.venuePercentage) {
      // Handle object format with separate percentage fields
      splitString = `${doorDeal.artistPercentage}/${doorDeal.venuePercentage}`;
    } else if (doorDeal.split && typeof doorDeal.split === 'object') {
      // Handle nested split object
      if (doorDeal.split.artistPercentage && doorDeal.split.venuePercentage) {
        splitString = `${doorDeal.split.artistPercentage}/${doorDeal.split.venuePercentage}`;
      }
    }
    
    if (splitString) {
      // Try multiple regex patterns to be more flexible
      const patterns = [
        /^(\d+)\/(\d+)$/,           // Standard: "70/30"
        /^(\d+)\s*\/\s*(\d+)$/,    // With spaces: "70 / 30"
        /^(\d+)%?\s*\/\s*(\d+)%?$/, // With percentage signs: "70%/30%"
        /^(\d+)\s*-\s*(\d+)$/,     // With dash: "70-30"
        /^(\d+)\s*:\s*(\d+)$/      // With colon: "70:30"
      ];
      
      let splitMatch = null;
      for (const pattern of patterns) {
        splitMatch = splitString.match(pattern);
        if (splitMatch) {
          break;
        }
      }
      
      if (splitMatch) {
        const artistPct = parseInt(splitMatch[1]);
        const venuePct = parseInt(splitMatch[2]);
        
        // Validate percentages make sense
        if (artistPct >= 0 && artistPct <= 100 && venuePct >= 0 && venuePct <= 100) {
          
          // 🎯 FIX: Detect guarantee-plus-percentage format
          // If we have an amount AND the split is "X/0", it's a guarantee + bonus percentage
          if (amount && amount > 0 && venuePct === 0 && artistPct > 0) {
            return {
              type: 'guarantee-plus-percentage',
              displayText: `$${amount} + ${artistPct}% after costs`,
              guarantee: amount,
              bonusPercentage: artistPct,
              afterExpenses: doorDeal.afterExpenses,
              rawInput: `$${amount} + ${artistPct}% after costs`
            };
          }
          
          if (amount && amount > 0) {
            return {
              type: 'percentage',
              displayText: `${artistPct}% split, $${amount} minimum`,
              percentage: {
                artistPercentage: artistPct,
                venuePercentage: venuePct,
                minimumGuarantee: amount
              },
              rawInput: `${artistPct}% split, $${amount} minimum`
            };
          } else {
            return {
              type: 'percentage',
              displayText: `${artistPct}/${venuePct} split`,
              percentage: {
                artistPercentage: artistPct,
                venuePercentage: venuePct,
                afterExpenses: doorDeal.afterExpenses || doorDeal.minimumGuarantee
              },
              rawInput: `${artistPct}/${venuePct} split`
            };
          }
        }
      }
      
      // Custom format - use the raw split string
      return {
        type: 'custom',
        displayText: splitString,
        rawInput: splitString
      };
    }
  }

  return null;
}

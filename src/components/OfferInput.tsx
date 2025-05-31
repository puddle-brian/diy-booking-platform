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

export default function OfferInput({
  value,
  onChange,
  placeholder = "e.g., $500 guarantee, 70/30 door split, $300 + 80% after costs",
  className = "",
  disabled = false,
  showPresets = true,
  label,
  required = false
}: OfferInputProps) {
  const [inputText, setInputText] = useState(value?.rawInput || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [parsedOffer, setParsedOffer] = useState<ParsedOffer | null>(value || null);

  // Parse natural language input into structured offer
  const parseOfferInput = (input: string): ParsedOffer | null => {
    if (!input.trim()) return null;

    const text = input.toLowerCase().trim();
    
    // Pattern 1: Simple guarantee - "$500", "$500 guarantee", "500 flat"
    const guaranteeMatch = text.match(/^\$?(\d+(?:\.\d{2})?)\s*(?:guarantee|flat|fixed)?$/);
    if (guaranteeMatch) {
      const amount = parseFloat(guaranteeMatch[1]);
      return {
        type: 'guarantee',
        displayText: `$${amount} guarantee`,
        guarantee: amount,
        rawInput: input
      };
    }

    // Pattern 2: Percentage split - "70/30", "70/30 split", "80/20 door"
    const percentageSplitMatch = text.match(/^(\d+)\/(\d+)\s*(?:split|door)?$/);
    if (percentageSplitMatch) {
      const artistPct = parseInt(percentageSplitMatch[1]);
      const venuePct = parseInt(percentageSplitMatch[2]);
      if (artistPct + venuePct === 100) {
        return {
          type: 'percentage',
          displayText: `${artistPct}/${venuePct} split`,
          percentage: {
            artistPercentage: artistPct,
            venuePercentage: venuePct
          },
          rawInput: input
        };
      }
    }

    // Pattern 3: Guarantee + percentage - "$300 + 80% after costs", "$500 plus 70% after $200"
    const guaranteePlusMatch = text.match(/^\$?(\d+(?:\.\d{2})?)\s*(?:\+|plus)\s*(\d+)%\s*(?:after\s*(?:\$?(\d+(?:\.\d{2})?))?)?/);
    if (guaranteePlusMatch) {
      const guarantee = parseFloat(guaranteePlusMatch[1]);
      const percentage = parseInt(guaranteePlusMatch[2]);
      const afterExpenses = guaranteePlusMatch[3] ? parseFloat(guaranteePlusMatch[3]) : undefined;
      
      return {
        type: 'guarantee-plus-percentage',
        displayText: `$${guarantee} + ${percentage}%${afterExpenses ? ` after $${afterExpenses}` : ' after costs'}`,
        guarantee,
        bonusPercentage: percentage,
        afterExpenses,
        rawInput: input
      };
    }

    // Pattern 4: Percentage with minimum - "70% of door, $200 minimum", "80% with $300 min"
    const percentageMinMatch = text.match(/^(\d+)%\s*(?:of\s*door)?(?:,\s*|\s+(?:with\s+)?)?\$?(\d+(?:\.\d{2})?)\s*(?:minimum|min)$/);
    if (percentageMinMatch) {
      const artistPct = parseInt(percentageMinMatch[1]);
      const minimum = parseFloat(percentageMinMatch[2]);
      
      return {
        type: 'percentage',
        displayText: `${artistPct}% split, $${minimum} minimum`,
        percentage: {
          artistPercentage: artistPct,
          venuePercentage: 100 - artistPct,
          minimumGuarantee: minimum
        },
        rawInput: input
      };
    }

    // Pattern 4b: Split with minimum - "70/30 with $200 min", "80/20 with $300 minimum"
    const splitWithMinMatch = text.match(/^(\d+)\/(\d+)\s+with\s+\$?(\d+(?:\.\d{2})?)\s*(?:minimum|min)$/);
    if (splitWithMinMatch) {
      const artistPct = parseInt(splitWithMinMatch[1]);
      const venuePct = parseInt(splitWithMinMatch[2]);
      const minimum = parseFloat(splitWithMinMatch[3]);
      
      if (artistPct + venuePct === 100) {
        return {
          type: 'percentage',
          displayText: `${artistPct}/${venuePct} split, $${minimum} minimum`,
          percentage: {
            artistPercentage: artistPct,
            venuePercentage: venuePct,
            minimumGuarantee: minimum
          },
          rawInput: input
        };
      }
    }

    // Pattern 5: Percentage split after expenses - "70/30 after $500", "80/20 after expenses"
    const splitAfterMatch = text.match(/^(\d+)\/(\d+)\s*after\s*(?:\$?(\d+(?:\.\d{2})?)|\w+)$/);
    if (splitAfterMatch) {
      const artistPct = parseInt(splitAfterMatch[1]);
      const venuePct = parseInt(splitAfterMatch[2]);
      const expenses = splitAfterMatch[3] ? parseFloat(splitAfterMatch[3]) : undefined;
      
      if (artistPct + venuePct === 100) {
        return {
          type: 'percentage',
          displayText: `${artistPct}/${venuePct} split${expenses ? ` after $${expenses}` : ' after expenses'}`,
          percentage: {
            artistPercentage: artistPct,
            venuePercentage: venuePct,
            afterExpenses: expenses
          },
          rawInput: input
        };
      }
    }

    // If no pattern matches, treat as custom
    return {
      type: 'custom',
      displayText: input,
      rawInput: input
    };
  };

  // Update parsed offer when input changes
  useEffect(() => {
    const parsed = parseOfferInput(inputText);
    setParsedOffer(parsed);
    onChange(parsed);
  }, [inputText, onChange]);

  // Preset options
  const presets = [
    { label: 'Fixed Rate', value: '$500 guarantee' },
    { label: 'Split', value: '70/30' },
    { label: 'Split + Min', value: '70/30 with $200 min' },
    { label: 'Guarantee + %', value: '$300 + 80% after costs' }
  ];

  const handlePresetClick = (presetValue: string) => {
    setInputText(presetValue);
    setShowSuggestions(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Main Input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* Preset Suggestions */}
        {showPresets && showSuggestions && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="p-2 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2">Quick Presets</div>
              <div className="grid grid-cols-2 gap-1">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset.value)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-left transition-colors"
                  >
                    <div className="font-medium">{preset.label}</div>
                    <div className="text-gray-600">{preset.value}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-2">
              <div className="text-xs text-gray-500">
                Examples: "$500 guarantee", "70/30", "$300 + 80% after costs", "70/30 with $200 min"
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parsed Result Display */}
      {parsedOffer && parsedOffer.type !== 'custom' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-blue-900">
                {parsedOffer.displayText}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {parsedOffer.type === 'guarantee' && 'Fixed payment regardless of attendance'}
                {parsedOffer.type === 'percentage' && 'Revenue split based on ticket sales'}
                {parsedOffer.type === 'guarantee-plus-percentage' && 'Base payment plus percentage of revenue'}
              </div>
              
              {/* Breakdown */}
              <div className="text-xs text-blue-600 mt-2 space-y-1">
                {parsedOffer.guarantee && (
                  <div>├─ Base: ${parsedOffer.guarantee} guarantee</div>
                )}
                {parsedOffer.percentage && (
                  <div>├─ Split: {parsedOffer.percentage.artistPercentage}% artist / {parsedOffer.percentage.venuePercentage}% venue</div>
                )}
                {parsedOffer.bonusPercentage && (
                  <div>├─ Bonus: {parsedOffer.bonusPercentage}% of revenue after costs</div>
                )}
                {parsedOffer.percentage?.minimumGuarantee && (
                  <div>├─ Minimum: ${parsedOffer.percentage.minimumGuarantee} guaranteed</div>
                )}
                {parsedOffer.afterExpenses && (
                  <div>├─ After: ${parsedOffer.afterExpenses} expenses</div>
                )}
                <div>└─ Artist gets: {getArtistPayoutDescription(parsedOffer)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom/Unparsed Input Warning */}
      {parsedOffer && parsedOffer.type === 'custom' && inputText.trim() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-900">Custom offer format</div>
              <div className="text-xs text-yellow-700 mt-1">
                This will be saved as-is. For better parsing, try formats like "$500 guarantee" or "70/30 split".
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to describe what the artist gets
function getArtistPayoutDescription(offer: ParsedOffer): string {
  switch (offer.type) {
    case 'guarantee':
      return `$${offer.guarantee} flat`;
    
    case 'percentage':
      if (offer.percentage?.minimumGuarantee) {
        return `$${offer.percentage.minimumGuarantee} minimum, potentially more`;
      }
      return `${offer.percentage?.artistPercentage}% of door revenue`;
    
    case 'guarantee-plus-percentage':
      return `$${offer.guarantee} minimum, plus ${offer.bonusPercentage}% upside`;
    
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
  if (!amount && !doorDeal) return null;

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
  if (doorDeal && doorDeal.split) {
    const splitMatch = doorDeal.split.match(/^(\d+)\/(\d+)$/);
    if (splitMatch) {
      const artistPct = parseInt(splitMatch[1]);
      const venuePct = parseInt(splitMatch[2]);
      
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
            afterExpenses: doorDeal.afterExpenses
          },
          rawInput: `${artistPct}/${venuePct} split`
        };
      }
    }
    
    // Custom format
    return {
      type: 'custom',
      displayText: doorDeal.split,
      rawInput: doorDeal.split
    };
  }

  return null;
} 
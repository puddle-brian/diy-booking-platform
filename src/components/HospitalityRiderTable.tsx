'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface HospitalityRequirement {
  id: string;
  requirement: string;
  required: boolean;
}

interface HospitalityRiderTableProps {
  requirements: HospitalityRequirement[];
  onChange: (requirements: HospitalityRequirement[]) => void;
  className?: string;
}

// Common suggestions for autocomplete
const SUGGESTIONS = [
  'Vegetarian Meal', 'Vegan Meal', 'Gluten-Free Options', 'Hot Meal', 'Sandwiches',
  'Pizza', 'Local Cuisine', 'Snacks', 'Fresh Fruit', 'Nuts/Trail Mix',
  'Energy Bars', 'Coffee', 'Tea', 'Water Bottles', 'Soft Drinks',
  'Beer', 'Wine', 'Spirits', 'Energy Drinks', 'Juice',
  'Hotel Room', 'Private Accommodation', 'Shared Accommodation', 'Floor Space',
  'Transportation to/from Venue', 'Airport Pickup', 'Local Transportation',
  'Parking Passes', 'Load-in Assistance', 'Towels', 'Shower Access'
];

export default function HospitalityRiderTable({ 
  requirements, 
  onChange, 
  className = '' 
}: HospitalityRiderTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showSuggestions || !event.target) return;
      
      const target = event.target as Element;
      
      // Check if click is inside dropdown or input
      const isClickInsideDropdown = target.closest('.hosp-suggestions-dropdown');
      const isClickInsideInput = target.closest('.hosp-suggestions-input');
      
      if (!isClickInsideDropdown && !isClickInsideInput) {
        setShowSuggestions(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSuggestions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSuggestions]);

  const addRequirement = () => {
    const newReq: HospitalityRequirement = {
      id: Date.now().toString(),
      requirement: '',
      required: false
    };
    onChange([...requirements, newReq]);
    setEditingId(newReq.id);
    
    // Focus the new input after a brief delay
    setTimeout(() => {
      inputRefs.current[newReq.id]?.focus();
    }, 50);
  };

  const updateRequirement = (id: string, field: keyof HospitalityRequirement, value: string | boolean) => {
    onChange(requirements.map(req => 
      req.id === id ? { ...req, [field]: field === 'required' ? value === 'true' || value === true : value } : req
    ));
  };

  const removeRequirement = (id: string) => {
    onChange(requirements.filter(req => req.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      setEditingId(null);
      setShowSuggestions(null);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setShowSuggestions(null);
    }
  };

  const filteredSuggestions = SUGGESTIONS.filter(suggestion =>
    suggestion.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-md font-semibold text-gray-900">Hospitality Rider</h4>
      
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                Requirement
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wide w-24">
                Required
              </th>
              <th className="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-100">
            {/* Requirement Rows */}
            {requirements.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50">
                {/* Requirement */}
                <td className="px-3 py-2 border-r border-gray-100 relative">
                  {editingId === req.id ? (
                    <div className="relative">
                      <input
                        ref={(el) => { inputRefs.current[req.id] = el; }}
                        type="text"
                        value={req.requirement}
                        onChange={(e) => {
                          updateRequirement(req.id, 'requirement', e.target.value);
                          setSearchTerm(e.target.value);
                        }}
                        onFocus={() => setShowSuggestions(req.id)}
                        onBlur={() => {
                          setTimeout(() => {
                            setEditingId(null);
                            setShowSuggestions(null);
                          }, 200);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, req.id)}
                        placeholder="Type requirement..."
                        className="hosp-suggestions-input w-full text-sm border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded px-1 py-1"
                      />
                      
                      {/* Autocomplete Suggestions */}
                      {showSuggestions === req.id && filteredSuggestions.length > 0 && (
                        <div 
                          className="hosp-suggestions-dropdown fixed bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto z-[9999] min-w-[200px]"
                          style={{
                            top: (inputRefs.current[req.id]?.getBoundingClientRect()?.bottom || 0) + window.scrollY + 4,
                            left: (inputRefs.current[req.id]?.getBoundingClientRect()?.left || 0) + window.scrollX,
                            width: inputRefs.current[req.id]?.getBoundingClientRect()?.width || 200
                          }}
                          onWheel={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          onScroll={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {filteredSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updateRequirement(req.id, 'requirement', suggestion);
                                setShowSuggestions(null);
                                setSearchTerm('');
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingId(req.id)}
                      className="text-left w-full text-sm text-gray-900 hover:text-blue-600"
                    >
                      {req.requirement || 'Click to add requirement...'}
                    </button>
                  )}
                </td>

                {/* Required Checkbox */}
                <td className="px-3 py-2 border-r border-gray-100 text-center">
                  <input
                    type="checkbox"
                    checked={req.required}
                    onChange={(e) => updateRequirement(req.id, 'required', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>

                {/* Remove Button */}
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRequirement(req.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove requirement"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Add Row Button */}
            <tr className="bg-gray-50">
              <td colSpan={3} className="px-3 py-2">
                <button
                  type="button"
                  onClick={addRequirement}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Hospitality Requirement
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
} 
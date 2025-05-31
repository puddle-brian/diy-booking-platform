'use client';

import { useState, useEffect, useRef } from 'react';

interface LocationSuggestion {
  id: string;
  displayName: string;
  city: string;
  state: string | null;
  country: string;
  venueCount: number;
  artistCount: number;
  totalCount: number;
  description: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "e.g., London, UK or Seattle, WA",
  required = false,
  className = "",
  label = "Location",
  showLabel = true
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.length >= 2) {
        searchLocations(value);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const searchLocations = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.displayName);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0 && value.length >= 2) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding dropdown to allow clicks
    setTimeout(() => {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // Format input value as user types (basic city, state formatting)
  const formatLocation = (input: string): string => {
    // Simple formatting: capitalize first letters and add comma before state abbreviations
    const parts = input.split(',').map(part => part.trim());
    if (parts.length === 2) {
      const city = parts[0].replace(/\b\w/g, l => l.toUpperCase());
      const state = parts[1].toUpperCase();
      return `${city}, ${state}`;
    }
    return input.replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && '*'}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          autoComplete="off"
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Location icon */}
        {!loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{suggestion.displayName}</div>
                  <div className="text-sm text-gray-500">{suggestion.description}</div>
                </div>
                {suggestion.totalCount > 0 && (
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    {suggestion.venueCount > 0 && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {suggestion.venueCount} venues
                      </span>
                    )}
                    {suggestion.artistCount > 0 && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {suggestion.artistCount} artists
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
          
          {/* Add custom location option */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500">
              💡 Don't see your location? You can type any city/region - we'll help expand the network!
            </div>
          </div>
        </div>
      )}
      
      {/* Helper text */}
      <p className="text-xs text-gray-500 mt-1">
        {value && suggestions.length === 0 && value.length >= 2 && !loading
          ? "New location - we'll help you connect with venues in this area!"
          : "Start typing to see locations with existing venues and artists worldwide"
        }
      </p>
    </div>
  );
} 
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
  type: 'location';
}

interface VenueSuggestion {
  id: string;
  name: string;
  city: string;
  state: string;
  venueType: string;
  capacity: number;
  type: 'venue';
}

type SearchSuggestion = LocationSuggestion | VenueSuggestion;

interface LocationVenueAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
  showLabel?: boolean;
  preSelectedVenue?: { id: string; name: string; } | null; // For pre-filling from Request Show button
}

export default function LocationVenueAutocomplete({
  value,
  onChange,
  placeholder = "Type location or venue name...",
  required = false,
  className = "",
  label = "Location or Venue",
  showLabel = true,
  preSelectedVenue = null
}: LocationVenueAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize with pre-selected venue if provided (only once, and only if user hasn't interacted)
  useEffect(() => {
    if (preSelectedVenue && !value && !hasUserInteracted) {
      onChange(`venue:${preSelectedVenue.id}:${preSelectedVenue.name}`);
    }
  }, [preSelectedVenue, value, onChange, hasUserInteracted]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.length >= 2 && !value.startsWith('venue:')) {
        searchLocationsAndVenues(value);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const searchLocationsAndVenues = async (query: string) => {
    setLoading(true);
    try {
      // Search both locations and venues in parallel
      const [locationsResponse, venuesResponse] = await Promise.all([
        fetch(`/api/locations?q=${encodeURIComponent(query)}&limit=4`),
        fetch(`/api/venues?search=${encodeURIComponent(query)}&limit=4`)
      ]);
      
      const allSuggestions: SearchSuggestion[] = [];
      
      // Add location suggestions
      if (locationsResponse.ok) {
        const locationData = await locationsResponse.json();
        const locationSuggestions: LocationSuggestion[] = locationData.map((loc: any) => ({
          ...loc,
          type: 'location' as const
        }));
        allSuggestions.push(...locationSuggestions);
      }
      
      // Add venue suggestions - venues come directly as array, not nested
      if (venuesResponse.ok) {
        const venueData = await venuesResponse.json();
        const venueSuggestions: VenueSuggestion[] = (Array.isArray(venueData) ? venueData : []).map((venue: any) => ({
          id: venue.id,
          name: venue.name,
          city: venue.city,
          state: venue.state,
          venueType: venue.venueType,
          capacity: venue.capacity,
          type: 'venue' as const
        }));
        allSuggestions.push(...venueSuggestions);
      }
      
      setSuggestions(allSuggestions);
      setShowDropdown(allSuggestions.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching locations and venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHasUserInteracted(true); // Mark that user has manually interacted
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'venue') {
      // Special format for venues: "venue:id:name"
      onChange(`venue:${suggestion.id}:${suggestion.name}`);
    } else {
      // Regular location string
      onChange(suggestion.displayName);
    }
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

  // Display value - show friendly name for venue selections
  const getDisplayValue = () => {
    if (value.startsWith('venue:')) {
      const parts = value.split(':');
      return parts[2] || value; // Return venue name
    }
    return value;
  };

  // Group suggestions by type
  const locationSuggestions = suggestions.filter(s => s.type === 'location') as LocationSuggestion[];
  const venueSuggestions = suggestions.filter(s => s.type === 'venue') as VenueSuggestion[];

  // Smart relevance scoring for intermingling
  const getSuggestionRelevance = (suggestion: SearchSuggestion, query: string): number => {
    const searchTerm = query.toLowerCase().trim();
    let score = 0;
    
    if (suggestion.type === 'venue') {
      const venue = suggestion;
      // Exact name match gets highest score
      if (venue.name.toLowerCase() === searchTerm) score += 100;
      // Name starts with query gets high score  
      else if (venue.name.toLowerCase().startsWith(searchTerm)) score += 80;
      // Name contains query gets medium score
      else if (venue.name.toLowerCase().includes(searchTerm)) score += 60;
      
      // City match gets points
      if (venue.city.toLowerCase().includes(searchTerm)) score += 40;
      if (venue.state.toLowerCase().includes(searchTerm)) score += 30;
    } else {
      const location = suggestion;
      // Exact city match gets highest score
      if (location.city.toLowerCase() === searchTerm) score += 90;
      // City starts with query gets high score
      else if (location.city.toLowerCase().startsWith(searchTerm)) score += 70;
      // Display name contains query gets medium score
      else if (location.displayName.toLowerCase().includes(searchTerm)) score += 50;
      
      // Boost for having venues/artists (more useful locations)
      if (location.totalCount > 0) score += 20;
    }
    
    return score;
  };

  // Create intermingled, sorted suggestions
  const sortedSuggestions = suggestions
    .map(suggestion => ({
      suggestion,
      relevance: getSuggestionRelevance(suggestion, value)
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .map(item => item.suggestion);

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
          value={getDisplayValue()}
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
        
        {/* Icon - venue if venue selected, location otherwise */}
        {!loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {value.startsWith('venue:') ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Unified suggestions dropdown - no sections, sorted by relevance */}
      {showDropdown && sortedSuggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {sortedSuggestions.map((suggestion, index) => {
            if (suggestion.type === 'venue') {
              const venue = suggestion;
              return (
                <button
                  key={`venue-${venue.id}`}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-green-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    index === selectedIndex ? 'bg-green-50 border-green-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {venue.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {venue.city}, {venue.state} • {venue.capacity} cap • {venue.venueType.replace('-', ' ')}
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      Venue
                    </div>
                  </div>
                </button>
              );
            } else {
              const location = suggestion;
              return (
                <button
                  key={`location-${location.id}`}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {location.displayName}
                      </div>
                      <div className="text-sm text-gray-500">{location.description}</div>
                    </div>
                    {location.totalCount > 0 && (
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        {location.venueCount > 0 && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {location.venueCount} venues
                          </span>
                        )}
                        {location.artistCount > 0 && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {location.artistCount} artists
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            }
          })}
          
          {/* Helper text */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500">
              💡 <strong>Venues</strong> = Direct request to specific venue • <strong>Locations</strong> = Open to all venues in area
            </div>
          </div>
        </div>
      )}
      
      {/* Helper text */}
      <p className="text-xs text-gray-500 mt-1">
        {value.startsWith('venue:')
          ? "✅ Venue selected - request will go directly to this venue"
          : value && suggestions.length === 0 && value.length >= 2 && !loading
          ? "New location - we'll help you connect with venues in this area!"
          : "Start typing to see specific venues or general locations"
        }
      </p>
    </div>
  );
} 
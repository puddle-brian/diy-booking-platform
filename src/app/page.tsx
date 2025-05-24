'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Venue, Artist, VenueType, ArtistType, VENUE_TYPE_LABELS, ARTIST_TYPE_LABELS } from '../../types';

// Multi-select dropdown component
function MultiSelectDropdown({ 
  label, 
  options, 
  selectedValues, 
  onSelectionChange, 
  placeholder = "All"
}: {
  label: string;
  options: Record<string, string>;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return `All ${label}`;
    if (selectedValues.length === 1) return options[selectedValues[0]];
    return `${selectedValues.length} ${label} selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black min-w-[160px]"
      >
        <span className="truncate">{getDisplayText()}</span>
        <svg 
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            {selectedValues.length > 0 && (
              <button
                onClick={() => onSelectionChange([])}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Clear all
              </button>
            )}
            {Object.entries(options).map(([value, label]) => (
              <label
                key={value}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={() => handleToggleOption(value)}
                  className="mr-3 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="flex-1">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get initial tab from URL parameter, default to 'venues' if not specified
  const [activeTab, setActiveTab] = useState<'venues' | 'artists'>(() => {
    const tabParam = searchParams.get('tab');
    return (tabParam === 'artists' || tabParam === 'venues') ? tabParam : 'venues';
  });
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [selectedArtistTypes, setSelectedArtistTypes] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAgeRestrictions, setSelectedAgeRestrictions] = useState<string[]>([]);
  const [selectedCapacities, setSelectedCapacities] = useState<string[]>([]);
  const [selectedDraws, setSelectedDraws] = useState<string[]>([]);
  const [selectedTourStatus, setSelectedTourStatus] = useState<string[]>([]);
  
  // Search states
  const [venueSearchLocation, setVenueSearchLocation] = useState('');
  const [venueSearchDate, setVenueSearchDate] = useState('');
  const [artistSearchLocation, setArtistSearchLocation] = useState('');
  const [artistSearchDate, setArtistSearchDate] = useState('');

  // Genre options
  const genreOptions = {
    'punk': 'Punk',
    'hardcore': 'Hardcore', 
    'folk': 'Folk',
    'indie': 'Indie',
    'metal': 'Metal',
    'electronic': 'Electronic',
    'experimental': 'Experimental',
    'country': 'Country',
    'hip-hop': 'Hip-Hop',
    'jazz': 'Jazz',
    'rock': 'Rock',
    'emo': 'Emo',
    'acoustic': 'Acoustic',
    'post-hardcore': 'Post-Hardcore',
    'alternative': 'Alternative'
  };

  const ageRestrictionOptions = {
    'all-ages': 'All Ages',
    '18+': '18+',
    '21+': '21+'
  };

  // Capacity range options for venues
  const capacityOptions = {
    '0-50': 'Under 50',
    '50-200': '50-200',
    '200-500': '200-500',
    '500+': '500+'
  };

  // Expected draw options for artists
  const drawOptions = {
    'local': 'Local (0-50)',
    'regional': 'Regional (50-200)', 
    'national': 'National (200+)',
    'international': 'International'
  };

  // Tour status options for artists
  const tourStatusOptions = {
    'seeking-shows': '🗺️ Looking for shows',
    'active': 'Actively touring',
    'selective': 'Selective booking',
    'local-only': 'Local shows only',
    'on-hiatus': 'On hiatus'
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [venuesResponse, artistsResponse] = await Promise.all([
        fetch('/api/venues'),
        fetch('/api/artists')
      ]);

      if (!venuesResponse.ok || !artistsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [venuesData, artistsData] = await Promise.all([
        venuesResponse.json(),
        artistsResponse.json()
      ]);

      setVenues(Array.isArray(venuesData) ? venuesData : []);
      setArtists(Array.isArray(artistsData) ? artistsData : []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setVenues([]);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter venues based on selected filters
  const filteredVenues = loading ? [] : (venues && Array.isArray(venues) ? venues : []).filter(venue => {
    // Safety check - ensure venue is a valid object
    if (!venue || typeof venue !== 'object') {
      return false;
    }

    try {
      // Location search - search in name, city, state, description
      if (venueSearchLocation && venueSearchLocation.trim()) {
        const searchTerm = venueSearchLocation.toLowerCase().trim();
        const searchableText = [
          venue.name || '',
          venue.city || '',
          venue.state || '',
          venue.description || '',
          `${venue.city || ''}, ${venue.state || ''}`
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Date availability check - wrapped in additional safety
      if (venueSearchDate && venueSearchDate.trim()) {
        try {
          if (!isVenueAvailableOnDate(venue, venueSearchDate)) {
            return false;
          }
        } catch (error) {
          console.warn('Error in date availability check:', error);
          // Continue filtering without date restriction if there's an error
        }
      }

      if (selectedVenueTypes.length > 0 && !selectedVenueTypes.includes(venue.venueType)) {
        return false;
      }
      if (selectedGenres.length > 0 && !selectedGenres.some(genre => venue.genres && venue.genres.includes(genre))) {
        return false;
      }
      if (selectedAgeRestrictions.length > 0 && !selectedAgeRestrictions.includes(venue.ageRestriction)) {
        return false;
      }
      if (selectedCapacities.length > 0) {
        const matchesCapacity = selectedCapacities.some(range => {
          const capacity = venue.capacity || 0;
          switch (range) {
            case '0-50': return capacity < 50;
            case '50-200': return capacity >= 50 && capacity <= 200;
            case '200-500': return capacity > 200 && capacity <= 500;
            case '500+': return capacity > 500;
            default: return false;
          }
        });
        if (!matchesCapacity) return false;
      }
      return true;
    } catch (error) {
      console.warn('Error filtering venue:', error, venue);
      return false; // Exclude problematic venues
    }
  });

  // Filter artists based on selected filters
  const filteredArtists = loading ? [] : (artists && Array.isArray(artists) ? artists : []).filter(artist => {
    // Safety check - ensure artist is a valid object
    if (!artist || typeof artist !== 'object') {
      return false;
    }

    try {
      // Location search - search in name, city, state, description
      if (artistSearchLocation && artistSearchLocation.trim()) {
        const searchTerm = artistSearchLocation.toLowerCase().trim();
        const searchableText = [
          artist.name || '',
          artist.city || '',
          artist.state || '',
          artist.description || '',
          `${artist.city || ''}, ${artist.state || ''}`
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Date availability check - wrapped in additional safety
      if (artistSearchDate && artistSearchDate.trim()) {
        try {
          if (!isArtistAvailableOnDate(artist, artistSearchDate)) {
            return false;
          }
        } catch (error) {
          console.warn('Error in artist date availability check:', error);
          // Continue filtering without date restriction if there's an error
        }
      }

      if (selectedArtistTypes.length > 0 && !selectedArtistTypes.includes(artist.artistType)) {
        return false;
      }
      if (selectedGenres.length > 0 && !selectedGenres.some(genre => artist.genres && artist.genres.includes(genre))) {
        return false;
      }
      if (selectedDraws.length > 0) {
        const matchesDraw = selectedDraws.some(range => {
          const expectedDraw = (artist.expectedDraw || '').toLowerCase();
          switch (range) {
            case 'local': 
              return expectedDraw.includes('local') || 
                     (expectedDraw.match(/\d+/) && parseInt(expectedDraw.match(/\d+/)?.[0] || '0') < 50);
            case 'regional': 
              return expectedDraw.includes('regional') || 
                     (expectedDraw.match(/\d+/) && parseInt(expectedDraw.match(/\d+/)?.[0] || '0') >= 50 && parseInt(expectedDraw.match(/\d+/)?.[0] || '0') <= 200);
            case 'national': 
              return expectedDraw.includes('national') || 
                     (expectedDraw.match(/\d+/) && parseInt(expectedDraw.match(/\d+/)?.[0] || '0') > 200);
            case 'international': 
              return expectedDraw.includes('international') || expectedDraw.includes('touring');
            default: return false;
          }
        });
        if (!matchesDraw) return false;
      }
      if (selectedTourStatus.length > 0) {
        const matchesTourStatus = selectedTourStatus.some(status => {
          switch (status) {
            case 'seeking-shows':
              // For now, simulate active tour requests - in real implementation we'd check tour requests
              // Artists with certain keywords in description or who are actively touring
              const description = (artist.description || '').toLowerCase();
              const tourStatus = (artist.tourStatus || '').toLowerCase();
              return description.includes('tour') || description.includes('dates') || 
                     description.includes('booking') || tourStatus.includes('active') ||
                     description.includes('shows') || description.includes('looking');
            case 'active':
              return artist.tourStatus === 'active';
            case 'local-only':
              return artist.tourStatus === 'local-only';
            case 'on-hiatus':
              return artist.tourStatus === 'hiatus';
            default: return false;
          }
        });
        if (!matchesTourStatus) return false;
      }
      return true;
    } catch (error) {
      console.warn('Error filtering artist:', error, artist);
      return false; // Exclude problematic artists
    }
  });

  const clearAllFilters = () => {
    setSelectedVenueTypes([]);
    setSelectedArtistTypes([]);
    setSelectedGenres([]);
    setSelectedAgeRestrictions([]);
    setSelectedCapacities([]);
    setSelectedDraws([]);
    setSelectedTourStatus([]);
    // Clear search inputs
    setVenueSearchLocation('');
    setVenueSearchDate('');
    setArtistSearchLocation('');
    setArtistSearchDate('');
  };

  // Helper function to check if a venue is available on a specific date
  const isVenueAvailableOnDate = (venue: Venue, dateString: string): boolean => {
    // Safety checks
    if (!venue || !dateString) return true;
    
    try {
      const searchDate = new Date(dateString);
      
      // Check if date is in blackout dates (if field exists)
      if (venue.blackoutDates && Array.isArray(venue.blackoutDates) && venue.blackoutDates.includes(dateString)) {
        return false;
      }

      // Check if date is already booked (if field exists)
      if (venue.bookedDates && Array.isArray(venue.bookedDates) && venue.bookedDates.some(booking => booking && booking.date === dateString && booking.confirmed)) {
        return false;
      }

      // Check if date falls within availability windows (if field exists)
      if (venue.availability && Array.isArray(venue.availability) && venue.availability.length > 0) {
        return venue.availability.some(window => {
          if (!window || !window.startDate || !window.endDate) return false;
          try {
            const startDate = new Date(window.startDate);
            const endDate = new Date(window.endDate);
            return searchDate >= startDate && searchDate <= endDate;
          } catch {
            return false;
          }
        });
      }

      // If no availability windows defined, assume available
      return true;
    } catch (error) {
      console.warn('Error checking venue availability:', error);
      return true; // Default to available if there's an error
    }
  };

  // Helper function to check if an artist is available on a specific date
  const isArtistAvailableOnDate = (artist: Artist, dateString: string): boolean => {
    // Safety checks
    if (!artist || !dateString) return true;
    
    try {
      const searchDate = new Date(dateString);
      
      // Check if date is already booked (if field exists)
      if (artist.bookedDates && Array.isArray(artist.bookedDates) && artist.bookedDates.some(booking => booking && booking.date === dateString && booking.confirmed)) {
        return false;
      }

      // Check if date falls within tour dates (if field exists)
      if (artist.tourDates && Array.isArray(artist.tourDates) && artist.tourDates.length > 0) {
        return artist.tourDates.some(window => {
          if (!window || !window.startDate || !window.endDate) return false;
          try {
            const startDate = new Date(window.startDate);
            const endDate = new Date(window.endDate);
            return searchDate >= startDate && searchDate <= endDate;
          } catch {
            return false;
          }
        });
      }

      // If no tour dates defined, assume available if active/local
      return artist.tourStatus === 'active' || artist.tourStatus === 'local-only';
    } catch (error) {
      console.warn('Error checking artist availability:', error);
      return true; // Default to available if there's an error
    }
  };

  const hasActiveFilters = selectedVenueTypes.length > 0 || selectedArtistTypes.length > 0 || 
                         selectedGenres.length > 0 || selectedAgeRestrictions.length > 0 ||
                         selectedCapacities.length > 0 || selectedDraws.length > 0 ||
                         selectedTourStatus.length > 0 ||
                         venueSearchLocation.trim() || venueSearchDate.trim() ||
                         artistSearchLocation.trim() || artistSearchDate.trim();

  // Update URL when tab changes
  const handleTabChange = (tab: 'venues' | 'artists') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  // Update activeTab when URL parameter changes (e.g., browser back/forward)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'artists' || tabParam === 'venues') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Centered Toggle */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Book Yr Life</h1>
          </div>
          
          {/* Centered Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleTabChange('venues')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'venues'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              🏠 Spaces
            </button>
            <button
              onClick={() => handleTabChange('artists')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'artists'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              🎵 Artists
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Prominent CTAs */}
            <a 
              href={activeTab === 'venues' ? '/admin/venues' : '/admin/artists'}
              className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
            >
              {activeTab === 'venues' ? '+ List a Space' : '+ List an Artist'}
            </a>
            
            {/* Regular Nav */}
            <nav className="hidden md:flex space-x-6">
              <a href="/admin" className="text-gray-700 hover:text-black">Admin</a>
              <a href="/auth/login" className="text-gray-700 hover:text-black">Sign In</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Dynamic Content */}
      {activeTab === 'venues' ? (
        // VENUES VIEW - Browse venues
        <section className="container mx-auto px-4 py-8">
          {/* Airbnb-style Search Bar */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2">
              <div className="flex items-center">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-1">
                  <div className="p-4">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Where</div>
                    <input
                      type="text"
                      placeholder="Search spaces"
                      value={venueSearchLocation}
                      onChange={(e) => setVenueSearchLocation(e.target.value)}
                      className="w-full text-sm placeholder-gray-500 border-none outline-none"
                    />
                  </div>
                  <div className="p-4 border-l border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-1">When</div>
                    <input
                      type="date"
                      placeholder="Show date"
                      value={venueSearchDate}
                      onChange={(e) => setVenueSearchDate(e.target.value)}
                      className="w-full text-sm placeholder-gray-500 border-none outline-none"
                      min={new Date().toISOString().split('T')[0]} // Can't book in the past
                    />
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-12 h-12 bg-black text-white rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-wrap gap-3 items-center justify-center">
              <MultiSelectDropdown
                label="Venue Types"
                options={VENUE_TYPE_LABELS}
                selectedValues={selectedVenueTypes}
                onSelectionChange={setSelectedVenueTypes}
              />
              
              <MultiSelectDropdown
                label="Genres"
                options={genreOptions}
                selectedValues={selectedGenres}
                onSelectionChange={setSelectedGenres}
              />
              
              <MultiSelectDropdown
                label="Ages"
                options={ageRestrictionOptions}
                selectedValues={selectedAgeRestrictions}
                onSelectionChange={setSelectedAgeRestrictions}
              />

              <MultiSelectDropdown
                label="Capacity"
                options={capacityOptions}
                selectedValues={selectedCapacities}
                onSelectionChange={setSelectedCapacities}
              />

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-600 hover:text-black underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
            
            {/* Active Filter Summary */}
            {hasActiveFilters && (
              <div className="mt-3 text-sm text-gray-600">
                Showing {filteredVenues.length} of {venues.length} spaces
                {venueSearchLocation.trim() && (
                  <span className="ml-2 text-blue-600">
                    • searching "{venueSearchLocation}"
                  </span>
                )}
                {venueSearchDate && (
                  <span className="ml-2 text-blue-600">
                    • available {new Date(venueSearchDate).toLocaleDateString()}
                  </span>
                )}
                {selectedVenueTypes.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedVenueTypes.length} venue type{selectedVenueTypes.length !== 1 ? 's' : ''}
                  </span>
                )}
                {selectedGenres.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''}
                  </span>
                )}
                {selectedAgeRestrictions.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedAgeRestrictions.length} age filter{selectedAgeRestrictions.length !== 1 ? 's' : ''}
                  </span>
                )}
                {selectedCapacities.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedCapacities.length} capacity range{selectedCapacities.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Venues Grid */}
          <div className="max-w-7xl mx-auto">
            {loading ? (
              // Loading state
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-300"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVenues.length === 0 ? (
              // Empty state
              <div className="col-span-full text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏠</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {venueSearchLocation.trim() ? `No spaces found for "${venueSearchLocation}"` : 
                     hasActiveFilters ? 'No matching spaces found' : 'Help Build the Network'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {venueSearchLocation.trim() ? `Try searching for a different city or venue name, or browse all spaces below.` :
                     hasActiveFilters 
                      ? 'Try adjusting your filters to see more results.'
                      : 'Know a DIY space, basement, record store, or community center that hosts shows? Add it to help touring artists discover authentic venues.'
                    }
                  </p>
                  <div className="space-y-3">
                    {hasActiveFilters ? (
                      <button
                        onClick={clearAllFilters}
                        className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 font-medium"
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <a 
                        href="/admin/venues" 
                        className="block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 font-medium"
                      >
                        + List a Space
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Venue cards
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredVenues.map((venue) => (
                  <Link key={venue.id} href={`/venues/${venue.id}`}>
                    <div className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-square relative">
                        <img 
                          src={venue.images[0] || '/api/placeholder/other'} 
                          alt={venue.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/api/placeholder/other';
                          }}
                        />
                        <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{venue.name}</h3>
                          {venue.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-medium">{venue.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{venue.city}, {venue.state}</p>
                        <p className="text-sm text-gray-500 mb-3 capitalize">
                          {VENUE_TYPE_LABELS[venue.venueType]} • {venue.ageRestriction} • 
                          {venue.equipment.pa ? ' PA system' : ' No PA'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold">{venue.capacity}</span>
                            <span className="text-sm text-gray-600"> capacity</span>
                          </div>
                          {venue.equipment.pa && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">PA System</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Load More */}
          {filteredVenues.length > 0 && (
            <div className="text-center mt-12">
              <button className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Show more spaces
              </button>
            </div>
          )}
        </section>
      ) : (
        // ARTISTS VIEW - Browse artists
        <section className="container mx-auto px-4 py-8">
          {/* Search Bar for Artists */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2">
              <div className="flex items-center">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-1">
                  <div className="p-4">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Where</div>
                    <input
                      type="text"
                      placeholder="Search artists"
                      value={artistSearchLocation}
                      onChange={(e) => setArtistSearchLocation(e.target.value)}
                      className="w-full text-sm placeholder-gray-500 border-none outline-none"
                    />
                  </div>
                  <div className="p-4 border-l border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-1">When</div>
                    <input
                      type="date"
                      placeholder="Available dates"
                      value={artistSearchDate}
                      onChange={(e) => setArtistSearchDate(e.target.value)}
                      className="w-full text-sm placeholder-gray-500 border-none outline-none"
                      min={new Date().toISOString().split('T')[0]} // Can't book in the past
                    />
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-12 h-12 bg-black text-white rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Dropdowns for Artists */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-wrap gap-3 items-center justify-center">
              <MultiSelectDropdown
                label="Artist Types"
                options={ARTIST_TYPE_LABELS}
                selectedValues={selectedArtistTypes}
                onSelectionChange={setSelectedArtistTypes}
              />
              
              <MultiSelectDropdown
                label="Genres"
                options={genreOptions}
                selectedValues={selectedGenres}
                onSelectionChange={setSelectedGenres}
              />

              <MultiSelectDropdown
                label="Expected Draw"
                options={drawOptions}
                selectedValues={selectedDraws}
                onSelectionChange={setSelectedDraws}
              />

              <MultiSelectDropdown
                label="Tour Status"
                options={tourStatusOptions}
                selectedValues={selectedTourStatus}
                onSelectionChange={setSelectedTourStatus}
              />

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-600 hover:text-black underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
            
            {/* Active Filter Summary */}
            {hasActiveFilters && (
              <div className="mt-3 text-sm text-gray-600">
                Showing {filteredArtists.length} of {artists.length} artists
                {artistSearchLocation.trim() && (
                  <span className="ml-2 text-blue-600">
                    • searching "{artistSearchLocation}"
                  </span>
                )}
                {artistSearchDate && (
                  <span className="ml-2 text-blue-600">
                    • available {new Date(artistSearchDate).toLocaleDateString()}
                  </span>
                )}
                {selectedArtistTypes.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedArtistTypes.length} artist type{selectedArtistTypes.length !== 1 ? 's' : ''}
                  </span>
                )}
                {selectedGenres.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''}
                  </span>
                )}
                {selectedDraws.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedDraws.length} draw range{selectedDraws.length !== 1 ? 's' : ''}
                  </span>
                )}
                {selectedTourStatus.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedTourStatus.length} tour status{selectedTourStatus.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Artists Grid */}
          <div className="max-w-7xl mx-auto">
            {loading ? (
              // Loading state
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-300"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArtists.length === 0 ? (
              // Empty state
              <div className="col-span-full text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {artistSearchLocation.trim() ? `No artists found for "${artistSearchLocation}"` : 
                     hasActiveFilters ? 'No matching artists found' : 'Showcase DIY Artists'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {artistSearchLocation.trim() ? `Try searching for a different city or artist name, or browse all artists below.` :
                     hasActiveFilters 
                      ? 'Try adjusting your filters to see more results.'
                      : 'Know touring bands, solo artists, or collectives looking for authentic venues? Add them to connect with spaces that book real music.'
                    }
                  </p>
                  <div className="space-y-3">
                    {hasActiveFilters ? (
                      <button
                        onClick={clearAllFilters}
                        className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 font-medium"
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <a 
                        href="/admin/artists" 
                        className="block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 font-medium"
                      >
                        + List an Artist
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Artist cards
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredArtists.map((artist) => (
                  <Link key={artist.id} href={`/artists/${artist.id}`}>
                    <div className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-square relative">
                        <img 
                          src={artist.images?.[0] || `/api/placeholder/${artist.artistType}`}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `/api/placeholder/${artist.artistType}`;
                          }}
                        />
                        <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        
                        {/* Tour Status Badge */}
                        {(() => {
                          const description = (artist.description || '').toLowerCase();
                          const tourStatus = (artist.tourStatus || '').toLowerCase();
                          const isSeekingShows = description.includes('tour') || description.includes('dates') || 
                                               description.includes('booking') || tourStatus.includes('active') ||
                                               description.includes('shows') || description.includes('looking');
                          
                          if (isSeekingShows || artist.tourStatus === 'active') {
                            return (
                              <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                🗺️ Seeking shows
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{artist.name}</h3>
                          {artist.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-medium">{artist.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{artist.city}, {artist.state}</p>
                        <p className="text-sm text-gray-500 mb-3 capitalize">
                          {ARTIST_TYPE_LABELS[artist.artistType]} • {artist.tourStatus} • 
                          {artist.equipment.acoustic ? ' Acoustic' : ' Full band'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold">{artist.expectedDraw}</span>
                            <span className="text-sm text-gray-600"> draw</span>
                          </div>
                          {artist.equipment.acoustic && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Acoustic</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Load More */}
          {filteredArtists.length > 0 && (
            <div className="text-center mt-12">
              <button className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Show more artists
              </button>
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">B</span>
                </div>
                <span className="font-bold">Book Yr Life</span>
              </div>
              <p className="text-sm text-gray-600">
                Connecting DIY spaces with touring artists worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">For Artists</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><a href="/" className="hover:text-black">Find Spaces</a></li>
                <li><a href="/admin/artists" className="hover:text-black">List Your Project</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">For Spaces</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><a href="/admin/venues" className="hover:text-black">List Your Space</a></li>
                <li><a href="/" className="hover:text-black">Find Artists</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><a href="/admin" className="hover:text-black">Admin</a></li>
                <li><a href="/auth/login" className="hover:text-black">Sign In</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
            <p>© 2024 Book Yr Life. Connecting the underground music community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
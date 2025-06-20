'use client';

import { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Venue, Artist, VenueType, ArtistType, VENUE_TYPE_LABELS, ARTIST_TYPE_LABELS, CAPACITY_OPTIONS, ARTIST_STATUS_OPTIONS, getGenresForArtistTypes, type ArtistStatus } from '../../types/index';
import LocationSorting from '../components/LocationSorting';
import CommunitySection from '../components/CommunitySection';
import UserStatus from '../components/UserStatus';
import SmartGallery from '../components/SmartGallery';
import { MobileFeedbackButton } from '../components/FeedbackWidget';
import { useAuth } from '../contexts/AuthContext';
import AuthLink from '../components/AuthLink';
import FavoriteButton from '../components/FavoriteButton';

// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Get initial tab from URL parameter, default to 'venues' if not specified
  const [activeTab, setActiveTab] = useState<'venues' | 'artists'>(() => {
    const tabParam = searchParams?.get('tab');
    return (tabParam === 'artists' || tabParam === 'venues') ? tabParam : 'venues';
  });
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [tourRequests, setTourRequests] = useState<any[]>([]);
  const [userVenue, setUserVenue] = useState<Venue | null>(null);
  
  // Filter states
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [selectedArtistTypes, setSelectedArtistTypes] = useState<string[]>([]);
  const [selectedArtistTypesWelcome, setSelectedArtistTypesWelcome] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAgeRestrictions, setSelectedAgeRestrictions] = useState<string[]>([]);
  const [selectedCapacities, setSelectedCapacities] = useState<string[]>([]);
  const [selectedDraws, setSelectedDraws] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  
  // Mobile filters state
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Search states - with immediate and debounced versions
  const [venueSearchLocation, setVenueSearchLocation] = useState('');
  const [artistSearchLocation, setArtistSearchLocation] = useState('');

  // Debounced search values for better performance
  const debouncedVenueLocation = useDebounce(venueSearchLocation, 300);
  const debouncedArtistLocation = useDebounce(artistSearchLocation, 300);

  // Genre options - dynamic based on selected artist types
  const genreOptions = useMemo(() => {
    if (selectedArtistTypes.length === 0) {
      // If no artist types selected, show a general set of popular genres
      return {
        'punk': 'Punk',
        'hardcore': 'Hardcore',
        'indie-rock': 'Indie Rock',
        'folk-acoustic': 'Folk/Acoustic',
        'electronic': 'Electronic',
        'hip-hop': 'Hip-Hop',
        'experimental': 'Experimental',
        'jazz': 'Jazz',
        'metal': 'Metal',
        'comedy': 'Comedy',
        'poetry': 'Poetry'
      };
    }
    
    // Get genres for selected artist types
    const genres = getGenresForArtistTypes(selectedArtistTypes as ArtistType[]);
    return Object.fromEntries(
      genres.map(genre => [genre.value, genre.label])
    );
  }, [selectedArtistTypes]);

  const ageRestrictionOptions = {
    'all-ages': 'All Ages',
    '18+': '18+',
    '21+': '21+'
  };

  // Capacity range options for venues
  const capacityOptions = Object.fromEntries(
    CAPACITY_OPTIONS.map(option => [option.value, option.label])
  );

  // Expected draw options for artists
  const drawOptions = {
    'local': 'Local (0-50)',
    'regional': 'Regional (50-200)', 
    'national': 'National (200+)',
    'international': 'International'
  };

  // Tour status options for artists
  const tourStatusOptions = Object.fromEntries(
    ARTIST_STATUS_OPTIONS.map(option => [option.value, option.label])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      // REVERT: Load ALL data to ensure nothing is missing (like Lightning Bolt)
      const [venuesResponse, artistsResponse] = await Promise.all([
        fetch('/api/venues'), // Load ALL venues
        fetch('/api/artists') // Load ALL artists
      ]);

      if (!venuesResponse.ok || !artistsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [venuesData, artistsData] = await Promise.all([
        venuesResponse.json(),
        artistsResponse.json()
      ]);

      // Handle both old format (array) and new paginated format
      setVenues(Array.isArray(venuesData) ? venuesData : (venuesData.venues || []));
      setArtists(Array.isArray(artistsData) ? artistsData : (artistsData.artists || []));
      
      // Load tour requests for location-based sorting
      try {
        const tourRequestsResponse = await fetch('/api/show-requests?initiatedBy=ARTIST&status=OPEN'); // 🎯 PHASE 5: Updated to use show-requests API
        if (tourRequestsResponse.ok) {
          const tourRequestsData = await tourRequestsResponse.json();
          setTourRequests(Array.isArray(tourRequestsData) ? tourRequestsData : []);
        }
      } catch (error) {
        console.error('Failed to load tour requests:', error);
        setTourRequests([]);
      }

      // Skip venue loading for now since profileType doesn't exist in User interface
      // if (user?.profileType === 'venue' && user?.profileId) {
      //   try {
      //     const userVenueResponse = await fetch(`/api/venues/${user.profileId}`);
      //     if (userVenueResponse.ok) {
      //       const userVenueData = await userVenueResponse.json();
      //       setUserVenue(userVenueData);
      //     }
      //   } catch (error) {
      //     console.error('Failed to load user venue:', error);
      //     setUserVenue(null);
      //   }
      // } else {
      //   setUserVenue(null);
      // }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setVenues([]);
      setArtists([]);
      setTourRequests([]);
      setUserVenue(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Filter venues based on selected filters - memoized for performance
  const filteredVenues = useMemo(() => {
    if (loading || !venues || !Array.isArray(venues)) return [];
    
    return venues.filter(venue => {
      // Safety check - ensure venue is a valid object
      if (!venue || typeof venue !== 'object') {
        return false;
      }

      try {
        // Location search - search in name, city, state, description (CASE INSENSITIVE)
        if (debouncedVenueLocation && debouncedVenueLocation.trim()) {
          const searchTerm = debouncedVenueLocation.toLowerCase().trim();
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

        if (selectedVenueTypes.length > 0 && !selectedVenueTypes.includes(venue.venueType)) {
          return false;
        }
        if (selectedArtistTypesWelcome.length > 0) {
          // Check if venue welcomes any of the selected artist types
          // If venue has no specific artist types (welcomes all), it should match
          if (venue.artistTypesWelcome && venue.artistTypesWelcome.length > 0) {
            // Venue has specific artist types - check for overlap
            if (!selectedArtistTypesWelcome.some(type => venue.artistTypesWelcome.includes(type))) {
              return false;
            }
          }
          // If venue.artistTypesWelcome is empty or undefined, it welcomes all types (matches)
        }
        if (selectedAgeRestrictions.length > 0 && !selectedAgeRestrictions.includes(venue.ageRestriction)) {
          return false;
        }
        if (selectedGenres.length > 0 && !selectedGenres.some(genre => venue.genres && venue.genres.includes(genre))) {
          return false;
        }
        if (selectedCapacities.length > 0) {
          const matchesCapacity = selectedCapacities.some(minCapacity => {
            const capacity = venue.capacity || 0;
            const minCap = parseInt(minCapacity);
            return capacity >= minCap;
          });
          if (!matchesCapacity) return false;
        }
        return true;
      } catch (error) {
        console.warn('Error filtering venue:', error, venue);
        return false; // Exclude problematic venues
      }
    });
  }, [
    loading, 
    venues, 
    debouncedVenueLocation, 
    selectedVenueTypes, 
    selectedArtistTypesWelcome, 
    selectedAgeRestrictions, 
    selectedGenres, 
    selectedCapacities
  ]);

  // Filter artists based on selected filters - memoized for performance
  const filteredArtists = useMemo(() => {
    if (loading || !artists || !Array.isArray(artists)) return [];
    
    return artists.filter(artist => {
      // Safety check - ensure artist is a valid object
      if (!artist || typeof artist !== 'object') {
        return false;
      }

      try {
        // Location search - search in name, city, state, description
        if (debouncedArtistLocation && debouncedArtistLocation.trim()) {
          const searchTerm = debouncedArtistLocation.toLowerCase().trim();
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

        if (selectedArtistTypes.length > 0 && !selectedArtistTypes.includes(artist.artistType)) {
          return false;
        }
        if (selectedGenres.length > 0) {
          // If artist has no genres, treat as "matches all" (don't filter out)
          // Only filter out if artist has genres but none match the selected ones
          if (artist.genres && artist.genres.length > 0) {
            if (!selectedGenres.some(genre => artist.genres.includes(genre))) {
              return false;
            }
          }
          // If artist.genres is empty/undefined, they match all genre searches (don't filter out)
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
        if (selectedStatus.length > 0) {
          const matchesStatus = selectedStatus.some(status => {
            switch (status) {
              case 'seeking-shows':
                return artist.status === 'seeking-shows';
              case 'not-seeking':
                return artist.status === 'not-seeking';
              default:
                return false;
            }
          });
          if (!matchesStatus) return false;
        }
        return true;
      } catch (error) {
        console.warn('Error filtering artist:', error, artist);
        return false; // Exclude problematic artists
      }
    });
  }, [
    loading, 
    artists, 
    debouncedArtistLocation, 
    selectedArtistTypes, 
    selectedGenres, 
    selectedDraws, 
    selectedStatus
  ]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    if (activeTab === 'venues') {
      return selectedVenueTypes.length > 0 || 
             selectedArtistTypesWelcome.length > 0 || 
             selectedAgeRestrictions.length > 0 || 
             selectedCapacities.length > 0 || 
             debouncedVenueLocation.trim().length > 0;
    } else {
      return selectedArtistTypes.length > 0 || 
             selectedGenres.length > 0 || 
             selectedDraws.length > 0 || 
             selectedStatus.length > 0 || 
             debouncedArtistLocation.trim().length > 0;
    }
  }, [
    activeTab,
    selectedVenueTypes, selectedArtistTypesWelcome, selectedAgeRestrictions, selectedCapacities, debouncedVenueLocation,
    selectedArtistTypes, selectedGenres, selectedDraws, selectedStatus, debouncedArtistLocation
  ]);

  // Optimized clear filters function
  const clearAllFilters = () => {
    setSelectedVenueTypes([]);
    setSelectedArtistTypes([]);
    setSelectedArtistTypesWelcome([]);
    setSelectedGenres([]);
    setSelectedAgeRestrictions([]);
    setSelectedCapacities([]);
    setSelectedDraws([]);
    setSelectedStatus([]);
    setVenueSearchLocation('');
    setArtistSearchLocation('');
  };

  // Update URL when filters change (debounced to avoid too many history entries)
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    
    // Update search parameters in URL
    if (debouncedVenueLocation.trim()) {
      params.set('venueLocation', debouncedVenueLocation);
    } else {
      params.delete('venueLocation');
    }
    
    if (debouncedArtistLocation.trim()) {
      params.set('artistLocation', debouncedArtistLocation);
    } else {
      params.delete('artistLocation');
    }

    // Update filter parameters
    if (selectedVenueTypes.length > 0) {
      params.set('venueTypes', selectedVenueTypes.join(','));
    } else {
      params.delete('venueTypes');
    }

    if (selectedArtistTypes.length > 0) {
      params.set('artistTypes', selectedArtistTypes.join(','));
    } else {
      params.delete('artistTypes');
    }

    if (selectedArtistTypesWelcome.length > 0) {
      params.set('artistTypesWelcome', selectedArtistTypesWelcome.join(','));
    } else {
      params.delete('artistTypesWelcome');
    }

    if (selectedGenres.length > 0) {
      params.set('genres', selectedGenres.join(','));
    } else {
      params.delete('genres');
    }

    // Only update URL if there are actual changes
    const newUrl = `/?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) {
      router.replace(newUrl, { scroll: false });
    }
  }, [
    debouncedVenueLocation, debouncedArtistLocation,
    selectedVenueTypes, selectedArtistTypes, selectedArtistTypesWelcome, selectedGenres,
    router, searchParams
  ]);

  // Initialize filters from URL parameters on component mount
  useEffect(() => {
    const venueLocation = searchParams?.get('venueLocation');
    const artistLocation = searchParams?.get('artistLocation');
    const venueTypes = searchParams?.get('venueTypes');
    const artistTypes = searchParams?.get('artistTypes');
    const artistTypesWelcome = searchParams?.get('artistTypesWelcome');
    const genres = searchParams?.get('genres');

    if (venueLocation) setVenueSearchLocation(venueLocation);
    if (artistLocation) setArtistSearchLocation(artistLocation);
    if (venueTypes) setSelectedVenueTypes(venueTypes.split(','));
    if (artistTypes) setSelectedArtistTypes(artistTypes.split(','));
    if (artistTypesWelcome) setSelectedArtistTypesWelcome(artistTypesWelcome.split(','));
    if (genres) setSelectedGenres(genres.split(','));
  }, []); // Only run once on mount

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
      return artist.status === 'seeking-shows';
    } catch (error) {
      console.warn('Error checking artist availability:', error);
      return true; // Default to available if there's an error
    }
  };

  // Update URL when tab changes
  const handleTabChange = (tab: 'venues' | 'artists') => {
    setActiveTab(tab);
    // Collapse mobile filters when switching tabs
    setFiltersExpanded(false);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', tab);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  // Update activeTab when URL parameter changes (e.g., browser back/forward)
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'artists' || tabParam === 'venues') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Smart location-based artist sorting for venues
  const getLocationBasedArtistSections = useMemo(() => {
    if (!userVenue || activeTab !== 'artists') {
      return { sections: [], hasLocationData: false };
    }

    const venueCity = userVenue.city.toLowerCase();
    const venueState = userVenue.state.toLowerCase();
    
    // Artists seeking shows near this venue
    const artistsSeekingNearby = filteredArtists.filter(artist => {
      return tourRequests.some(request => {
        const requestLocation = request.city?.toLowerCase() + ', ' + request.state?.toLowerCase();
        const venueLocation = venueCity + ', ' + venueState;
        
        // Check if tour request is in the same city/state as venue
        return request.artistId === artist.id && 
               (requestLocation.includes(venueCity) || 
                requestLocation.includes(venueState) ||
                venueLocation.includes(request.city?.toLowerCase()) ||
                venueLocation.includes(request.state?.toLowerCase()));
      });
    });

    // Local artists (same city/state)
    const localArtists = filteredArtists.filter(artist => {
      const artistCity = artist.city.toLowerCase();
      const artistState = artist.state.toLowerCase();
      
      return (artistCity === venueCity || artistState === venueState) &&
             !artistsSeekingNearby.some(seeking => seeking.id === artist.id);
    });

    // Regional artists (within reasonable distance, not local)
    const regionalArtists = filteredArtists.filter(artist => {
      const artistState = artist.state.toLowerCase();
      
      // Define regional states (this could be more sophisticated with actual distance calculation)
      const regionalStates: { [key: string]: string[] } = {
        'ca': ['or', 'wa', 'nv', 'az'],
        'or': ['ca', 'wa', 'id'],
        'wa': ['or', 'ca', 'id'],
        'ny': ['nj', 'ct', 'pa', 'ma', 'vt'],
        'ma': ['ny', 'ct', 'ri', 'nh', 'vt'],
        'tx': ['ok', 'nm', 'ar', 'la'],
        'fl': ['ga', 'al', 'sc'],
        'il': ['in', 'wi', 'ia', 'mo'],
        // Add more regional groupings as needed
      };
      
      const venueRegionalStates = regionalStates[venueState] || [];
      
      return venueRegionalStates.includes(artistState) &&
             !artistsSeekingNearby.some(seeking => seeking.id === artist.id) &&
             !localArtists.some(local => local.id === artist.id);
    });

    // All other artists
    const otherArtists = filteredArtists.filter(artist => {
      return !artistsSeekingNearby.some(seeking => seeking.id === artist.id) &&
             !localArtists.some(local => local.id === artist.id) &&
             !regionalArtists.some(regional => regional.id === artist.id);
    });

    const sections = [
      {
        title: `Artists Seeking Shows Near ${userVenue.city}`,
        subtitle: `${artistsSeekingNearby.length} artists with active tour requests in your area`,
        artists: artistsSeekingNearby,
        priority: 'high' as const,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      {
        title: `Local Artists (${userVenue.state})`,
        subtitle: `${localArtists.length} artists based in your area`,
        artists: localArtists,
        priority: 'medium' as const,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      {
        title: `Regional Artists`,
        subtitle: `${regionalArtists.length} artists within touring distance`,
        artists: regionalArtists,
        priority: 'medium' as const,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      {
        title: `All Other Artists`,
        subtitle: `${otherArtists.length} artists from other regions`,
        artists: otherArtists,
        priority: 'low' as const,
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    ].filter(section => section.artists.length > 0);

    return { sections, hasLocationData: true };
  }, [userVenue, activeTab, filteredArtists, tourRequests]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Responsive Layout */}
      <header>
        {/* Desktop Layout - Hidden on mobile */}
        <div className="hidden md:block">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="diyshows logo" 
                className="w-8 h-8 rounded-sm"
                onError={(e) => {
                  // Fallback to the original "B" logo if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center hidden">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">diyshows <span className="text-sm font-normal text-gray-500">beta</span></h1>
            </div>
            
            {/* Centered Toggle */}
            <div className="absolute left-1/2 transform -translate-x-1/2" style={{ marginLeft: '-24px' }}>
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleTabChange('venues')}
                  className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'venues'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Spaces
                </button>
                <button
                  onClick={() => handleTabChange('artists')}
                  className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'artists'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Artists
                </button>
              </div>
            </div>
            
            {/* Right side - Just User Status */}
            <div className="flex items-center">
              <UserStatus />
            </div>
          </div>
        </div>

        {/* Mobile Layout - Hidden on desktop */}
        <div className="md:hidden">
          {/* Top: Search Bar */}
          <div className="bg-white sticky top-0 z-20 shadow-sm">
            <div className="container mx-auto px-4 pt-4 pb-2">
              <div className="bg-white rounded-full shadow-lg border border-gray-200 p-1">
                <div className="flex items-center">
                  <div className="flex-1 px-4 py-2">
                    <input
                      type="text"
                      placeholder={activeTab === 'venues' ? "Search spaces by name or location..." : "Search artists by name or location..."}
                      value={activeTab === 'venues' ? venueSearchLocation : artistSearchLocation}
                      onChange={(e) => activeTab === 'venues' ? setVenueSearchLocation(e.target.value) : setArtistSearchLocation(e.target.value)}
                      className="w-full text-sm placeholder-gray-500 border-none outline-none"
                    />
                  </div>
                  <div className="flex items-center pr-1">
                    {/* Filter Toggle Button - Circular to match search bar style */}
                    <button
                      onClick={() => setFiltersExpanded(!filtersExpanded)}
                      className="relative w-8 h-8 bg-gray-100 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                          {[
                            selectedVenueTypes.length,
                            selectedArtistTypesWelcome.length,
                            selectedAgeRestrictions.length + selectedCapacities.length,
                            debouncedVenueLocation.trim() ? 1 : 0
                          ].reduce((a, b) => a + b, 0)}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Spaces/Artists Toggle - directly underneath search */}
            <div className="container mx-auto px-4 pb-3">
              <div className="flex justify-center">
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleTabChange('venues')}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'venues'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    Spaces
                  </button>
                  <button
                    onClick={() => handleTabChange('artists')}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'artists'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    Artists
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            {/* Primary Actions Row */}
            <div className="flex items-center justify-center space-x-3 px-4 py-3 border-b border-gray-100">
              <Link 
                href="/venues/submit"
                className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm flex-1 text-center max-w-[140px]"
              >
                + List a Space
              </Link>
              
              <Link 
                href="/artists/submit"
                className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm flex-1 text-center max-w-[140px]"
              >
                + List an Artist
              </Link>
            </div>
            
            {/* User Status Row */}
            <div className="flex items-center justify-center px-4 py-2">
              <UserStatus />
              <MobileFeedbackButton />
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Content - Responsive */}
      {activeTab === 'venues' ? (
        // VENUES VIEW - Browse venues
        <section className="container mx-auto px-4 pb-24 md:py-8 md:pb-20 md:pt-0">
          {/* Desktop Search Bar - Hidden on mobile */}
          <div className="max-w-2xl mx-auto mb-6 md:mb-8 hidden md:block">
            <div className="bg-white rounded-full shadow-lg border border-gray-200 p-1">
              <div className="flex items-center">
                <div className="flex-1 px-4 py-2">
                  <input
                    type="text"
                    placeholder="Search spaces by name or location..."
                    value={venueSearchLocation}
                    onChange={(e) => setVenueSearchLocation(e.target.value)}
                    className="w-full text-sm placeholder-gray-500 border-none outline-none"
                  />
                </div>
                <div className="flex items-center pr-1">
                  {/* Filter Toggle Button - Circular to match search bar style */}
                  <button
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className="relative w-8 h-8 bg-gray-100 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                        {[
                          selectedVenueTypes.length,
                          selectedArtistTypesWelcome.length,
                          selectedAgeRestrictions.length + selectedCapacities.length,
                          debouncedVenueLocation.trim() ? 1 : 0
                        ].reduce((a, b) => a + b, 0)}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="max-w-4xl mx-auto md:mb-8">
            {/* Filter Dropdowns - Collapsible on all screen sizes */}
            <div className={`${filtersExpanded ? 'block' : 'hidden'}`}>
              {/* Clear All Button - Always visible when filters are expanded */}
              {hasActiveFilters && (
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-600 hover:text-black underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
              
              <div className="flex flex-wrap gap-3 items-center justify-center">
                <MultiSelectDropdown
                  label="Space Types"
                  options={VENUE_TYPE_LABELS}
                  selectedValues={selectedVenueTypes}
                  onSelectionChange={setSelectedVenueTypes}
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
                
                <MultiSelectDropdown
                  label="Artist Types Welcome"
                  options={ARTIST_TYPE_LABELS}
                  selectedValues={selectedArtistTypesWelcome}
                  onSelectionChange={setSelectedArtistTypesWelcome}
                />
              </div>
            </div>
            
            {/* Active Filter Summary */}
            {hasActiveFilters && (
              <div className="mt-3 text-sm text-gray-600">
                Showing {filteredVenues.length} of {venues.length} spaces
                {debouncedVenueLocation.trim() && (
                  <span className="ml-2 text-blue-600">
                    • searching "{debouncedVenueLocation}"
                  </span>
                )}
                {selectedVenueTypes.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedVenueTypes.length} space type{selectedVenueTypes.length !== 1 ? 's' : ''}
                  </span>
                )}
                {selectedArtistTypesWelcome.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedArtistTypesWelcome.length} artist type{selectedArtistTypesWelcome.length !== 1 ? 's' : ''} welcome
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

          {/* Venues Content */}
          <div className="max-w-7xl mx-auto">
            {!hasActiveFilters ? (
              // Smart Gallery when no filters are active
              <SmartGallery 
                venues={venues}
                artists={artists}
                activeTab={activeTab}
                loading={loading}
              />
            ) : loading ? (
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
                    {debouncedVenueLocation.trim() ? `No spaces found for "${debouncedVenueLocation}"` : 
                     hasActiveFilters ? 'No matching spaces found' : 'Help Build the Network'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {debouncedVenueLocation.trim() ? `Try searching for a different city or venue name, or browse all spaces below.` :
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
                        href="/venues/submit"
                        className="bg-white text-black px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg"
                      >
                        List Your Space
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Filtered venue cards
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredVenues.map((venue) => (
                  <Link key={venue.id} href={`/venues/${venue.id}`}>
                    <div className="bg-white rounded-xl overflow-hidden cursor-pointer group">
                      <div className="aspect-square relative">
                        <img 
                          src={venue.images[0] || '/api/placeholder/other'} 
                          alt={venue.name}
                          className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-75"
                          style={{ borderRadius: '1.25rem' }}
                          onError={(e) => {
                            e.currentTarget.src = '/api/placeholder/other';
                          }}
                        />
                        <div className="absolute top-3 right-3">
                          <FavoriteButton 
                            entityType="VENUE"
                            entityId={venue.id}
                            size="md"
                          />
                        </div>
                      </div>
                      <div className="p-2">
                        <h3 className="font-bold text-gray-900 truncate text-sm mb-1">{venue.name}</h3>
                        <p className="text-xs text-gray-500">
                          {venue.city}, {venue.state} <span className="text-gray-300">•</span> {venue.capacity >= 1000 ? `${(venue.capacity / 1000).toFixed(venue.capacity % 1000 === 0 ? 0 : 1)}k` : venue.capacity} cap <span className="text-gray-300">•</span> {(venue.totalRatings || 0) === 0 ? (
                            <span className="text-gray-400">★ N/A</span>
                          ) : (
                            <span className="text-gray-700">★ {(venue.rating || 0).toFixed(1)}</span>
                          )}
                        </p>
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
        <section className="container mx-auto px-4 pb-24 md:py-8 md:pb-20 md:pt-0">
          {/* Desktop Search Bar - Hidden on mobile */}
          <div className="max-w-2xl mx-auto mb-6 md:mb-8 hidden md:block">
            <div className="bg-white rounded-full shadow-lg border border-gray-200 p-1">
              <div className="flex items-center">
                <div className="flex-1 px-4 py-2">
                  <input
                    type="text"
                    placeholder="Search artists by name or location..."
                    value={artistSearchLocation}
                    onChange={(e) => setArtistSearchLocation(e.target.value)}
                    className="w-full text-sm placeholder-gray-500 border-none outline-none"
                  />
                </div>
                <div className="flex items-center pr-1">
                  {/* Filter Toggle Button - Circular to match search bar style */}
                  <button
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className="relative w-8 h-8 bg-gray-100 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                        {[
                          selectedArtistTypes.length,
                          selectedGenres.length,
                          selectedDraws.length + selectedStatus.length,
                          debouncedArtistLocation.trim() ? 1 : 0
                        ].reduce((a, b) => a + b, 0)}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Dropdowns for Artists */}
          <div className="max-w-4xl mx-auto md:mb-8">
            {/* Filter Dropdowns - Collapsible on all screen sizes */}
            <div className={`${filtersExpanded ? 'block' : 'hidden'}`}>
              {/* Clear All Button - Always visible when filters are expanded */}
              {hasActiveFilters && (
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-600 hover:text-black underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
              
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
                  selectedValues={selectedStatus}
                  onSelectionChange={setSelectedStatus}
                />
              </div>
            </div>
            
            {/* Active Filter Summary */}
            {hasActiveFilters && (
              <div className="mt-3 text-sm text-gray-600">
                Showing {filteredArtists.length} of {artists.length} artists
                {debouncedArtistLocation.trim() && (
                  <span className="ml-2 text-blue-600">
                    • searching "{debouncedArtistLocation}"
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
                {selectedStatus.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedStatus.length} tour status{selectedStatus.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Artists Content */}
          <div className="max-w-7xl mx-auto">
            {!hasActiveFilters ? (
              // Smart Gallery when no filters are active
              <SmartGallery 
                venues={venues}
                artists={artists}
                activeTab={activeTab}
                loading={loading}
              />
            ) : loading ? (
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
                    {debouncedArtistLocation.trim() ? `No artists found for "${debouncedArtistLocation}"` : 
                     hasActiveFilters ? 'No matching artists found' : 'Showcase DIY Artists'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {debouncedArtistLocation.trim() ? `Try searching for a different city or artist name, or browse all artists below.` :
                     hasActiveFilters 
                      ? 'Try adjusting your filters to see more results.'
                      : 'Know touring bands, comedians, poets, or other artists looking for authentic spaces? Add them to connect with venues that book real talent.'
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
                        href="/venues/submit"
                        className="bg-white text-black px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg"
                      >
                        List Your Space
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : getLocationBasedArtistSections.hasLocationData ? (
              // Location-based sections for venues
              <div className="space-y-1">
                {getLocationBasedArtistSections.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    <div className="mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {section.artists.map((artist) => (
                        <Link key={artist.id} href={`/artists/${artist.id}`}>
                          <div className="bg-white rounded-xl overflow-hidden cursor-pointer group">
                            <div className="aspect-square relative">
                              <img 
                                src={artist.images?.[0] || `/api/placeholder/${artist.artistType}`}
                                alt={artist.name}
                                className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-75"
                                style={{ borderRadius: '1.25rem' }}
                                onError={(e) => {
                                  e.currentTarget.src = `/api/placeholder/${artist.artistType}`;
                                }}
                              />
                              <div className="absolute top-3 right-3">
                                <FavoriteButton 
                                  entityType="ARTIST"
                                  entityId={artist.id}
                                  size="md"
                                />
                              </div>
                              
                              {/* Tour Status Badge */}
                              {(() => {
                                const hasActiveRequest = tourRequests.some(request => request.artistId === artist.id);
                                
                                if (hasActiveRequest) {
                                  return (
                                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                      Seeking shows
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div className="p-2">
                              <h3 className="font-bold text-gray-900 truncate text-sm mb-1">{artist.name}</h3>
                              <p className="text-xs text-gray-500">
                                {artist.city}, {artist.state} <span className="text-gray-300">•</span> {ARTIST_TYPE_LABELS[artist.artistType]} <span className="text-gray-300">•</span> {(artist.totalRatings || 0) === 0 ? (
                                  <span className="text-gray-400">★ N/A</span>
                                ) : (
                                  <span className="text-gray-700">★ {(artist.rating || 0).toFixed(1)}</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Standard artist grid for non-venues or when no location data
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredArtists.map((artist) => (
                  <Link key={artist.id} href={`/artists/${artist.id}`}>
                    <div className="bg-white rounded-xl overflow-hidden cursor-pointer group">
                      <div className="aspect-square relative">
                        <img 
                          src={artist.images?.[0] || `/api/placeholder/${artist.artistType}`}
                          alt={artist.name}
                          className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-75"
                          style={{ borderRadius: '1.25rem' }}
                          onError={(e) => {
                            e.currentTarget.src = `/api/placeholder/${artist.artistType}`;
                          }}
                        />
                        <div className="absolute top-3 right-3">
                          <FavoriteButton 
                            entityType="ARTIST"
                            entityId={artist.id}
                            size="md"
                          />
                        </div>
                        
                        {/* Tour Status Badge */}
                        {(() => {
                          const description = (artist.description || '').toLowerCase();
                          const status = (artist.status || '').toLowerCase();
                          const isSeekingShows = description.includes('tour') || description.includes('dates') || 
                                               description.includes('booking') || status.includes('seeking') ||
                                               description.includes('shows') || description.includes('looking');
                          
                          if (isSeekingShows || artist.status === 'seeking-shows') {
                            return (
                              <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                Seeking shows
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="p-2">
                        <h3 className="font-bold text-gray-900 truncate text-sm mb-1">{artist.name}</h3>
                        <p className="text-xs text-gray-500">
                          {artist.city}, {artist.state} <span className="text-gray-300">•</span> {ARTIST_TYPE_LABELS[artist.artistType]} <span className="text-gray-300">•</span> {(artist.totalRatings || 0) === 0 ? (
                            <span className="text-gray-400">★ N/A</span>
                          ) : (
                            <span className="text-gray-700">★ {(artist.rating || 0).toFixed(1)}</span>
                          )}
                        </p>
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
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">DIY Shows</h3>
              <p className="text-gray-400">
                Skip the agents and middlemen. This platform enables venues to find artists looking for shows in their area and place bids, while artists can request shows anywhere and have venues discover and bid on their tour requests.
              </p>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-3">For Artists</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/admin/artists" className="hover:text-white">List an Artist</Link></li>
                <li><AuthLink href="/dashboard" className="hover:text-white">Dashboard & Requests</AuthLink></li>
                <li><AuthLink href="/dashboard" className="hover:text-white">Manage Bookings</AuthLink></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-3">For Venues</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/venues/submit" className="hover:text-white">List Your Space</Link></li>
                <li><Link href="/?tab=artists" className="hover:text-white">Browse Artists</Link></li>
                <li><AuthLink href="/dashboard" className="hover:text-white">Manage Bookings</AuthLink></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About DIY Shows</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
                <li><Link href="/guidelines" className="hover:text-white">Guidelines</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex justify-between items-center">
            <p className="text-gray-400">
              © 2025 DIY Shows. Built by and for the DIY music community.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-gray-500 text-xs">DEV:</span>
              <Link 
                href="/admin" 
                className="text-gray-500 hover:text-gray-300 text-xs"
                title="Admin Debug Tools"
              >
                🛠️ Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Fixed Bottom Navigation - Desktop */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-center space-x-4 px-4 py-4">
          <Link 
            href="/venues/submit"
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm flex-1 text-center max-w-[140px]"
          >
            + List a Space
          </Link>
          
          <Link 
            href="/artists/submit"
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm flex-1 text-center max-w-[140px]"
          >
            + List an Artist
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
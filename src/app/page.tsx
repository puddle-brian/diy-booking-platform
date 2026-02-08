'use client';

import { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Venue, Artist, VenueType, ArtistType, VENUE_TYPE_LABELS, ARTIST_TYPE_LABELS, CAPACITY_OPTIONS, ARTIST_STATUS_OPTIONS, getGenresForArtistTypes, type ArtistStatus } from '../../types/index';
import LocationSorting from '../components/LocationSorting';
import CommunitySection from '../components/CommunitySection';
import UserStatus from '../components/UserStatus';
import SmartGallery from '../components/SmartGallery';
import SeekingShowsBanner from '../components/SeekingShowsBanner';
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

// Multi-select dropdown component - Terminal Style
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
    if (selectedValues.length === 0) return `ALL ${label.toUpperCase()}`;
    if (selectedValues.length === 1) return options[selectedValues[0]].toUpperCase();
    return `${selectedValues.length} SELECTED`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 text-2xs font-medium uppercase tracking-wider text-text-primary bg-bg-tertiary border border-border-subtle hover:bg-bg-hover hover:border-border-default transition-colors min-w-[140px]"
      >
        <span className="truncate">{getDisplayText()}</span>
        <span className="ml-2 text-text-muted">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-64 mt-px bg-bg-secondary border border-border-subtle max-h-60 overflow-y-auto">
          <div className="p-1">
            {selectedValues.length > 0 && (
              <button
                onClick={() => onSelectionChange([])}
                className="w-full text-left px-3 py-2 text-2xs uppercase tracking-wider text-text-muted hover:bg-bg-hover hover:text-status-error transition-colors"
              >
                [CLEAR ALL]
              </button>
            )}
            {Object.entries(options).map(([value, optionLabel]) => (
              <label
                key={value}
                className="flex items-center px-3 py-2 text-xs text-text-primary hover:bg-bg-hover cursor-pointer transition-colors"
              >
                <span className={`w-4 h-4 border mr-3 flex items-center justify-center ${
                  selectedValues.includes(value) 
                    ? 'border-status-active bg-status-active text-bg-primary' 
                    : 'border-border-default'
                }`}>
                  {selectedValues.includes(value) && '✓'}
                </span>
                <span className="flex-1">{optionLabel}</span>
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
  
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  const [venueSearchLocation, setVenueSearchLocation] = useState('');
  const [artistSearchLocation, setArtistSearchLocation] = useState('');

  const debouncedVenueLocation = useDebounce(venueSearchLocation, 300);
  const debouncedArtistLocation = useDebounce(artistSearchLocation, 300);

  const genreOptions = useMemo(() => {
    if (selectedArtistTypes.length === 0) {
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

  const capacityOptions = Object.fromEntries(
    CAPACITY_OPTIONS.map(option => [option.value, option.label])
  );

  const drawOptions = {
    'local': 'Local (0-50)',
    'regional': 'Regional (50-200)', 
    'national': 'National (200+)',
    'international': 'International'
  };

  const tourStatusOptions = Object.fromEntries(
    ARTIST_STATUS_OPTIONS.map(option => [option.value, option.label])
  );

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

      setVenues(Array.isArray(venuesData) ? venuesData : (venuesData.venues || []));
      setArtists(Array.isArray(artistsData) ? artistsData : (artistsData.artists || []));
      
      try {
        const tourRequestsResponse = await fetch('/api/show-requests?initiatedBy=ARTIST&status=OPEN');
        if (tourRequestsResponse.ok) {
          const tourRequestsData = await tourRequestsResponse.json();
          setTourRequests(Array.isArray(tourRequestsData) ? tourRequestsData : []);
        }
      } catch (error) {
        console.error('Failed to load tour requests:', error);
        setTourRequests([]);
      }
      
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

  // Filter venues
  const filteredVenues = useMemo(() => {
    if (loading || !venues || !Array.isArray(venues)) return [];
    
    return venues.filter(venue => {
      if (!venue || typeof venue !== 'object') return false;

      try {
        if (debouncedVenueLocation && debouncedVenueLocation.trim()) {
          const searchTerm = debouncedVenueLocation.toLowerCase().trim();
          const searchableText = [
            venue.name || '',
            venue.city || '',
            venue.state || '',
            venue.description || '',
            `${venue.city || ''}, ${venue.state || ''}`
          ].join(' ').toLowerCase();
          
          if (!searchableText.includes(searchTerm)) return false;
        }

        if (selectedVenueTypes.length > 0 && !selectedVenueTypes.includes(venue.venueType)) return false;
        if (selectedArtistTypesWelcome.length > 0) {
          if (venue.artistTypesWelcome && venue.artistTypesWelcome.length > 0) {
            if (!selectedArtistTypesWelcome.some(type => venue.artistTypesWelcome.includes(type))) return false;
          }
        }
        if (selectedAgeRestrictions.length > 0 && !selectedAgeRestrictions.includes(venue.ageRestriction)) return false;
        if (selectedGenres.length > 0 && !selectedGenres.some(genre => venue.genres && venue.genres.includes(genre))) return false;
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
        return false;
      }
    });
  }, [loading, venues, debouncedVenueLocation, selectedVenueTypes, selectedArtistTypesWelcome, selectedAgeRestrictions, selectedGenres, selectedCapacities]);

  // Filter artists
  const filteredArtists = useMemo(() => {
    if (loading || !artists || !Array.isArray(artists)) return [];
    
    return artists.filter(artist => {
      if (!artist || typeof artist !== 'object') return false;

      try {
        if (debouncedArtistLocation && debouncedArtistLocation.trim()) {
          const searchTerm = debouncedArtistLocation.toLowerCase().trim();
          const searchableText = [
            artist.name || '',
            artist.city || '',
            artist.state || '',
            artist.description || '',
            `${artist.city || ''}, ${artist.state || ''}`
          ].join(' ').toLowerCase();
          
          if (!searchableText.includes(searchTerm)) return false;
        }

        if (selectedArtistTypes.length > 0 && !selectedArtistTypes.includes(artist.artistType)) return false;
        if (selectedGenres.length > 0) {
          if (artist.genres && artist.genres.length > 0) {
            if (!selectedGenres.some(genre => artist.genres.includes(genre))) return false;
          }
        }
        if (selectedDraws.length > 0) {
          const matchesDraw = selectedDraws.some(range => {
            const expectedDraw = (artist.expectedDraw || '').toLowerCase();
            switch (range) {
              case 'local': return expectedDraw.includes('local') || (expectedDraw.match(/\d+/) && parseInt(expectedDraw.match(/\d+/)?.[0] || '0') < 50);
              case 'regional': return expectedDraw.includes('regional') || (expectedDraw.match(/\d+/) && parseInt(expectedDraw.match(/\d+/)?.[0] || '0') >= 50 && parseInt(expectedDraw.match(/\d+/)?.[0] || '0') <= 200);
              case 'national': return expectedDraw.includes('national') || (expectedDraw.match(/\d+/) && parseInt(expectedDraw.match(/\d+/)?.[0] || '0') > 200);
              case 'international': return expectedDraw.includes('international') || expectedDraw.includes('touring');
              default: return false;
            }
          });
          if (!matchesDraw) return false;
        }
        if (selectedStatus.length > 0) {
          const matchesStatus = selectedStatus.some(status => {
            switch (status) {
              case 'seeking-shows': return artist.status === 'seeking-shows';
              case 'not-seeking': return artist.status === 'not-seeking';
              default: return false;
            }
          });
          if (!matchesStatus) return false;
        }
        return true;
      } catch (error) {
        console.warn('Error filtering artist:', error, artist);
        return false;
      }
    });
  }, [loading, artists, debouncedArtistLocation, selectedArtistTypes, selectedGenres, selectedDraws, selectedStatus]);

  const hasActiveFilters = useMemo(() => {
    if (activeTab === 'venues') {
      return selectedVenueTypes.length > 0 || selectedArtistTypesWelcome.length > 0 || selectedAgeRestrictions.length > 0 || selectedCapacities.length > 0 || debouncedVenueLocation.trim().length > 0;
    } else {
      return selectedArtistTypes.length > 0 || selectedGenres.length > 0 || selectedDraws.length > 0 || selectedStatus.length > 0 || debouncedArtistLocation.trim().length > 0;
    }
  }, [activeTab, selectedVenueTypes, selectedArtistTypesWelcome, selectedAgeRestrictions, selectedCapacities, debouncedVenueLocation, selectedArtistTypes, selectedGenres, selectedDraws, selectedStatus, debouncedArtistLocation]);

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

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    
    if (debouncedVenueLocation.trim()) params.set('venueLocation', debouncedVenueLocation);
    else params.delete('venueLocation');
    
    if (debouncedArtistLocation.trim()) params.set('artistLocation', debouncedArtistLocation);
    else params.delete('artistLocation');

    if (selectedVenueTypes.length > 0) params.set('venueTypes', selectedVenueTypes.join(','));
    else params.delete('venueTypes');

    if (selectedArtistTypes.length > 0) params.set('artistTypes', selectedArtistTypes.join(','));
    else params.delete('artistTypes');

    if (selectedArtistTypesWelcome.length > 0) params.set('artistTypesWelcome', selectedArtistTypesWelcome.join(','));
    else params.delete('artistTypesWelcome');

    if (selectedGenres.length > 0) params.set('genres', selectedGenres.join(','));
    else params.delete('genres');

    const newUrl = `/?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) {
      router.replace(newUrl, { scroll: false });
    }
  }, [debouncedVenueLocation, debouncedArtistLocation, selectedVenueTypes, selectedArtistTypes, selectedArtistTypesWelcome, selectedGenres, router, searchParams]);

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
  }, []);

  const handleTabChange = (tab: 'venues' | 'artists') => {
    setActiveTab(tab);
    setFiltersExpanded(false);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', tab);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'artists' || tabParam === 'venues') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Venue card component - Terminal style
  const VenueCard = ({ venue }: { venue: Venue }) => (
    <Link key={venue.id} href={`/venues/${venue.id}`}>
      <div className="bg-bg-secondary border border-border-subtle hover:border-border-default hover:bg-bg-tertiary transition-all cursor-pointer group">
        {/* Image */}
        <div className="aspect-square relative overflow-hidden">
          <img 
            src={venue.images[0] || '/api/placeholder/other'} 
            alt={venue.name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            onError={(e) => { e.currentTarget.src = '/api/placeholder/other'; }}
          />
          <div className="absolute top-2 right-2">
            <FavoriteButton entityType="VENUE" entityId={venue.id} size="md" />
          </div>
          {/* Capacity badge */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bg-primary/90 to-transparent p-2">
            <span className="text-2xs uppercase tracking-wider text-text-muted">
              {venue.capacity >= 1000 ? `${(venue.capacity / 1000).toFixed(venue.capacity % 1000 === 0 ? 0 : 1)}k` : venue.capacity} cap
            </span>
          </div>
        </div>
        {/* Info */}
        <div className="p-3 border-t border-border-subtle">
          <h3 className="font-medium text-text-accent truncate text-sm">{venue.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xs text-text-secondary uppercase tracking-wider">
              {venue.city}, {venue.state}
            </span>
            <span className="text-2xs text-text-muted tabular-nums">
              {(venue.totalRatings || 0) === 0 ? '—' : `★${(venue.rating || 0).toFixed(1)}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );

  // Artist card component - Terminal style
  const ArtistCard = ({ artist }: { artist: Artist }) => (
    <Link key={artist.id} href={`/artists/${artist.id}`}>
      <div className="bg-bg-secondary border border-border-subtle hover:border-border-default hover:bg-bg-tertiary transition-all cursor-pointer group">
        <div className="aspect-square relative overflow-hidden">
          <img 
            src={artist.images?.[0] || `/api/placeholder/${artist.artistType}`}
            alt={artist.name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            onError={(e) => { e.currentTarget.src = `/api/placeholder/${artist.artistType}`; }}
          />
          <div className="absolute top-2 right-2">
            <FavoriteButton entityType="ARTIST" entityId={artist.id} size="md" />
          </div>
          {/* Status badge */}
          {artist.status === 'seeking-shows' && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-status-info/90 text-bg-primary text-2xs uppercase tracking-wider font-medium">
              Seeking Shows
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bg-primary/90 to-transparent p-2">
            <span className="text-2xs uppercase tracking-wider text-text-muted">
              {ARTIST_TYPE_LABELS[artist.artistType]}
            </span>
          </div>
        </div>
        <div className="p-3 border-t border-border-subtle">
          <h3 className="font-medium text-text-accent truncate text-sm">{artist.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xs text-text-secondary uppercase tracking-wider">
              {artist.city}, {artist.state}
            </span>
            <span className="text-2xs text-text-muted tabular-nums">
              {(artist.totalRatings || 0) === 0 ? '—' : `★${(artist.rating || 0).toFixed(1)}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary">
        <div className="container mx-auto px-4 py-4">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border border-border-default flex items-center justify-center">
                <span className="text-text-accent font-bold text-sm">D</span>
              </div>
              <div>
                <h1 className="text-lg font-medium text-text-accent tracking-tight">DIYSHOWS</h1>
                <span className="text-2xs text-text-muted uppercase tracking-wider">BETA v0.1</span>
              </div>
            </div>
            
            {/* Tab Toggle */}
            <div className="flex items-center border border-border-subtle">
              <button
                onClick={() => handleTabChange('venues')}
                className={`px-6 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeTab === 'venues'
                    ? 'bg-text-accent text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                Spaces
              </button>
              <button
                onClick={() => handleTabChange('artists')}
                className={`px-6 py-2 text-xs font-medium uppercase tracking-wider transition-colors border-l border-border-subtle ${
                  activeTab === 'artists'
                    ? 'bg-text-accent text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                Artists
              </button>
            </div>
            
            <UserStatus />
          </div>

          {/* Mobile Header */}
          <div className="md:hidden space-y-3">
            {/* Logo row */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border border-border-default flex items-center justify-center">
                  <span className="text-text-accent font-bold text-xs">D</span>
                </div>
                <span className="text-sm font-medium text-text-accent">DIYSHOWS</span>
              </div>
              <UserStatus />
            </div>
            
            {/* Search bar */}
            <div className="flex items-center bg-bg-tertiary border border-border-subtle">
              <span className="px-3 text-text-muted text-xs">&gt;&gt;</span>
              <input
                type="text"
                placeholder={activeTab === 'venues' ? "SEARCH SPACES..." : "SEARCH ARTISTS..."}
                value={activeTab === 'venues' ? venueSearchLocation : artistSearchLocation}
                onChange={(e) => activeTab === 'venues' ? setVenueSearchLocation(e.target.value) : setArtistSearchLocation(e.target.value)}
                className="flex-1 bg-transparent py-2 text-xs text-text-primary placeholder-text-muted outline-none uppercase"
              />
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className={`px-3 py-2 border-l border-border-subtle text-xs transition-colors ${
                  hasActiveFilters ? 'text-status-info' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                [FILTER{hasActiveFilters ? `: ${selectedVenueTypes.length + selectedArtistTypes.length + selectedCapacities.length}` : ''}]
              </button>
            </div>
            
            {/* Tab Toggle */}
            <div className="flex border border-border-subtle">
              <button
                onClick={() => handleTabChange('venues')}
                className={`flex-1 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeTab === 'venues'
                    ? 'bg-text-accent text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                Spaces
              </button>
              <button
                onClick={() => handleTabChange('artists')}
                className={`flex-1 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors border-l border-border-subtle ${
                  activeTab === 'artists'
                    ? 'bg-text-accent text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                Artists
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-32">
        {/* Desktop Search */}
        <div className="hidden md:block max-w-2xl mx-auto mb-6">
          <div className="flex items-center bg-bg-tertiary border border-border-subtle">
            <span className="px-4 text-text-muted">&gt;&gt;</span>
            <input
              type="text"
              placeholder={activeTab === 'venues' ? "SEARCH SPACES BY NAME OR LOCATION..." : "SEARCH ARTISTS BY NAME OR LOCATION..."}
              value={activeTab === 'venues' ? venueSearchLocation : artistSearchLocation}
              onChange={(e) => activeTab === 'venues' ? setVenueSearchLocation(e.target.value) : setArtistSearchLocation(e.target.value)}
              className="flex-1 bg-transparent py-3 text-sm text-text-primary placeholder-text-muted outline-none"
            />
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className={`px-4 py-3 border-l border-border-subtle text-xs uppercase tracking-wider transition-colors ${
                hasActiveFilters ? 'text-status-info' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              [FILTER{hasActiveFilters ? `S: ${selectedVenueTypes.length + selectedArtistTypes.length + selectedCapacities.length}` : ''}]
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {filtersExpanded && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-bg-secondary border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xs uppercase tracking-wider text-text-secondary">[FILTER OPTIONS]</span>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="text-2xs uppercase tracking-wider text-status-error hover:text-status-error/80 transition-colors">
                  [CLEAR ALL]
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {activeTab === 'venues' ? (
                <>
                  <MultiSelectDropdown label="Types" options={VENUE_TYPE_LABELS} selectedValues={selectedVenueTypes} onSelectionChange={setSelectedVenueTypes} />
                  <MultiSelectDropdown label="Ages" options={ageRestrictionOptions} selectedValues={selectedAgeRestrictions} onSelectionChange={setSelectedAgeRestrictions} />
                  <MultiSelectDropdown label="Capacity" options={capacityOptions} selectedValues={selectedCapacities} onSelectionChange={setSelectedCapacities} />
                  <MultiSelectDropdown label="Artist Types" options={ARTIST_TYPE_LABELS} selectedValues={selectedArtistTypesWelcome} onSelectionChange={setSelectedArtistTypesWelcome} />
                </>
              ) : (
                <>
                  <MultiSelectDropdown label="Types" options={ARTIST_TYPE_LABELS} selectedValues={selectedArtistTypes} onSelectionChange={setSelectedArtistTypes} />
                  <MultiSelectDropdown label="Genres" options={genreOptions} selectedValues={selectedGenres} onSelectionChange={setSelectedGenres} />
                  <MultiSelectDropdown label="Draw" options={drawOptions} selectedValues={selectedDraws} onSelectionChange={setSelectedDraws} />
                  <MultiSelectDropdown label="Status" options={tourStatusOptions} selectedValues={selectedStatus} onSelectionChange={setSelectedStatus} />
                </>
              )}
            </div>
          </div>
        )}

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="max-w-7xl mx-auto mb-4 px-1">
            <span className="text-2xs text-text-muted uppercase tracking-wider tabular-nums">
              [RESULTS: {activeTab === 'venues' ? filteredVenues.length : filteredArtists.length} / {activeTab === 'venues' ? venues.length : artists.length}]
            </span>
          </div>
        )}

        {/* Touring Artists Seeking Shows Banner - Show on Artists tab */}
        {activeTab === 'artists' && !loading && tourRequests.length > 0 && (
          <div className="max-w-7xl mx-auto mb-6">
            <SeekingShowsBanner showRequests={tourRequests} maxDisplay={3} />
            <div className="mt-2 text-right">
              <Link href="/touring-artists" className="text-xs text-text-accent hover:text-text-primary transition-colors">
                View all touring artists →
              </Link>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-bg-secondary border border-border-subtle animate-pulse">
                  <div className="aspect-square bg-bg-tertiary"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-bg-tertiary"></div>
                    <div className="h-3 bg-bg-tertiary w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'venues' ? (
            filteredVenues.length === 0 ? (
              <div className="text-center py-16 border border-border-subtle bg-bg-secondary">
                <div className="text-4xl mb-4">📡</div>
                <h3 className="text-lg font-medium text-text-accent mb-2">NO SPACES FOUND</h3>
                <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
                  {hasActiveFilters ? 'Adjust your filters to see more results.' : 'Be the first to add a venue in your area.'}
                </p>
                {hasActiveFilters ? (
                  <button onClick={clearAllFilters} className="btn">CLEAR FILTERS</button>
                ) : (
                  <Link href="/venues/submit" className="btn btn-primary">+ LIST A SPACE</Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredVenues.map(venue => <VenueCard key={venue.id} venue={venue} />)}
              </div>
            )
          ) : (
            filteredArtists.length === 0 ? (
              <div className="text-center py-16 border border-border-subtle bg-bg-secondary">
                <div className="text-4xl mb-4">🎸</div>
                <h3 className="text-lg font-medium text-text-accent mb-2">NO ARTISTS FOUND</h3>
                <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
                  {hasActiveFilters ? 'Adjust your filters to see more results.' : 'Be the first to add an artist.'}
                </p>
                {hasActiveFilters ? (
                  <button onClick={clearAllFilters} className="btn">CLEAR FILTERS</button>
                ) : (
                  <Link href="/artists/submit" className="btn btn-primary">+ LIST AN ARTIST</Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredArtists.map(artist => <ArtistCard key={artist.id} artist={artist} />)}
              </div>
            )
          )}
        </div>

        {/* Load More */}
        {((activeTab === 'venues' && filteredVenues.length > 0) || (activeTab === 'artists' && filteredArtists.length > 0)) && (
          <div className="text-center mt-8">
            <button className="btn">LOAD MORE</button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-bg-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-accent mb-4">[DIYSHOWS]</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Skip the agents. Direct booking between DIY venues and touring artists.
              </p>
            </div>
            <div>
              <h4 className="text-2xs uppercase tracking-wider text-text-muted mb-3">&gt; FOR ARTISTS</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/admin/artists" className="text-text-secondary hover:text-text-accent transition-colors">List an Artist</Link></li>
                <li><AuthLink href="/dashboard" className="text-text-secondary hover:text-text-accent transition-colors">Dashboard</AuthLink></li>
              </ul>
            </div>
            <div>
              <h4 className="text-2xs uppercase tracking-wider text-text-muted mb-3">&gt; FOR VENUES</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/venues/submit" className="text-text-secondary hover:text-text-accent transition-colors">List Your Space</Link></li>
                <li><Link href="/?tab=artists" className="text-text-secondary hover:text-text-accent transition-colors">Browse Artists</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-2xs uppercase tracking-wider text-text-muted mb-3">&gt; COMMUNITY</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/about" className="text-text-secondary hover:text-text-accent transition-colors">About</Link></li>
                <li><Link href="/support" className="text-text-secondary hover:text-text-accent transition-colors">Support</Link></li>
                <li><Link href="/guidelines" className="text-text-secondary hover:text-text-accent transition-colors">Guidelines</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border-subtle mt-8 pt-6 flex justify-between items-center">
            <p className="text-text-muted text-2xs uppercase tracking-wider">
              © 2025 DIYSHOWS — BUILT FOR THE DIY COMMUNITY
            </p>
            <Link href="/admin" className="text-text-muted hover:text-text-secondary text-2xs uppercase tracking-wider transition-colors">
              [ADMIN]
            </Link>
          </div>
        </div>
      </footer>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border-subtle z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-3">
          <Link href="/venues/submit" className="btn btn-primary text-xs">
            + LIST A SPACE
          </Link>
          <Link href="/artists/submit" className="btn btn-primary text-xs">
            + LIST AN ARTIST
          </Link>
          <div className="hidden md:block ml-4">
            <MobileFeedbackButton />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-text-muted text-sm uppercase tracking-wider animate-pulse">
            [LOADING...]
          </div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

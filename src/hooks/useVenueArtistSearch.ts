import { useState, useEffect } from 'react';

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity?: number;
}

interface Artist {
  id: string;
  name: string;
  city?: string;
  state?: string;
  genres?: string[];
}

interface UseVenueArtistSearchReturn {
  venues: Venue[];
  artists: Artist[];
  venueSearchResults: Venue[];
  artistSearchResults: Artist[];
  showVenueDropdown: boolean;
  showArtistDropdown: boolean;
  handleVenueSearch: (searchTerm: string) => void;
  handleArtistSearch: (searchTerm: string) => void;
  selectVenue: (venue: Venue) => void;
  selectArtist: (artist: Artist) => void;
  setShowVenueDropdown: (show: boolean) => void;
  setShowArtistDropdown: (show: boolean) => void;
}

interface UseVenueArtistSearchProps {
  onVenueSelect?: (venue: Venue) => void;
  onArtistSelect?: (artist: Artist) => void;
}

export function useVenueArtistSearch({
  onVenueSelect,
  onArtistSelect
}: UseVenueArtistSearchProps = {}): UseVenueArtistSearchReturn {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [venueSearchResults, setVenueSearchResults] = useState<Venue[]>([]);
  const [artistSearchResults, setArtistSearchResults] = useState<Artist[]>([]);
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venues');
      if (response.ok) {
        const data = await response.json();
        setVenues(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.warn('Failed to fetch venues:', error);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await fetch('/api/artists');
      if (response.ok) {
        const data = await response.json();
        setArtists(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.warn('Failed to fetch artists:', error);
    }
  };

  const handleVenueSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setVenueSearchResults([]);
      setShowVenueDropdown(false);
      return;
    }

    const filtered = venues.filter(venue =>
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.state.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    setVenueSearchResults(filtered);
    setShowVenueDropdown(filtered.length > 0);
  };

  const handleArtistSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setArtistSearchResults([]);
      setShowArtistDropdown(false);
      return;
    }

    const filtered = artists.filter(artist =>
      artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.state?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    setArtistSearchResults(filtered);
    setShowArtistDropdown(filtered.length > 0);
  };

  const selectVenue = (venue: Venue) => {
    setShowVenueDropdown(false);
    onVenueSelect?.(venue);
  };

  const selectArtist = (artist: Artist) => {
    setShowArtistDropdown(false);
    onArtistSelect?.(artist);
  };

  useEffect(() => {
    fetchVenues();
    fetchArtists();
  }, []);

  return {
    venues,
    artists,
    venueSearchResults,
    artistSearchResults,
    showVenueDropdown,
    showArtistDropdown,
    handleVenueSearch,
    handleArtistSearch,
    selectVenue,
    selectArtist,
    setShowVenueDropdown,
    setShowArtistDropdown
  };
} 
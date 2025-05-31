import React, { useState, useEffect } from 'react';
import OfferInput, { ParsedOffer, parsedOfferToLegacyFormat } from './OfferInput';

interface Artist {
  id: string;
  name: string;
  genres: string[];
  city: string;
  state: string;
  country: string;
}

interface VenueOfferFormProps {
  venueId: string;
  venueName: string;
  onSuccess: (offer: any) => void;
  onCancel: () => void;
}

export default function VenueOfferForm({ 
  venueId, 
  venueName, 
  onSuccess, 
  onCancel 
}: VenueOfferFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);
  const [offerData, setOfferData] = useState<ParsedOffer | null>(null);
  
  const [offerForm, setOfferForm] = useState({
    // Target Artist
    artistId: '',
    artistName: '',
    
    // Basic Offer Details
    proposedDate: '',
    ageRestriction: 'all-ages' as 'all-ages' | '18+' | '21+',
    capacity: '',
    
    // Personal Message
    message: '',
    
    // Auto-generated title
    title: ''
  });

  // Load artists on mount
  useEffect(() => {
    loadArtists();
  }, []);

  // Filter artists based on search
  useEffect(() => {
    if (artistSearch.trim() === '') {
      setFilteredArtists(artists.slice(0, 10)); // Show first 10
    } else {
      const filtered = artists.filter(artist =>
        artist.name.toLowerCase().includes(artistSearch.toLowerCase()) ||
        artist.genres.some(genre => genre.toLowerCase().includes(artistSearch.toLowerCase())) ||
        `${artist.city}, ${artist.state}`.toLowerCase().includes(artistSearch.toLowerCase())
      ).slice(0, 10);
      setFilteredArtists(filtered);
    }
  }, [artistSearch, artists]);

  const loadArtists = async () => {
    try {
      const response = await fetch('/api/artists');
      if (response.ok) {
        const data = await response.json();
        setArtists(Array.isArray(data) ? data : (data.artists || []));
      }
    } catch (error) {
      console.error('Failed to load artists:', error);
    }
  };

  const handleArtistSelect = (artist: Artist) => {
    setOfferForm(prev => ({
      ...prev,
      artistId: artist.id,
      artistName: artist.name
    }));
    setArtistSearch(artist.name);
    setShowArtistDropdown(false);
    
    // Auto-generate title
    if (offerForm.proposedDate) {
      const date = new Date(offerForm.proposedDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      setOfferForm(prev => ({
        ...prev,
        title: `${artist.name} - ${date} at ${venueName}`
      }));
    }
  };

  const handleDateChange = (date: string) => {
    setOfferForm(prev => ({ ...prev, proposedDate: date }));
    
    // Auto-update title if artist is selected
    if (offerForm.artistName && date) {
      const formattedDate = new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      setOfferForm(prev => ({
        ...prev,
        title: `${offerForm.artistName} - ${formattedDate} at ${venueName}`
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert parsed offer to legacy format
      const legacyOffer = parsedOfferToLegacyFormat(offerData);
      
      const response = await fetch(`/api/venues/${venueId}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId: offerForm.artistId,
          title: offerForm.title || `${offerForm.artistName} - ${new Date(offerForm.proposedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${venueName}`,
          proposedDate: offerForm.proposedDate,
          amount: legacyOffer.amount,
          doorDeal: legacyOffer.doorDeal,
          capacity: offerForm.capacity ? parseInt(offerForm.capacity) : undefined,
          ageRestriction: offerForm.ageRestriction,
          message: offerForm.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create offer');
      }

      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Make Offer to Artist
        </h3>
        <p className="text-sm text-gray-600">
          Invite a specific artist to play at {venueName}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Artist Selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Artist *
          </label>
          <input
            type="text"
            required
            value={artistSearch}
            onChange={(e) => {
              setArtistSearch(e.target.value);
              setShowArtistDropdown(true);
              setOfferForm(prev => ({ ...prev, artistId: '', artistName: '' }));
            }}
            onFocus={() => setShowArtistDropdown(true)}
            onBlur={() => {
              // Delay hiding dropdown to allow clicks
              setTimeout(() => setShowArtistDropdown(false), 200);
            }}
            placeholder="Search for artist by name, genre, or location"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Artist Search Dropdown */}
          {showArtistDropdown && filteredArtists.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredArtists.map((artist) => (
                <div
                  key={artist.id}
                  onClick={() => handleArtistSelect(artist)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{artist.name}</div>
                  <div className="text-sm text-gray-600">
                    {artist.genres.slice(0, 2).join(', ')} • {artist.city}, {artist.state}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {offerForm.artistId && (
            <p className="text-sm text-green-600 mt-1">
              ✓ Selected: {offerForm.artistName}
            </p>
          )}
        </div>

        {/* Proposed Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proposed Date *
          </label>
          <input
            type="date"
            required
            value={offerForm.proposedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Basic Terms */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Restriction
            </label>
            <select
              value={offerForm.ageRestriction}
              onChange={(e) => setOfferForm(prev => ({ ...prev, ageRestriction: e.target.value as any }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all-ages">All Ages</option>
              <option value="18+">18+</option>
              <option value="21+">21+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Capacity
            </label>
            <input
              type="number"
              value={offerForm.capacity}
              onChange={(e) => setOfferForm(prev => ({ ...prev, capacity: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 150"
            />
          </div>
        </div>

        {/* Personal Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Message
          </label>
          <textarea
            value={offerForm.message}
            onChange={(e) => setOfferForm(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Tell the artist why you'd like them to play at your venue..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            This message will be sent directly to the artist along with your offer.
          </p>
        </div>

        {/* Offer Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Offer
          </label>
          <OfferInput
            value={offerData}
            onChange={(data) => setOfferData(data)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !offerForm.artistId || !offerForm.proposedDate}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending Offer...' : 'Send Offer'}
          </button>
        </div>
      </form>
    </div>
  );
} 
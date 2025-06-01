import React, { useState, useEffect } from 'react';
import OfferInput from './OfferInput';

interface Artist {
  id: string;
  name: string;
  genres: string[];
  city: string;
  state: string;
}

interface OfferFormCoreProps {
  // Context
  venueId: string;
  venueName: string;
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  
  // Pre-selection (when coming from artist page)
  preSelectedArtist?: {
    id: string;
    name: string;
  };
  
  // Customization
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  showCapacityField?: boolean;
  
  // Error handling
  error?: string;
}

export default function OfferFormCore({
  venueId,
  venueName,
  onSubmit,
  onCancel,
  loading = false,
  preSelectedArtist,
  title = "Make Offer to Artist",
  subtitle,
  submitButtonText = "Send Offer",
  showCapacityField = true,
  error
}: OfferFormCoreProps) {
  // Form state
  const [offerData, setOfferData] = useState<any>(null);
  const [formData, setFormData] = useState({
    artistId: preSelectedArtist?.id || '',
    artistName: preSelectedArtist?.name || '',
    proposedDate: '',
    ageRestriction: 'all-ages' as 'all-ages' | '18+' | '21+',
    capacity: '',
    message: ''
  });

  // Artist search state
  const [artistSearch, setArtistSearch] = useState(preSelectedArtist?.name || '');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);

  // Load artists on mount
  useEffect(() => {
    loadArtists();
  }, []);

  // Filter artists based on search
  useEffect(() => {
    if (!artistSearch.trim()) {
      setFilteredArtists([]);
      return;
    }

    const filtered = artists.filter(artist =>
      artist.name.toLowerCase().includes(artistSearch.toLowerCase()) ||
      artist.genres.some(genre => genre.toLowerCase().includes(artistSearch.toLowerCase())) ||
      `${artist.city}, ${artist.state}`.toLowerCase().includes(artistSearch.toLowerCase())
    ).slice(0, 8);

    setFilteredArtists(filtered);
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
    setFormData(prev => ({
      ...prev,
      artistId: artist.id,
      artistName: artist.name
    }));
    setArtistSearch(artist.name);
    setShowArtistDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the submission data
    const submissionData = {
      artistId: formData.artistId,
      artistName: formData.artistName,
      proposedDate: formData.proposedDate,
      ageRestriction: formData.ageRestriction,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      message: formData.message,
      offerData: offerData // The parsed offer data from OfferInput
    };

    await onSubmit(submissionData);
  };

  const defaultSubtitle = subtitle || `Invite a specific artist to play at ${venueName}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          {defaultSubtitle}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 🎯 CENTERPIECE: OFFER FIELD - Most important info first */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h4 className="text-base font-semibold text-blue-900">Your Offer</h4>
          </div>
          <OfferInput
            value={offerData}
            onChange={(data) => setOfferData(data)}
            placeholder="e.g., $500 guarantee, 70/30 door split after $300, $400 + 80% after costs"
            className="w-full p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <p className="text-xs text-blue-700 mt-2">
            💡 This is what the artist will see first. Make it compelling!
          </p>
        </div>

        {/* Artist Selection - Only show if not pre-selected */}
        {!preSelectedArtist && (
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
                setFormData(prev => ({ ...prev, artistId: '', artistName: '' }));
              }}
              onFocus={() => setShowArtistDropdown(true)}
              onBlur={() => {
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
            
            {formData.artistId && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Selected: {formData.artistName}
              </p>
            )}
          </div>
        )}

        {/* Show selected artist info if pre-selected */}
        {preSelectedArtist && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-green-900">Making offer to: {preSelectedArtist.name}</span>
            </div>
          </div>
        )}

        {/* Show Details - Consistent grouping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposed Date *
            </label>
            <input
              type="date"
              required
              value={formData.proposedDate}
              onChange={(e) => setFormData(prev => ({ ...prev, proposedDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Restriction
            </label>
            <select
              value={formData.ageRestriction}
              onChange={(e) => setFormData(prev => ({ ...prev, ageRestriction: e.target.value as any }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all-ages">All Ages</option>
              <option value="18+">18+</option>
              <option value="21+">21+</option>
            </select>
          </div>
        </div>

        {/* Optional Capacity Field */}
        {showCapacityField && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Capacity (Optional)
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 150"
            />
            <p className="text-sm text-gray-500 mt-1">
              Help the artist understand the scale of the show
            </p>
          </div>
        )}

        {/* Personal Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Message (Optional)
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Tell the artist why you'd like them to play at your venue..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            This message will be sent directly to the artist along with your offer.
          </p>
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
            disabled={loading || (!preSelectedArtist && !formData.artistId) || !formData.proposedDate}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Sending Offer...' : submitButtonText}
          </button>
        </div>
      </form>
    </div>
  );
} 
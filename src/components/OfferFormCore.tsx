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
  
  // Pre-selection (when coming from tour request date)
  preSelectedDate?: string;
  
  // Existing bid information (when updating)
  existingBid?: {
    id: string;
    amount?: number;
    message?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  
  // 🎯 UX IMPROVEMENT: Delete functionality for existing offers
  onDelete?: () => Promise<void>;
  
  // 🎯 UX IMPROVEMENT: Dismiss request functionality for venues  
  onDismissRequest?: () => Promise<void>;
  
  // Customization
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  
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
  preSelectedDate,
  existingBid,
  onDelete,
  onDismissRequest,
  title = "Make Offer to Artist",
  subtitle,
  submitButtonText = "Send Offer",
  error
}: OfferFormCoreProps) {
  // Form state
  const [formData, setFormData] = useState<{
    artistId: string;
    artistName: string;
    proposedDate: string;
    capacity: string;
    ageRestriction: string;
    message: string;
  }>({
    artistId: preSelectedArtist?.id || '',
    artistName: preSelectedArtist?.name || '',
    proposedDate: preSelectedDate || '',
    capacity: '',
    ageRestriction: 'ALL_AGES',
    message: ''
  });
  
  const [offerData, setOfferData] = useState<any>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [hasInitializedFromExistingBid, setHasInitializedFromExistingBid] = useState(false);
  
  // 🎯 UX IMPROVEMENT: Delete state management
  const [isDeleting, setIsDeleting] = useState(false);

  // 🎯 UX IMPROVEMENT: Dismiss state management
  const [isDismissing, setIsDismissing] = useState(false);

  // 🎯 LOAD EXISTING BID DATA: Pre-populate form if editing existing bid (ONLY ONCE)
  useEffect(() => {
    if (existingBid && !hasInitializedFromExistingBid) {
      console.log('🔄 Pre-filling form with existing bid (first time only):', existingBid);
      
      // Pre-populate form with existing bid data
      if (existingBid.amount) {
        const parsedOffer = {
          type: 'guarantee' as const,
          displayText: `$${existingBid.amount} guarantee`,
          guarantee: existingBid.amount,
          rawInput: `$${existingBid.amount} guarantee`
        };
        setOfferData(parsedOffer);
        console.log('✅ Set offer data:', parsedOffer);
      }
      
      if (existingBid.message) {
        setFormData(prev => ({ ...prev, message: existingBid.message || '' }));
        console.log('✅ Set message:', existingBid.message);
      }

      // Mark that we've initialized to prevent re-running
      setHasInitializedFromExistingBid(true);
      console.log('🚫 Marked as initialized - will not override user input');
    }
  }, [existingBid, hasInitializedFromExistingBid]);

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
          {existingBid ? '✏️ Update Your Bid' : title}
        </h3>
        <p className="text-sm text-gray-600">
          {existingBid ? `Updating your existing bid for this show request` : defaultSubtitle}
        </p>
      </div>

      {/* 🎯 EXISTING BID INDICATOR: Show when updating existing bid */}
      {existingBid && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 mb-3">You already have a bid on this request</h4>
              
              {/* Compact inline layout */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-amber-800 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-amber-700">Current bid:</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-900 font-semibold rounded">
                    ${existingBid.amount || 'No amount'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-700">Status:</span>
                  <span className="px-2 py-1 bg-white text-amber-900 font-medium rounded border border-amber-200 capitalize">
                    {existingBid.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-700">Updated:</span>
                  <span className="font-medium text-amber-900">
                    {new Date(existingBid.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Any changes you make will <strong>update your existing bid</strong> rather than creating a new one.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            A default message is provided. Feel free to customize it or leave as-is.
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          {/* 🎯 UX IMPROVEMENT: Cancel on left - just backing out */}
          <div>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
          
          {/* 🎯 UX IMPROVEMENT: Resolution actions grouped together on right */}
          <div className="flex space-x-3">
            {existingBid && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
                    setIsDeleting(true);
                    try {
                      await onDelete();
                    } catch (error) {
                      console.error('Delete failed:', error);
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                disabled={loading || isDeleting || isDismissing}
                className="px-4 py-2 text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                {isDeleting && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isDeleting ? 'Deleting...' : 'Delete Offer'}
              </button>
            )}
            
            {!existingBid && onDismissRequest && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Remove this show request from your timeline? You can still find it in the general show requests if you change your mind.')) {
                    setIsDismissing(true);
                    try {
                      await onDismissRequest();
                    } catch (error) {
                      console.error('Dismiss failed:', error);
                    } finally {
                      setIsDismissing(false);
                    }
                  }
                }}
                disabled={loading || isDeleting || isDismissing}
                className="px-4 py-2 text-gray-800 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                {isDismissing && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isDismissing ? 'Dismissing...' : 'Dismiss Request'}
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || isDeleting || isDismissing || (!preSelectedArtist && !formData.artistId) || !formData.proposedDate}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? (existingBid ? 'Updating Bid...' : 'Sending Offer...') : (existingBid ? 'Update Bid' : submitButtonText)}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 

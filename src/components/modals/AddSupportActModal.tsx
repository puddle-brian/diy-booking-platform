import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import OfferInput, { ParsedOffer, parsedOfferToLegacyFormat } from '../OfferInput';
import { extractDateString, formatDisplayDate } from '../../utils/dateUtils';
import { Artist } from '../../../types/index';

interface AddSupportActModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: string;
  showDate: string;
  venueName: string;
  venueId: string;
  onSuccess: (offer: any) => void;
}

export function AddSupportActModal({
  isOpen,
  onClose,
  showId,
  showDate,
  venueName,
  venueId,
  onSuccess
}: AddSupportActModalProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [offerData, setOfferData] = useState<ParsedOffer | null>(null);
  const [message, setMessage] = useState('');
  const [billingPosition, setBillingPosition] = useState<'headliner' | 'co-headliner' | 'support' | 'local-support'>('support');
  const [setLength, setSetLength] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  const [error, setError] = useState('');

  // Load artists when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchArtists();
      // Reset form
      setSelectedArtist(null);
      setSearchTerm('');
      setOfferData(null);
      setMessage('');
      setBillingPosition('support'); // Default to support for "Add Support Act"
      setSetLength('');
      setError('');
    }
  }, [isOpen]);

  // Update default message when artist changes
  useEffect(() => {
    if (selectedArtist && venueName && showDate) {
      const formattedDate = new Date(showDate).toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric' 
      });
      setMessage(`Hi ${selectedArtist.name}! We'd love to have you play support at ${venueName} on ${formattedDate}. Let us know if you're interested!`);
    }
  }, [selectedArtist, venueName, showDate]);

  const fetchArtists = async () => {
    setIsLoadingArtists(true);
    try {
      const response = await fetch('/api/artists');
      if (response.ok) {
        const artistsData = await response.json();
        setArtists(artistsData);
      }
    } catch (error) {
      console.error('Failed to fetch artists:', error);
    } finally {
      setIsLoadingArtists(false);
    }
  };

  // Smart search filtering - matching existing pattern
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredArtists([]);
      setShowDropdown(false);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = artists.filter(artist =>
      artist.name.toLowerCase().includes(searchTermLower) ||
      artist.city.toLowerCase().includes(searchTermLower) ||
      artist.state.toLowerCase().includes(searchTermLower) ||
      `${artist.city}, ${artist.state}`.toLowerCase().includes(searchTermLower) ||
      artist.genres.some((genre: string) => genre.toLowerCase().includes(searchTermLower))
    ).slice(0, 8); // Limit to 8 results like other components

    setFilteredArtists(filtered);
    setShowDropdown(filtered.length > 0);
  }, [searchTerm, artists]);

  const handleArtistSelect = (artist: Artist) => {
    setSelectedArtist(artist);
    setSearchTerm(artist.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedArtist || !offerData) {
      setError('Please select an artist and specify the offer details');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Convert parsed offer to legacy format
      const legacyOffer = parsedOfferToLegacyFormat(offerData);
      
      // 🎯 UNIFIED SYSTEM: Use new ShowRequest endpoint instead of old VenueOffer endpoint
      const response = await fetch('/api/show-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId: selectedArtist.id,
          venueId: venueId,
          title: `${selectedArtist.name} - ${new Date(showDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${venueName} (${billingPosition.charAt(0).toUpperCase() + billingPosition.slice(1)})`,
          requestedDate: extractDateString(showDate), // Extract YYYY-MM-DD to avoid timezone issues
          initiatedBy: 'VENUE',
          amount: legacyOffer.amount,
          doorDeal: legacyOffer.doorDeal,
          billingPosition: billingPosition.toUpperCase(), // 🎵 FIX: Use user-selected billing position instead of hardcoded 'SUPPORT'
          setLength: setLength ? parseInt(setLength) : undefined, // 🎵 ADD: Include set length
          message: message,
          // TODO: Add parentShowId and showRole fields when schema is enhanced
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create support act offer');
      }

      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create support act offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                Add Support Act
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Invite an artist to play support on {formatDisplayDate(showDate)} at {venueName}. This will create a venue offer that appears in both your timeline and the artist's itinerary.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Smart Artist Search */}
              <div className="mb-6 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Artists *
                </label>
                <input
                  type="text"
                  required
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedArtist(null); // Clear selection when typing
                  }}
                  onFocus={() => setShowDropdown(filteredArtists.length > 0)}
                  onBlur={() => {
                    // Delay hiding dropdown to allow clicks
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  placeholder="Search by name, city, or genre..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Smart Search Dropdown */}
                {showDropdown && filteredArtists.length > 0 && (
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
                
                {/* Selected Artist Confirmation */}
                {selectedArtist && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-900">{selectedArtist.name}</div>
                        <div className="text-sm text-blue-700">
                          {selectedArtist.genres.slice(0, 2).join(', ')} • {selectedArtist.city}, {selectedArtist.state}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedArtist(null);
                          setSearchTerm('');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Offer Details */}
              {selectedArtist && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Details *
                  </label>
                  <OfferInput
                    value={offerData}
                    onChange={setOfferData}
                    placeholder="e.g., $200 guarantee or 60/40 door split after $100 expenses"
                  />
                </div>
              )}

              {/* 🎵 ADD: Billing Position Module - matches OfferFormCore styling */}
              {selectedArtist && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h4 className="text-base font-semibold text-blue-900">Billing Position *</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">
                        What role are you offering?
                      </label>
                      <select
                        required
                        value={billingPosition}
                        onChange={(e) => setBillingPosition(e.target.value as any)}
                        className="w-full p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="support">Support</option>
                        <option value="local-support">Local Support</option>
                        <option value="headliner">Headliner</option>
                        <option value="co-headliner">Co-Headliner</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">
                        Set Length (minutes)
                      </label>
                      <input
                        type="number"
                        value={setLength}
                        onChange={(e) => setSetLength(e.target.value)}
                        placeholder="e.g. 30"
                        min="15"
                        max="180"
                        className="w-full p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    {billingPosition === 'headliner' && 'Main draw, top billing, longest set (typically 45-90 min)'}
                    {billingPosition === 'support' && 'Opening act, shorter set time (typically 30-45 min)'}
                    {billingPosition === 'local-support' && 'Local opener, builds community (typically 20-30 min)'}
                    {billingPosition === 'co-headliner' && 'Shared top billing with touring act (typically 45-75 min)'}
                  </p>
                </div>
              )}

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a personal message to the artist..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              disabled={isSubmitting || !selectedArtist || !offerData}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Support Act Offer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 
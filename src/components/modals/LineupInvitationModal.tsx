import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LineupPosition } from '../../../types';
import OfferInput, { ParsedOffer, parsedOfferToLegacyFormat } from '../OfferInput';

interface Artist {
  id: string;
  name: string;
  city: string;
  state: string;
  artistType: string;
  genres: string[];
}

interface LineupInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: string;
  showDate: string;
  venueName: string;
  onInvitationSent: () => void;
}

export function LineupInvitationModal({
  isOpen,
  onClose,
  showId,
  showDate,
  venueName,
  onInvitationSent
}: LineupInvitationModalProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lineupRole, setLineupRole] = useState<LineupPosition>('DIRECT_SUPPORT');
  const [billingOrder, setBillingOrder] = useState(2);
  const [offerData, setOfferData] = useState<ParsedOffer | null>(null);
  const [setLength, setSetLength] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);

  // Load artists when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchArtists();
      // Reset form
      setSelectedArtist(null);
      setSearchTerm('');
      setOfferData(null);
      setSetLength('');
    }
  }, [isOpen]);

  // Update default message when role or artist changes
  useEffect(() => {
    if (selectedArtist && lineupRole && venueName && showDate) {
      const roleText = lineupRole.toLowerCase().replace('_', ' ');
      setMessage(`Hi! We'd love to have you play ${roleText} at ${venueName} on ${new Date(showDate).toLocaleDateString()}. Let us know if you're interested!`);
    }
  }, [selectedArtist, lineupRole, venueName, showDate]);

  // Update billing order when role changes
  useEffect(() => {
    switch (lineupRole) {
      case 'HEADLINER':
        setBillingOrder(1);
        break;
      case 'DIRECT_SUPPORT':
        setBillingOrder(2);
        break;
      case 'OPENER':
        setBillingOrder(3);
        break;
      case 'LOCAL_OPENER':
        setBillingOrder(4);
        break;
    }
  }, [lineupRole]);

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

  // Smart search filtering - similar to other components in the codebase
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
      artist.genres.some(genre => genre.toLowerCase().includes(searchTermLower))
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
    if (!selectedArtist) return;

    setIsSubmitting(true);
    try {
      // Convert offer data to legacy format for the API
      const legacyOffer = parsedOfferToLegacyFormat(offerData);
      
      const response = await fetch('/api/lineup-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showId,
          artistId: selectedArtist.id,
          lineupRole,
          billingOrder,
          guarantee: legacyOffer.amount || undefined,
          doorDeal: legacyOffer.doorDeal || undefined,
          setLength: setLength || undefined,
          message: message.trim()
        }),
      });

      if (response.ok) {
        onInvitationSent();
        onClose();
        // Reset form
        setSelectedArtist(null);
        setSearchTerm('');
        setOfferData(null);
        setSetLength('');
        setMessage('');
      } else {
        const error = await response.json();
        alert(`Failed to send invitation: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to send lineup invitation:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: LineupPosition) => {
    switch (role) {
      case 'HEADLINER': return 'Headliner';
      case 'DIRECT_SUPPORT': return 'Direct Support';
      case 'OPENER': return 'Opener';
      case 'LOCAL_OPENER': return 'Local Opener';
      default: return role;
    }
  };

  const getRoleDescription = (role: LineupPosition) => {
    switch (role) {
      case 'HEADLINER': return 'Main act, closes the show';
      case 'DIRECT_SUPPORT': return 'Primary support, plays before headliner';
      case 'OPENER': return 'Opening act, warms up the crowd';
      case 'LOCAL_OPENER': return 'Local opener, typically first slot';
      default: return '';
    }
  };

  if (!isOpen) return null;

  // Render modal using portal to avoid HTML validation issues
  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Invite Artist to Lineup
                  </h3>

                  {/* Smart Artist Search */}
                  <div className="mb-4 relative">
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

                  {/* Lineup Role Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lineup Position *
                    </label>
                    <select
                      value={lineupRole}
                      onChange={(e) => setLineupRole(e.target.value as LineupPosition)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="HEADLINER">Headliner</option>
                      <option value="DIRECT_SUPPORT">Direct Support</option>
                      <option value="OPENER">Opener</option>
                      <option value="LOCAL_OPENER">Local Opener</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {getRoleDescription(lineupRole)}
                    </p>
                  </div>

                  {/* Offer Details - Using existing OfferInput component */}
                  <div className="mb-4">
                    <OfferInput
                      value={offerData}
                      onChange={setOfferData}
                      label="Financial Offer"
                      placeholder="Set guarantee, door split, or custom terms"
                      showPresets={true}
                      required={false}
                    />
                  </div>

                  {/* Set Length */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Set Length (minutes)
                    </label>
                    <input
                      type="number"
                      value={setLength}
                      onChange={(e) => setSetLength(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 45"
                      min="1"
                      max="120"
                    />
                  </div>

                  {/* Personal Message */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a personal note to the artist..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={!selectedArtist || isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isSubmitting ? 'Sending...' : 'Send Invitation'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document root level
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
} 
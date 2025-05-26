'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Basic interfaces for this component
interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
  ageRestriction: string;
}

interface Artist {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface ShowFormData {
  artistId: string;
  venueId: string;
  date: string;
  city: string;
  state: string;
  venueName: string;
  artistName: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  guarantee?: number;
  doorDeal?: {
    split: string;
    minimumGuarantee?: number;
  };
  ticketPrice?: {
    advance?: number;
    door?: number;
  };
  capacity: number;
  ageRestriction: string;
  loadIn?: string;
  soundcheck?: string;
  doorsOpen?: string;
  showTime?: string;
  curfew?: string;
  expectedDraw?: number;
  notes?: string;
}

export default function AddShow() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const [formData, setFormData] = useState<ShowFormData>({
    artistId: '',
    venueId: '',
    date: '',
    city: '',
    state: '',
    venueName: '',
    artistName: '',
    status: 'confirmed',
    capacity: 0,
    ageRestriction: 'all-ages',
  });

  // Load venues and artists
  useEffect(() => {
    const loadData = async () => {
      try {
        const [venuesResponse, artistsResponse] = await Promise.all([
          fetch('/api/venues'),
          fetch('/api/artists')
        ]);

        if (venuesResponse.ok && artistsResponse.ok) {
          const [venuesData, artistsData] = await Promise.all([
            venuesResponse.json(),
            artistsResponse.json()
          ]);
          setVenues(venuesData);
          setArtists(artistsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Update form when venue is selected
  useEffect(() => {
    if (selectedVenue) {
      setFormData(prev => ({
        ...prev,
        venueId: selectedVenue.id,
        venueName: selectedVenue.name,
        city: selectedVenue.city,
        state: selectedVenue.state,
        capacity: selectedVenue.capacity,
        ageRestriction: selectedVenue.ageRestriction,
      }));
    }
  }, [selectedVenue]);

  // Update form when artist is selected
  useEffect(() => {
    if (selectedArtist) {
      setFormData(prev => ({
        ...prev,
        artistId: selectedArtist.id,
        artistName: selectedArtist.name,
      }));
    }
  }, [selectedArtist]);

  const handleVenueChange = (venueId: string) => {
    const venue = venues.find(v => v.id === venueId);
    setSelectedVenue(venue || null);
  };

  const handleArtistChange = (artistId: string) => {
    const artist = artists.find(a => a.id === artistId);
    setSelectedArtist(artist || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          createdBy: 'admin', // In a real app, this would be the current user
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create show');
      }

      router.push('/shows');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Show</h1>
              <p className="text-gray-600 mt-1">Create a new show listing</p>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/shows"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
              >
                ← Back to Shows
              </Link>
              <Link 
                href="/admin"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue *
                </label>
                <select
                  id="venue"
                  required
                  value={formData.venueId}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select a venue...</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name} - {venue.city}, {venue.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-2">
                  Artist *
                </label>
                <select
                  id="artist"
                  required
                  value={formData.artistId}
                  onChange={(e) => handleArtistChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select an artist...</option>
                  {artists.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name} - {artist.city}, {artist.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Show Date *
                </label>
                <input
                  type="date"
                  id="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="tentative">Tentative</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Show Times */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Show Times</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="loadIn" className="block text-sm font-medium text-gray-700 mb-2">
                  Load In Time
                </label>
                <input
                  type="time"
                  id="loadIn"
                  value={formData.loadIn || ''}
                  onChange={(e) => setFormData({ ...formData, loadIn: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="soundcheck" className="block text-sm font-medium text-gray-700 mb-2">
                  Soundcheck
                </label>
                <input
                  type="time"
                  id="soundcheck"
                  value={formData.soundcheck || ''}
                  onChange={(e) => setFormData({ ...formData, soundcheck: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="doorsOpen" className="block text-sm font-medium text-gray-700 mb-2">
                  Doors Open
                </label>
                <input
                  type="time"
                  id="doorsOpen"
                  value={formData.doorsOpen || ''}
                  onChange={(e) => setFormData({ ...formData, doorsOpen: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="showTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Show Time
                </label>
                <input
                  type="time"
                  id="showTime"
                  value={formData.showTime || ''}
                  onChange={(e) => setFormData({ ...formData, showTime: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="curfew" className="block text-sm font-medium text-gray-700 mb-2">
                  Curfew
                </label>
                <input
                  type="time"
                  id="curfew"
                  value={formData.curfew || ''}
                  onChange={(e) => setFormData({ ...formData, curfew: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Financial Details</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="guarantee" className="block text-sm font-medium text-gray-700 mb-2">
                  Guarantee ($)
                </label>
                <input
                  type="number"
                  id="guarantee"
                  min="0"
                  value={formData.guarantee || ''}
                  onChange={(e) => setFormData({ ...formData, guarantee: parseInt(e.target.value) || undefined })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="expectedDraw" className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Draw
                </label>
                <input
                  type="number"
                  id="expectedDraw"
                  min="0"
                  value={formData.expectedDraw || ''}
                  onChange={(e) => setFormData({ ...formData, expectedDraw: parseInt(e.target.value) || undefined })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="advancePrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Advance Ticket Price ($)
                </label>
                <input
                  type="number"
                  id="advancePrice"
                  min="0"
                  value={formData.ticketPrice?.advance || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    ticketPrice: { 
                      ...formData.ticketPrice, 
                      advance: parseInt(e.target.value) || undefined 
                    }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="doorPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Door Price ($)
                </label>
                <input
                  type="number"
                  id="doorPrice"
                  min="0"
                  value={formData.ticketPrice?.door || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    ticketPrice: { 
                      ...formData.ticketPrice, 
                      door: parseInt(e.target.value) || undefined 
                    }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Additional Information</h2>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Additional details about the show..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/shows"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Show'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
} 
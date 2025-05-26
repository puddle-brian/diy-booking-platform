'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Show } from '../../../types';

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

export default function ShowsPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const debouncedLocation = useDebounce(searchLocation, 300);
  const debouncedDate = useDebounce(searchDate, 100);

  const loadShows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shows');
      
      if (!response.ok) {
        throw new Error('Failed to fetch shows');
      }

      const showsData = await response.json();
      setShows(Array.isArray(showsData) ? showsData : []);
      
    } catch (error) {
      console.error('Error loading shows:', error);
      setShows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShows();
  }, []);

  // Filter shows based on search criteria
  const filteredShows = useMemo(() => {
    if (loading || !shows || !Array.isArray(shows)) return [];
    
    return shows.filter(show => {
      // Safety check
      if (!show || typeof show !== 'object') return false;

      try {
        // Location search
        if (debouncedLocation && debouncedLocation.trim()) {
          const searchTerm = debouncedLocation.toLowerCase().trim();
          const searchableText = [
            show.artistName || '',
            show.venueName || '',
            show.city || '',
            show.state || '',
            `${show.city || ''}, ${show.state || ''}`
          ].join(' ').toLowerCase();
          
          if (!searchableText.includes(searchTerm)) {
            return false;
          }
        }

        // Date filter
        if (debouncedDate && debouncedDate.trim()) {
          if (show.date !== debouncedDate) {
            return false;
          }
        }

        // Status filter
        if (selectedStatus && selectedStatus !== 'all') {
          if (show.status !== selectedStatus) {
            return false;
          }
        }

        // Only show future shows by default (unless specifically searching past dates)
        if (!debouncedDate) {
          const showDate = new Date(show.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (showDate < today) {
            return false;
          }
        }

        return true;
      } catch (error) {
        console.warn('Error filtering show:', error, show);
        return false;
      }
    });
  }, [loading, shows, debouncedLocation, debouncedDate, selectedStatus]);

  const hasActiveFilters = debouncedLocation.trim() || debouncedDate.trim() || selectedStatus;

  const clearAllFilters = () => {
    setSearchLocation('');
    setSearchDate('');
    setSelectedStatus('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'tentative': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80">
                <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">diyshows <span className="text-sm font-normal text-gray-500">beta</span></h1>
              </Link>
            </div>
            
            {/* Centered Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h2 className="text-2xl font-bold text-gray-900">DIY Shows</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin/shows"
                className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
              >
                + Add a Show
              </Link>
              
              <Link 
                href="/admin/venues"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm border border-gray-200"
              >
                + List a Space
              </Link>
              
              <Link 
                href="/admin/artists"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm border border-gray-200"
              >
                + List an Artist
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <section className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2">
            <div className="flex items-center">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-1">
                <div className="p-4">
                  <div className="text-xs font-semibold text-gray-700 mb-1">Where</div>
                  <input
                    type="text"
                    placeholder="Search shows, venues, artists..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full text-sm placeholder-gray-500 border-none outline-none"
                  />
                </div>
                <div className="p-4 border-l border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-1">When</div>
                  <input
                    type="date"
                    placeholder="Show date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full text-sm placeholder-gray-500 border-none outline-none"
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

        {/* Status Filter */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-wrap gap-3 items-center justify-center">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Shows</option>
              <option value="confirmed">Confirmed</option>
              <option value="tentative">Tentative</option>
              <option value="cancelled">Cancelled</option>
            </select>

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
            <div className="mt-3 text-sm text-gray-600 text-center">
              Showing {filteredShows.length} of {shows.length} shows
              {debouncedLocation.trim() && (
                <span className="ml-2 text-blue-600">
                  • searching "{debouncedLocation}"
                </span>
              )}
              {debouncedDate && (
                <span className="ml-2 text-blue-600">
                  • on {formatDate(debouncedDate)}
                </span>
              )}
              {selectedStatus && (
                <span className="ml-2 text-blue-600">
                  • {selectedStatus} only
                </span>
              )}
            </div>
          )}
        </div>

        {/* Shows List */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            // Loading state
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                    </div>
                    <div className="h-8 w-20 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredShows.length === 0 ? (
            // Empty state
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎵</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {debouncedLocation.trim() ? `No shows found for "${debouncedLocation}"` : 
                   hasActiveFilters ? 'No matching shows found' : 'No Upcoming Shows'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {debouncedLocation.trim() ? `Try searching for a different location, artist, or venue.` :
                   hasActiveFilters 
                    ? 'Try adjusting your filters to see more results.'
                    : 'Be the first to add a show to the DIY network! Connect artists with venues to get the scene moving.'
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
                    <div className="flex gap-3 justify-center">
                      <Link 
                        href="/admin/venues" 
                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-medium"
                      >
                        + List a Space
                      </Link>
                      <Link 
                        href="/admin/artists" 
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium border border-gray-200"
                      >
                        + List an Artist
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Shows list
            <div className="space-y-4">
              {filteredShows.map((show) => (
                <div key={show.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{show.artistName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(show.status)}`}>
                            {show.status}
                          </span>
                        </div>
                        <p className="text-lg text-gray-700 mb-1">at {show.venueName}</p>
                        <p className="text-sm text-gray-600">{show.city}, {show.state}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">{formatDate(show.date)}</div>
                        {show.showTime && (
                          <div className="text-sm text-gray-600">Show: {formatTime(show.showTime)}</div>
                        )}
                        {show.doorsOpen && (
                          <div className="text-sm text-gray-600">Doors: {formatTime(show.doorsOpen)}</div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {show.ageRestriction && (
                        <div>
                          <span className="text-gray-500">Ages:</span>
                          <span className="ml-1 font-medium">{show.ageRestriction}</span>
                        </div>
                      )}
                      {show.ticketPrice && (show.ticketPrice.advance || show.ticketPrice.door) && (
                        <div>
                          <span className="text-gray-500">Tickets:</span>
                          <span className="ml-1 font-medium">
                            {show.ticketPrice.advance && `$${show.ticketPrice.advance} adv`}
                            {show.ticketPrice.advance && show.ticketPrice.door && ' / '}
                            {show.ticketPrice.door && `$${show.ticketPrice.door} door`}
                          </span>
                        </div>
                      )}
                      {show.capacity && (
                        <div>
                          <span className="text-gray-500">Capacity:</span>
                          <span className="ml-1 font-medium">{show.capacity}</span>
                        </div>
                      )}
                      {show.expectedDraw && (
                        <div>
                          <span className="text-gray-500">Expected:</span>
                          <span className="ml-1 font-medium">{show.expectedDraw}</span>
                        </div>
                      )}
                    </div>

                    {show.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{show.notes}</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex gap-3">
                        <Link 
                          href={`/artists/${show.artistId}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Artist →
                        </Link>
                        <Link 
                          href={`/venues/${show.venueId}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Venue →
                        </Link>
                      </div>
                      {show.promotion && (
                        <div className="text-xs text-gray-500">
                          Promoted by: {show.promotion.flyerUrl ? 'Flyer available' : 'Venue promotion'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredShows.length > 0 && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Show more shows
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">DIY Booking</h3>
              <p className="text-gray-400">
                Connecting artists with authentic spaces. diyshows beta.
              </p>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-3">For Artists</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/?tab=venues" className="hover:text-white">Find Venues</Link></li>
                <li><Link href="/shows" className="hover:text-white">Browse Shows</Link></li>
                <li><Link href="/admin/artists" className="hover:text-white">List Yourself</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-3">For Venues</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/admin/venues" className="hover:text-white">List Your Space</Link></li>
                <li><Link href="/?tab=artists" className="hover:text-white">Browse Artists</Link></li>
                <li><Link href="/shows" className="hover:text-white">View Shows</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/" className="hover:text-white">About BYOFL</Link></li>
                <li><Link href="/" className="hover:text-white">Support</Link></li>
                <li><Link href="/" className="hover:text-white">Guidelines</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex justify-between items-center">
            <p className="text-gray-400">
              © 2025 DIY Booking Platform. Inspired by the BYOFL zine.
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
    </div>
  );
} 
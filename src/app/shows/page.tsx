'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Show } from '../../../types';
import UserStatus from '../../components/UserStatus';
import { MobileFeedbackButton } from '../../components/FeedbackWidget';
import AuthLink from '../../components/AuthLink';

// 🎵 Extended Show interface to include lineup
interface ShowWithLineup extends Show {
  title?: string;
  lineup?: Array<{
    artistId: string;
    artistName: string;
    billingPosition: 'HEADLINER' | 'CO_HEADLINER' | 'SUPPORT' | 'OPENER' | 'LOCAL_SUPPORT';
    performanceOrder: number;
    setLength?: number;
    guarantee?: number;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  }>;
}

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

// Import unified show naming system
import { generateSmartShowTitle } from '../../utils/showNaming';

const getLineupSummary = (show: ShowWithLineup): { 
  headliner: string; 
  supportCount: number; 
  isMultiArtist: boolean;
  confirmedCount: number;
} => {
  if (!show.lineup || show.lineup.length === 0) {
    return {
      headliner: show.artistName || 'TBA',
      supportCount: 0,
      isMultiArtist: false,
      confirmedCount: 1
    };
  }

  const sortedLineup = [...show.lineup].sort((a, b) => a.performanceOrder - b.performanceOrder);
  const headliner = sortedLineup.find(item => item.billingPosition === 'HEADLINER') || sortedLineup[0];
  const supportCount = sortedLineup.length - 1;
  const confirmedCount = sortedLineup.filter(item => item.status === 'CONFIRMED').length;

  return {
    headliner: headliner?.artistName || 'TBA',
    supportCount,
    isMultiArtist: sortedLineup.length > 1,
    confirmedCount
  };
};

export default function ShowsPage() {
  const [shows, setShows] = useState<ShowWithLineup[]>([]);
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
        // Location search - now includes lineup artist names
        if (debouncedLocation && debouncedLocation.trim()) {
          const searchTerm = debouncedLocation.toLowerCase().trim();
          
          // Build searchable text including lineup
          let searchableText = [
            show.artistName || '',
            show.venueName || '',
            show.city || '',
            show.state || '',
            `${show.city || ''}, ${show.state || ''}`
          ];

          // Add lineup artist names to search
          if (show.lineup && show.lineup.length > 0) {
            show.lineup.forEach(lineupItem => {
              searchableText.push(lineupItem.artistName || '');
            });
          }

          const searchText = searchableText.join(' ').toLowerCase();
          
          if (!searchText.includes(searchTerm)) {
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
        {/* Desktop Layout - Hidden on mobile */}
        <div className="hidden md:block">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-3 hover:opacity-80">
                  <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight">diyshows <span className="text-sm font-normal text-gray-500">beta</span></h1>
                </Link>
                <span className="text-gray-300">•</span>
                <h2 className="text-lg font-semibold text-gray-900">DIY Shows</h2>
              </div>
              
              {/* Right side - Just User Status */}
              <div className="flex items-center">
                <UserStatus />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Hidden on desktop */}
        <div className="md:hidden">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Top Row: Logo, Title, and Navigation */}
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80">
                <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight">diyshows <span className="text-xs font-normal text-gray-500">beta</span></h1>
              </Link>
              
              {/* Back arrow or menu icon could go here */}
              <Link href="/" className="text-gray-600 hover:text-black">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
            </div>
            
            {/* Middle Row: Page Title */}
            <div className="flex justify-center">
              <h2 className="text-2xl font-bold text-gray-900">DIY Shows</h2>
            </div>
            
            {/* Bottom Row: Primary Action Buttons Only */}
            <div className="flex items-center justify-center space-x-3">
              <Link 
                href="/admin/shows"
                className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm flex-1 text-center max-w-[120px]"
              >
                + Add Show
              </Link>
              
              <Link 
                href="/admin/venues"
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm border border-gray-200 flex-1 text-center max-w-[120px]"
              >
                + Space
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-20">
        {/* Search and Filter Section */}
        <div className="max-w-4xl mx-auto mb-8">
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
                                                      <h3 className="text-xl font-bold text-gray-900">
                              {(() => {
                                // Handle custom titles
                                if (show.title && !show.title.includes(' at ')) {
                                  return show.title;
                                }
                                
                                // Use lineup if available
                                if (show.lineup && show.lineup.length > 0) {
                                  const { title } = generateSmartShowTitle(show.lineup);
                                  return title;
                                }
                                
                                // Fallback to original artistName
                                return show.artistName || 'TBA';
                              })()}
                            </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(show.status)}`}>
                            {show.status}
                          </span>
                        </div>
                        <p className="text-lg text-gray-700 mb-1">at {show.venueName}</p>
                        <p className="text-sm text-gray-600">{show.city}, {show.state}</p>
                        
                        {/* 🎵 NEW: Lineup Summary */}
                        {(() => {
                          const lineupSummary = getLineupSummary(show);
                          return lineupSummary.isMultiArtist ? (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {lineupSummary.supportCount + 1} Artists
                              </span>
                              {lineupSummary.confirmedCount < (lineupSummary.supportCount + 1) && (
                                <span className="text-gray-500 text-xs">
                                  ({lineupSummary.confirmedCount} confirmed)
                                </span>
                              )}
                            </div>
                          ) : null;
                        })()}
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
                        {/* 🎵 NEW: Smart Artist Links */}
                        {(() => {
                          const lineupSummary = getLineupSummary(show);
                          
                          if (lineupSummary.isMultiArtist && show.lineup && show.lineup.length > 0) {
                            // Multi-artist show - show lineup preview
                            const sortedLineup = [...show.lineup].sort((a, b) => a.performanceOrder - b.performanceOrder);
                            const displayLineup = sortedLineup.slice(0, 3); // Show first 3
                            const hasMore = sortedLineup.length > 3;
                            
                            return (
                              <div className="flex flex-wrap gap-2 items-center">
                                {displayLineup.map((lineupItem, index) => (
                                  <Link 
                                    key={lineupItem.artistId}
                                    href={`/artists/${lineupItem.artistId}`}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                  >
                                    {lineupItem.artistName}
                                  </Link>
                                ))}
                                {hasMore && (
                                  <span className="text-xs text-gray-500">
                                    +{sortedLineup.length - 3} more
                                  </span>
                                )}
                              </div>
                            );
                          } else {
                            // Single artist show - original link
                            return (
                              <Link 
                                href={`/artists/${show.artistId}`}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View Artist →
                              </Link>
                            );
                          }
                        })()}
                        
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
      </main>

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
                <li><Link href="/admin/venues" className="hover:text-white">List Your Space</Link></li>
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

      {/* Fixed Bottom Navigation - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        {/* Primary Actions Row */}
        <div className="flex items-center justify-center space-x-2 px-4 py-3 border-b border-gray-100">
          <Link 
            href="/admin/shows"
            className="bg-black text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors text-xs min-w-[80px] text-center"
          >
            + Show
          </Link>
          
          <Link 
            href="/admin/venues"
            className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors text-xs border border-gray-200 min-w-[80px] text-center"
          >
            + Space
          </Link>
          
          <Link 
            href="/admin/artists"
            className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors text-xs border border-gray-200 min-w-[80px] text-center"
          >
            + Artist
          </Link>
        </div>
        
        {/* User Status Row */}
        <div className="flex items-center justify-center px-4 py-2">
          <UserStatus />
          <MobileFeedbackButton />
        </div>
      </div>

      {/* Fixed Bottom Navigation - Desktop */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-center space-x-4 px-4 py-4">
          <Link 
            href="/admin/shows"
            className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
          >
            + Add a Show
          </Link>
          
          <Link 
            href="/admin/venues"
            className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm border border-gray-200"
          >
            + List a Space
          </Link>
          
          <Link 
            href="/admin/artists"
            className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm border border-gray-200"
          >
            + List an Artist
          </Link>
        </div>
      </div>
    </div>
  );
} 
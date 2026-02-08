'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface ShowRequest {
  id: string;
  title: string;
  description?: string;
  requestedDate: string;
  targetLocations: string[];
  status: string;
  genres: string[];
  artist: {
    id: string;
    name: string;
    genres: string[];
    artistType?: string;
    imageUrl?: string;
    location?: {
      city: string;
      stateProvince: string;
    };
  };
}

export default function TouringArtistsPage() {
  const { user } = useAuth();
  const [showRequests, setShowRequests] = useState<ShowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [venueLocation, setVenueLocation] = useState<{ city: string; state: string } | null>(null);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'location'>('date');

  // Load user's venue if they have one
  useEffect(() => {
    const loadVenueProfile = async () => {
      if (!user?.memberships) return;
      
      const venueMembership = user.memberships.find(m => m.entityType === 'venue');
      if (venueMembership) {
        try {
          const response = await fetch(`/api/venues/${venueMembership.entityId}`);
          if (response.ok) {
            const venue = await response.json();
            setVenueLocation({ 
              city: venue.location?.city || venue.city, 
              state: venue.location?.stateProvince || venue.state 
            });
          }
        } catch (error) {
          console.error('Failed to load venue:', error);
        }
      }
    };

    loadVenueProfile();
  }, [user]);

  // Load show requests
  useEffect(() => {
    const loadShowRequests = async () => {
      try {
        const response = await fetch('/api/show-requests?initiatedBy=ARTIST&status=OPEN');
        if (response.ok) {
          const data = await response.json();
          setShowRequests(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to load show requests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadShowRequests();
  }, []);

  // Get all unique genres from requests
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    showRequests.forEach(req => {
      req.artist?.genres?.forEach(g => genres.add(g));
      req.genres?.forEach(g => genres.add(g));
    });
    return Array.from(genres).sort();
  }, [showRequests]);

  // Get all unique locations
  const allLocations = useMemo(() => {
    const locations = new Set<string>();
    showRequests.forEach(req => {
      req.targetLocations?.forEach(loc => locations.add(loc));
    });
    return Array.from(locations).sort();
  }, [showRequests]);

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let filtered = [...showRequests];

    // Filter by location
    if (filterLocation) {
      filtered = filtered.filter(req => 
        req.targetLocations?.some(loc => 
          loc.toLowerCase().includes(filterLocation.toLowerCase())
        )
      );
    }

    // Filter by genre
    if (filterGenre) {
      filtered = filtered.filter(req => 
        req.artist?.genres?.includes(filterGenre) || req.genres?.includes(filterGenre)
      );
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime());
    } else if (sortBy === 'location' && venueLocation) {
      // Sort by whether the request matches user's location
      filtered.sort((a, b) => {
        const aMatches = a.targetLocations?.some(loc => 
          loc.toLowerCase().includes(venueLocation.city.toLowerCase()) ||
          loc.toLowerCase().includes(venueLocation.state.toLowerCase())
        );
        const bMatches = b.targetLocations?.some(loc => 
          loc.toLowerCase().includes(venueLocation.city.toLowerCase()) ||
          loc.toLowerCase().includes(venueLocation.state.toLowerCase())
        );
        if (aMatches && !bMatches) return -1;
        if (bMatches && !aMatches) return 1;
        return new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime();
      });
    }

    return filtered;
  }, [showRequests, filterLocation, filterGenre, sortBy, venueLocation]);

  // Count requests in user's location
  const localRequestCount = useMemo(() => {
    if (!venueLocation) return 0;
    return showRequests.filter(req => 
      req.targetLocations?.some(loc => 
        loc.toLowerCase().includes(venueLocation.city.toLowerCase()) ||
        loc.toLowerCase().includes(venueLocation.state.toLowerCase())
      )
    ).length;
  }, [showRequests, venueLocation]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-text-muted hover:text-text-secondary text-xs">
                ← Back
              </Link>
              <div>
                <h1 className="text-lg font-medium text-text-accent">🎸 Touring Artists</h1>
                <p className="text-xs text-text-muted">Artists looking for shows</p>
              </div>
            </div>
            {venueLocation && localRequestCount > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 px-3 py-2 rounded">
                <span className="text-sm text-green-400 font-medium">
                  {localRequestCount} seeking shows in {venueLocation.city}!
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-border-subtle bg-bg-secondary/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">Location:</label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="bg-bg-tertiary border border-border-subtle text-sm px-3 py-1.5 rounded"
              >
                <option value="">All Locations</option>
                {venueLocation && (
                  <option value={venueLocation.city}>📍 My Area ({venueLocation.city})</option>
                )}
                {allLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Genre Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">Genre:</label>
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="bg-bg-tertiary border border-border-subtle text-sm px-3 py-1.5 rounded"
              >
                <option value="">All Genres</option>
                {allGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'location')}
                className="bg-bg-tertiary border border-border-subtle text-sm px-3 py-1.5 rounded"
              >
                <option value="date">By Date</option>
                {venueLocation && <option value="location">By My Location</option>}
              </select>
            </div>

            {/* Clear Filters */}
            {(filterLocation || filterGenre) && (
              <button
                onClick={() => { setFilterLocation(''); setFilterGenre(''); }}
                className="text-xs text-status-error hover:text-status-error/80"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-bg-secondary border border-border-subtle p-4 animate-pulse">
                <div className="h-6 bg-bg-tertiary rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-bg-tertiary rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 border border-border-subtle bg-bg-secondary rounded-lg">
            <div className="text-4xl mb-4">🎸</div>
            <h3 className="text-lg font-medium text-text-accent mb-2">No Touring Artists Found</h3>
            <p className="text-text-secondary text-sm">
              {filterLocation || filterGenre 
                ? 'Try adjusting your filters to see more results.'
                : 'No artists are currently seeking shows. Check back later!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="text-xs text-text-muted mb-4">
              Showing {filteredRequests.length} open request{filteredRequests.length !== 1 ? 's' : ''}
            </div>

            {/* Request Cards */}
            {filteredRequests.map(request => {
              const isLocalMatch = venueLocation && request.targetLocations?.some(loc => 
                loc.toLowerCase().includes(venueLocation.city.toLowerCase()) ||
                loc.toLowerCase().includes(venueLocation.state.toLowerCase())
              );

              return (
                <Link 
                  key={request.id}
                  href={`/show-requests/${request.id}`}
                  className={`block bg-bg-secondary border rounded-lg overflow-hidden hover:border-border-default transition-colors ${
                    isLocalMatch ? 'border-green-500/30' : 'border-border-subtle'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex gap-4">
                      {/* Artist Image */}
                      <div className="w-16 h-16 rounded-lg bg-bg-tertiary overflow-hidden flex-shrink-0">
                        {request.artist?.imageUrl ? (
                          <img 
                            src={request.artist.imageUrl} 
                            alt={request.artist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🎸
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-text-primary">
                                {request.artist?.name || 'Unknown Artist'}
                              </h3>
                              {isLocalMatch && (
                                <span className="text-2xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded font-medium">
                                  YOUR AREA
                                </span>
                              )}
                            </div>
                            {request.artist?.location && (
                              <p className="text-xs text-text-muted">
                                From {request.artist.location.city}, {request.artist.location.stateProvince}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-medium text-amber-400">
                              {formatDate(request.requestedDate)}
                            </div>
                          </div>
                        </div>

                        {/* Target Locations */}
                        <div className="mt-2">
                          <span className="text-xs text-text-secondary">Seeking shows in: </span>
                          <span className="text-xs text-text-primary font-medium">
                            {request.targetLocations?.join(', ') || 'Any location'}
                          </span>
                        </div>

                        {/* Genres */}
                        {request.artist?.genres && request.artist.genres.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {request.artist.genres.slice(0, 5).map(genre => (
                              <span 
                                key={genre} 
                                className="text-2xs px-2 py-0.5 bg-bg-tertiary text-text-secondary rounded"
                              >
                                {genre}
                              </span>
                            ))}
                            {request.artist.genres.length > 5 && (
                              <span className="text-2xs text-text-muted">
                                +{request.artist.genres.length - 5} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Description preview */}
                        {request.description && (
                          <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                            {request.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 bg-bg-tertiary/50 border-t border-border-subtle flex justify-between items-center">
                    <span className="text-2xs text-text-muted">
                      {request.title}
                    </span>
                    <span className="text-xs text-text-accent">
                      View Details →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

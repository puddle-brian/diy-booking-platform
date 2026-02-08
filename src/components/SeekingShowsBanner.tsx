'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface ShowRequest {
  id: string;
  title: string;
  requestedDate: string;
  targetLocations: string[];
  artist: {
    id: string;
    name: string;
    genres: string[];
    location?: {
      city: string;
      stateProvince: string;
    };
  };
  genres: string[];
  description?: string;
  status: string;
}

interface SeekingShowsBannerProps {
  showRequests?: ShowRequest[];
  userLocation?: { city: string; state: string };
  maxDisplay?: number;
}

export default function SeekingShowsBanner({ 
  showRequests: propShowRequests, 
  userLocation,
  maxDisplay = 5 
}: SeekingShowsBannerProps) {
  const { user } = useAuth();
  const [showRequests, setShowRequests] = useState<ShowRequest[]>(propShowRequests || []);
  const [loading, setLoading] = useState(!propShowRequests);
  const [expanded, setExpanded] = useState(false);

  // Get user's venue location if they're a venue owner
  const [venueLocation, setVenueLocation] = useState<{ city: string; state: string } | null>(null);

  useEffect(() => {
    // Load user's venue if they have one
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

  useEffect(() => {
    // Load show requests if not provided via props
    if (!propShowRequests) {
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
    }
  }, [propShowRequests]);

  if (loading) return null;
  if (showRequests.length === 0) return null;

  // Determine effective location for filtering
  const effectiveLocation = userLocation || venueLocation;

  // Filter and sort requests
  const sortedRequests = [...showRequests].sort((a, b) => {
    // If user has a location, prioritize requests targeting their area
    if (effectiveLocation) {
      const aMatchesLocation = a.targetLocations?.some(loc => 
        loc.toLowerCase().includes(effectiveLocation.city.toLowerCase()) ||
        loc.toLowerCase().includes(effectiveLocation.state.toLowerCase())
      );
      const bMatchesLocation = b.targetLocations?.some(loc => 
        loc.toLowerCase().includes(effectiveLocation.city.toLowerCase()) ||
        loc.toLowerCase().includes(effectiveLocation.state.toLowerCase())
      );
      
      if (aMatchesLocation && !bMatchesLocation) return -1;
      if (bMatchesLocation && !aMatchesLocation) return 1;
    }
    
    // Then sort by date
    return new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime();
  });

  // Requests matching user's location
  const localRequests = effectiveLocation 
    ? sortedRequests.filter(req => 
        req.targetLocations?.some(loc => 
          loc.toLowerCase().includes(effectiveLocation.city.toLowerCase()) ||
          loc.toLowerCase().includes(effectiveLocation.state.toLowerCase())
        )
      )
    : [];

  const displayRequests = expanded ? sortedRequests : sortedRequests.slice(0, maxDisplay);
  const hasMore = sortedRequests.length > maxDisplay;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-amber-500/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎸</span>
          <h3 className="text-sm font-medium text-amber-400">
            Touring Artists Seeking Shows
          </h3>
          <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded">
            {sortedRequests.length} open {sortedRequests.length === 1 ? 'request' : 'requests'}
          </span>
        </div>
        {localRequests.length > 0 && effectiveLocation && (
          <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
            {localRequests.length} seeking shows in {effectiveLocation.city}!
          </span>
        )}
      </div>

      {/* Requests List */}
      <div className="divide-y divide-border-subtle">
        {displayRequests.map((request) => {
          const isLocalMatch = effectiveLocation && request.targetLocations?.some(loc => 
            loc.toLowerCase().includes(effectiveLocation.city.toLowerCase()) ||
            loc.toLowerCase().includes(effectiveLocation.state.toLowerCase())
          );

          return (
            <Link 
              key={request.id}
              href={`/show-requests/${request.id}`}
              className={`block px-4 py-3 hover:bg-bg-hover transition-colors ${
                isLocalMatch ? 'bg-green-500/5' : ''
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {request.artist?.name || 'Unknown Artist'}
                    </span>
                    {isLocalMatch && (
                      <span className="text-2xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded shrink-0">
                        YOUR AREA
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {request.artist?.location?.city && (
                      <span>From {request.artist.location.city}, {request.artist.location.stateProvince} • </span>
                    )}
                    <span>Seeking: {request.targetLocations?.join(', ') || 'Any location'}</span>
                  </div>
                  {request.artist?.genres && request.artist.genres.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {request.artist.genres.slice(0, 3).map(genre => (
                        <span 
                          key={genre} 
                          className="text-2xs px-1.5 py-0.5 bg-bg-tertiary text-text-secondary rounded"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm text-amber-400 font-medium">
                    {formatDate(request.requestedDate)}
                  </div>
                  <div className="text-2xs text-text-muted mt-0.5">
                    {request.title}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      {hasMore && (
        <div className="px-4 py-2 border-t border-amber-500/20 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            {expanded ? '← Show less' : `View all ${sortedRequests.length} requests →`}
          </button>
        </div>
      )}

      {/* CTA for venue owners */}
      {effectiveLocation && localRequests.length > 0 && (
        <div className="px-4 py-3 bg-green-500/5 border-t border-green-500/20">
          <p className="text-xs text-green-400">
            💡 <strong>{localRequests.length} {localRequests.length === 1 ? 'artist is' : 'artists are'} looking for shows in your area!</strong>{' '}
            Click on a request to offer them a show at your venue.
          </p>
        </div>
      )}
    </div>
  );
}

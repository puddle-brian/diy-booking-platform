'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Venue, Artist, ARTIST_TYPE_LABELS } from '../../types/index';
import { useAuth } from '../contexts/AuthContext';
import FavoriteButton from './FavoriteButton';

interface SmartGalleryProps {
  venues: Venue[];
  artists: Artist[];
  activeTab: 'venues' | 'artists';
  loading: boolean;
}

interface CategorySection {
  id: string;
  title: string;
  items: (Venue | Artist)[];
  priority: number; // Higher priority = shown first
}

// Helper function to calculate distance (simplified - in real app would use proper geolocation)
function calculateDistance(userCity: string, userState: string, itemCity: string, itemState: string): number {
  // Simple distance calculation - same city = 0, same state = 50, different state = 100+
  if (userCity.toLowerCase() === itemCity.toLowerCase() && userState.toLowerCase() === itemState.toLowerCase()) {
    return 0;
  }
  if (userState.toLowerCase() === itemState.toLowerCase()) {
    return 50;
  }
  return 100;
}

// Helper function to check if genres match
function hasMatchingGenres(userGenres: string[], itemGenres: string[]): boolean {
  return userGenres.some(genre => itemGenres.includes(genre));
}

export default function SmartGallery({ venues, artists, activeTab, loading }: SmartGalleryProps) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<Venue | Artist | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.memberships || user.memberships.length === 0) return;
      
      setLoadingProfile(true);
      try {
        // Get the first membership to determine user's primary profile
        const primaryMembership = user.memberships[0];
        const response = await fetch(`/api/${primaryMembership.entityType}s/${primaryMembership.entityId}`);
        if (response.ok) {
          const profileData = await response.json();
          setUserProfile(profileData);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user]);

  // Scroll function for navigation buttons
  const scrollCategory = (categoryId: string, direction: 'left' | 'right') => {
    const container = scrollRefs.current[categoryId];
    if (!container) return;

    const cardWidth = 256; // 240px card + 16px gap
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  // Check if scroll buttons should be visible
  const [scrollStates, setScrollStates] = useState<{ [key: string]: { canScrollLeft: boolean; canScrollRight: boolean } }>({});

  const updateScrollState = (categoryId: string) => {
    const container = scrollRefs.current[categoryId];
    if (!container) return;

    const canScrollLeft = container.scrollLeft > 0;
    const canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth);

    setScrollStates(prev => ({
      ...prev,
      [categoryId]: { canScrollLeft, canScrollRight }
    }));
  };

  // Generate smart categories based on user context
  const categories = useMemo((): CategorySection[] => {
    if (loading || loadingProfile) return [];

    // Determine user type from memberships
    const userType = user?.memberships?.[0]?.entityType;

    console.log('SmartGallery: Generating categories', {
      activeTab,
      userType,
      hasUserProfile: !!userProfile,
      venuesCount: venues.length,
      artistsCount: artists.length
    });

    const sections: CategorySection[] = [];

    if (activeTab === 'venues' && userType === 'artist') {
      // Artist looking at venues
      const userArtist = userProfile as Artist;
      
      if (userArtist) {
        console.log('Artist viewing venues:', userArtist.name, 'from', userArtist.city, userArtist.state);
        console.log('Artist genres:', userArtist.genres);
        
        // 1. Venues near me (always show this first)
        const nearbyVenues = venues
          .filter(venue => calculateDistance(userArtist.city, userArtist.state, venue.city, venue.state) <= 50)
          .sort((a, b) => calculateDistance(userArtist.city, userArtist.state, a.city, a.state) - 
                          calculateDistance(userArtist.city, userArtist.state, b.city, b.state))
          .slice(0, 20);

        if (nearbyVenues.length > 0) {
          sections.push({
            id: 'venues-near-me',
            title: `Venues near ${userArtist.city}`,
            items: nearbyVenues,
            priority: 100
          });
        }

        // 2. If I have genres, show local venues that match my genres
        if (userArtist.genres && userArtist.genres.length > 0) {
          const localGenreVenues = venues
            .filter(venue => calculateDistance(userArtist.city, userArtist.state, venue.city, venue.state) <= 50)
            .filter(venue => hasMatchingGenres(userArtist.genres, venue.genres))
            .sort((a, b) => calculateDistance(userArtist.city, userArtist.state, a.city, a.state) - 
                            calculateDistance(userArtist.city, userArtist.state, b.city, b.state))
            .slice(0, 20);

          if (localGenreVenues.length > 0) {
            const primaryGenre = userArtist.genres[0];
            sections.push({
              id: 'local-genre-venues',
              title: `Local ${primaryGenre} venues`,
              items: localGenreVenues,
              priority: 95
            });
          }
        }

        // 3. Venues in my state (but not nearby)
        const stateVenues = venues
          .filter(venue => venue.state === userArtist.state)
          .filter(venue => calculateDistance(userArtist.city, userArtist.state, venue.city, venue.state) > 50) // Not nearby
          .slice(0, 20);

        if (stateVenues.length > 0) {
          sections.push({
            id: 'venues-in-state',
            title: `Other venues in ${userArtist.state}`,
            items: stateVenues,
            priority: 90
          });
        }

        // 4. Venues in locations where I have active requests (simulated as different states)
        const touringVenues = venues
          .filter(venue => venue.state !== userArtist.state) // Different states
          .slice(0, 20);

        if (touringVenues.length > 0) {
          sections.push({
            id: 'touring-location-venues',
            title: 'Venues in locations where I have active requests',
            items: touringVenues,
            priority: 85
          });
        }

        // 5. Popular venues (high rated venues from different states)
        const popularVenues = venues
          .filter(venue => venue.state !== userArtist.state)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 12);

        if (popularVenues.length > 0) {
          sections.push({
            id: 'popular-venues',
            title: 'Popular venues',
            items: popularVenues,
            priority: 80
          });
        }

        // 6. If I have genres, show venues that match my genres in other states
        if (userArtist.genres && userArtist.genres.length > 0) {
          const genreVenuesOtherStates = venues
            .filter(venue => venue.state !== userArtist.state)
            .filter(venue => hasMatchingGenres(userArtist.genres, venue.genres))
            .slice(0, 12);

          if (genreVenuesOtherStates.length > 0) {
            const primaryGenre = userArtist.genres[0];
            sections.push({
              id: 'genre-venues-other-states',
              title: `${primaryGenre.charAt(0).toUpperCase() + primaryGenre.slice(1)} venues nationwide`,
              items: genreVenuesOtherStates,
              priority: 75
            });
          }
        }

        // 7. Large capacity venues (for bigger shows)
        const largeVenues = venues
          .filter(venue => venue.capacity >= 500)
          .sort((a, b) => b.capacity - a.capacity)
          .slice(0, 12);

        if (largeVenues.length > 0) {
          sections.push({
            id: 'large-venues',
            title: 'Large capacity venues',
            items: largeVenues,
            priority: 70
          });
        }

        // 8. Final fallback: All venues (ensure gallery is never empty)
        if (sections.length === 0) {
          const allVenues = venues.slice(0, 12);
          if (allVenues.length > 0) {
            sections.push({
              id: 'all-venues',
              title: 'All venues',
              items: allVenues,
              priority: 65
            });
          }
        }

        // 9. Ensure we always have at least 3 sections by adding more fallbacks
        if (sections.length < 3) {
          // Add small/intimate venues
          const smallVenues = venues
            .filter(venue => venue.capacity < 200)
            .sort((a, b) => a.capacity - b.capacity)
            .slice(0, 12);

          if (smallVenues.length > 0 && !sections.find(s => s.id === 'small-venues')) {
            sections.push({
              id: 'small-venues',
              title: 'Intimate venues',
              items: smallVenues,
              priority: 60
            });
          }
        }

        if (sections.length < 3) {
          // Add all-ages venues
          const allAgesVenues = venues
            .filter(venue => venue.ageRestriction === 'all-ages')
            .slice(0, 12);

          if (allAgesVenues.length > 0 && !sections.find(s => s.id === 'all-ages-venues')) {
            sections.push({
              id: 'all-ages-venues',
              title: 'All-ages venues',
              items: allAgesVenues,
              priority: 55
            });
          }
        }
      }

    } else if (activeTab === 'artists' && userType === 'venue') {
      // Venue looking at artists
      const userVenue = userProfile as Venue;
      
      if (userVenue) {
        console.log('Venue viewing artists:', userVenue.name, 'from', userVenue.city, userVenue.state);
        console.log('Venue genres:', userVenue.genres);
        
        // 1. Touring artists of matching genre looking for shows near me
        if (userVenue.genres && userVenue.genres.length > 0) {
          const touringArtists = artists
            .filter(artist => artist.status === 'seeking-shows')
            .filter(artist => calculateDistance(userVenue.city, userVenue.state, artist.city, artist.state) > 50) // Not local
            .filter(artist => hasMatchingGenres(userVenue.genres, artist.genres))
            .slice(0, 12);

          if (touringArtists.length > 0) {
            const primaryGenre = userVenue.genres[0];
            sections.push({
              id: 'touring-artists-near-me',
              title: `Touring ${primaryGenre} looking for shows near ${userVenue.city}`,
              items: touringArtists,
              priority: 100
            });
          }
        }

        // 2. Active local artists of matching genre
        if (userVenue.genres && userVenue.genres.length > 0) {
          const localArtists = artists
            .filter(artist => calculateDistance(userVenue.city, userVenue.state, artist.city, artist.state) <= 50)
            .filter(artist => artist.status === 'seeking-shows')
            .filter(artist => hasMatchingGenres(userVenue.genres, artist.genres))
            .slice(0, 12);

          if (localArtists.length > 0) {
            const primaryGenre = userVenue.genres[0];
            sections.push({
              id: 'local-artists',
              title: `Active local ${primaryGenre} bands`,
              items: localArtists,
              priority: 95
            });
          }
        }

        // 3. All touring artists near me (no genre filter)
        const allTouringArtists = artists
          .filter(artist => artist.status === 'seeking-shows')
          .filter(artist => calculateDistance(userVenue.city, userVenue.state, artist.city, artist.state) > 50)
          .slice(0, 12);

        if (allTouringArtists.length > 0) {
          sections.push({
            id: 'touring-artists-fallback',
            title: `Touring artists looking for shows near ${userVenue.city}`,
            items: allTouringArtists,
            priority: 90
          });
        }

        // 4. All local artists (no genre filter)
        const allLocalArtists = artists
          .filter(artist => calculateDistance(userVenue.city, userVenue.state, artist.city, artist.state) <= 50)
          .filter(artist => artist.status === 'seeking-shows')
          .slice(0, 12);

        if (allLocalArtists.length > 0) {
          sections.push({
            id: 'local-artists-fallback',
            title: `Active local bands`,
            items: allLocalArtists,
            priority: 85
          });
        }

        // 5. Artists in my state (not local)
        const stateArtists = artists
          .filter(artist => artist.state === userVenue.state)
          .filter(artist => calculateDistance(userVenue.city, userVenue.state, artist.city, artist.state) > 50)
          .filter(artist => artist.status === 'seeking-shows')
          .slice(0, 12);

        if (stateArtists.length > 0) {
          sections.push({
            id: 'state-artists',
            title: `Artists in ${userVenue.state}`,
            items: stateArtists,
            priority: 80
          });
        }

        // 6. Popular artists (different states)
        const popularArtists = artists
          .filter(artist => artist.state !== userVenue.state)
          .filter(artist => artist.status === 'seeking-shows')
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 12);

        if (popularArtists.length > 0) {
          sections.push({
            id: 'popular-artists',
            title: 'Popular artists',
            items: popularArtists,
            priority: 75
          });
        }

        // 7. Final fallback: Show any active artists (ensure gallery is never empty)
        if (sections.length === 0) {
          const allActiveArtists = artists
            .filter(artist => artist.status === 'seeking-shows')
            .slice(0, 12);
          
          if (allActiveArtists.length > 0) {
            sections.push({
              id: 'all-active-artists',
              title: 'Active artists',
              items: allActiveArtists,
              priority: 70
            });
          }
        }
      }

    } else {
      // Public user or no profile - show general categories
      console.log('Public user or no profile, showing general categories');
      
      if (activeTab === 'venues') {
        // Popular venues by location
        const venuesByState = venues.reduce((acc, venue) => {
          if (!acc[venue.state]) acc[venue.state] = [];
          acc[venue.state].push(venue);
          return acc;
        }, {} as Record<string, Venue[]>);

        // Show top states with most venues
        Object.entries(venuesByState)
          .sort(([,a], [,b]) => b.length - a.length)
          .slice(0, 3)
          .forEach(([state, stateVenues], index) => {
            sections.push({
              id: `venues-${state}`,
              title: `Venues in ${state}`,
              items: stateVenues.slice(0, 12),
              priority: 90 - (index * 10)
            });
          });

      } else {
        // Popular artists by genre
        const artistsByGenre = artists.reduce((acc, artist) => {
          artist.genres.forEach(genre => {
            if (!acc[genre]) acc[genre] = [];
            acc[genre].push(artist);
          });
          return acc;
        }, {} as Record<string, Artist[]>);

        // Show top genres
        Object.entries(artistsByGenre)
          .sort(([,a], [,b]) => b.length - a.length)
          .slice(0, 3)
          .forEach(([genre, genreArtists], index) => {
            sections.push({
              id: `artists-${genre}`,
              title: `${genre.charAt(0).toUpperCase() + genre.slice(1)} artists`,
              items: genreArtists.slice(0, 12),
              priority: 90 - (index * 10)
            });
          });
      }
    }

    console.log('SmartGallery: Generated', sections.length, 'sections');
    sections.forEach(section => {
      console.log(`- ${section.title}: ${section.items.length} items (priority: ${section.priority})`);
    });
    
    // Sort by priority and return
    return sections.sort((a, b) => b.priority - a.priority);
  }, [venues, artists, activeTab, user, userProfile, loading, loadingProfile]);

  useEffect(() => {
    // Update scroll states for all categories
    Object.keys(scrollRefs.current).forEach(categoryId => {
      updateScrollState(categoryId);
    });
  }, [categories]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-48 mb-3"></div>
            <div className="flex space-x-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map(j => (
                <div key={j} className="flex-none w-64 h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <section key={category.id} className="space-y-1">
          {/* Header with title and navigation buttons */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
            
            {/* Navigation buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => scrollCategory(category.id, 'left')}
                disabled={!scrollStates[category.id]?.canScrollLeft}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                  scrollStates[category.id]?.canScrollLeft
                    ? 'border-gray-300 hover:border-gray-400 hover:shadow-md bg-white'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <svg 
                  className={`w-4 h-4 ${scrollStates[category.id]?.canScrollLeft ? 'text-gray-600' : 'text-gray-300'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => scrollCategory(category.id, 'right')}
                disabled={!scrollStates[category.id]?.canScrollRight}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                  scrollStates[category.id]?.canScrollRight
                    ? 'border-gray-300 hover:border-gray-400 hover:shadow-md bg-white'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <svg 
                  className={`w-4 h-4 ${scrollStates[category.id]?.canScrollRight ? 'text-gray-600' : 'text-gray-300'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Scrollable content */}
          <div className="relative">
            <div 
              ref={(el) => {
                scrollRefs.current[category.id] = el;
                if (el) {
                  // Update scroll state when container is ready
                  setTimeout(() => updateScrollState(category.id), 100);
                  
                  // Add scroll event listener
                  const handleScroll = () => updateScrollState(category.id);
                  el.addEventListener('scroll', handleScroll);
                  
                  return () => el.removeEventListener('scroll', handleScroll);
                }
              }}
              className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4" 
              style={{ 
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              onWheel={(e) => {
                // Enable horizontal scrolling with mouse wheel
                e.currentTarget.scrollLeft += e.deltaY;
                e.preventDefault();
              }}
            >
              {category.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/${activeTab}/${item.id}`}
                  className="group block flex-shrink-0"
                  style={{ minWidth: '240px', width: '240px' }}
                >
                  <div className="bg-white rounded-xl overflow-hidden cursor-pointer">
                    <div className="aspect-square relative">
                      <img
                        src={item.images?.[0] || `/api/placeholder/${activeTab === 'venues' ? 'other' : (item as Artist).artistType}`}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-xl transition-all duration-200 group-hover:brightness-75"
                        onError={(e) => {
                          e.currentTarget.src = `/api/placeholder/${activeTab === 'venues' ? 'other' : (item as Artist).artistType}`;
                        }}
                      />
                      <div className="absolute top-3 right-3">
                        <FavoriteButton 
                          entityType={activeTab === 'venues' ? 'VENUE' : 'ARTIST'}
                          entityId={item.id}
                          size="md"
                        />
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="mb-1">
                        <h3 className="font-bold text-gray-900 truncate text-sm mb-1">{item.name}</h3>
                      </div>
                      <p className="text-xs text-gray-500">
                        {item.city}, {item.state} <span className="text-gray-300">•</span> {activeTab === 'venues' 
                          ? `${(item as Venue).capacity >= 1000 ? `${((item as Venue).capacity / 1000).toFixed((item as Venue).capacity % 1000 === 0 ? 0 : 1)}k` : (item as Venue).capacity} cap`
                          : ARTIST_TYPE_LABELS[(item as Artist).artistType]
                        } <span className="text-gray-300">•</span> {(item.totalRatings || 0) === 0 ? (
                          <span className="text-gray-400">★ N/A</span>
                        ) : (
                          <span className="text-gray-700">★ {(item.rating || 0).toFixed(1)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
} 
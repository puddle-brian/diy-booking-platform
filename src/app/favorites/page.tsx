'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import FavoriteButton from '../../components/FavoriteButton';
import { VENUE_TYPE_LABELS, ARTIST_TYPE_LABELS } from '../../../types/index';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading, getFavoritesByType } = useFavorites();
  const [activeTab, setActiveTab] = useState<'venues' | 'artists'>('venues');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth/login';
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const favoriteVenues = getFavoritesByType('VENUE');
  const favoriteArtists = getFavoritesByType('ARTIST');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-gray-600 mt-1">
                Venues and artists you've saved for future reference
              </p>
            </div>
            <Link
              href="/"
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Browse More
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('venues')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'venues'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Venues ({favoriteVenues.length})
            </button>
            <button
              onClick={() => setActiveTab('artists')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'artists'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Artists ({favoriteArtists.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'venues' ? (
          <div>
            {favoriteVenues.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏠</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorite venues yet</h3>
                <p className="text-gray-600 mb-6">
                  Start exploring venues and save the ones you'd like to book or remember for later.
                </p>
                <Link
                  href="/?tab=venues"
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Browse Venues
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {favoriteVenues.map((favorite) => {
                  const venue = favorite.entity;
                  if (!venue) return null;
                  
                  return (
                    <div key={favorite.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <Link href={`/venues/${venue.id}`}>
                        <div className="aspect-square relative cursor-pointer group">
                          <img
                            src={venue.images?.[0] || '/api/placeholder/other'}
                            alt={venue.name}
                            className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-75"
                            onError={(e) => {
                              e.currentTarget.src = '/api/placeholder/other';
                            }}
                          />
                          <div className="absolute top-3 right-3">
                            <FavoriteButton 
                              entityType="VENUE"
                              entityId={venue.id}
                              size="md"
                            />
                          </div>
                        </div>
                      </Link>
                      <div className="p-4">
                        <Link href={`/venues/${venue.id}`}>
                          <h3 className="font-bold text-gray-900 truncate text-sm mb-1 hover:text-blue-600">
                            {venue.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-500 mb-2">
                          {venue.city}, {venue.state}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="capitalize">
                            {VENUE_TYPE_LABELS[venue.venueType as keyof typeof VENUE_TYPE_LABELS] || 'Space'}
                          </span>
                          <span>
                            {venue.capacity >= 1000 
                              ? `${(venue.capacity / 1000).toFixed(venue.capacity % 1000 === 0 ? 0 : 1)}k` 
                              : venue.capacity} cap
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Saved {new Date(favorite.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {favoriteArtists.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎵</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorite artists yet</h3>
                <p className="text-gray-600 mb-6">
                  Discover touring artists and save the ones you'd like to book or follow.
                </p>
                <Link
                  href="/?tab=artists"
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Browse Artists
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {favoriteArtists.map((favorite) => {
                  const artist = favorite.entity;
                  if (!artist) return null;
                  
                  return (
                    <div key={favorite.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <Link href={`/artists/${artist.id}`}>
                        <div className="aspect-square relative cursor-pointer group">
                          <img
                            src={artist.images?.[0] || `/api/placeholder/${artist.artistType}`}
                            alt={artist.name}
                            className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-75"
                            onError={(e) => {
                              e.currentTarget.src = `/api/placeholder/${artist.artistType}`;
                            }}
                          />
                          <div className="absolute top-3 right-3">
                            <FavoriteButton 
                              entityType="ARTIST"
                              entityId={artist.id}
                              size="md"
                            />
                          </div>
                        </div>
                      </Link>
                      <div className="p-4">
                        <Link href={`/artists/${artist.id}`}>
                          <h3 className="font-bold text-gray-900 truncate text-sm mb-1 hover:text-blue-600">
                            {artist.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-500 mb-2">
                          {artist.city}, {artist.state}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="capitalize">
                            {ARTIST_TYPE_LABELS[artist.artistType as keyof typeof ARTIST_TYPE_LABELS] || 'Artist'}
                          </span>
                          <span className="capitalize">
                            {artist.tourStatus || 'active'}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Saved {new Date(favorite.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Utility Info */}
      {(favoriteVenues.length > 0 || favoriteArtists.length > 0) && (
        <div className="bg-blue-50 border-t border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🔔 Get Notified About Your Favorites
              </h3>
              <p className="text-blue-700 text-sm">
                {activeTab === 'venues' 
                  ? "We'll let your favorite venues know when you're looking for shows in their area!"
                  : "We'll let your favorite artists know when you have shows available in their area!"
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useFavorites } from '../../../hooks/useFavorites';
import FavoriteButton from '../../../components/FavoriteButton';
import { VENUE_TYPE_LABELS, ARTIST_TYPE_LABELS } from '../../../../types/index';
import MessageButton from '../../../components/MessageButton';
import InlineMessagePanel from '../../../components/InlineMessagePanel';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  role: string;
  profileType?: string;
  profileId?: string;
  joinedAt: string;
  memberships?: Array<{
    entityType: 'artist' | 'venue';
    entityId: string;
    entityName: string;
    role: string;
    joinedAt: string;
    image?: string;
    city?: string;
    state?: string;
  }>;
}

interface Conversation {
  id: string;
  recipientId: string;
  recipientName: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderName: string;
    isFromMe: boolean;
  };
  unreadCount: number;
  updatedAt: string;
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { favorites, loading: favoritesLoading, getFavoritesByType } = useFavorites();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [favoritesTab, setFavoritesTab] = useState<'venues' | 'artists'>('venues');
  const [activeSection, setActiveSection] = useState<'memberships' | 'favorites'>('memberships');
  const [selectedConversation, setSelectedConversation] = useState<{
    recipientId: string;
    recipientName: string;
    recipientType: 'artist' | 'venue' | 'user';
  } | null>(null);

  // Helper function to get headers with debug user info if needed
  const getApiHeaders = () => {
    const headers: Record<string, string> = {};

    // If user is a debug user (stored in localStorage), include it in headers
    if (typeof window !== 'undefined') {
      const debugUser = localStorage.getItem('debugUser');
      if (debugUser && user) {
        headers['x-debug-user'] = debugUser;
      }
    }

    return headers;
  };

  const loadConversations = async () => {
    if (!user) {
      console.log('🔐 Profile: No user found, skipping conversation load');
      return;
    }
    
    console.log('🔐 Profile: Loading conversations for user:', user.id, user.name);
    
    setLoadingConversations(true);
    try {
      const headers = getApiHeaders();
      console.log('🔐 Profile: Sending headers:', headers);
      
      const response = await fetch('/api/messages/conversations', {
        headers
      });
      
      console.log('🔐 Profile: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔐 Profile: Conversations loaded:', data);
        setConversations(data.slice(0, 5)); // Show only recent 5 conversations
        
        // Calculate total unread count
        const totalUnread = data.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      } else {
        const errorText = await response.text();
        console.error('🔐 Profile: Failed to load conversations:', response.status, errorText);
      }
    } catch (error) {
      console.error('🔐 Profile: Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const resolvedParams = await params;
        const profileId = resolvedParams.id;
        
        // Load the user's profile data first
        const response = await fetch(`/api/users/${profileId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found');
          } else {
            setError('Failed to load profile');
          }
          setLoading(false);
          return;
        }
        
        const profileData = await response.json();
        
        // Fetch entity details for each membership to get images and location
        if (profileData.memberships && profileData.memberships.length > 0) {
          const enrichedMemberships = await Promise.all(
            profileData.memberships.map(async (membership: any) => {
              try {
                const entityResponse = await fetch(`/api/${membership.entityType}s/${membership.entityId}`);
                if (entityResponse.ok) {
                  const entityData = await entityResponse.json();
                  return {
                    ...membership,
                    image: entityData.images?.[0],
                    city: entityData.city,
                    state: entityData.state
                  };
                }
                return membership;
              } catch (error) {
                console.error(`Failed to fetch ${membership.entityType} details:`, error);
                return membership;
              }
            })
          );
          profileData.memberships = enrichedMemberships;
        }
        
        setProfile(profileData);
        setLoading(false);
        
        // After profile is loaded, check if this is the current user and load conversations
        if (user && user.id === profileId) {
          await loadConversations();
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
        setLoading(false);
      }
    };

    // Only load profile if we have the params
    loadProfile();
  }, [user, params, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
          <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist or couldn't be loaded.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {profile.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              </div>
            </div>
          </div>
          
          {profile.bio && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}

          {/* Message Button - Only show if user is logged in and it's not their own profile */}
          {user && user.id !== profile.id && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <MessageButton
                recipientId={profile.id}
                recipientName={profile.name}
                recipientType="user"
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
              >
                💬 Send Message
              </MessageButton>
            </div>
          )}
        </div>

        {/* Profile Content - Single container with tab titles */}
        {user && user.id === profile.id && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            {/* Tab Titles */}
            <div className="flex space-x-8 mb-6">
              <button
                onClick={() => setActiveSection('memberships')}
                className={`text-lg transition-colors ${
                  activeSection === 'memberships'
                    ? 'font-semibold text-gray-900'
                    : 'font-normal text-gray-500 hover:text-gray-700'
                }`}
              >
                Memberships
              </button>
              <button
                onClick={() => setActiveSection('favorites')}
                className={`text-lg transition-colors ${
                  activeSection === 'favorites'
                    ? 'font-semibold text-gray-900'
                    : 'font-normal text-gray-500 hover:text-gray-700'
                }`}
              >
                Favorites ({favorites.length})
              </button>
            </div>

            {/* Content based on active section */}
            {activeSection === 'memberships' ? (
              /* Memberships Content */
              profile.memberships && profile.memberships.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {profile.memberships.map((membership, index) => (
                    <a 
                      key={index} 
                      href={`/${membership.entityType}s/${membership.entityId}`}
                      className="block"
                    >
                      <div className="bg-white rounded-xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="aspect-square relative">
                          <img 
                            src={(() => {
                              if (membership.image) {
                                if (membership.image.includes('/uploads/')) {
                                  return membership.image.replace('/uploads/', '/uploads/thumbnails/').replace('.webp', '-thumb.webp');
                                }
                                return membership.image;
                              }
                              return membership.entityType === 'artist' ? '/api/placeholder/band' : '/api/placeholder/other';
                            })()}
                            alt={membership.entityName}
                            className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-75"
                            style={{ borderRadius: '1.25rem' }}
                            onError={(e) => {
                              e.currentTarget.src = membership.entityType === 'artist' ? '/api/placeholder/band' : '/api/placeholder/other';
                            }}
                          />
                          
                          <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium">
                            {membership.role}
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <h3 className="font-bold text-gray-900 truncate text-sm">{membership.entityName}</h3>
                          <p className="text-xs text-gray-600">
                            {membership.city && membership.state 
                              ? `${membership.city}, ${membership.state} • ` 
                              : ''
                            }
                            <span className="capitalize">{membership.entityType}</span>
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    🎭
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No memberships yet</h3>
                  <p className="text-xs text-gray-600 mb-4">Join an artist or venue to start managing your music career.</p>
                  <div className="flex justify-center space-x-2">
                    <a href="/artists/submit" className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors">
                      Add Artist
                    </a>
                    <a href="/venues/submit" className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
                      Add Venue
                    </a>
                  </div>
                </div>
              )
            ) : (
              /* Favorites Content */
              <div>
                <div className="flex justify-center mb-6">
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setFavoritesTab('venues')}
                      className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                        favoritesTab === 'venues'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      Venues ({getFavoritesByType('VENUE').length})
                    </button>
                    <button
                      onClick={() => setFavoritesTab('artists')}
                      className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                        favoritesTab === 'artists'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      Artists ({getFavoritesByType('ARTIST').length})
                    </button>
                  </div>
                </div>

                {favoritesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading favorites...</p>
                  </div>
                ) : (
                  <div>
                    {favoritesTab === 'venues' ? (
                      <div>
                        {getFavoritesByType('VENUE').length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              🏠
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-2">No favorite venues yet</h3>
                            <p className="text-xs text-gray-600 mb-4">Start exploring venues and save the ones you'd like to book or remember for later.</p>
                            <a
                              href="/?tab=venues"
                              className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                            >
                              Browse Venues
                            </a>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {getFavoritesByType('VENUE').map((favorite) => {
                              const venue = favorite.entity;
                              if (!venue) return null;
                              
                              return (
                                <div key={favorite.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                  <a href={`/venues/${venue.id}`}>
                                    <div className="aspect-square relative cursor-pointer group">
                                      <img
                                        src={venue.images?.[0] || '/api/placeholder/other'}
                                        alt={venue.name}
                                        className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-75"
                                        style={{ borderRadius: '1.25rem' }}
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
                                  </a>
                                  <div className="p-2">
                                    <a href={`/venues/${venue.id}`}>
                                      <h3 className="font-bold text-gray-900 truncate text-sm mb-1 hover:text-blue-600">
                                        {venue.name}
                                      </h3>
                                    </a>
                                    <p className="text-xs text-gray-500">
                                      {venue.location?.city}, {venue.location?.stateProvince} <span className="text-gray-300">•</span> {VENUE_TYPE_LABELS[venue.venueType as keyof typeof VENUE_TYPE_LABELS] || 'Space'} <span className="text-gray-300">•</span> {venue.capacity >= 1000 
                                        ? `${(venue.capacity / 1000).toFixed(venue.capacity % 1000 === 0 ? 0 : 1)}k` 
                                        : venue.capacity} cap
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {getFavoritesByType('ARTIST').length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              🎵
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-2">No favorite artists yet</h3>
                            <p className="text-xs text-gray-600 mb-4">Discover touring artists and save the ones you'd like to book or follow.</p>
                            <a
                              href="/?tab=artists"
                              className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                            >
                              Browse Artists
                            </a>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {getFavoritesByType('ARTIST').map((favorite) => {
                              const artist = favorite.entity;
                              if (!artist) return null;
                              
                              return (
                                <div key={favorite.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                  <a href={`/artists/${artist.id}`}>
                                    <div className="aspect-square relative cursor-pointer group">
                                      <img
                                        src={artist.images?.[0] || `/api/placeholder/${artist.artistType}`}
                                        alt={artist.name}
                                        className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-75"
                                        style={{ borderRadius: '1.25rem' }}
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
                                  </a>
                                  <div className="p-2">
                                    <a href={`/artists/${artist.id}`}>
                                      <h3 className="font-bold text-gray-900 truncate text-sm mb-1 hover:text-blue-600">
                                        {artist.name}
                                      </h3>
                                    </a>
                                    <p className="text-xs text-gray-500">
                                      {artist.location?.city}, {artist.location?.stateProvince} <span className="text-gray-300">•</span> {ARTIST_TYPE_LABELS[artist.artistType as keyof typeof ARTIST_TYPE_LABELS] || 'Artist'} <span className="text-gray-300">•</span> {artist.tourStatus || 'active'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Messages Section - Only show for current user */}
        {user && user.id === profile.id && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
                {unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <a 
                href="/messages" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </a>
            </div>

            {loadingConversations ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  💬
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-xs text-gray-600 mb-4">Start messaging artists and venues to see your conversations here.</p>
                <div className="flex justify-center space-x-2">
                  <a href="/artists" className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition-colors">
                    Browse Artists
                  </a>
                  <a href="/venues" className="bg-gray-600 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-700 transition-colors">
                    Browse Venues
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation({
                      recipientId: conversation.recipientId,
                      recipientName: conversation.recipientName,
                      recipientType: 'user'
                    })}
                    className={`flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      conversation.unreadCount > 0 ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold mr-3 text-sm relative">
                      {conversation.recipientName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`truncate text-sm ${
                          conversation.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                        }`}>
                          {conversation.recipientName}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {conversation.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                              {conversation.unreadCount}
                            </span>
                          )}
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {conversation.lastMessage ? (
                        <p className={`text-xs truncate ${
                          conversation.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-600'
                        }`}>
                          {conversation.lastMessage.isFromMe ? 'You: ' : `${conversation.lastMessage.senderName}: `}
                          {conversation.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No messages yet</p>
                      )}
                    </div>

                    {/* Arrow */}
                    <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
                
                {conversations.length >= 5 && (
                  <div className="text-center pt-2">
                    <a 
                      href="/messages" 
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all conversations →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contact Info (if available) */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">📧</span>
              <span className="text-gray-700">{profile.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">📅</span>
              <span className="text-gray-700">
                Member since {new Date(profile.joinedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Message Panel */}
      {selectedConversation && (
        <InlineMessagePanel
          isOpen={!!selectedConversation}
          onClose={() => setSelectedConversation(null)}
          recipientId={selectedConversation.recipientId}
          recipientName={selectedConversation.recipientName}
          recipientType={selectedConversation.recipientType}
          onMessagesRead={loadConversations}
          context={{
            fromPage: 'user-profile',
            entityName: selectedConversation.recipientName,
            entityType: 'user'
          }}
        />
      )}
    </div>
  );
} 
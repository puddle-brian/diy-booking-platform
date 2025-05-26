'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import MessageButton from '../../components/MessageButton';

interface EntityMembership {
  id: string;
  name: string;
  type: 'artist' | 'venue';
  role: string;
  permissions: string[];
  joinedAt: string;
  city?: string;
  state?: string;
  image?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantType: 'artist' | 'venue' | 'user';
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const permissions = usePermissions();
  const router = useRouter();
  const [memberships, setMemberships] = useState<EntityMembership[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [activeTab, setActiveTab] = useState<'memberships' | 'messages' | 'favorites' | 'about'>('memberships');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('Dashboard: User loaded:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileType: user.profileType,
        profileId: user.profileId
      });
      loadUserMemberships();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'messages' && user) {
      loadConversations();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === 'favorites' && user) {
      loadFavorites();
    }
  }, [activeTab, user]);

  const loadUserMemberships = async () => {
    try {
      const mockMemberships: EntityMembership[] = [];

      if (user?.profileType === 'artist' && user?.profileId) {
        const artistResponse = await fetch(`/api/artists/${user.profileId}`);
        if (artistResponse.ok) {
          const artist = await artistResponse.json();
          mockMemberships.push({
            id: artist.id,
            name: artist.name,
            type: 'artist',
            role: 'owner',
            permissions: ['edit_profile', 'manage_bookings', 'invite_members', 'manage_members', 'view_analytics'],
            joinedAt: new Date().toISOString(),
            city: artist.city,
            state: artist.state,
            image: artist.images?.[0]
          });
        }
      }

      if (user?.profileType === 'venue' && user?.profileId) {
        const venueResponse = await fetch(`/api/venues/${user.profileId}`);
        if (venueResponse.ok) {
          const venue = await venueResponse.json();
          mockMemberships.push({
            id: venue.id,
            name: venue.name,
            type: 'venue',
            role: 'owner',
            permissions: ['edit_profile', 'manage_bookings', 'invite_staff', 'manage_staff', 'view_analytics'],
            joinedAt: new Date().toISOString(),
            city: venue.city,
            state: venue.state,
            image: venue.images?.[0]
          });
        }
      }

      setMemberships(mockMemberships);
    } catch (error) {
      console.error('Failed to load memberships:', error);
    } finally {
      setLoadingMemberships(false);
    }
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await fetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadFavorites = async () => {
    setLoadingFavorites(true);
    try {
      // Mock favorites for now - in real app would fetch from API
      setFavorites([]);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
            Sign in to access your dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with User Badge */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(user.name)}
                </div>
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600 text-sm">Your Profile & Dashboard</p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button 
                onClick={() => router.back()}
                className="text-gray-600 hover:text-black flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
              {user.role === 'admin' && (
                <Link 
                  href="/admin"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('memberships')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'memberships'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Memberships
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'messages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'favorites'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Favorites
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'about'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                About
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'memberships' && (
              <div className="space-y-6">
                {loadingMemberships ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your memberships...</p>
                  </div>
                ) : memberships.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🎵</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No memberships yet</h3>
                    <p className="text-gray-600 mb-4">
                      You're not currently associated with any bands or venues.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Link 
                        href="/admin/artists"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Create Artist Profile
                      </Link>
                      <Link 
                        href="/admin/venues"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Create Venue Profile
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                      {memberships.map((membership) => (
                        <Link key={`${membership.type}-${membership.id}`} href={`/${membership.type}s/${membership.id}`}>
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
                                  return membership.type === 'artist' ? '/api/placeholder/band' : '/api/placeholder/other';
                                })()}
                                alt={membership.name}
                                className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-75"
                                style={{ borderRadius: '1.25rem' }}
                                onError={(e) => {
                                  e.currentTarget.src = membership.type === 'artist' ? '/api/placeholder/band' : '/api/placeholder/other';
                                }}
                              />
                              
                              <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium">
                                {membership.role}
                              </div>
                            </div>
                            
                            <div className="p-3">
                              <h3 className="font-bold text-gray-900 truncate text-sm">{membership.name}</h3>
                              <p className="text-xs text-gray-600">
                                {membership.city && membership.state 
                                  ? `${membership.city}, ${membership.state} • ` 
                                  : ''
                                }
                                <span className="capitalize">{membership.type}</span>
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>


                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div>
                {loadingConversations ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">💬</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start conversations with artists and venues you're interested in.
                    </p>
                    <button 
                      onClick={() => router.back()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Back</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversations.map((conversation) => (
                      <Link 
                        key={conversation.id}
                        href={`/messages?conversation=${conversation.id}`}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                              {getInitials(conversation.participantName)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{conversation.participantName}</h4>
                              {conversation.lastMessage && (
                                <p className="text-sm text-gray-600 truncate max-w-md">
                                  {conversation.lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {conversation.unreadCount > 0 && (
                              <div className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 mb-1">
                                {conversation.unreadCount}
                              </div>
                            )}
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessage.timestamp)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                {loadingFavorites ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading favorites...</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">❤️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
                    <p className="text-gray-600 mb-4">
                      Click the heart icon on venues and artists you like to save them here.
                    </p>
                    <button 
                      onClick={() => router.back()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Back</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700">{user.email}</span>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="text-gray-900 capitalize">{user.role}</span>
                    </div>
                    {user.profileType && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Primary Profile:</span>
                        <span className="text-gray-900 capitalize">{user.profileType}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member Since:</span>
                      <span className="text-gray-900">{formatDate(user.createdAt || new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link 
                      href="/?tab=venues"
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-center"
                    >
                      <div className="text-2xl mb-2">🔍</div>
                      <div className="font-medium text-gray-900">Browse Venues</div>
                      <div className="text-sm text-gray-600">Find spaces to play</div>
                    </Link>
                    
                    <Link 
                      href="/?tab=artists"
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-center"
                    >
                      <div className="text-2xl mb-2">🎵</div>
                      <div className="font-medium text-gray-900">Browse Artists</div>
                      <div className="text-sm text-gray-600">Discover performers</div>
                    </Link>
                    
                    <Link 
                      href="/admin/venues"
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-center"
                    >
                      <div className="text-2xl mb-2">➕</div>
                      <div className="font-medium text-gray-900">Add Venue</div>
                      <div className="text-sm text-gray-600">List a new space</div>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

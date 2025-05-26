'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import MessageButton from '../../../components/MessageButton';

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

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const resolvedParams = await params;
        const profileId = resolvedParams.id;
        
        // If this is the current user's profile, redirect to dashboard
        if (user && user.id === profileId) {
          router.replace('/dashboard');
          return;
        }
        
        // Load the user's profile data
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
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
        setLoading(false);
      }
    };

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
                <p className="text-gray-600 capitalize">{profile.role}</p>
                {profile.profileType && (
                  <p className="text-sm text-gray-500">
                    {profile.profileType === 'artist' ? '🎵 Artist' : '🏢 Venue'} Profile
                  </p>
                )}
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

        {/* Memberships */}
        {profile.memberships && profile.memberships.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bands & Venues</h2>
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
    </div>
  );
} 
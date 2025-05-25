'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import VenueBidding from '../../components/VenueBidding';

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

export default function Dashboard() {
  const { user, loading } = useAuth();
  const permissions = usePermissions();
  const [memberships, setMemberships] = useState<EntityMembership[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);

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

  const loadUserMemberships = async () => {
    try {
      // For now, we'll simulate memberships based on the debug user data
      // In a real app, this would fetch from an API
      const mockMemberships: EntityMembership[] = [];

      if (user?.profileType === 'artist' && user?.profileId) {
        // Add the artist they're associated with using the correct profileId
        const artistResponse = await fetch(`/api/artists/${user.profileId}`);
        if (artistResponse.ok) {
          const artist = await artistResponse.json();
          mockMemberships.push({
            id: artist.id,
            name: artist.name,
            type: 'artist',
            role: 'owner', // For now, assume owner
            permissions: ['edit_profile', 'manage_bookings', 'invite_members', 'manage_members', 'view_analytics'],
            joinedAt: new Date().toISOString(),
            city: artist.city,
            state: artist.state,
            image: artist.images?.[0]
          });
        } else {
          console.error(`Failed to fetch artist with ID ${user.profileId}:`, artistResponse.status);
        }
      }

      if (user?.profileType === 'venue' && user?.profileId) {
        // Add the venue they're associated with using the correct profileId
        const venueResponse = await fetch(`/api/venues/${user.profileId}`);
        if (venueResponse.ok) {
          const venue = await venueResponse.json();
          mockMemberships.push({
            id: venue.id,
            name: venue.name,
            type: 'venue',
            role: 'owner', // For now, assume owner
            permissions: ['edit_profile', 'manage_bookings', 'invite_staff', 'manage_staff', 'view_analytics'],
            joinedAt: new Date().toISOString(),
            city: venue.city,
            state: venue.state,
            image: venue.images?.[0]
          });
        } else {
          console.error(`Failed to fetch venue with ID ${user.profileId}:`, venueResponse.status);
        }
      }

      console.log('Loaded memberships for user:', user?.name, 'memberships:', mockMemberships);
      setMemberships(mockMemberships);
    } catch (error) {
      console.error('Failed to load memberships:', error);
    } finally {
      setLoadingMemberships(false);
    }
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/"
                className="text-gray-600 hover:text-black"
              >
                Browse Directory
              </Link>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 capitalize">
                {user.role} {user.profileType && `• ${user.profileType}`}
              </p>
            </div>
          </div>
        </div>

        {/* Memberships */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Bands & Venues</h3>
          
          {loadingMemberships ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your memberships...</p>
            </div>
          ) : memberships.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No memberships yet</h4>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memberships.map((membership) => (
                <div key={`${membership.type}-${membership.id}`} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xl">
                          {membership.type === 'artist' ? '🎸' : '🏢'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{membership.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">
                          {membership.type} • {membership.role}
                        </p>
                      </div>
                    </div>
                    
                    {membership.city && membership.state && (
                      <p className="text-sm text-gray-500 mb-4">
                        {membership.city}, {membership.state}
                      </p>
                    )}
                    
                    <div className="flex space-x-2">
                      <Link 
                        href={`/${membership.type}s/${membership.id}`}
                        className="flex-1 bg-black text-white px-3 py-2 rounded text-sm text-center hover:bg-gray-800"
                      >
                        Manage
                      </Link>
                      <Link 
                        href={`/${membership.type}s/${membership.id}`}
                        className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Venue-Specific Features */}
        {user.profileType === 'venue' && memberships.length > 0 && (
          <div className="mb-8">
            <VenueBidding 
              venueId={memberships[0].id} 
              venueName={memberships[0].name} 
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
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
    </div>
  );
}

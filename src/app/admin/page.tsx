'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  venueType: 'house-show' | 'community-space' | 'record-store' | 'vfw-hall' | 'arts-center' | 'warehouse' | 'bar' | 'club' | 'theater' | 'other';
  genres: string[];
  capacity: number;
  ageRestriction: 'all-ages' | '18+' | '21+';
  equipment: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  features: string[];
  pricing: {
    guarantee: number;
    door: boolean;
    merchandise: boolean;
  };
  contact: {
    email: string;
    phone?: string;
    social?: string;
    website?: string;
  };
  images: string[];
  description: string;
  rating: number;
  showsThisYear: number;
  createdAt: Date;
  updatedAt: Date;
  hasAccount: boolean;
}

interface Artist {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  artistType: 'band' | 'solo' | 'duo' | 'collective';
  genres: string[];
  members: number;
  yearFormed: number;
  tourStatus: 'active' | 'hiatus' | 'selective' | 'local-only';
  equipment: {
    needsPA: boolean;
    needsMics: boolean;
    needsDrums: boolean;
    needsAmps: boolean;
    acoustic: boolean;
  };
  features: string[];
  contact: {
    email: string;
    phone?: string;
    social?: string;
    website?: string;
  };
  images: string[];
  description: string;
  rating: number;
  showsThisYear: number;
  expectedDraw: string;
  tourRadius: 'local' | 'regional' | 'national' | 'international';
  hasAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ArtistClaim {
  id: string;
  artistId: string;
  artistName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export default function AdminDashboard() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [claims, setClaims] = useState<ArtistClaim[]>([]);
  const [activeTab, setActiveTab] = useState<'venues' | 'artists' | 'claims'>('venues');
  const [loading, setLoading] = useState(true);
  const [deleteMessage, setDeleteMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [venuesResponse, artistsResponse, claimsResponse] = await Promise.all([
        fetch('/api/venues'),
        fetch('/api/artists'),
        fetch('/api/artist-claims')
      ]);
      
      if (venuesResponse.ok) {
        const venueData = await venuesResponse.json();
        setVenues(venueData);
      }
      
      if (artistsResponse.ok) {
        const artistData = await artistsResponse.json();
        setArtists(artistData);
      }

      if (claimsResponse.ok) {
        const claimsData = await claimsResponse.json();
        setClaims(claimsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVenue = async (venueId: string, venueName: string) => {
    if (!confirm(`Are you sure you want to delete "${venueName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete venue');
      }

      setDeleteMessage(`Venue "${venueName}" deleted successfully`);
      await loadData(); // Reload the data
      setTimeout(() => setDeleteMessage(''), 3000);
    } catch (error) {
      setDeleteMessage(`Error deleting venue: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setDeleteMessage(''), 5000);
    }
  };

  const handleDeleteArtist = async (artistId: string) => {
    if (!confirm(`Are you sure you want to delete this artist? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/artists/${artistId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete artist');
      }

      setDeleteMessage(`Artist deleted successfully`);
      await loadData(); // Reload the data
      setTimeout(() => setDeleteMessage(''), 3000);
    } catch (error) {
      setDeleteMessage(`Error deleting artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setDeleteMessage(''), 5000);
    }
  };

  const handleClaimAction = async (claimId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await fetch(`/api/artist-claims/${claimId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected',
          notes: notes || ''
        }),
      });

      if (response.ok) {
        // Reload claims data
        const claimsResponse = await fetch('/api/artist-claims');
        if (claimsResponse.ok) {
          const claimsData = await claimsResponse.json();
          setClaims(claimsData);
        }
      }
    } catch (error) {
      console.error('Failed to update claim:', error);
    }
  };

  const getStats = () => {
    const venueStats = {
      total: venues.length,
      withAccounts: venues.filter(v => v.hasAccount).length,
      averageRating: venues.length > 0 ? venues.reduce((acc, v) => acc + v.rating, 0) / venues.length : 0
    };

    const artistStats = {
      total: artists.length,
      withAccounts: artists.filter(a => a.hasAccount).length,
      averageRating: artists.length > 0 ? artists.reduce((acc, a) => acc + a.rating, 0) / artists.length : 0
    };

    const claimStats = {
      total: claims.length,
      pending: claims.filter(c => c.status === 'pending').length,
      approved: claims.filter(c => c.status === 'approved').length,
      rejected: claims.filter(c => c.status === 'rejected').length
    };

    return { venueStats, artistStats, claimStats };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage venues, artists, and claims</p>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {deleteMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            deleteMessage.includes('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {deleteMessage}
          </div>
        )}

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Venues Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Venues</h3>
                  <p className="text-2xl font-bold text-blue-600">{stats.venueStats.total}</p>
                  <p className="text-sm text-gray-600">{stats.venueStats.withAccounts} with accounts</p>
                </div>
              </div>
            </div>

            {/* Artists Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Artists</h3>
                  <p className="text-2xl font-bold text-purple-600">{stats.artistStats.total}</p>
                  <p className="text-sm text-gray-600">{stats.artistStats.withAccounts} with accounts</p>
                </div>
              </div>
            </div>

            {/* Claims Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Claims</h3>
                  <p className="text-2xl font-bold text-orange-600">{stats.claimStats.pending}</p>
                  <p className="text-sm text-gray-600">pending review</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('venues')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'venues'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Venues ({stats.venueStats.total})
              </button>
              <button
                onClick={() => setActiveTab('artists')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'artists'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Artists ({stats.artistStats.total})
              </button>
              <button
                onClick={() => setActiveTab('claims')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'claims'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Artist Claims ({stats.claimStats.pending} pending)
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'venues' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Venues</h2>
                  <Link
                    href="/admin/venues"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add New Venue
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Venue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Capacity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {venues.map((venue) => (
                        <tr key={venue.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{venue.name}</div>
                              <div className="text-sm text-gray-500">{venue.contact.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {venue.city}, {venue.state}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {venue.venueType.replace('-', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {venue.capacity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              venue.hasAccount 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {venue.hasAccount ? 'Active' : 'Unclaimed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Link
                              href={`/admin/venues/edit/${venue.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteVenue(venue.id, venue.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'artists' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Artists</h2>
                  <Link
                    href="/admin/artists"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add New Artist
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Artist
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Members
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {artists.map((artist) => (
                        <tr key={artist.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{artist.name}</div>
                              <div className="text-sm text-gray-500">{artist.contact.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {artist.city}, {artist.state}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {artist.artistType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {artist.members}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              artist.hasAccount 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {artist.hasAccount ? 'Active' : 'Unclaimed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Link
                              href={`/admin/artists/edit/${artist.id}`}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteArtist(artist.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'claims' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Artist Claims</h2>
                  <div className="text-sm text-gray-600">
                    {stats.claimStats.pending} pending • {stats.claimStats.approved} approved • {stats.claimStats.rejected} rejected
                  </div>
                </div>

                <div className="space-y-6">
                  {claims.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500">No artist claims yet</p>
                    </div>
                  ) : (
                    claims.map((claim) => (
                      <div key={claim.id} className={`border rounded-lg p-6 ${
                        claim.status === 'pending' ? 'border-orange-200 bg-orange-50' :
                        claim.status === 'approved' ? 'border-green-200 bg-green-50' :
                        'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{claim.artistName}</h3>
                            <p className="text-sm text-gray-600">
                              Claim by {claim.contactName} ({claim.contactEmail})
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(claim.timestamp).toLocaleDateString()} at {new Date(claim.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            claim.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {claim.status}
                          </span>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Message:</h4>
                          <p className="text-gray-700 text-sm bg-white p-3 rounded border">
                            {claim.message}
                          </p>
                        </div>

                        {claim.contactPhone && (
                          <div className="mb-4">
                            <span className="text-sm text-gray-600">Phone: {claim.contactPhone}</span>
                          </div>
                        )}

                        {claim.notes && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Admin Notes:</h4>
                            <p className="text-gray-700 text-sm bg-white p-3 rounded border">
                              {claim.notes}
                            </p>
                          </div>
                        )}

                        {claim.status === 'pending' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                const notes = prompt('Add notes (optional):');
                                handleClaimAction(claim.id, 'approve', notes || undefined);
                              }}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const notes = prompt('Add rejection reason:');
                                if (notes) {
                                  handleClaimAction(claim.id, 'reject', notes);
                                }
                              }}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              Reject
                            </button>
                            <Link
                              href={`/artists/${claim.artistId}`}
                              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                            >
                              View Artist
                            </Link>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 
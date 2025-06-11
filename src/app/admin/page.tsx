'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'debug' | 'content' | 'feedback' | 'analytics'>('debug');
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [venues, setVenues] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [venueSearch, setVenueSearch] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [backups, setBackups] = useState<any[]>([]);
  const [showBackupsList, setShowBackupsList] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // Filter functions for search
  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
    venue.city.toLowerCase().includes(venueSearch.toLowerCase()) ||
    venue.state.toLowerCase().includes(venueSearch.toLowerCase()) ||
    venue.venueType.toLowerCase().includes(venueSearch.toLowerCase())
  );

  const filteredArtists = artists.filter(artist => 
    artist.name.toLowerCase().includes(artistSearch.toLowerCase()) ||
    artist.city.toLowerCase().includes(artistSearch.toLowerCase()) ||
    artist.state.toLowerCase().includes(artistSearch.toLowerCase()) ||
    artist.artistType.toLowerCase().includes(artistSearch.toLowerCase())
  );

  // Prevent hydration mismatch by only showing browser-specific content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load data for content management
  useEffect(() => {
    if (activeTab === 'content') {
      loadContentData();
    } else if (activeTab === 'feedback') {
      loadFeedbackData();
    }
  }, [activeTab]);

  const loadContentData = async () => {
    try {
      const [venuesResponse, artistsResponse] = await Promise.all([
        fetch('/api/venues'),
        fetch('/api/artists')
      ]);
      
      if (venuesResponse.ok) {
        const venuesData = await venuesResponse.json();
        setVenues(Array.isArray(venuesData) ? venuesData : []);
      }
      
      if (artistsResponse.ok) {
        const artistsData = await artistsResponse.json();
        setArtists(Array.isArray(artistsData) ? artistsData : []);
      }
    } catch (error) {
      console.error('Error loading content data:', error);
    }
  };

  const loadFeedbackData = async () => {
    try {
      const response = await fetch('/api/feedback');
      if (response.ok) {
        const feedbackData = await response.json();
        setFeedback(Array.isArray(feedbackData) ? feedbackData : []);
      }
    } catch (error) {
      console.error('Error loading feedback data:', error);
    }
  };

  const handleQuickLogin = async (email: string, displayName: string, entityType: string, entityName: string) => {
    setLoading(prev => ({ ...prev, [email]: true }));
    
    try {
      console.log('Admin: Redirecting to login with pre-filled credentials for:', displayName);
      
      // Redirect to login page with pre-filled email and password
      const loginUrl = `/auth/login?email=${encodeURIComponent(email)}&password=debug123&name=${encodeURIComponent(displayName)}`;
      
      if (mounted) {
        window.location.href = loginUrl;
      }
    } catch (error) {
      console.error('Quick login redirect failed:', error);
      alert('Quick login redirect failed');
    } finally {
      setLoading(prev => ({ ...prev, [email]: false }));
    }
  };

  const handleResetBids = async () => {
    setIsResetting(true);
    
    try {
      const response = await fetch('/api/admin/reset-bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset bids');
      }

      alert('✅ All bids have been reset to their original demo state!');
      // Refresh the page to show updated state
      if (mounted) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Bid reset failed:', error);
      alert('Failed to reset bids');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearAllBids = async () => {
    if (!confirm('⚠️ This will permanently delete ALL bids from the system. This action cannot be undone. Are you sure?')) {
      return;
    }

    setLoading(prev => ({ ...prev, clearBids: true }));
    
    try {
      const response = await fetch('/api/admin/clear-bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear bids');
      }

      alert('🧹 All bids have been cleared from the system!');
      // Refresh the page to show updated state
      if (mounted) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Clear bids failed:', error);
      alert('Failed to clear bids');
    } finally {
      setLoading(prev => ({ ...prev, clearBids: false }));
    }
  };

  const handleDeleteContent = async (type: 'venue' | 'artist', id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${type} "${name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(prev => ({ ...prev, [`delete-${type}-${id}`]: true }));
    
    try {
      console.log(`🗑️ Attempting to delete ${type}: ${name} (ID: ${id})`);
      
      const response = await fetch(`/api/${type}s/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`🗑️ Delete response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`🗑️ Delete failed:`, errorData);
        throw new Error(errorData.error || `Failed to delete ${type} (${response.status})`);
      }

      const result = await response.json();
      console.log(`✅ Delete successful:`, result);
      
      alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} "${name}" has been deleted!`);
      
      // Reload content data
      await loadContentData();
    } catch (error) {
      console.error(`❌ Delete ${type} failed:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to delete ${type}`;
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(prev => ({ ...prev, [`delete-${type}-${id}`]: false }));
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setBackupMessage('');
    
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      // Check if this is a direct download response (production)
      const contentType = response.headers.get('content-type');
      const filename = response.headers.get('x-backup-filename');
      
      if (contentType?.includes('application/json') && filename) {
        // Production: Direct download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setBackupMessage(`✅ Backup downloaded successfully: ${filename}`);
        alert('Backup created and downloaded successfully!');
      } else {
        // Local development: JSON response with file path
        const backupData = await response.json();
        setBackupMessage(backupData.message);
        alert('Backup created successfully!');
      }
      
      // Refresh backup list if it's currently shown
      if (showBackupsList) {
        await handleShowBackups();
      }
    } catch (error) {
      console.error('Backup creation failed:', error);
      alert('Failed to create backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleShowBackups = async () => {
    setLoadingBackups(true);
    try {
      const response = await fetch('/api/admin/backups');
      if (!response.ok) {
        throw new Error('Failed to fetch backups');
      }

      const backupData = await response.json();
      setBackups(backupData.backups || []);
      setShowBackupsList(true);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
      alert('Failed to fetch backups');
    } finally {
      setLoadingBackups(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🛠️ Admin Control Panel</h1>
                <p className="text-gray-600 mt-1">Manage platform content and debug tools</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Back to Main Site Button */}
                <a
                  href="/"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Main Site
                </a>
                
                {/* Current User Status */}
                <div className="text-right">
                  <div className="text-sm text-gray-600">Current User:</div>
                  {user ? (
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-gray-600">
                        {user.role} {user.memberships && user.memberships.length > 0 && `• ${user.memberships.length} membership${user.memberships.length > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Not logged in</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('debug')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'debug'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🐛 Debug Tools
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📝 Content Management
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'feedback'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💬 Feedback ({feedback.filter(f => f.status === 'NEW').length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Analytics
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'debug' && (
              <div className="space-y-8">
                {/* Quick User Switcher */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick User Switcher</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Click any user below to go to the login page with their credentials pre-filled. 
                    All debug users use password: <code className="bg-gray-100 px-2 py-1 rounded">debug123</code>
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* ARTISTS */}
                    <div className="col-span-full">
                      <h3 className="text-md font-medium text-gray-700 mb-3 border-b border-gray-200 pb-1">🎵 Artists</h3>
                    </div>

                    {/* Tom May (The Menzingers) */}
                    <button
                      onClick={() => handleQuickLogin('tom@debug.diyshows.com', 'Tom May (Debug)', 'artist', 'The Menzingers')}
                      disabled={loading['tom@debug.diyshows.com']}
                      className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="font-semibold text-blue-800">🎤 Tom May (Debug)</div>
                      <div className="text-sm text-blue-600">The Menzingers • Vocalist/Guitar</div>
                      <div className="text-xs text-blue-500 mt-1">Scranton, PA • Punk Rock</div>
                      <div className="text-xs text-gray-500 mt-2">tom@debug.diyshows.com</div>
                    </button>

                    {/* Laura Jane Grace (Against Me!) */}
                    <button
                      onClick={() => handleQuickLogin('laura@debug.diyshows.com', 'Laura Jane Grace (Debug)', 'artist', 'Against Me!')}
                      disabled={loading['laura@debug.diyshows.com']}
                      className="p-4 border-2 border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="font-semibold text-red-800">🎸 Laura Jane Grace (Debug)</div>
                        <div className="text-sm text-red-600">Against Me! • Vocalist/Guitar</div>
                        <div className="text-xs text-red-500 mt-1">Gainesville, FL • Folk Punk</div>
                      <div className="text-xs text-gray-500 mt-2">laura@debug.diyshows.com</div>
                    </button>

                    {/* Patti Smith */}
                    <button
                      onClick={() => handleQuickLogin('patti@debug.diyshows.com', 'Patti Smith (Debug)', 'artist', 'Patti Smith')}
                      disabled={loading['patti@debug.diyshows.com']}
                      className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="font-semibold text-indigo-800">📖 Patti Smith (Debug)</div>
                        <div className="text-sm text-indigo-600">Solo Artist • Poet/Musician</div>
                        <div className="text-xs text-indigo-500 mt-1">New York, NY • Punk Poetry</div>
                      <div className="text-xs text-gray-500 mt-2">patti@debug.diyshows.com</div>
                    </button>

                    {/* Barry Johnson (Joyce Manor) */}
                    <button
                      onClick={() => handleQuickLogin('barry@debug.diyshows.com', 'Barry Johnson (Debug)', 'artist', 'Joyce Manor')}
                      disabled={loading['barry@debug.diyshows.com']}
                      className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="font-semibold text-orange-800">🎸 Barry Johnson (Debug)</div>
                        <div className="text-sm text-orange-600">Joyce Manor • Vocalist/Guitar</div>
                        <div className="text-xs text-orange-500 mt-1">Torrance, CA • Punk/Emo</div>
                      <div className="text-xs text-gray-500 mt-2">barry@debug.diyshows.com</div>
                    </button>

                    {/* Brian Gibson (Lightning Bolt) */}
                    <button
                      onClick={() => handleQuickLogin('brian.gibson@debug.diyshows.com', 'Brian Gibson (Debug)', 'artist', 'Lightning Bolt')}
                      disabled={loading['brian.gibson@debug.diyshows.com']}
                      className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="font-semibold text-purple-800">🎸 Brian Gibson (Debug)</div>
                      <div className="text-sm text-purple-600">Lightning Bolt • Bass • Owner</div>
                      <div className="text-xs text-purple-500 mt-1">Providence, RI • Noise Rock</div>
                      <div className="text-xs text-gray-500 mt-2">brian.gibson@debug.diyshows.com</div>
                    </button>

                    {/* Brian Chippendale (Lightning Bolt) */}
                    <button
                      onClick={() => handleQuickLogin('brian.chippendale@debug.diyshows.com', 'Brian Chippendale (Debug)', 'artist', 'Lightning Bolt')}
                      disabled={loading['brian.chippendale@debug.diyshows.com']}
                      className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="font-semibold text-purple-800">🥁 Brian Chippendale (Debug)</div>
                      <div className="text-sm text-purple-600">Lightning Bolt • Drums • Member</div>
                      <div className="text-xs text-purple-500 mt-1">Providence, RI • Noise Rock</div>
                      <div className="text-xs text-gray-500 mt-2">brian.chippendale@debug.diyshows.com</div>
                    </button>

                    {/* VENUES */}
                    <div className="col-span-full mt-6">
                      <h3 className="text-md font-medium text-gray-700 mb-3 border-b border-gray-200 pb-1">🏢 Venues</h3>
                    </div>

                    {/* Lidz Bierenday (Lost Bag) */}
                    <button
                      onClick={() => handleQuickLogin('lidz@debug.diyshows.com', 'Lidz Bierenday (Debug)', 'venue', 'Lost Bag')}
                      disabled={loading['lidz@debug.diyshows.com']}
                      className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="font-semibold text-green-800">🏠 Lidz Bierenday (Debug)</div>
                        <div className="text-sm text-green-600">Lost Bag • House Show</div>
                        <div className="text-xs text-green-500 mt-1">Providence, RI • 300 cap</div>
                      <div className="text-xs text-gray-500 mt-2">lidz@debug.diyshows.com</div>
                    </button>

                    {/* Joe Martinez (Joe's Basement) */}
                    <button
                      onClick={() => handleQuickLogin('joe@debug.diyshows.com', 'Joe Martinez (Debug)', 'venue', "Joe's Basement")}
                      disabled={loading['joe@debug.diyshows.com']}
                      className="p-4 border-2 border-yellow-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="font-semibold text-yellow-800">🏠 Joe Martinez (Debug)</div>
                        <div className="text-sm text-yellow-600">Joe's Basement • House Show</div>
                        <div className="text-xs text-yellow-500 mt-1">Portland, OR • 35 cap</div>
                      <div className="text-xs text-gray-500 mt-2">joe@debug.diyshows.com</div>
                    </button>

                    {/* Sarah Chen (Community Arts Center) */}
                    <button
                      onClick={() => handleQuickLogin('sarah@debug.diyshows.com', 'Sarah Chen (Debug)', 'venue', 'Community Arts Center')}
                      disabled={loading['sarah@debug.diyshows.com']}
                      className="p-4 border-2 border-teal-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="font-semibold text-teal-800">🎭 Sarah Chen (Debug)</div>
                        <div className="text-sm text-teal-600">Community Arts Center • Booker</div>
                        <div className="text-xs text-teal-500 mt-1">Austin, TX • 120 cap</div>
                      <div className="text-xs text-gray-500 mt-2">sarah@debug.diyshows.com</div>
                    </button>

                    {/* Mike Rodriguez (The Underground) */}
                    <button
                      onClick={() => handleQuickLogin('mike@debug.diyshows.com', 'Mike Rodriguez (Debug)', 'venue', 'The Underground')}
                      disabled={loading['mike@debug.diyshows.com']}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="font-semibold text-gray-800">🏠 Mike Rodriguez (Debug)</div>
                        <div className="text-sm text-gray-600">The Underground • House Show</div>
                        <div className="text-xs text-gray-500 mt-1">Brooklyn, NY • 50 cap</div>
                      <div className="text-xs text-gray-500 mt-2">mike@debug.diyshows.com</div>
                    </button>

                    {/* Alex Thompson (VFW Post 1138) */}
                    <button
                      onClick={() => handleQuickLogin('alex@debug.diyshows.com', 'Alex Thompson (Debug)', 'venue', 'VFW Post 1138')}
                      disabled={loading['alex@debug.diyshows.com']}
                      className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="font-semibold text-purple-800">🏛️ Alex Thompson (Debug)</div>
                        <div className="text-sm text-purple-600">VFW Post 1138 • Event Coordinator</div>
                        <div className="text-xs text-purple-500 mt-1">Richmond, VA • 150 cap</div>
                      <div className="text-xs text-gray-500 mt-2">alex@debug.diyshows.com</div>
                    </button>

                    {/* LOGOUT */}
                    <div className="col-span-full mt-6">
                      <h3 className="text-md font-medium text-gray-700 mb-3 border-b border-gray-200 pb-1">👤 Other</h3>
                    </div>

                    {/* Public View */}
                    <button
                      onClick={() => {
                        if (mounted) {
                          window.location.href = '/';
                        }
                      }}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="font-semibold text-gray-900">👤 Public View</div>
                        <div className="text-sm text-gray-600">Not logged in</div>
                      <div className="text-xs text-gray-500 mt-1">Browse as public user</div>
                    </button>
                  </div>
                  
                  {/* Usage Instructions */}
                  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">🔧 How to use Debug Users</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Click any user above to go to login page with pre-filled credentials</li>
                      <li>• All debug users use the same password: <code className="bg-blue-100 px-1 rounded">debug123</code></li>
                      <li>• This tests the full authentication flow including login form validation</li>
                      <li>• Debug users are clearly marked with "(Debug)" in their names</li>
                      <li>• Each user is linked to real artists/venues in the database</li>
                      <li>• <strong>Lightning Bolt has multiple members</strong> - test owner vs member permissions</li>
                    </ul>
                  </div>
                </div>

                {/* Test Data Management */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Data Management</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Manage test data for show requests, bids, and shows. Use these tools to reset the system to a known state for testing.
                  </p>
                  
                  {/* Hold System Testing */}
                  <div className="mb-6">
                    <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
                      <h4 className="font-medium text-violet-900 mb-2">🔒 Hold System Testing</h4>
                      <p className="text-sm text-violet-800 mb-3">
                        Create and manage hold scenarios for testing the timeline UI. Test HELD and FROZEN bid states.
                      </p>
                      <a
                        href="/admin/holds"
                        className="inline-block px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
                      >
                        Manage Holds
                      </a>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reset Bids Button */}
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">🔄 Reset Test Data</h4>
                      <p className="text-sm text-yellow-800 mb-3">
                        Recreates all show requests, bids, and shows with realistic test data using the NEW UNIFIED SYSTEM
                      </p>
                      <button
                        onClick={handleResetBids}
                        disabled={isResetting}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                      >
                        {isResetting ? 'Resetting...' : 'Reset Bids & Test Data'}
                      </button>
                    </div>

                    {/* Database Backup Section */}
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">💾 Database Backup</h4>
                      <p className="text-sm text-green-800 mb-3">
                        Create and restore database backups to protect against data loss
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={handleCreateBackup}
                          disabled={isBackingUp}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 mr-2"
                        >
                          {isBackingUp ? 'Creating Backup...' : 'Create Backup Now'}
                        </button>
                        <button
                          onClick={handleShowBackups}
                          disabled={loadingBackups}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loadingBackups ? 'Loading...' : 'View Backups'}
                        </button>
                      </div>
                      {backupMessage && (
                        <div className={`mt-2 text-sm ${backupMessage.includes('✅') ? 'text-green-700' : 'text-red-700'}`}>
                          {backupMessage}
                        </div>
                      )}
                      
                      {/* Backup List Display */}
                      {showBackupsList && (
                        <div className="mt-4 p-3 bg-white border border-green-300 rounded-lg">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="font-medium text-green-900">📁 Available Backups ({backups.length})</h5>
                            <button
                              onClick={() => setShowBackupsList(false)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              ✕ Close
                            </button>
                          </div>
                          
                          {backups.length === 0 ? (
                            <p className="text-sm text-green-700">No backups found. Create your first backup above!</p>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {backups.map((backup: any, index: number) => (
                                <div key={backup.filename} className="flex justify-between items-center p-2 bg-green-50 rounded border">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-green-900">{backup.filename}</div>
                                    <div className="text-xs text-green-600">
                                      {backup.sizeFormatted} • Created: {new Date(backup.created).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `/api/admin/backups/${backup.filename}`;
                                        link.download = backup.filename;
                                        link.click();
                                      }}
                                      className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                      Download
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Test Data Info */}
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">📊 What Test Data Includes (NEW UNIFIED SYSTEM)</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• <strong>Lightning Bolt:</strong> 10 bids with UI-visible statuses (pending, hold, accepted) - perfect for testing bid management</li>
                      <li>• <strong>The Menzingers:</strong> 8 bids focusing on hold system testing (pending, hold)</li>
                      <li>• <strong>Against Me!:</strong> 6 bids with acceptances leading to confirmed shows - perfect for testing acceptance workflow</li>
                      <li>• <strong>Venue offers:</strong> 3 venue-initiated show requests (venues making offers to artists)</li>
                      <li>• <strong>Additional shows:</strong> 12-20 random confirmed shows across all artists and venues</li>
                      <li>• <strong>Realistic data:</strong> Proper dates, venues, pricing, and booking details</li>
                      <li>• <strong>✅ FIXED:</strong> All data now uses the unified ShowRequest system that the UI actually reads from!</li>
                      <li>• <strong>🎯 REALISTIC:</strong> Only creates bids with statuses that are actually visible in the UI (no rejected/withdrawn bids)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-8">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a 
                    href="/admin/venues"
                    className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
                  >
                    <div className="font-semibold text-green-900">+ Add New Space</div>
                    <div className="text-sm text-green-600">Create a new venue/space</div>
                  </a>
                  <a 
                    href="/admin/artists"
                    className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
                  >
                    <div className="font-semibold text-blue-900">+ Add New Performer</div>
                    <div className="text-sm text-blue-600">Create a new artist/performer</div>
                  </a>
                </div>

                {/* Venues Management */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Manage Spaces ({filteredVenues.length} of {venues.length})</h2>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search spaces..."
                        value={venueSearch}
                        onChange={(e) => setVenueSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {filteredVenues.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          {venueSearch ? `No venues found matching "${venueSearch}"` : 'No venues found'}
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredVenues.map((venue: any) => (
                              <tr key={venue.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{venue.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{venue.city}, {venue.state}</td>
                                <td className="px-4 py-2 text-sm text-gray-500 capitalize">{venue.venueType}</td>
                                <td className="px-4 py-2 text-sm space-x-2">
                                  <a 
                                    href={`/venues/${venue.id}`}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    View
                                  </a>
                                  <a 
                                    href={`/admin/venues/edit/${venue.id}`}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    Edit
                                  </a>
                                  <button
                                    onClick={() => handleDeleteContent('venue', venue.id, venue.name)}
                                    disabled={loading[`delete-venue-${venue.id}`]}
                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                  >
                                    {loading[`delete-venue-${venue.id}`] ? 'Deleting...' : 'Delete'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                {/* Artists Management */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Manage Performers ({filteredArtists.length} of {artists.length})</h2>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search performers..."
                        value={artistSearch}
                        onChange={(e) => setArtistSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {filteredArtists.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          {artistSearch ? `No performers found matching "${artistSearch}"` : 'No artists found'}
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredArtists.map((artist: any) => (
                              <tr key={artist.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{artist.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{artist.city}, {artist.state}</td>
                                <td className="px-4 py-2 text-sm text-gray-500 capitalize">{artist.artistType}</td>
                                <td className="px-4 py-2 text-sm space-x-2">
                                  <a 
                                    href={`/artists/${artist.id}`}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    View
                                  </a>
                                  <a 
                                    href={`/admin/artists/edit/${artist.id}`}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    Edit
                                  </a>
                                  <button
                                    onClick={() => handleDeleteContent('artist', artist.id, artist.name)}
                                    disabled={loading[`delete-artist-${artist.id}`]}
                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                  >
                                    {loading[`delete-artist-${artist.id}`] ? 'Deleting...' : 'Delete'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
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
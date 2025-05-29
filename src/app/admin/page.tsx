'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminPage() {
  const { user, setDebugUser, clearDebugUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'debug' | 'content' | 'feedback' | 'analytics'>('debug');
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [venues, setVenues] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [venueSearch, setVenueSearch] = useState('');
  const [artistSearch, setArtistSearch] = useState('');

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

  const handleQuickLogin = async (userType: 'artist' | 'venue' | 'logout' | 'member' | 'venue-staff', userData?: any) => {
    setLoading(prev => ({ ...prev, [userType]: true }));
    
    try {
      if (userType === 'logout') {
        // Clear debug user and reload
        clearDebugUser();
        if (mounted) {
          window.location.href = '/';
        }
        return;
      }

      // Set debug user in auth context with proper data structure
      console.log('Admin: Setting debug user for type:', userType, 'with data:', userData);
      setDebugUser(userData);
      
      // Add a small delay to ensure the user is set before redirecting
      setTimeout(() => {
        if (mounted) {
          console.log('Admin: Redirecting to user profile');
          // Redirect to user's profile instead of dashboard
          if (userData?.id) {
            window.location.href = `/profile/${userData.id}`;
          } else {
            window.location.href = '/dashboard'; // Fallback to dashboard redirect
          }
        }
      }, 100);
    } catch (error) {
      console.error('Quick login failed:', error);
      alert('Quick login failed');
    } finally {
      setLoading(prev => ({ ...prev, [userType]: false }));
    }
  };

  const handleResetBids = async () => {
    setLoading(prev => ({ ...prev, resetBids: true }));
    
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
      setLoading(prev => ({ ...prev, resetBids: false }));
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
      const response = await fetch(`/api/${type}s/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${type}`);
      }

      alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} "${name}" has been deleted!`);
      
      // Reload content data
      await loadContentData();
    } catch (error) {
      console.error(`Delete ${type} failed:`, error);
      alert(`Failed to delete ${type}`);
    } finally {
      setLoading(prev => ({ ...prev, [`delete-${type}-${id}`]: false }));
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
                        {user.role} {user.profileType && `• ${user.profileType}`}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* ARTISTS */}
                    <div className="col-span-full">
                      <h3 className="text-md font-medium text-gray-700 mb-3 border-b border-gray-200 pb-1">🎵 Artists</h3>
                    </div>

                    {/* Brian Gibson (Lightning Bolt Member) */}
                    <button
                      onClick={() => handleQuickLogin('member', {
                        id: 'brian-gibson',
                        name: 'Brian Gibson',
                        email: 'brian@lightningbolt.com',
                        role: 'user',
                        profileType: 'artist',
                        profileId: '1748101913848',
                        isVerified: true,
                        createdAt: '2024-01-01T00:00:00.000Z'
                      })}
                      disabled={loading.member}
                      className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-purple-800">🎸 Brian Gibson</div>
                        <div className="text-sm text-purple-600">Lightning Bolt • Bass</div>
                        <div className="text-xs text-purple-500 mt-1">Providence, RI • Noise Rock</div>
                      </div>
                    </button>

                    {/* Brian Chippendale (Lightning Bolt Member) */}
                    <button
                      onClick={() => handleQuickLogin('member', {
                        id: 'brian-chippendale',
                        name: 'Brian Chippendale',
                        email: 'brian.chippendale@lightningbolt.com',
                        role: 'user',
                        profileType: 'artist',
                        profileId: '1748101913848', // Lightning Bolt
                        isVerified: true,
                        createdAt: '2024-01-01T00:00:00.000Z'
                      })}
                      disabled={loading.member}
                      className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-purple-800">🥁 Brian Chippendale</div>
                        <div className="text-sm text-purple-600">Lightning Bolt • Drums</div>
                        <div className="text-xs text-purple-500 mt-1">Providence, RI • Noise Rock</div>
                      </div>
                    </button>

                    {/* Laura Jane Grace (Against Me!) */}
                    <button
                      onClick={() => handleQuickLogin('member', {
                        id: 'laura',
                        name: 'Laura Jane Grace',
                        email: 'laura@againstme.com',
                        role: 'user',
                        profileType: 'artist',
                        profileId: '1',
                        isVerified: true,
                        createdAt: '2024-01-01T00:00:00.000Z'
                      })}
                      disabled={loading.member}
                      className="p-4 border-2 border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-red-800">🎸 Laura Jane Grace</div>
                        <div className="text-sm text-red-600">Against Me! • Vocalist/Guitar</div>
                        <div className="text-xs text-red-500 mt-1">Gainesville, FL • Folk Punk</div>
                      </div>
                    </button>

                    {/* Tom May (The Menzingers) */}
                    <button
                      onClick={() => handleQuickLogin('member', {
                        id: 'tom',
                        name: 'Tom May',
                        email: 'tom@themenzingers.com',
                        role: 'user',
                        profileType: 'artist',
                        profileId: '2',
                        isVerified: true,
                        createdAt: '2024-01-01T00:00:00.000Z'
                      })}
                      disabled={loading.member}
                      className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-blue-800">🎤 Tom May</div>
                        <div className="text-sm text-blue-600">The Menzingers • Vocalist/Guitar</div>
                        <div className="text-xs text-blue-500 mt-1">Scranton, PA • Punk Rock</div>
                      </div>
                    </button>

                    {/* Patti Smith */}
                    <button
                      onClick={() => handleQuickLogin('member', {
                        id: 'patti',
                        name: 'Patti Smith',
                        email: 'patti@pattismith.net',
                        role: 'user',
                        profileType: 'artist',
                        profileId: '3',
                        isVerified: true,
                        createdAt: '2024-01-01T00:00:00.000Z'
                      })}
                      disabled={loading.member}
                      className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-indigo-800">📖 Patti Smith</div>
                        <div className="text-sm text-indigo-600">Solo Artist • Poet/Musician</div>
                        <div className="text-xs text-indigo-500 mt-1">New York, NY • Punk Poetry</div>
                      </div>
                    </button>

                    {/* Barry Johnson (Joyce Manor) */}
                    <button
                      onClick={() => handleQuickLogin('member', {
                        id: 'barry',
                        name: 'Barry Johnson',
                        email: 'barry@joycemanor.org',
                        role: 'user',
                        profileType: 'artist',
                        profileId: '5',
                        isVerified: true,
                        createdAt: '2024-01-01T00:00:00.000Z'
                      })}
                      disabled={loading.member}
                      className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-orange-800">🎸 Barry Johnson</div>
                        <div className="text-sm text-orange-600">Joyce Manor • Vocalist/Guitar</div>
                        <div className="text-xs text-orange-500 mt-1">Torrance, CA • Punk/Emo</div>
                      </div>
                    </button>

                    {/* VENUES */}
                    <div className="col-span-full mt-6">
                      <h3 className="text-md font-medium text-gray-700 mb-3 border-b border-gray-200 pb-1">🏢 Venues</h3>
                    </div>

                    {/* Lidz Bierenday (Lost Bag Staff) */}
                    <button
                      onClick={() => handleQuickLogin('venue-staff', {
                        id: 'lidz-bierenday',
                        name: 'Lidz Bierenday',
                        email: 'lidz@lostbag.com',
                        role: 'user',
                        profileType: 'venue',
                        profileId: '1748094967307',
                        isVerified: true,
                        createdAt: '2024-01-01T00:00:00.000Z'
                      })}
                      disabled={loading['venue-staff']}
                      className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-green-800">🏠 Lidz Bierenday</div>
                        <div className="text-sm text-green-600">Lost Bag • House Show</div>
                        <div className="text-xs text-green-500 mt-1">Providence, RI • 300 cap</div>
                      </div>
                    </button>

                    {/* Joe (Joe's Basement) */}
                    <button
                      onClick={() => handleQuickLogin('venue-staff', {
                        id: 'joe-basement',
                        name: 'Joe Martinez',
                        email: 'joe@joesbasement.com',
                        role: 'user',
                        profileType: 'venue',
                        profileId: '1', // Joe's Basement
                        isVerified: true,
                        createdAt: '2024-01-01T00:00:00.000Z'
                      })}
                      disabled={loading['venue-staff']}
                      className="p-4 border-2 border-yellow-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-yellow-800">🏠 Joe Martinez</div>
                        <div className="text-sm text-yellow-600">Joe's Basement • House Show</div>
                        <div className="text-xs text-yellow-500 mt-1">Portland, OR • 35 cap</div>
                      </div>
                    </button>

                    {/* Sarah (Community Arts Center) */}
                    <button
                      onClick={() => handleQuickLogin('venue-staff', {
                        id: 'sarah-arts',
                        name: 'Sarah Chen',
                        email: 'sarah@communityarts.org',
                        role: 'user',
                        profileType: 'venue',
                        profileId: '2', // Community Arts Center
                        isVerified: true,
                        createdAt: '2024-01-01T00:00:00.000Z'
                      })}
                      disabled={loading['venue-staff']}
                      className="p-4 border-2 border-teal-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-teal-800">🎭 Sarah Chen</div>
                        <div className="text-sm text-teal-600">Community Arts Center • Booker</div>
                        <div className="text-xs text-teal-500 mt-1">Austin, TX • 120 cap</div>
                      </div>
                    </button>

                    {/* Mike (The Underground) */}
                    <button
                      onClick={() => handleQuickLogin('venue-staff', {
                        id: 'mike-underground',
                        name: 'Mike Rodriguez',
                        email: 'mike@theunderground.nyc',
                        role: 'user',
                        profileType: 'venue',
                        profileId: '4', // The Underground
                        isVerified: true,
                        createdAt: '2024-01-01T00:00:00.000Z'
                      })}
                      disabled={loading['venue-staff']}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-gray-800">🏠 Mike Rodriguez</div>
                        <div className="text-sm text-gray-600">The Underground • House Show</div>
                        <div className="text-xs text-gray-500 mt-1">Brooklyn, NY • 50 cap</div>
                      </div>
                    </button>

                    {/* Alex (VFW Post 1138) */}
                    <button
                      onClick={() => handleQuickLogin('venue-staff', {
                        id: 'alex-vfw',
                        name: 'Alex Thompson',
                        email: 'alex@vfw1138.org',
                        role: 'user',
                        profileType: 'venue',
                        profileId: '5', // VFW Post 1138
                        isVerified: true,
                        createdAt: '2024-01-01T00:00:00.000Z'
                      })}
                      disabled={loading['venue-staff']}
                      className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-purple-800">🏛️ Alex Thompson</div>
                        <div className="text-sm text-purple-600">VFW Post 1138 • Event Coordinator</div>
                        <div className="text-xs text-purple-500 mt-1">Richmond, VA • 150 cap</div>
                      </div>
                    </button>

                    {/* ADMIN/PUBLIC */}
                    <div className="col-span-full mt-6">
                      <h3 className="text-md font-medium text-gray-700 mb-3 border-b border-gray-200 pb-1">👤 Other</h3>
                    </div>

                    {/* Logout */}
                    <button
                      onClick={() => handleQuickLogin('logout')}
                      disabled={loading.logout}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">👤 Public View</div>
                        <div className="text-sm text-gray-600">Not logged in</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {loading.logout ? 'Logging out...' : 'Browse as public user'}
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  {/* Usage Instructions */}
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">💡</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Testing Instructions</h3>
                        <div className="mt-1 text-sm text-blue-700">
                          <p className="mb-2">Use these accounts to test the bidding and hold system:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li><strong>Artists:</strong> Create tour requests, view/manage bids, place holds, accept/decline offers</li>
                            <li><strong>Venues:</strong> Browse tour requests, submit bids, view bid status, confirm accepted shows</li>
                            <li><strong>Cross-testing:</strong> Switch between accounts to see both sides of the booking process</li>
                            <li><strong>Hold System:</strong> Test first/second/third hold priority and automatic promotion</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Reset Tools */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Testing Data Tools</h2>
                  
                  {/* Reset to Demo State */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">🎭</span>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-green-800">Create Demo Testing Data</h3>
                        <p className="mt-1 text-sm text-green-700">
                          Creates sophisticated booking scenarios to test the full bidding system. Lightning Bolt gets 10 bids with all statuses (1 accepted, 6 pending, 1 rejected, 1 withdrawn) to test bid management. Menzingers gets 8 bids mostly pending (6 pending, 1 rejected) perfect for testing the hold system. Against Me gets 6 bids with 2 accepted leading to confirmed shows. Click on tour requests in artist pages to see expandable bid management interface!
                        </p>
                        <div className="mt-2 text-xs text-green-600">
                          <strong>How to test:</strong> Go to Lightning Bolt artist page → click on "Lightning Bolt East Coast Noise Tour" to expand → see 10 detailed bids with Accept/Hold/Decline buttons. 
                          Test hold system with Menzingers, test acceptance workflow with Against Me. Each tour request has 6-10 bids to showcase the sophisticated booking system.
                        </div>
                        <div className="mt-4">
                          <button
                            onClick={handleResetBids}
                            disabled={loading.resetBids}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading.resetBids ? 'Creating...' : '🎭 Create Demo Data'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clear All Data */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">🧹</span>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-red-800">Clear All Testing Data</h3>
                        <p className="mt-1 text-sm text-red-700">
                          Permanently deletes ALL tour requests and bids from the system. Use this to start with a clean slate.
                          <strong> This action cannot be undone!</strong>
                        </p>
                        <div className="mt-4">
                          <button
                            onClick={handleClearAllBids}
                            disabled={loading.clearBids}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading.clearBids ? 'Clearing...' : '🧹 Clear All Data'}
                          </button>
                        </div>
                      </div>
                    </div>
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
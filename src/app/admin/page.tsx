'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Theme presets
const themePresets = {
  'gibson-dark': {
    name: 'Gibson Dark (Default)',
    bgPrimary: '#0a0a0b',
    bgSecondary: '#111113',
    bgTertiary: '#18181b',
    textPrimary: '#e4e4e7',
    textSecondary: '#a1a1aa',
    textMuted: '#52525b',
    borderPrimary: '#27272a',
    accentColor: '#22c55e',
  },
  'midnight': {
    name: 'Midnight Blue',
    bgPrimary: '#0a0f1a',
    bgSecondary: '#101827',
    bgTertiary: '#1a2337',
    textPrimary: '#e0e7ff',
    textSecondary: '#94a3b8',
    textMuted: '#475569',
    borderPrimary: '#1e3a5f',
    accentColor: '#3b82f6',
  },
  'forest': {
    name: 'Forest Terminal',
    bgPrimary: '#0a0f0a',
    bgSecondary: '#101810',
    bgTertiary: '#182018',
    textPrimary: '#d4e7d4',
    textSecondary: '#8fbc8f',
    textMuted: '#4a6a4a',
    borderPrimary: '#1f3f1f',
    accentColor: '#4ade80',
  },
  'amber': {
    name: 'Amber Glow',
    bgPrimary: '#0f0a05',
    bgSecondary: '#1a1208',
    bgTertiary: '#261a0d',
    textPrimary: '#fef3c7',
    textSecondary: '#fcd34d',
    textMuted: '#92400e',
    borderPrimary: '#451a03',
    accentColor: '#f59e0b',
  },
  'light': {
    name: 'Light Mode',
    bgPrimary: '#fafafa',
    bgSecondary: '#f4f4f5',
    bgTertiary: '#e4e4e7',
    textPrimary: '#18181b',
    textSecondary: '#3f3f46',
    textMuted: '#71717a',
    borderPrimary: '#d4d4d8',
    accentColor: '#0ea5e9',
  },
};

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'debug' | 'content' | 'feedback' | 'analytics' | 'settings'>('debug');
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
  
  // Theme settings
  const [currentTheme, setCurrentTheme] = useState('gibson-dark');
  const [customColors, setCustomColors] = useState(themePresets['gibson-dark']);

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

  useEffect(() => {
    setMounted(true);
    
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('diyshows-theme');
    const savedColors = localStorage.getItem('diyshows-custom-colors');
    
    if (savedTheme && themePresets[savedTheme as keyof typeof themePresets]) {
      setCurrentTheme(savedTheme);
      setCustomColors(themePresets[savedTheme as keyof typeof themePresets]);
    } else if (savedColors) {
      try {
        const colors = JSON.parse(savedColors);
        setCustomColors(colors);
        setCurrentTheme('custom');
      } catch (e) {
        console.error('Failed to parse saved colors');
      }
    }
  }, []);

  // Apply theme to CSS variables
  const applyTheme = (colors: typeof customColors) => {
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', colors.bgPrimary);
    root.style.setProperty('--bg-secondary', colors.bgSecondary);
    root.style.setProperty('--bg-tertiary', colors.bgTertiary);
    root.style.setProperty('--text-primary', colors.textPrimary);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--text-muted', colors.textMuted);
    root.style.setProperty('--border-primary', colors.borderPrimary);
    root.style.setProperty('--status-active', colors.accentColor);
  };

  const handleThemeChange = (themeKey: string) => {
    const preset = themePresets[themeKey as keyof typeof themePresets];
    if (preset) {
      setCurrentTheme(themeKey);
      setCustomColors(preset);
      applyTheme(preset);
      localStorage.setItem('diyshows-theme', themeKey);
      localStorage.removeItem('diyshows-custom-colors');
    }
  };

  const handleColorChange = (colorKey: keyof typeof customColors, value: string) => {
    const newColors = { ...customColors, [colorKey]: value };
    setCustomColors(newColors);
    setCurrentTheme('custom');
    applyTheme(newColors);
    localStorage.setItem('diyshows-custom-colors', JSON.stringify(newColors));
    localStorage.removeItem('diyshows-theme');
  };

  const resetToDefault = () => {
    const defaultTheme = themePresets['gibson-dark'];
    setCurrentTheme('gibson-dark');
    setCustomColors(defaultTheme);
    applyTheme(defaultTheme);
    localStorage.setItem('diyshows-theme', 'gibson-dark');
    localStorage.removeItem('diyshows-custom-colors');
  };

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
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to reset bids');

      alert('✅ All bids have been reset to their original demo state!');
      if (mounted) window.location.reload();
    } catch (error) {
      console.error('Bid reset failed:', error);
      alert('Failed to reset bids');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearAllBids = async () => {
    if (!confirm('⚠️ This will permanently delete ALL bids from the system. Are you sure?')) return;

    setLoading(prev => ({ ...prev, clearBids: true }));
    
    try {
      const response = await fetch('/api/admin/clear-bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to clear bids');

      alert('🧹 All bids have been cleared!');
      if (mounted) window.location.reload();
    } catch (error) {
      console.error('Clear bids failed:', error);
      alert('Failed to clear bids');
    } finally {
      setLoading(prev => ({ ...prev, clearBids: false }));
    }
  };

  const handleDeleteContent = async (type: 'venue' | 'artist', id: string, name: string) => {
    if (!confirm(`Delete ${type} "${name}"? This cannot be undone.`)) return;

    setLoading(prev => ({ ...prev, [`delete-${type}-${id}`]: true }));
    
    try {
      const response = await fetch(`/api/${type}s/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to delete ${type}`);
      }

      alert(`✅ ${type} "${name}" deleted!`);
      await loadContentData();
    } catch (error) {
      console.error(`Delete ${type} failed:`, error);
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
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to create backup');

      const contentType = response.headers.get('content-type');
      const filename = response.headers.get('x-backup-filename');
      
      if (contentType?.includes('application/json') && filename) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setBackupMessage(`✅ Backup downloaded: ${filename}`);
      } else {
        const backupData = await response.json();
        setBackupMessage(backupData.message);
      }
      
      if (showBackupsList) await handleShowBackups();
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
      if (!response.ok) throw new Error('Failed to fetch backups');

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

  const tabs = [
    { id: 'debug', label: 'DEBUG', icon: '⚙' },
    { id: 'content', label: 'CONTENT', icon: '📁' },
    { id: 'staging', label: 'DATABASE BUILDER', icon: '🔍', href: '/admin/staging' },
    { id: 'feedback', label: `FEEDBACK [${feedback.filter(f => f.status === 'NEW').length}]`, icon: '💬' },
    { id: 'analytics', label: 'ANALYTICS', icon: '📊' },
    { id: 'settings', label: 'SETTINGS', icon: '🎨' },
  ];

  // Debug user cards data
  const debugUsers = {
    artists: [
      { email: 'tom@debug.diyshows.com', name: 'Tom May', entity: 'The Menzingers', role: 'Vocalist/Guitar', location: 'Scranton, PA', genre: 'Punk Rock' },
      { email: 'laura@debug.diyshows.com', name: 'Laura Jane Grace', entity: 'Against Me!', role: 'Vocalist/Guitar', location: 'Gainesville, FL', genre: 'Folk Punk' },
      { email: 'patti@debug.diyshows.com', name: 'Patti Smith', entity: 'Solo Artist', role: 'Poet/Musician', location: 'New York, NY', genre: 'Punk Poetry' },
      { email: 'barry@debug.diyshows.com', name: 'Barry Johnson', entity: 'Joyce Manor', role: 'Vocalist/Guitar', location: 'Torrance, CA', genre: 'Punk/Emo' },
      { email: 'brian.gibson@debug.diyshows.com', name: 'Brian Gibson', entity: 'Lightning Bolt', role: 'Bass • Owner', location: 'Providence, RI', genre: 'Noise Rock' },
      { email: 'brian.chippendale@debug.diyshows.com', name: 'Brian Chippendale', entity: 'Lightning Bolt', role: 'Drums • Member', location: 'Providence, RI', genre: 'Noise Rock' },
    ],
    venues: [
      { email: 'lidz@debug.diyshows.com', name: 'Lidz Bierenday', entity: 'Lost Bag', type: 'House Show', location: 'Providence, RI', cap: '300' },
      { email: 'joe@debug.diyshows.com', name: 'Joe Martinez', entity: "Joe's Basement", type: 'House Show', location: 'Portland, OR', cap: '35' },
      { email: 'sarah@debug.diyshows.com', name: 'Sarah Chen', entity: 'Community Arts Center', type: 'Arts Center', location: 'Austin, TX', cap: '120' },
      { email: 'mike@debug.diyshows.com', name: 'Mike Rodriguez', entity: 'The Underground', type: 'House Show', location: 'Brooklyn, NY', cap: '50' },
      { email: 'alex@debug.diyshows.com', name: 'Alex Thompson', entity: 'VFW Post 1138', type: 'VFW Hall', location: 'Richmond, VA', cap: '150' },
    ]
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-medium text-text-accent">[ADMIN CONTROL]</span>
              <span className="text-2xs text-text-muted uppercase tracking-wider">System Management</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="/" className="btn text-2xs">&lt;&lt; BACK TO SITE</a>
              
              <button
                onClick={async () => {
                  await fetch('/api/admin/auth', { method: 'DELETE' });
                  window.location.href = '/admin/login';
                }}
                className="btn text-2xs text-red-400 border-red-500/40 hover:bg-red-500/20"
              >
                LOGOUT
              </button>
              {user ? (
                <div className="text-right">
                  <div className="text-xs text-text-accent">{user.name}</div>
                  <div className="text-2xs text-text-muted uppercase tracking-wider">
                    {user.role} {user.memberships && user.memberships.length > 0 && `• ${user.memberships.length} MEMBERSHIPS`}
                  </div>
                </div>
              ) : (
                <span className="text-2xs text-text-muted">[ADMIN SESSION]</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-border-subtle bg-bg-tertiary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            {tabs.map(tab => (
              tab.href ? (
                <a
                  key={tab.id}
                  href={tab.href}
                  className="px-6 py-3 text-2xs font-medium uppercase tracking-wider border-b-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                >
                  {tab.icon} {tab.label}
                </a>
              ) : (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 text-2xs font-medium uppercase tracking-wider border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-text-accent text-text-accent bg-bg-secondary'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              )
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'debug' && (
          <div className="space-y-8">
            {/* Quick User Switcher */}
            <section className="module-section">
              <div className="module-header">&gt; QUICK USER SWITCHER</div>
              <div className="p-4">
                <p className="text-xs text-text-secondary mb-4">
                  Click any user to login. Password: <span className="text-status-info font-medium">debug123</span>
                </p>
                
                {/* Artists */}
                <div className="mb-6">
                  <h3 className="text-2xs uppercase tracking-wider text-text-muted mb-3 pb-2 border-b border-border-subtle">[ARTISTS]</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {debugUsers.artists.map(u => (
                      <button
                        key={u.email}
                        onClick={() => handleQuickLogin(u.email, u.name, 'artist', u.entity)}
                        disabled={loading[u.email]}
                        className="p-3 bg-bg-tertiary border border-border-subtle hover:border-status-info hover:bg-bg-hover transition-all text-left disabled:opacity-50"
                      >
                        <div className="text-sm font-medium text-text-accent">{u.name}</div>
                        <div className="text-xs text-status-info">{u.entity}</div>
                        <div className="text-2xs text-text-muted mt-1">{u.location} • {u.genre}</div>
                        <div className="text-2xs text-text-muted mt-1 opacity-60">{u.email}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Venues */}
                <div>
                  <h3 className="text-2xs uppercase tracking-wider text-text-muted mb-3 pb-2 border-b border-border-subtle">[VENUES]</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {debugUsers.venues.map(u => (
                      <button
                        key={u.email}
                        onClick={() => handleQuickLogin(u.email, u.name, 'venue', u.entity)}
                        disabled={loading[u.email]}
                        className="p-3 bg-bg-tertiary border border-border-subtle hover:border-status-active hover:bg-bg-hover transition-all text-left disabled:opacity-50"
                      >
                        <div className="text-sm font-medium text-text-accent">{u.name}</div>
                        <div className="text-xs text-status-active">{u.entity}</div>
                        <div className="text-2xs text-text-muted mt-1">{u.location} • {u.cap} cap</div>
                        <div className="text-2xs text-text-muted mt-1 opacity-60">{u.email}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Test Data Management */}
            <section className="module-section">
              <div className="module-header">&gt; TEST DATA MANAGEMENT</div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reset Bids */}
                  <div className="p-4 bg-bg-tertiary border border-status-warning/30">
                    <h4 className="text-xs font-medium text-status-warning mb-2">[RESET TEST DATA]</h4>
                    <p className="text-2xs text-text-secondary mb-3">
                      Recreates all show requests, bids, and shows with realistic test data.
                    </p>
                    <button onClick={handleResetBids} disabled={isResetting} className="btn text-2xs">
                      {isResetting ? 'RESETTING...' : 'RESET BIDS'}
                    </button>
                  </div>
                  
                  {/* Backup */}
                  <div className="p-4 bg-bg-tertiary border border-status-active/30">
                    <h4 className="text-xs font-medium text-status-active mb-2">[DATABASE BACKUP]</h4>
                    <p className="text-2xs text-text-secondary mb-3">
                      Create and restore database backups.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={handleCreateBackup} disabled={isBackingUp} className="btn text-2xs">
                        {isBackingUp ? 'CREATING...' : 'CREATE BACKUP'}
                      </button>
                      <button onClick={handleShowBackups} disabled={loadingBackups} className="btn text-2xs">
                        {loadingBackups ? 'LOADING...' : 'VIEW BACKUPS'}
                      </button>
                    </div>
                    {backupMessage && (
                      <div className="mt-2 text-2xs text-status-active">{backupMessage}</div>
                    )}
                  </div>
                  
                  {/* Hold System */}
                  <div className="p-4 bg-bg-tertiary border border-status-info/30">
                    <h4 className="text-xs font-medium text-status-info mb-2">[HOLD SYSTEM]</h4>
                    <p className="text-2xs text-text-secondary mb-3">
                      Manage hold scenarios for timeline UI testing.
                    </p>
                    <a href="/admin/holds" className="btn text-2xs">MANAGE HOLDS</a>
                  </div>
                </div>
                
                {/* Backups List */}
                {showBackupsList && (
                  <div className="mt-4 p-4 bg-bg-secondary border border-border-subtle">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-2xs uppercase tracking-wider text-text-muted">[BACKUPS: {backups.length}]</span>
                      <button onClick={() => setShowBackupsList(false)} className="text-2xs text-text-muted hover:text-text-primary">
                        [CLOSE]
                      </button>
                    </div>
                    
                    {backups.length === 0 ? (
                      <p className="text-xs text-text-secondary">No backups found.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {backups.map((backup: any) => (
                          <div key={backup.filename} className="flex justify-between items-center p-2 bg-bg-tertiary border border-border-subtle">
                            <div>
                              <div className="text-xs text-text-primary font-medium tabular-nums">{backup.filename}</div>
                              <div className="text-2xs text-text-muted tabular-nums">
                                {backup.sizeFormatted} • {new Date(backup.created).toLocaleString()}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/api/admin/backups/${backup.filename}`;
                                link.download = backup.filename;
                                link.click();
                              }}
                              className="btn text-2xs"
                            >
                              DOWNLOAD
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/admin/venues" className="p-4 bg-bg-secondary border border-border-subtle hover:border-status-active hover:bg-bg-tertiary transition-all text-center">
                <div className="text-sm font-medium text-text-accent">+ ADD NEW SPACE</div>
                <div className="text-2xs text-text-muted mt-1">Create a new venue listing</div>
              </a>
              <a href="/admin/artists" className="p-4 bg-bg-secondary border border-border-subtle hover:border-status-info hover:bg-bg-tertiary transition-all text-center">
                <div className="text-sm font-medium text-text-accent">+ ADD NEW PERFORMER</div>
                <div className="text-2xs text-text-muted mt-1">Create a new artist listing</div>
              </a>
            </div>

            {/* Venues Table */}
            <section className="module-section">
              <div className="module-header flex justify-between items-center">
                <span>&gt; SPACES [{filteredVenues.length}/{venues.length}]</span>
                <div className="flex items-center bg-bg-primary border border-border-subtle">
                  <span className="px-2 text-text-muted">&gt;&gt;</span>
                  <input
                    type="text"
                    placeholder="SEARCH..."
                    value={venueSearch}
                    onChange={(e) => setVenueSearch(e.target.value)}
                    className="bg-transparent px-2 py-1 text-2xs text-text-primary placeholder-text-muted outline-none w-32"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredVenues.length === 0 ? (
                  <div className="p-4 text-center text-text-muted text-xs">
                    {venueSearch ? `No venues matching "${venueSearch}"` : 'No venues found'}
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>LOCATION</th>
                        <th>TYPE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVenues.map((venue: any) => (
                        <tr key={venue.id}>
                          <td className="text-xs text-text-primary">{venue.name}</td>
                          <td className="text-xs text-text-secondary">{venue.city}, {venue.state}</td>
                          <td className="text-xs text-text-secondary uppercase">{venue.venueType}</td>
                          <td className="space-x-2">
                            <a href={`/venues/${venue.id}`} className="text-2xs text-status-info hover:underline">VIEW</a>
                            <a href={`/admin/venues/edit/${venue.id}`} className="text-2xs text-status-active hover:underline">EDIT</a>
                            <button
                              onClick={() => handleDeleteContent('venue', venue.id, venue.name)}
                              disabled={loading[`delete-venue-${venue.id}`]}
                              className="text-2xs text-status-error hover:underline disabled:opacity-50"
                            >
                              {loading[`delete-venue-${venue.id}`] ? '...' : 'DELETE'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Artists Table */}
            <section className="module-section">
              <div className="module-header flex justify-between items-center">
                <span>&gt; PERFORMERS [{filteredArtists.length}/{artists.length}]</span>
                <div className="flex items-center bg-bg-primary border border-border-subtle">
                  <span className="px-2 text-text-muted">&gt;&gt;</span>
                  <input
                    type="text"
                    placeholder="SEARCH..."
                    value={artistSearch}
                    onChange={(e) => setArtistSearch(e.target.value)}
                    className="bg-transparent px-2 py-1 text-2xs text-text-primary placeholder-text-muted outline-none w-32"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredArtists.length === 0 ? (
                  <div className="p-4 text-center text-text-muted text-xs">
                    {artistSearch ? `No artists matching "${artistSearch}"` : 'No artists found'}
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>LOCATION</th>
                        <th>TYPE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArtists.map((artist: any) => (
                        <tr key={artist.id}>
                          <td className="text-xs text-text-primary">{artist.name}</td>
                          <td className="text-xs text-text-secondary">{artist.city}, {artist.state}</td>
                          <td className="text-xs text-text-secondary uppercase">{artist.artistType}</td>
                          <td className="space-x-2">
                            <a href={`/artists/${artist.id}`} className="text-2xs text-status-info hover:underline">VIEW</a>
                            <a href={`/admin/artists/edit/${artist.id}`} className="text-2xs text-status-active hover:underline">EDIT</a>
                            <button
                              onClick={() => handleDeleteContent('artist', artist.id, artist.name)}
                              disabled={loading[`delete-artist-${artist.id}`]}
                              className="text-2xs text-status-error hover:underline disabled:opacity-50"
                            >
                              {loading[`delete-artist-${artist.id}`] ? '...' : 'DELETE'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'feedback' && (
          <section className="module-section">
            <div className="module-header">&gt; USER FEEDBACK</div>
            <div className="p-4">
              <p className="text-xs text-text-muted">Feedback management coming soon...</p>
            </div>
          </section>
        )}

        {activeTab === 'analytics' && (
          <section className="module-section">
            <div className="module-header">&gt; ANALYTICS</div>
            <div className="p-4">
              <p className="text-xs text-text-muted">Analytics dashboard coming soon...</p>
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Theme Presets */}
            <section className="module-section">
              <div className="module-header">&gt; THEME PRESETS</div>
              <div className="p-4">
                <p className="text-xs text-text-secondary mb-4">
                  Select a preset theme or customize colors below. Changes are saved automatically.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(themePresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      className={`p-3 border transition-all text-left ${
                        currentTheme === key 
                          ? 'border-status-active bg-status-active/10' 
                          : 'border-border-subtle hover:border-text-secondary'
                      }`}
                    >
                      <div className="flex gap-1 mb-2">
                        <div className="w-4 h-4 border border-white/20" style={{ backgroundColor: preset.bgPrimary }}></div>
                        <div className="w-4 h-4 border border-white/20" style={{ backgroundColor: preset.textPrimary }}></div>
                        <div className="w-4 h-4 border border-white/20" style={{ backgroundColor: preset.accentColor }}></div>
                      </div>
                      <div className="text-xs text-text-primary">{preset.name}</div>
                      {currentTheme === key && (
                        <div className="text-2xs text-status-active mt-1">[ACTIVE]</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Custom Colors */}
            <section className="module-section">
              <div className="module-header">&gt; CUSTOM COLORS {currentTheme === 'custom' && '[CUSTOM MODE]'}</div>
              <div className="p-4">
                <p className="text-xs text-text-secondary mb-4">
                  Adjust individual colors. Modifying any color switches to custom mode.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Background Colors */}
                  <div className="space-y-3">
                    <h4 className="text-2xs uppercase tracking-wider text-text-muted border-b border-border-subtle pb-2">Backgrounds</h4>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColors.bgPrimary}
                        onChange={(e) => handleColorChange('bgPrimary', e.target.value)}
                        className="w-8 h-8 cursor-pointer bg-transparent border border-border-subtle"
                      />
                      <div>
                        <div className="text-xs text-text-primary">Primary BG</div>
                        <div className="text-2xs text-text-muted font-mono">{customColors.bgPrimary}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColors.bgSecondary}
                        onChange={(e) => handleColorChange('bgSecondary', e.target.value)}
                        className="w-8 h-8 cursor-pointer bg-transparent border border-border-subtle"
                      />
                      <div>
                        <div className="text-xs text-text-primary">Secondary BG</div>
                        <div className="text-2xs text-text-muted font-mono">{customColors.bgSecondary}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColors.bgTertiary}
                        onChange={(e) => handleColorChange('bgTertiary', e.target.value)}
                        className="w-8 h-8 cursor-pointer bg-transparent border border-border-subtle"
                      />
                      <div>
                        <div className="text-xs text-text-primary">Tertiary BG</div>
                        <div className="text-2xs text-text-muted font-mono">{customColors.bgTertiary}</div>
                      </div>
                    </div>
                  </div>

                  {/* Text Colors */}
                  <div className="space-y-3">
                    <h4 className="text-2xs uppercase tracking-wider text-text-muted border-b border-border-subtle pb-2">Text</h4>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColors.textPrimary}
                        onChange={(e) => handleColorChange('textPrimary', e.target.value)}
                        className="w-8 h-8 cursor-pointer bg-transparent border border-border-subtle"
                      />
                      <div>
                        <div className="text-xs text-text-primary">Primary Text</div>
                        <div className="text-2xs text-text-muted font-mono">{customColors.textPrimary}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColors.textSecondary}
                        onChange={(e) => handleColorChange('textSecondary', e.target.value)}
                        className="w-8 h-8 cursor-pointer bg-transparent border border-border-subtle"
                      />
                      <div>
                        <div className="text-xs text-text-primary">Secondary Text</div>
                        <div className="text-2xs text-text-muted font-mono">{customColors.textSecondary}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColors.textMuted}
                        onChange={(e) => handleColorChange('textMuted', e.target.value)}
                        className="w-8 h-8 cursor-pointer bg-transparent border border-border-subtle"
                      />
                      <div>
                        <div className="text-xs text-text-primary">Muted Text</div>
                        <div className="text-2xs text-text-muted font-mono">{customColors.textMuted}</div>
                      </div>
                    </div>
                  </div>

                  {/* Border & Accent */}
                  <div className="space-y-3">
                    <h4 className="text-2xs uppercase tracking-wider text-text-muted border-b border-border-subtle pb-2">Border & Accent</h4>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColors.borderPrimary}
                        onChange={(e) => handleColorChange('borderPrimary', e.target.value)}
                        className="w-8 h-8 cursor-pointer bg-transparent border border-border-subtle"
                      />
                      <div>
                        <div className="text-xs text-text-primary">Border</div>
                        <div className="text-2xs text-text-muted font-mono">{customColors.borderPrimary}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColors.accentColor}
                        onChange={(e) => handleColorChange('accentColor', e.target.value)}
                        className="w-8 h-8 cursor-pointer bg-transparent border border-border-subtle"
                      />
                      <div>
                        <div className="text-xs text-text-primary">Accent</div>
                        <div className="text-2xs text-text-muted font-mono">{customColors.accentColor}</div>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-3">
                    <h4 className="text-2xs uppercase tracking-wider text-text-muted border-b border-border-subtle pb-2">Preview</h4>
                    <div 
                      className="p-4 border"
                      style={{ 
                        backgroundColor: customColors.bgSecondary,
                        borderColor: customColors.borderPrimary
                      }}
                    >
                      <div style={{ color: customColors.textPrimary }} className="text-sm font-medium mb-1">
                        Primary Text
                      </div>
                      <div style={{ color: customColors.textSecondary }} className="text-xs mb-1">
                        Secondary text example
                      </div>
                      <div style={{ color: customColors.textMuted }} className="text-2xs mb-2">
                        Muted text example
                      </div>
                      <div 
                        className="inline-block px-2 py-1 text-2xs"
                        style={{ 
                          backgroundColor: customColors.accentColor,
                          color: customColors.bgPrimary
                        }}
                      >
                        [ACCENT BUTTON]
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border-subtle flex gap-3">
                  <button
                    onClick={resetToDefault}
                    className="btn text-2xs"
                  >
                    [RESET TO DEFAULT]
                  </button>
                  <span className="text-2xs text-text-muted self-center">
                    Current: {currentTheme === 'custom' ? 'Custom' : themePresets[currentTheme as keyof typeof themePresets]?.name}
                  </span>
                </div>
              </div>
            </section>

            {/* Info */}
            <section className="module-section">
              <div className="module-header">&gt; ABOUT THEMING</div>
              <div className="p-4">
                <div className="text-xs text-text-secondary space-y-2">
                  <p>
                    <span className="text-status-info">Note:</span> Theme settings are stored in your browser's localStorage 
                    and will persist across sessions. They only affect your view of the site.
                  </p>
                  <p>
                    The white backgrounds on Artist/Venue detail pages are intentional for 
                    better readability of content-heavy pages. These pages use a light theme 
                    variant to optimize for viewing images and detailed information.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

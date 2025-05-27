'use client';

import React, { useState } from 'react';
import FeaturedMediaEmbed from '../../components/FeaturedMediaEmbed';
import MediaEmbedSection from '../../components/MediaEmbedSection';

export default function MediaIntegrationDemo() {
  const [activeTab, setActiveTab] = useState<'venue-owner' | 'venue-visitor' | 'artist-owner' | 'artist-visitor'>('venue-owner');
  const [selectedVenue, setSelectedVenue] = useState('1');
  const [selectedArtist, setSelectedArtist] = useState('1');

  const scenarios = {
    'venue-owner': {
      title: 'Venue Owner View',
      description: 'What venue owners see when managing their profile',
      canEdit: true,
      entityType: 'venue' as const,
      entityId: selectedVenue
    },
    'venue-visitor': {
      title: 'Venue Visitor View', 
      description: 'What visitors see when viewing a venue profile',
      canEdit: false,
      entityType: 'venue' as const,
      entityId: selectedVenue
    },
    'artist-owner': {
      title: 'Artist Owner View',
      description: 'What artists see when managing their profile',
      canEdit: true,
      entityType: 'artist' as const,
      entityId: selectedArtist
    },
    'artist-visitor': {
      title: 'Artist Visitor View',
      description: 'What visitors see when viewing an artist profile',
      canEdit: false,
      entityType: 'artist' as const,
      entityId: selectedArtist
    }
  };

  const currentScenario = scenarios[activeTab];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Media Integration Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            See how media embeds integrate into venue and artist profiles with different permission levels.
            This shows the real implementation you'd add to your existing profile pages.
          </p>
        </div>

        {/* Scenario Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {Object.entries(scenarios).map(([key, scenario]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {scenario.title}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">{currentScenario.title}</h3>
            <p className="text-sm text-blue-800 mt-1">{currentScenario.description}</p>
            <div className="mt-2 flex items-center space-x-4 text-xs text-blue-700">
              <span>Can Edit: {currentScenario.canEdit ? '✅ Yes' : '❌ No'}</span>
              <span>Entity Type: {currentScenario.entityType}</span>
              <span>Entity ID: {currentScenario.entityId}</span>
            </div>
          </div>
        </div>

        {/* Mock Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {currentScenario.entityType === 'venue' ? '🏢' : '🎵'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentScenario.entityType === 'venue' ? 'The Underground' : 'Midnight Echoes'}
              </h1>
              <p className="text-gray-600">
                {currentScenario.entityType === 'venue' 
                  ? 'Intimate venue • Brooklyn, NY • 150 capacity' 
                  : 'Indie Rock Band • Portland, OR • 5 years active'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Featured Media - Shows at top of profile */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Featured Media (Top of Profile)
          </h2>
          <FeaturedMediaEmbed
            entityId={currentScenario.entityId}
            entityType={currentScenario.entityType}
            className="max-w-2xl"
          />
          <div className="mt-3 text-sm text-gray-600">
            💡 This appears at the top of the profile page when there's featured content
          </div>
        </div>

        {/* Full Media Section - Shows in dedicated tab/section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Full Media Section (Dedicated Tab)
          </h2>
          <MediaEmbedSection
            entityId={currentScenario.entityId}
            entityType={currentScenario.entityType}
            canEdit={currentScenario.canEdit}
            maxEmbeds={10}
          />
          <div className="mt-3 text-sm text-gray-600">
            💡 This would be in a "Media" tab or section on the profile page
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Implementation Guide
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Add to Profile Header</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm text-gray-800">
                  {`<FeaturedMediaEmbed 
  entityId={${currentScenario.entityType}.id} 
  entityType="${currentScenario.entityType}" 
  className="mb-6" 
/>`}
                </code>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Shows featured content prominently at the top of the profile
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Add Media Tab/Section</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm text-gray-800">
                  {`<MediaEmbedSection
  entityId={${currentScenario.entityType}.id}
  entityType="${currentScenario.entityType}"
  canEdit={permissions.canEdit${currentScenario.entityType === 'venue' ? 'Venue' : 'Artist'}(${currentScenario.entityType}.id)}
  maxEmbeds={10}
/>`}
                </code>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Full media management interface with tabs for featured vs all content
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. Database Schema</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm text-gray-800">
                  {`// Add to your database schema
table media_embeds {
  id: string
  entity_id: string
  entity_type: 'venue' | 'artist'
  url: string
  title: string
  description?: string
  order: number
  is_featured: boolean
  created_at: timestamp
  updated_at: timestamp
}`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">4. API Endpoints Needed</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div><code className="text-sm">GET /api/{currentScenario.entityType}s/:id/embeds</code> - List embeds</div>
                <div><code className="text-sm">POST /api/{currentScenario.entityType}s/:id/embeds</code> - Create embed</div>
                <div><code className="text-sm">PUT /api/{currentScenario.entityType}s/:id/embeds/:embedId</code> - Update embed</div>
                <div><code className="text-sm">DELETE /api/{currentScenario.entityType}s/:id/embeds/:embedId</code> - Delete embed</div>
                <div><code className="text-sm">PATCH /api/{currentScenario.entityType}s/:id/embeds/:embedId/featured</code> - Toggle featured</div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            Benefits of This Integration
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-green-900 mb-2">For Venues</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Showcase venue tours and atmosphere</li>
                <li>• Feature past performances and events</li>
                <li>• Display promotional videos</li>
                <li>• Share playlists of music they support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-900 mb-2">For Artists</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Feature latest music releases</li>
                <li>• Share live performance videos</li>
                <li>• Showcase music videos and content</li>
                <li>• Display Spotify/SoundCloud profiles</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
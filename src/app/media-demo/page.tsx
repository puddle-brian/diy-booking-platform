'use client';

import React, { useState } from 'react';
import MediaEmbed from '../../components/MediaEmbed';
import MediaEmbedForm from '../../components/MediaEmbedForm';

interface EmbedData {
  id: string;
  url: string;
  title: string;
  description?: string;
}

export default function MediaDemoPage() {
  const [embeds, setEmbeds] = useState<EmbedData[]>([
    {
      id: '1',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Featured Performance',
      description: 'Our latest live performance at the venue'
    },
    {
      id: '2',
      url: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
      title: 'Latest Single',
      description: 'Check out our newest release on Spotify'
    }
  ]);
  
  const [showForm, setShowForm] = useState(false);
  const [editingEmbed, setEditingEmbed] = useState<EmbedData | null>(null);

  const handleAddEmbed = (embedData: { url: string; title: string; description?: string }) => {
    const newEmbed: EmbedData = {
      id: Date.now().toString(),
      ...embedData
    };
    setEmbeds([...embeds, newEmbed]);
    setShowForm(false);
  };

  const handleEditEmbed = (embedData: { url: string; title: string; description?: string }) => {
    if (editingEmbed) {
      setEmbeds(embeds.map(embed => 
        embed.id === editingEmbed.id 
          ? { ...embed, ...embedData }
          : embed
      ));
      setEditingEmbed(null);
    }
  };

  const handleDeleteEmbed = (id: string) => {
    setEmbeds(embeds.filter(embed => embed.id !== id));
  };

  const startEdit = (embed: EmbedData) => {
    setEditingEmbed(embed);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingEmbed(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Media Embed Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Showcase your music, videos, and content from YouTube, Spotify, SoundCloud, and Bandcamp. 
            Perfect for artists and venues to share their work with potential bookers.
          </p>
        </div>

        {/* Add Embed Button */}
        {!showForm && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Media Embed
            </button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <MediaEmbedForm
              onSave={editingEmbed ? handleEditEmbed : handleAddEmbed}
              onCancel={cancelForm}
              initialData={editingEmbed || undefined}
            />
          </div>
        )}

        {/* Embeds Grid */}
        {embeds.length > 0 ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              Featured Content
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2">
              {embeds.map((embed) => (
                <div key={embed.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <MediaEmbed 
                    url={embed.url} 
                    title={embed.title}
                    className="w-full"
                  />
                  
                  {embed.description && (
                    <div className="p-4 border-t border-gray-200">
                      <p className="text-gray-600 text-sm">{embed.description}</p>
                    </div>
                  )}
                  
                  {/* Edit/Delete Controls */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
                    <button
                      onClick={() => startEdit(embed)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEmbed(embed.id)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media embeds yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first embed to showcase your content
            </p>
          </div>
        )}

        {/* Platform Examples */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Examples
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl mb-2">📺</div>
              <h4 className="font-medium text-gray-900">YouTube</h4>
              <p className="text-sm text-gray-600 mt-1">
                Live performances, music videos, venue tours
              </p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl mb-2">🎵</div>
              <h4 className="font-medium text-gray-900">Spotify</h4>
              <p className="text-sm text-gray-600 mt-1">
                Tracks, albums, playlists, artist profiles
              </p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl mb-2">🔊</div>
              <h4 className="font-medium text-gray-900">SoundCloud</h4>
              <p className="text-sm text-gray-600 mt-1">
                Original tracks, remixes, DJ sets
              </p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl mb-2">🎶</div>
              <h4 className="font-medium text-gray-900">Bandcamp</h4>
              <p className="text-sm text-gray-600 mt-1">
                Independent releases, direct sales
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Why Use Media Embeds?
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">💾 Save Space</h4>
              <p className="text-sm text-blue-800">
                No need to upload large files - embed directly from platforms
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">🔄 Always Updated</h4>
              <p className="text-sm text-blue-800">
                Content stays current with the original source
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">📱 Mobile Friendly</h4>
              <p className="text-sm text-blue-800">
                Responsive design works perfectly on all devices
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
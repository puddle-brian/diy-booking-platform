'use client';

import React, { useState, useEffect } from 'react';
import MediaEmbed from './MediaEmbed';
import MediaEmbedForm from './MediaEmbedForm';

interface MediaEmbedData {
  id: string;
  url: string;
  title: string;
  description?: string;
  order: number;
  isFeatured?: boolean;
}

interface MediaEmbedSectionProps {
  entityId: string;
  entityType: 'venue' | 'artist';
  canEdit?: boolean;
  maxEmbeds?: number;
  showFeaturedOnly?: boolean;
}

export default function MediaEmbedSection({ 
  entityId, 
  entityType, 
  canEdit = false, 
  maxEmbeds = 10,
  showFeaturedOnly = false 
}: MediaEmbedSectionProps) {
  const [embeds, setEmbeds] = useState<MediaEmbedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmbed, setEditingEmbed] = useState<MediaEmbedData | null>(null);
  const [activeTab, setActiveTab] = useState<'featured' | 'all'>('featured');

  // Load embeds from API
  useEffect(() => {
    loadEmbeds();
  }, [entityId, entityType]);

  const loadEmbeds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${entityType}s/${entityId}/embeds`);
      if (response.ok) {
        const embedsData = await response.json();
        // Ensure embedsData is an array
        const embedsArray = Array.isArray(embedsData) ? embedsData : [];
        setEmbeds(embedsArray.sort((a: MediaEmbedData, b: MediaEmbedData) => a.order - b.order));
      } else {
        console.warn('Failed to load embeds:', response.status);
        setEmbeds([]);
      }
    } catch (error) {
      console.error('Failed to load embeds:', error);
      setEmbeds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmbed = async (embedData: { url: string; title: string; description?: string }) => {
    try {
      if (editingEmbed) {
        // Update existing embed
        const response = await fetch(`/api/${entityType}s/${entityId}/embeds?embedId=${editingEmbed.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...embedData,
            order: editingEmbed.order,
            isFeatured: editingEmbed.isFeatured
          })
        });

        if (response.ok) {
          const updatedEmbed = await response.json();
          setEmbeds(prevEmbeds => Array.isArray(prevEmbeds) ? prevEmbeds.map(embed => 
            embed.id === editingEmbed.id ? updatedEmbed : embed
          ) : []);
        } else {
          throw new Error('Failed to update embed');
        }
      } else {
        // Add new embed
        if (Array.isArray(embeds) && embeds.length >= maxEmbeds) {
          alert(`Maximum of ${maxEmbeds} embeds allowed`);
          return;
        }

        const response = await fetch(`/api/${entityType}s/${entityId}/embeds`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...embedData,
            isFeatured: !Array.isArray(embeds) || embeds.length === 0 // First embed is featured by default
          })
        });

        if (response.ok) {
          const newEmbed = await response.json();
          setEmbeds(prevEmbeds => Array.isArray(prevEmbeds) ? [...prevEmbeds, newEmbed] : [newEmbed]);
        } else {
          throw new Error('Failed to create embed');
        }
      }

      setShowForm(false);
      setEditingEmbed(null);

    } catch (error) {
      console.error('Failed to save embed:', error);
      alert('Failed to save embed. Please try again.');
    }
  };

  const handleDeleteEmbed = async (id: string) => {
    if (!confirm('Are you sure you want to delete this embed?')) return;

    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/embeds?embedId=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setEmbeds(prevEmbeds => Array.isArray(prevEmbeds) ? prevEmbeds.filter(embed => embed.id !== id) : []);
      } else {
        throw new Error('Failed to delete embed');
      }

    } catch (error) {
      console.error('Failed to delete embed:', error);
      alert('Failed to delete embed. Please try again.');
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const embed = Array.isArray(embeds) ? embeds.find(e => e.id === id) : null;
      if (!embed) return;

      const response = await fetch(`/api/${entityType}s/${entityId}/embeds?embedId=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: embed.url,
          title: embed.title,
          description: embed.description,
          order: embed.order,
          isFeatured: !embed.isFeatured
        })
      });

      if (response.ok) {
        const updatedEmbed = await response.json();
        setEmbeds(prevEmbeds => Array.isArray(prevEmbeds) ? prevEmbeds.map(embed => 
          embed.id === id ? updatedEmbed : { ...embed, isFeatured: false }
        ) : []);
      } else {
        throw new Error('Failed to update featured status');
      }

    } catch (error) {
      console.error('Failed to update featured status:', error);
      alert('Failed to update featured status. Please try again.');
    }
  };

  const startEdit = (embed: MediaEmbedData) => {
    setEditingEmbed(embed);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingEmbed(null);
  };

  const featuredEmbeds = Array.isArray(embeds) ? embeds.filter(embed => embed.isFeatured) : [];
  const displayEmbeds = showFeaturedOnly ? featuredEmbeds : 
                       activeTab === 'featured' ? featuredEmbeds : (Array.isArray(embeds) ? embeds : []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Media Content</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showcase videos, music, and other content
            </p>
          </div>
          
          {canEdit && !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Media
            </button>
          )}
        </div>

        {/* Tabs - Only show if not in featured-only mode and there are embeds */}
        {!showFeaturedOnly && Array.isArray(embeds) && embeds.length > 0 && (
          <div className="mt-4">
            <nav className="flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('featured')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'featured'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Featured ({featuredEmbeds.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Content ({embeds.length})
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <MediaEmbedForm
            onSave={handleSaveEmbed}
            onCancel={cancelForm}
            initialData={editingEmbed || undefined}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {displayEmbeds.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'featured' ? 'No featured content' : 'No media content yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {canEdit 
                ? 'Add videos, music, and other content to showcase your work'
                : 'No media content has been shared yet'
              }
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Add Your First Media
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {displayEmbeds.map((embed) => {
              // Safety check for embed object
              if (!embed || !embed.id || !embed.url) {
                console.warn('Invalid embed object:', embed);
                return null;
              }
              
              return (
                <div key={embed.id} className="bg-gray-50 rounded-lg overflow-hidden">
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
                  
                  {/* Controls - Only show if user can edit */}
                  {canEdit && (
                    <div className="px-4 py-3 bg-white border-t border-gray-200 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(embed.id)}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            embed.isFeatured
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {embed.isFeatured ? '⭐ Featured' : 'Feature'}
                        </button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => startEdit(embed)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEmbed(embed.id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Usage Tips */}
      {canEdit && Array.isArray(embeds) && embeds.length === 0 && (
        <div className="px-6 pb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips for great media content</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Add YouTube videos of live performances or venue tours</li>
              <li>• Share Spotify playlists or featured tracks</li>
              <li>• Include SoundCloud sets or original music</li>
              <li>• Feature your best content to make a great first impression</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 
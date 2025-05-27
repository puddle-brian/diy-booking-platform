'use client';

import React, { useState } from 'react';
import MediaEmbed from './MediaEmbed';

interface MediaEmbedFormProps {
  onSave: (embedData: { url: string; title: string; description?: string }) => void;
  onCancel: () => void;
  initialData?: {
    url: string;
    title: string;
    description?: string;
  };
}

export default function MediaEmbedForm({ onSave, onCancel, initialData }: MediaEmbedFormProps) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [showPreview, setShowPreview] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);

  const validateUrl = (inputUrl: string) => {
    const supportedPlatforms = [
      'youtube.com',
      'youtu.be',
      'spotify.com',
      'soundcloud.com',
      'bandcamp.com'
    ];
    
    const isValid = supportedPlatforms.some(platform => inputUrl.includes(platform));
    setIsValidUrl(isValid);
    return isValid;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    validateUrl(newUrl);
    
    // Auto-generate title from URL if empty
    if (!title && newUrl) {
      if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be')) {
        setTitle('Video');
      } else if (newUrl.includes('spotify.com')) {
        setTitle('Music');
      } else if (newUrl.includes('soundcloud.com')) {
        setTitle('Audio');
      } else if (newUrl.includes('bandcamp.com')) {
        setTitle('Release');
      } else {
        setTitle('Media');
      }
    }
  };

  const handlePreview = () => {
    if (isValidUrl) {
      setShowPreview(true);
    }
  };

  const handleSave = () => {
    if (isValidUrl) {
      // Use auto-generated title if none provided
      const finalTitle = title.trim() || 'Media';
      
      onSave({
        url: url.trim(),
        title: finalTitle,
        description: description.trim() || undefined
      });
    }
  };

  const getSupportedPlatforms = () => [
    { name: 'YouTube', icon: '📺', example: 'https://youtube.com/watch?v=...' },
    { name: 'Spotify', icon: '🎵', example: 'https://open.spotify.com/track/...' },
    { name: 'SoundCloud', icon: '🔊', example: 'https://soundcloud.com/artist/track' },
    { name: 'Bandcamp', icon: '🎶', example: 'https://artist.bandcamp.com/track/...' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {initialData ? 'Edit Media Embed' : 'Add Media Embed'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Media URL *
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="Paste your YouTube, Spotify, SoundCloud, or Bandcamp URL here"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              url && !isValidUrl 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {url && !isValidUrl && (
            <p className="mt-1 text-sm text-red-600">
              Please enter a valid URL from a supported platform
            </p>
          )}
        </div>

        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title (Optional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Auto-generated based on platform"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave blank to auto-generate based on the platform
          </p>
        </div>

        {/* Description Input */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description about this content..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Preview Section */}
        {isValidUrl && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Preview</h3>
              {!showPreview && (
                <button
                  type="button"
                  onClick={handlePreview}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Show Preview
                </button>
              )}
            </div>
            
            {showPreview && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <MediaEmbed url={url} title={title} />
                {description && (
                  <p className="mt-3 text-sm text-gray-600">{description}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Supported Platforms */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-3">Supported Platforms</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {getSupportedPlatforms().map((platform) => (
              <div key={platform.name} className="flex items-center space-x-2">
                <span className="text-lg">{platform.icon}</span>
                <div>
                  <div className="text-sm font-medium text-blue-900">{platform.name}</div>
                  <div className="text-xs text-blue-700">{platform.example}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValidUrl}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initialData ? 'Update Embed' : 'Add Embed'}
          </button>
        </div>
      </div>
    </div>
  );
} 
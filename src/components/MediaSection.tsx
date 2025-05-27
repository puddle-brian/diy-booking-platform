'use client';

import React, { useState, useEffect } from 'react';
import MediaEmbed from './MediaEmbed';

interface MediaEmbedData {
  id: string;
  url: string;
  title: string;
  description?: string;
  isFeatured?: boolean;
  order: number;
}

interface MediaSectionProps {
  entityId: string;
  entityType: 'venue' | 'artist';
  className?: string;
  compact?: boolean;
}

export default function MediaSection({ 
  entityId, 
  entityType, 
  className = '',
  compact = false
}: MediaSectionProps) {
  const [embeds, setEmbeds] = useState<MediaEmbedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'featured' | 'all'>('featured');

  useEffect(() => {
    loadEmbeds();
  }, [entityId, entityType]);

  const loadEmbeds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${entityType}s/${entityId}/embeds`);
      
      if (response.ok) {
        const embedsData = await response.json();
        const embedsArray = Array.isArray(embedsData) ? embedsData : [];
        setEmbeds(embedsArray.sort((a: MediaEmbedData, b: MediaEmbedData) => a.order - b.order));
      } else {
        setEmbeds([]);
      }
    } catch (error) {
      console.error('Failed to load embeds:', error);
      setEmbeds([]);
    } finally {
      setLoading(false);
    }
  };

  const featuredEmbeds = embeds.filter(embed => embed.isFeatured);
  const allEmbeds = embeds;

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className={`${compact ? 'h-32' : 'aspect-video'} bg-gray-200 rounded`}></div>
        </div>
      </div>
    );
  }

  // Don't show anything if no media content
  if (embeds.length === 0) {
    return null;
  }

  const displayEmbeds = activeTab === 'featured' ? featuredEmbeds : allEmbeds;

  // Compact mode - show only featured embed in a small format
  if (compact && !expanded) {
    const featuredEmbed = featuredEmbeds[0];
    if (!featuredEmbed) return null;

    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Featured Media
            </h3>
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              View All ({embeds.length})
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="max-w-sm">
            <MediaEmbed 
              url={featuredEmbed.url} 
              className="w-full"
              autoplay={false}
            />
            {featuredEmbed.description && (
              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                {featuredEmbed.description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Expanded mode or full mode
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Media
            </h2>
            {compact && expanded && (
              <button
                onClick={() => setExpanded(false)}
                className="ml-4 text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Collapse
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {embeds.length} {embeds.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        {/* Tabs - Only show if there are multiple items or featured content */}
        {(embeds.length > 1 || featuredEmbeds.length > 0) && (
          <nav className="flex space-x-6">
            {featuredEmbeds.length > 0 && (
              <button
                onClick={() => setActiveTab('featured')}
                className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'featured'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Featured
              </button>
            )}
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Media ({embeds.length})
            </button>
          </nav>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {displayEmbeds.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-3">🎵</div>
            <p>No {activeTab === 'featured' ? 'featured' : ''} media content yet</p>
          </div>
        ) : activeTab === 'featured' && featuredEmbeds.length === 1 ? (
          // Single featured embed - make it prominent
          <div className="space-y-4">
            <MediaEmbed 
              url={featuredEmbeds[0].url} 
              className="w-full"
              autoplay={true}
            />
            {featuredEmbeds[0].description && (
              <p className="text-gray-600 text-sm leading-relaxed">
                {featuredEmbeds[0].description}
              </p>
            )}
          </div>
        ) : (
          // Multiple embeds - grid layout
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayEmbeds.map((embed) => (
              <div key={embed.id} className="space-y-3">
                <div className="relative">
                  {embed.isFeatured && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⭐ Featured
                      </span>
                    </div>
                  )}
                  <MediaEmbed 
                    url={embed.url} 
                    className="w-full"
                    autoplay={embed.isFeatured}
                  />
                </div>
                
                {embed.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {embed.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
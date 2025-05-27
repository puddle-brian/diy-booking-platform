'use client';

import React, { useState, useEffect } from 'react';
import MediaEmbed from './MediaEmbed';

interface MediaEmbedData {
  id: string;
  url: string;
  title: string;
  description?: string;
  isFeatured?: boolean;
}

interface FeaturedMediaEmbedProps {
  entityId: string;
  entityType: 'venue' | 'artist';
  className?: string;
}

export default function FeaturedMediaEmbed({ 
  entityId, 
  entityType, 
  className = '' 
}: FeaturedMediaEmbedProps) {
  const [featuredEmbed, setFeaturedEmbed] = useState<MediaEmbedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedEmbed();
  }, [entityId, entityType]);

  const loadFeaturedEmbed = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${entityType}s/${entityId}/embeds?featured=true`);
      
      if (response.ok) {
        const embedData = await response.json();
        
        // The API returns a single object when featured=true, not an array
        if (embedData && embedData.url) {
          setFeaturedEmbed(embedData);
        } else {
          setFeaturedEmbed(null);
        }
      } else {
        setFeaturedEmbed(null);
      }
    } catch (error) {
      console.error('Failed to load featured embed:', error);
      setFeaturedEmbed(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="aspect-video bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!featuredEmbed) {
    return null; // Don't show anything if no featured content
  }

  return (
    <div className={`${className}`}>
      <MediaEmbed 
        url={featuredEmbed.url} 
        className="w-full"
        autoplay={true}
      />
    </div>
  );
} 
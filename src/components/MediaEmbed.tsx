'use client';

import React, { useState } from 'react';

interface MediaEmbedProps {
  url: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
}

interface EmbedConfig {
  type: 'youtube' | 'spotify' | 'soundcloud' | 'bandcamp' | 'unknown';
  embedUrl: string;
  aspectRatio: string;
}

export default function MediaEmbed({ url, title, className = '', autoplay = false }: MediaEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const getEmbedConfig = (url: string): EmbedConfig => {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('watch?v=')) {
        videoId = url.split('watch?v=')[1].split('&')[0];
      }
      
      const autoplayParam = autoplay ? '&autoplay=1&mute=1' : '';
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${autoplayParam}`,
        aspectRatio: '16/9'
      };
    }

    // Spotify
    if (url.includes('spotify.com')) {
      const spotifyId = url.split('/').pop()?.split('?')[0];
      const contentType = url.includes('/track/') ? 'track' : 
                         url.includes('/album/') ? 'album' :
                         url.includes('/playlist/') ? 'playlist' :
                         url.includes('/artist/') ? 'artist' : 'track';
      
      return {
        type: 'spotify',
        embedUrl: `https://open.spotify.com/embed/${contentType}/${spotifyId}?utm_source=generator&theme=0`,
        aspectRatio: contentType === 'track' ? '12/5' : '1/1'
      };
    }

    // SoundCloud
    if (url.includes('soundcloud.com')) {
      return {
        type: 'soundcloud',
        embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`,
        aspectRatio: '16/9'
      };
    }

    // Bandcamp
    if (url.includes('bandcamp.com')) {
      const trackId = url.split('/track/')[1]?.split('/')[0] || url.split('/album/')[1]?.split('/')[0];
      const isAlbum = url.includes('/album/');
      
      return {
        type: 'bandcamp',
        embedUrl: `https://bandcamp.com/EmbeddedPlayer/${isAlbum ? 'album' : 'track'}=${trackId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/`,
        aspectRatio: '12/5'
      };
    }

    return {
      type: 'unknown',
      embedUrl: '',
      aspectRatio: '16/9'
    };
  };

  const config = getEmbedConfig(url);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (config.type === 'unknown') {
    return (
      <div className={`bg-gray-100 rounded-lg p-6 text-center ${className}`}>
        <div className="text-gray-500 mb-2">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">
          Unsupported media URL. Please use YouTube, Spotify, SoundCloud, or Bandcamp links.
        </p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
        <div className="text-red-500 mb-2">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-red-600">
          Failed to load media content. Please check the URL and try again.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className="bg-white px-4 py-2 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
        </div>
      )}
      
      <div 
        className="relative w-full"
        style={{ aspectRatio: config.aspectRatio }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        <iframe
          src={config.embedUrl}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          title={title || 'Embedded media content'}
        />
      </div>
      
      {/* Platform indicator */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {config.type.charAt(0).toUpperCase() + config.type.slice(1)}
      </div>
    </div>
  );
} 
'use client';

import Link from 'next/link';
import { VENUE_TYPE_LABELS, ARTIST_TYPE_LABELS } from '../../types/index';

interface CommunitySectionProps<T> {
  title: string;
  description: string;
  emoji: string;
  items: T[];
  entityType: 'venues' | 'artists';
  showAll?: boolean;
}

export default function CommunitySection<T extends { 
  id: string; 
  name: string; 
  city: string; 
  state: string; 
  rating?: number;
  distance?: number;
  distanceText?: string;
}>({ 
  title, 
  description, 
  emoji, 
  items, 
  entityType,
  showAll = false 
}: CommunitySectionProps<T>) {
  
  if (items.length === 0) return null;
  
  // Limit items for display (show more if showAll is true)
  const displayItems = showAll ? items : items.slice(0, 8);
  const hasMore = items.length > 8 && !showAll;
  
  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="mr-3">{emoji}</span>
            {title}
          </h2>
          <p className="text-gray-600 mt-1">{description}</p>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} {entityType === 'venues' ? 'space' : 'artist'}{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {hasMore && (
          <button className="text-sm text-gray-600 hover:text-black font-medium">
            Show all {items.length} →
          </button>
        )}
      </div>
      
      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {displayItems.map((item) => (
          <Link 
            key={item.id} 
            href={`/${entityType}/${item.id}`}
            className="group"
          >
            <div className="bg-white rounded-xl overflow-hidden cursor-pointer border border-gray-100">
              <div className="aspect-square relative">
                <img 
                  src={(() => {
                    if (entityType === 'venues') {
                      const venue = item as any;
                      if (venue.images && venue.images.length > 0) {
                        const image = venue.images[0];
                        if (image.includes('/uploads/')) {
                          return image.replace('/uploads/', '/uploads/thumbnails/').replace('.webp', '-thumb.webp');
                        }
                        return image;
                      }
                      return `/api/placeholder/${venue.venueType || 'other'}`;
                    } else {
                      const artist = item as any;
                      if (artist.images && artist.images.length > 0) {
                        const image = artist.images[0];
                        if (image.includes('placeholder')) return image;
                        if (image.includes('/uploads/')) {
                          return image.replace('/uploads/', '/uploads/thumbnails/').replace('.webp', '-thumb.webp');
                        }
                        return image;
                      }
                      return `/api/placeholder/${artist.artistType || 'band'}`;
                    }
                  })()}
                  alt={item.name}
                  className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-75"
                  onError={(e) => {
                    if (entityType === 'venues') {
                      const venue = item as any;
                      e.currentTarget.src = `/api/placeholder/${venue.venueType || 'other'}`;
                    } else {
                      const artist = item as any;
                      e.currentTarget.src = `/api/placeholder/${artist.artistType || 'band'}`;
                    }
                  }}
                />
                
                {/* Distance badge */}
                {item.distanceText && (
                  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                    📍 {item.distanceText}
                  </div>
                )}
                
                {/* Heart icon */}
                <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">{item.name}</h3>
                
                <p className="text-xs text-gray-500 mb-2">
                  {item.city}, {item.state} <span className="text-gray-300">•</span> {((item as any).totalRatings || 0) === 0 ? (
                    <span className="text-gray-400">★ N/A</span>
                  ) : (
                    <span className="text-gray-700">★ {((item as any).rating || 0).toFixed(1)}</span>
                  )}
                </p>
                
                {entityType === 'venues' ? (
                  <div className="text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span className="capitalize">{VENUE_TYPE_LABELS[(item as any).venueType as keyof typeof VENUE_TYPE_LABELS] || 'Space'}</span>
                      <span>{(item as any).capacity >= 1000 ? `${((item as any).capacity / 1000).toFixed((item as any).capacity % 1000 === 0 ? 0 : 1)}k` : (item as any).capacity} cap</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span className="capitalize">{ARTIST_TYPE_LABELS[(item as any).artistType as keyof typeof ARTIST_TYPE_LABELS] || 'Artist'}</span>
                      <span className="capitalize">{(item as any).tourStatus || 'active'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 
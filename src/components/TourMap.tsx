'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the map to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('./TourMapClient'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

export interface TourDate {
  id: string;
  date: string;
  venueName: string;
  city: string;
  state: string;
  status: string;
  latitude: number;
  longitude: number;
}

interface TourMapProps {
  artistId: string;
  artistName?: string;
  className?: string;
}

export default function TourMap({ artistId, artistName, className }: TourMapProps) {
  const [dates, setDates] = useState<TourDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/artists/${artistId}/tour-map`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tour dates');
        }
        
        const data = await response.json();
        setDates(data.dates || []);
      } catch (err) {
        console.error('Error fetching tour map data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      fetchDates();
    }
  }, [artistId]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>🗺️</span>
            Tour Map
          </h3>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading tour dates...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>🗺️</span>
            Tour Map
          </h3>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Unable to load map</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>🗺️</span>
            Tour Map
          </h3>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <span className="text-4xl mb-2 block">📍</span>
            <p>No mappable tour dates yet</p>
            <p className="text-sm mt-1">Book some shows to see your tour route!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>🗺️</span>
            Tour Map
            {artistName && <span className="text-gray-500 font-normal">— {artistName}</span>}
          </h3>
          <span className="text-sm text-gray-500">{dates.length} date{dates.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <MapComponent dates={dates} />
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the map to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('./TourMapClient'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-bg-secondary border border-border-primary flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-6 w-6 border border-text-primary border-t-transparent mx-auto mb-2"></div>
        <p className="text-text-secondary text-sm font-mono">Loading map...</p>
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
  highlightedDateId?: string | null;
  onDateHover?: (dateId: string | null) => void;
}

export default function TourMap({ artistId, artistName, className, highlightedDateId, onDateHover }: TourMapProps) {
  const [dates, setDates] = useState<TourDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/artists/${artistId}/tour-map`);
        
        const data = await response.json();
        
        // Handle both error responses and empty data gracefully
        if (data.error && !data.dates) {
          throw new Error(data.error);
        }
        
        setDates(data.dates || []);
      } catch (err) {
        console.error('Error fetching tour map data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setDates([]); // Set empty dates so component shows empty state instead of error
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
      <div className={`bg-bg-secondary border border-border-primary overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-border-primary bg-bg-tertiary">
          <h3 className="font-mono text-text-primary flex items-center gap-2">
            <span className="text-text-muted">&gt;&gt;</span>
            TOUR_MAP
          </h3>
        </div>
        <div className="h-[400px] flex items-center justify-center bg-bg-primary">
          <div className="text-center">
            <div className="animate-spin h-6 w-6 border border-text-primary border-t-transparent mx-auto mb-2"></div>
            <p className="text-text-secondary text-sm font-mono">Loading tour dates...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-bg-secondary border border-border-primary overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-border-primary bg-bg-tertiary">
          <h3 className="font-mono text-text-primary flex items-center gap-2">
            <span className="text-text-muted">&gt;&gt;</span>
            TOUR_MAP
          </h3>
        </div>
        <div className="h-[400px] flex items-center justify-center bg-bg-primary">
          <div className="text-center">
            <p className="text-text-secondary font-mono">// Unable to load map</p>
            <p className="text-sm text-text-muted font-mono mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className={`bg-bg-secondary border border-border-primary overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-border-primary bg-bg-tertiary">
          <h3 className="font-mono text-text-primary flex items-center gap-2">
            <span className="text-text-muted">&gt;&gt;</span>
            TOUR_MAP
          </h3>
        </div>
        <div className="h-[300px] flex items-center justify-center bg-bg-primary">
          <div className="text-center">
            <span className="text-4xl mb-2 block text-text-muted">📍</span>
            <p className="text-text-secondary font-mono">// NO_MAPPABLE_DATES</p>
            <p className="text-sm mt-1 text-text-muted font-mono">Book shows to see your tour route</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-secondary border border-border-primary overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-border-primary bg-bg-tertiary">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-text-primary flex items-center gap-2">
            <span className="text-text-muted">&gt;&gt;</span>
            TOUR_MAP
            {artistName && <span className="text-text-secondary font-normal">— {artistName}</span>}
          </h3>
          <span className="text-sm text-text-secondary font-mono">[{dates.length}] date{dates.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <MapComponent 
        dates={dates} 
        highlightedDateId={highlightedDateId}
        onDateHover={onDateHover}
      />
    </div>
  );
}


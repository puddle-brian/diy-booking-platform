'use client';

import React from 'react';
import { useLocation } from '../hooks/useLocation';

interface LocationSortingProps {
  onLocationChange?: (location: any) => void;
  compact?: boolean;
}

export default function LocationSorting({ onLocationChange, compact = false }: LocationSortingProps) {
  const { location, loading, error, requestLocation, clearLocation, hasRequestedLocation } = useLocation();

  // Notify parent component when location changes
  React.useEffect(() => {
    if (onLocationChange) {
      onLocationChange(location);
    }
  }, [location, onLocationChange]);

  if (compact && !location && !hasRequestedLocation) {
    return (
      <button
        onClick={requestLocation}
        disabled={loading}
        className="flex items-center text-sm text-gray-600 hover:text-black transition-colors"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2"></div>
            Getting location...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Show local first
          </>
        )}
      </button>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <h3 className="font-medium text-gray-900">Location-Based Sorting</h3>
            {!compact && (
              <p className="text-sm text-gray-600">Show local venues and artists first</p>
            )}
          </div>
        </div>

        {location ? (
          <button
            onClick={clearLocation}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          >
            ✓ Enabled
          </button>
        ) : (
          <button
            onClick={requestLocation}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Getting...' : 'Enable'}
          </button>
        )}
      </div>

      {/* Location Status */}
      {location && (
        <div className="mt-3 p-2 bg-green-50 rounded-lg">
          <div className="flex items-center text-sm text-green-700">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Sorting by distance from {location.city ? `${location.city}, ${location.state}` : 'your location'}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
          <div className="flex items-center text-sm text-yellow-700">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
          <button
            onClick={requestLocation}
            className="mt-2 text-xs text-yellow-800 hover:text-yellow-900 underline"
          >
            Try again
          </button>
        </div>
      )}

      {!location && !error && hasRequestedLocation && !loading && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Location access was denied. Enable location access in your browser to sort by distance.
          </p>
        </div>
      )}
    </div>
  );
} 
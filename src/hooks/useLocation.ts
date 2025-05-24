'use client';

import { useState, useEffect } from 'react';
import { getUserLocation, UserLocation, LocationResult } from '../../lib/location';

export interface UseLocationResult {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
  clearLocation: () => void;
  hasRequestedLocation: boolean;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);

  // Check for cached location on mount
  useEffect(() => {
    const checkCachedLocation = async () => {
      try {
        const cached = localStorage.getItem('userLocation');
        if (cached) {
          const cachedLocation: UserLocation = JSON.parse(cached);
          const oneHour = 60 * 60 * 1000;
          
          if (Date.now() - cachedLocation.timestamp < oneHour) {
            setLocation(cachedLocation);
            setHasRequestedLocation(true);
            return;
          }
          
          // Cache expired, remove it
          localStorage.removeItem('userLocation');
        }
      } catch (error) {
        console.warn('Failed to load cached location:', error);
      }
    };

    checkCachedLocation();
  }, []);

  const requestLocation = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    setHasRequestedLocation(true);

    try {
      const result: LocationResult = await getUserLocation();
      
      if (result.location) {
        setLocation(result.location);
        setError(null);
      } else {
        setError(result.error || 'Failed to get location');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setError(null);
    setHasRequestedLocation(false);
    
    try {
      localStorage.removeItem('userLocation');
    } catch (error) {
      console.warn('Failed to clear cached location:', error);
    }
  };

  return {
    location,
    loading,
    error,
    requestLocation,
    clearLocation,
    hasRequestedLocation
  };
} 
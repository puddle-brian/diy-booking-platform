// Location utilities for distance-based sorting
export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  timestamp: number;
}

export interface LocationResult {
  location: UserLocation | null;
  error?: string;
}

// Haversine formula to calculate distance between two points
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles (use 6371 for kilometers)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(deg: number): number {
  return deg * (Math.PI/180);
}

// Get user's current location using browser geolocation
export function getUserLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      resolve({
        location: null,
        error: 'Geolocation is not supported by this browser'
      });
      return;
    }

    // Check for cached location (valid for 1 hour)
    const cached = getCachedLocation();
    if (cached) {
      resolve({ location: cached });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        };

        // Try to get city/state from reverse geocoding
        try {
          const cityInfo = await reverseGeocode(location.latitude, location.longitude);
          location.city = cityInfo.city;
          location.state = cityInfo.state;
          location.country = cityInfo.country;
        } catch (error) {
          console.warn('Reverse geocoding failed:', error);
        }

        // Cache the location
        cacheLocation(location);
        
        resolve({ location });
      },
      (error) => {
        let errorMessage = 'Location access denied';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        resolve({
          location: null,
          error: errorMessage
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    );
  });
}

// Cache location in localStorage
function cacheLocation(location: UserLocation): void {
  try {
    localStorage.setItem('userLocation', JSON.stringify(location));
  } catch (error) {
    console.warn('Failed to cache location:', error);
  }
}

// Get cached location if it's still valid (1 hour)
function getCachedLocation(): UserLocation | null {
  try {
    const cached = localStorage.getItem('userLocation');
    if (!cached) return null;
    
    const location: UserLocation = JSON.parse(cached);
    const oneHour = 60 * 60 * 1000;
    
    if (Date.now() - location.timestamp < oneHour) {
      return location;
    }
    
    // Cache expired, remove it
    localStorage.removeItem('userLocation');
    return null;
  } catch (error) {
    console.warn('Failed to load cached location:', error);
    return null;
  }
}

// Simple reverse geocoding using a free service
async function reverseGeocode(lat: number, lon: number): Promise<{
  city?: string;
  state?: string;
  country?: string;
}> {
  try {
    // Using Nominatim (OpenStreetMap's free geocoding service)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    const address = data.address || {};
    
    return {
      city: address.city || address.town || address.village,
      state: address.state,
      country: address.country
    };
  } catch (error) {
    console.warn('Reverse geocoding error:', error);
    return {};
  }
}

// Approximate coordinates for major cities (for fallback/estimation)
export const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  // Major US cities
  'new york,ny': { lat: 40.7128, lon: -74.0060 },
  'brooklyn,ny': { lat: 40.6782, lon: -73.9442 },
  'los angeles,ca': { lat: 34.0522, lon: -118.2437 },
  'chicago,il': { lat: 41.8781, lon: -87.6298 },
  'seattle,wa': { lat: 47.6062, lon: -122.3321 },
  'portland,or': { lat: 45.5152, lon: -122.6784 },
  'richmond,va': { lat: 37.5407, lon: -77.4360 },
  'philadelphia,pa': { lat: 39.9526, lon: -75.1652 },
  'boston,ma': { lat: 42.3601, lon: -71.0589 },
  'san francisco,ca': { lat: 37.7749, lon: -122.4194 },
  'austin,tx': { lat: 30.2672, lon: -97.7431 },
  'denver,co': { lat: 39.7392, lon: -104.9903 },
  'atlanta,ga': { lat: 33.7490, lon: -84.3880 },
  'miami,fl': { lat: 25.7617, lon: -80.1918 },
  'nashville,tn': { lat: 36.1627, lon: -86.7816 },
  'baltimore,md': { lat: 39.2904, lon: -76.6122 },
  'washington,dc': { lat: 38.9072, lon: -77.0369 },
  'cleveland,oh': { lat: 41.4993, lon: -81.6944 },
  
  // International cities
  'toronto,on': { lat: 43.6532, lon: -79.3832 },
  'montreal,qc': { lat: 45.5017, lon: -73.5673 },
  'vancouver,bc': { lat: 49.2827, lon: -123.1207 },
};

// Get coordinates for a city/state combination
export function getCityCoordinates(city: string, state: string): { lat: number; lon: number } | null {
  const key = `${city.toLowerCase()},${state.toLowerCase()}`;
  return CITY_COORDINATES[key] || null;
}

// Add distance information to venues/artists
export function addDistanceInfo<T extends { city: string; state: string }>(
  items: T[],
  userLocation: UserLocation | null
): (T & { distance?: number; distanceText?: string })[] {
  if (!userLocation) {
    return items.map(item => ({ ...item }));
  }

  return items.map(item => {
    const itemCoords = getCityCoordinates(item.city, item.state);
    
    if (itemCoords) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        itemCoords.lat,
        itemCoords.lon
      );
      
      return {
        ...item,
        distance,
        distanceText: distance < 1 
          ? 'Local' 
          : distance < 50 
            ? `${distance} mi` 
            : `${Math.round(distance)} mi`
      };
    }
    
    return { ...item };
  });
}

// Sort items by distance (closest first)
export function sortByDistance<T extends { distance?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // Items with distance come first
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    
    // Items with distance come before items without
    if (a.distance !== undefined && b.distance === undefined) {
      return -1;
    }
    
    if (a.distance === undefined && b.distance !== undefined) {
      return 1;
    }
    
    // Both items have no distance, maintain original order
    return 0;
  });
} 
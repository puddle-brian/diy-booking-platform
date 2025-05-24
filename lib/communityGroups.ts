import { UserLocation, addDistanceInfo, getUserLocation } from './location';

export interface CommunitySection<T> {
  title: string;
  description: string;
  items: T[];
  emoji: string;
}

export interface CommunityGroups<T> {
  local: CommunitySection<T>;
  regional: CommunitySection<T>;
  touring: CommunitySection<T>;
  userLocation: UserLocation | null;
}

// Automatically get user location and group items
export async function createCommunityGroups<T extends { city: string; state: string }>(
  items: T[],
  entityType: 'venues' | 'artists'
): Promise<CommunityGroups<T & { distance?: number; distanceText?: string }>> {
  
  // Try to get user location silently
  let userLocation: UserLocation | null = null;
  
  try {
    const locationResult = await getUserLocation();
    userLocation = locationResult.location;
  } catch (error) {
    console.warn('Could not get user location for community grouping:', error);
  }

  // Add distance information
  const itemsWithDistance = addDistanceInfo(items, userLocation);
  
  // Sort by distance if we have location
  const sortedItems = userLocation 
    ? [...itemsWithDistance].sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return 0;
      })
    : itemsWithDistance;

  // Group into community sections
  const local: (T & { distance?: number; distanceText?: string })[] = [];
  const regional: (T & { distance?: number; distanceText?: string })[] = [];
  const touring: (T & { distance?: number; distanceText?: string })[] = [];

  for (const item of sortedItems) {
    if (!item.distance) {
      // No distance data, put in touring
      touring.push(item);
    } else if (item.distance <= 25) {
      local.push(item);
    } else if (item.distance <= 150) {
      regional.push(item);
    } else {
      touring.push(item);
    }
  }

  // Create section titles based on user location
  const locationName = userLocation?.city 
    ? `${userLocation.city}, ${userLocation.state}` 
    : 'Your Area';
    
  const entityLabel = entityType === 'venues' ? 'Spaces' : 'Artists';
  const entityEmoji = entityType === 'venues' ? '🏠' : '🎵';

  return {
    local: {
      title: `Local ${entityLabel}`,
      description: userLocation?.city 
        ? `${entityLabel} in and around ${locationName}` 
        : `${entityLabel} in your area`,
      items: local,
      emoji: entityEmoji
    },
    regional: {
      title: `Regional ${entityLabel}`,
      description: userLocation?.city 
        ? `${entityLabel} within 150 miles of ${locationName}`
        : `${entityLabel} in your region`,
      items: regional,
      emoji: '🗺️'
    },
    touring: {
      title: `Touring Circuit`,
      description: `${entityLabel} from everywhere else`,
      items: touring,
      emoji: '🌍'
    },
    userLocation
  };
}

// Utility to get a nice location description
export function getLocationDescription(userLocation: UserLocation | null): string {
  if (!userLocation) return '';
  
  if (userLocation.city && userLocation.state) {
    return `${userLocation.city}, ${userLocation.state}`;
  }
  
  if (userLocation.state) {
    return userLocation.state;
  }
  
  return 'Your Location';
} 
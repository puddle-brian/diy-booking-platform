import fs from 'fs';
import path from 'path';
import { ArtistMembership, VenueMembership, ArtistPermission, VenuePermission } from '../../types/index';

const ARTIST_MEMBERSHIPS_FILE = path.join(process.cwd(), 'data', 'artist-memberships.json');
const VENUE_MEMBERSHIPS_FILE = path.join(process.cwd(), 'data', 'venue-memberships.json');

// Load memberships
const loadArtistMemberships = (): ArtistMembership[] => {
  try {
    if (!fs.existsSync(ARTIST_MEMBERSHIPS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ARTIST_MEMBERSHIPS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const loadVenueMemberships = (): VenueMembership[] => {
  try {
    if (!fs.existsSync(VENUE_MEMBERSHIPS_FILE)) return [];
    return JSON.parse(fs.readFileSync(VENUE_MEMBERSHIPS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

// Check if user has specific permission for an artist
export function hasArtistPermission(
  userId: string, 
  artistId: string, 
  permission: ArtistPermission
): boolean {
  const memberships = loadArtistMemberships();
  const membership = memberships.find(
    m => m.userId === userId && 
         m.artistId === artistId && 
         m.status === 'active'
  );
  
  if (!membership) return false;
  return membership.permissions.includes(permission);
}

// Check if user has specific permission for a venue
export function hasVenuePermission(
  userId: string, 
  venueId: string, 
  permission: VenuePermission
): boolean {
  const memberships = loadVenueMemberships();
  const membership = memberships.find(
    m => m.userId === userId && 
         m.venueId === venueId && 
         m.status === 'active'
  );
  
  if (!membership) return false;
  return membership.permissions.includes(permission);
}

// Get user's role for an artist
export function getUserArtistRole(userId: string, artistId: string): string | null {
  const memberships = loadArtistMemberships();
  const membership = memberships.find(
    m => m.userId === userId && 
         m.artistId === artistId && 
         m.status === 'active'
  );
  
  return membership?.role || null;
}

// Get user's role for a venue  
export function getUserVenueRole(userId: string, venueId: string): string | null {
  const memberships = loadVenueMemberships();
  const membership = memberships.find(
    m => m.userId === userId && 
         m.venueId === venueId && 
         m.status === 'active'
  );
  
  return membership?.role || null;
}

// Get all artists that a user has access to
export function getUserArtists(userId: string): ArtistMembership[] {
  const memberships = loadArtistMemberships();
  return memberships.filter(m => m.userId === userId && m.status === 'active');
}

// Get all venues that a user has access to
export function getUserVenues(userId: string): VenueMembership[] {
  const memberships = loadVenueMemberships();
  return memberships.filter(m => m.userId === userId && m.status === 'active');
}

// Check if user can manage booking for artist/venue
export function canManageBookings(userId: string, entityType: 'artist' | 'venue', entityId: string): boolean {
  if (entityType === 'artist') {
    return hasArtistPermission(userId, entityId, 'manage_bookings');
  } else {
    return hasVenuePermission(userId, entityId, 'manage_bookings');
  }
}

// Check if user can edit profile for artist/venue
export function canEditProfile(userId: string, entityType: 'artist' | 'venue', entityId: string): boolean {
  if (entityType === 'artist') {
    return hasArtistPermission(userId, entityId, 'edit_profile');
  } else {
    return hasVenuePermission(userId, entityId, 'edit_profile');
  }
}

// Utility to check if user is admin (for platform administration)
export function isAdmin(userRole: string): boolean {
  return userRole === 'admin';
}

// Create initial membership when someone claims an artist/venue
export function createOwnerMembership(
  userId: string, 
  entityType: 'artist' | 'venue', 
  entityId: string
): void {
  const timestamp = new Date().toISOString();
  
  if (entityType === 'artist') {
    const memberships = loadArtistMemberships();
    const newMembership: ArtistMembership = {
      id: Date.now().toString(),
      userId,
      artistId: entityId,
      role: 'owner',
      permissions: ['edit_profile', 'manage_bookings', 'invite_members', 'manage_members', 'view_analytics', 'delete_artist'],
      joinedAt: timestamp,
      invitedBy: userId, // Self-created through claiming
      status: 'active'
    };
    
    memberships.push(newMembership);
    fs.writeFileSync(ARTIST_MEMBERSHIPS_FILE, JSON.stringify(memberships, null, 2));
  } else {
    const memberships = loadVenueMemberships();
    const newMembership: VenueMembership = {
      id: Date.now().toString(),
      userId,
      venueId: entityId,
      role: 'owner',
      permissions: ['edit_profile', 'manage_bookings', 'invite_staff', 'manage_staff', 'view_analytics', 'delete_venue'],
      joinedAt: timestamp,
      invitedBy: userId,
      status: 'active'
    };
    
    memberships.push(newMembership);
    fs.writeFileSync(VENUE_MEMBERSHIPS_FILE, JSON.stringify(memberships, null, 2));
  }
} 
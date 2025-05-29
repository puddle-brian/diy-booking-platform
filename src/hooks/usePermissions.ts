'use client';

import { useAuth } from '../contexts/AuthContext';
import { ArtistPermission, VenuePermission } from '../../types/index';

export interface UserPermissions {
  // Artist permissions
  canEditArtistProfile: (artistId: string) => boolean;
  canManageArtistBookings: (artistId: string) => boolean;
  canInviteArtistMembers: (artistId: string) => boolean;
  canManageArtistMembers: (artistId: string) => boolean;
  canViewArtistAnalytics: (artistId: string) => boolean;
  canDeleteArtist: (artistId: string) => boolean;
  
  // Venue permissions
  canEditVenueProfile: (venueId: string) => boolean;
  canManageVenueBookings: (venueId: string) => boolean;
  canInviteVenueStaff: (venueId: string) => boolean;
  canManageVenueStaff: (venueId: string) => boolean;
  canViewVenueAnalytics: (venueId: string) => boolean;
  canDeleteVenue: (venueId: string) => boolean;
  
  // General permissions
  isAdmin: boolean;
  isArtistMember: (artistId: string) => boolean;
  isVenueMember: (venueId: string) => boolean;
  hasAnyPermission: (entityType: 'artist' | 'venue', entityId: string) => boolean;
  
  // New helper functions
  getUserRole: (entityType: 'artist' | 'venue', entityId: string) => string | null;
  hasOwnerRole: (entityType: 'artist' | 'venue', entityId: string) => boolean;
}

export function usePermissions(): UserPermissions {
  const { user } = useAuth();

  // Helper function to check if user is admin
  const isAdmin = user?.role === 'admin';

  // Helper function to check if user is associated with an artist
  const isArtistMember = (artistId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    
    // Check if user has any membership with this artist
    return user.memberships?.some(membership => 
      membership.entityType === 'artist' && membership.entityId === artistId
    ) || false;
  };

  // Helper function to check if user is associated with a venue
  const isVenueMember = (venueId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    
    // Check if user has any membership with this venue
    return user.memberships?.some(membership => 
      membership.entityType === 'venue' && membership.entityId === venueId
    ) || false;
  };

  // Helper function to get user's role for a specific entity
  const getUserRole = (entityType: 'artist' | 'venue', entityId: string): string | null => {
    if (!user?.memberships) return null;
    
    const membership = user.memberships.find(m => 
      m.entityType === entityType && m.entityId === entityId
    );
    
    return membership?.role || null;
  };

  // Helper function to check if user has owner/admin role for an entity
  const hasOwnerRole = (entityType: 'artist' | 'venue', entityId: string): boolean => {
    const role = getUserRole(entityType, entityId);
    return role === 'owner' || role === 'admin';
  };

  // Artist permission checks
  const canEditArtistProfile = (artistId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return isArtistMember(artistId);
  };

  const canManageArtistBookings = (artistId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return isArtistMember(artistId);
  };

  const canInviteArtistMembers = (artistId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return isArtistMember(artistId);
  };

  const canManageArtistMembers = (artistId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return isArtistMember(artistId);
  };

  const canViewArtistAnalytics = (artistId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return isArtistMember(artistId);
  };

  const canDeleteArtist = (artistId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    // Only owners should be able to delete
    return hasOwnerRole('artist', artistId);
  };

  // Venue permission checks
  const canEditVenueProfile = (venueId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return isVenueMember(venueId);
  };

  const canManageVenueBookings = (venueId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return isVenueMember(venueId);
  };

  const canInviteVenueStaff = (venueId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return isVenueMember(venueId);
  };

  const canManageVenueStaff = (venueId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return isVenueMember(venueId);
  };

  const canViewVenueAnalytics = (venueId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return isVenueMember(venueId);
  };

  const canDeleteVenue = (venueId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    // Only owners should be able to delete
    return hasOwnerRole('venue', venueId);
  };

  // General permission checks
  const hasAnyPermission = (entityType: 'artist' | 'venue', entityId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    
    if (entityType === 'artist') {
      return isArtistMember(entityId);
    } else {
      return isVenueMember(entityId);
    }
  };

  return {
    // Artist permissions
    canEditArtistProfile,
    canManageArtistBookings,
    canInviteArtistMembers,
    canManageArtistMembers,
    canViewArtistAnalytics,
    canDeleteArtist,
    
    // Venue permissions
    canEditVenueProfile,
    canManageVenueBookings,
    canInviteVenueStaff,
    canManageVenueStaff,
    canViewVenueAnalytics,
    canDeleteVenue,
    
    // General permissions
    isAdmin,
    isArtistMember,
    isVenueMember,
    hasAnyPermission,
    
    // New helper functions
    getUserRole,
    hasOwnerRole,
  };
} 
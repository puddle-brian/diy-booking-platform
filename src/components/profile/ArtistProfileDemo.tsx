import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileLayout from './ProfileLayout';
import { ProfileContext, Artist } from './ProfileModules';

interface ArtistProfileDemoProps {
  artist: any; // Your existing artist data structure
  members?: any[];
}

export const ArtistProfileDemo: React.FC<ArtistProfileDemoProps> = ({ 
  artist, 
  members = [] 
}) => {
  const { user } = useAuth();

  // Transform your existing artist data to match the modular system
  const transformedArtist: Artist = {
    id: artist.id,
    name: artist.name,
    city: artist.city,
    state: artist.state,
    country: artist.country,
    images: artist.images || [],
    description: artist.description || '',
    rating: artist.rating,
    contact: {
      email: artist.contact?.email || '',
      phone: artist.contact?.phone,
      website: artist.contact?.website,
      social: artist.contact?.social
    },
    artistType: artist.artistType,
    genres: artist.genres || [],
    tourStatus: artist.tourStatus || 'active',
    yearFormed: artist.yearFormed,
    members: artist.members,
    expectedDraw: artist.expectedDraw,
    equipment: {
      needsPA: artist.equipment?.needsPA || false,
      needsMics: artist.equipment?.needsMics || false,
      needsDrums: artist.equipment?.needsDrums || false,
      needsAmps: artist.equipment?.needsAmps || false,
      acoustic: artist.equipment?.acoustic || false
    }
  };

  // Determine user context and permissions
  const context: ProfileContext = {
    viewerType: (() => {
      if (!user) return 'public';
      if (user.role === 'admin') return 'admin';
      // Check if user is a member of this artist
      const isMember = members.some(member => member.id === user.id);
      return isMember ? 'artist' : 'public';
    })(),
    entityType: 'artist',
    isOwner: (() => {
      if (!user) return false;
      return members.some(member => member.id === user.id);
    })(),
    canEdit: (() => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      // Check if user has edit permissions
      const userMembership = members.find(member => member.id === user.id);
      return userMembership && (
        userMembership.role === 'Owner' || 
        userMembership.role === 'Member' || 
        userMembership.role === 'Admin'
      );
    })()
  };

  return (
    <ProfileLayout
      entity={transformedArtist}
      context={context}
      members={members}
    >
      {/* You can add any custom content here that's specific to this artist */}
      {/* For example, special announcements, featured content, etc. */}
    </ProfileLayout>
  );
};

export default ArtistProfileDemo; 
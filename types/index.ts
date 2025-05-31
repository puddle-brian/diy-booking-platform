// Venue Types
export type VenueType = 
  | 'house-show'
  | 'community-space' 
  | 'record-store'
  | 'vfw-hall'
  | 'arts-center'
  | 'warehouse'
  | 'bar'
  | 'club'
  | 'theater'
  | 'coffee-shop'
  | 'bookstore'
  | 'gallery'
  | 'library'
  | 'park'
  | 'basement'
  | 'loft'
  | 'church'
  | 'brewery'
  | 'rooftop'
  | 'restaurant'
  | 'other';

// Artist Types
export type ArtistType = 
  | 'band'
  | 'solo'
  | 'duo'
  | 'collective'
  | 'dj'
  | 'comedian'
  | 'poet'
  | 'lecturer'
  | 'dancer'
  | 'theater-group'
  | 'storyteller'
  | 'variety'
  | 'rapper'
  | 'singer-songwriter'
  | 'experimental'
  | 'visual-artist';

// Common Types
export type AgeRestriction = 'all-ages' | '18+' | '21+';
export type TourStatus = 'active' | 'hiatus' | 'selective' | 'local-only';
export type TourRadius = 'local' | 'regional' | 'national' | 'international';

// Availability Types
export interface AvailabilityWindow {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  notes?: string;    // "Spring tour", "Weekend only", etc.
}

export interface BookedDate {
  date: string;      // ISO date string
  artistName?: string; // If venue is booked
  venueName?: string;  // If artist is booked
  confirmed: boolean;
  notes?: string;
}

// Full Interface Definitions
export interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  streetAddress?: string;    // Street address (e.g., "2528 Nicollet Ave")
  addressLine2?: string;     // Apartment, suite, etc. (optional)
  postalCode?: string;       // ZIP/postal code
  neighborhood?: string;     // Neighborhood or district (e.g., "Eat Street", "Five Points")
  venueType: VenueType;
  genres: string[];
  capacity: number;
  ageRestriction: AgeRestriction;
  equipment: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  features: string[];
  pricing: {
    guarantee: number;
    door: boolean;
    merchandise: boolean;
  };
  contact: {
    email: string;
    phone: string;
    social: string;
    website: string;
  };
  images: string[];
  description: string;
  rating: number;
  reviewCount: number;
  totalRatings: number;
  verified: boolean;
  lastUpdated: string;
  // New availability fields
  availability: AvailabilityWindow[];
  bookedDates: BookedDate[];
  blackoutDates: string[]; // ISO date strings for dates they never book
  preferredDays: string[]; // 'monday', 'tuesday', etc.
  showsThisYear: number;
  hasAccount: boolean;
  unavailableDates: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Artist {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  artistType: ArtistType;
  genres: string[];
  members: number;
  yearFormed: number;
  tourStatus: TourStatus;
  equipment: {
    needsPA: boolean;
    needsMics: boolean;
    needsDrums: boolean;
    needsAmps: boolean;
    acoustic: boolean;
  };
  contact: {
    email: string;
    phone: string;
    social: string;
    website: string;
    booking: string;
  };
  images: string[];
  description: string;
  expectedDraw: string;
  rating: number;
  reviewCount: number;
  totalRatings: number;
  verified: boolean;
  claimed: boolean;
  lastUpdated: string;
  // New availability fields
  tourDates: AvailabilityWindow[];
  bookedDates: BookedDate[];
  homeBase: boolean; // true if they prefer local/regional shows
  showsThisYear: number;
  tourRadius: TourRadius;
  hasAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtistClaim {
  id: string;
  artistId: string;
  artistName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

// Type mappings for display purposes
export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  'house-show': 'House Show',
  'community-space': 'Community Space',
  'record-store': 'Record Store',
  'vfw-hall': 'VFW Hall',
  'arts-center': 'Arts Center',
  'warehouse': 'Warehouse',
  'bar': 'Bar',
  'club': 'Club',
  'theater': 'Theater',
  'coffee-shop': 'Coffee Shop',
  'bookstore': 'Bookstore',
  'gallery': 'Gallery',
  'library': 'Library',
  'park': 'Park / Outdoor',
  'basement': 'Basement',
  'loft': 'Loft',
  'church': 'Church',
  'brewery': 'Brewery',
  'rooftop': 'Rooftop',
  'restaurant': 'Restaurant',
  'other': 'Other'
};

export const ARTIST_TYPE_LABELS: Record<ArtistType, string> = {
  'band': 'Band',
  'solo': 'Solo Artist',
  'duo': 'Duo',
  'collective': 'Collective',
  'dj': 'DJ',
  'comedian': 'Comedian',
  'poet': 'Poet / Spoken Word',
  'lecturer': 'Lecturer / Speaker',
  'dancer': 'Dancer / Dance Troupe',
  'theater-group': 'Theater Group',
  'storyteller': 'Storyteller',
  'variety': 'Variety / Magic',
  'rapper': 'MC / Rapper',
  'singer-songwriter': 'Singer-Songwriter',
  'experimental': 'Experimental / Noise',
  'visual-artist': 'Visual Artist'
};

export interface BookingInquiry {
  id: string;
  type: 'artist-to-venue' | 'venue-to-artist';
  
  // Who's making the inquiry
  inquirerType: 'artist' | 'venue';
  inquirerId: string;
  inquirerName: string;
  inquirerEmail: string;
  inquirerPhone?: string;
  
  // Who's receiving the inquiry
  recipientType: 'artist' | 'venue';
  recipientId: string;
  recipientName: string;
  
  // Event details
  proposedDate: string; // ISO date string
  alternativeDates?: string[]; // Additional date options
  eventType: string; // 'concert', 'festival', 'showcase', etc.
  expectedAttendance?: number;
  
  // Financial details
  guarantee?: number;
  doorSplit?: string; // '50/50', '60/40', etc.
  ticketPrice?: number;
  
  // Additional details
  message: string;
  riders?: string; // Technical/hospitality requirements
  
  // Status tracking
  status: 'pending' | 'viewed' | 'responded' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  updatedAt: string;
  viewedAt?: string;
  respondedAt?: string;
  
  // Follow-up communication
  responses?: BookingResponse[];
}

export interface BookingResponse {
  id: string;
  inquiryId: string;
  responderId: string;
  responderName: string;
  responderEmail: string;
  message: string;
  status: 'counter-offer' | 'accepted' | 'declined' | 'more-info-needed';
  
  // Counter-offer details (if applicable)
  counterDate?: string;
  counterGuarantee?: number;
  counterDoorSplit?: string;
  
  createdAt: string;
}

// NEW: Team Management Types
export interface ArtistMembership {
  id: string;
  userId: string;
  artistId: string;
  role: 'owner' | 'admin' | 'member';
  permissions: ArtistPermission[];
  joinedAt: string;
  invitedBy: string;
  status: 'active' | 'pending' | 'inactive';
  inviteToken?: string; // For pending invitations
}

export interface VenueMembership {
  id: string;
  userId: string;
  venueId: string;
  role: 'owner' | 'booker' | 'staff';
  permissions: VenuePermission[];
  joinedAt: string;
  invitedBy: string;
  status: 'active' | 'pending' | 'inactive';
  inviteToken?: string;
}

export type ArtistPermission = 
  | 'edit_profile'
  | 'manage_bookings' 
  | 'invite_members'
  | 'manage_members'
  | 'view_analytics'
  | 'delete_artist';

export type VenuePermission = 
  | 'edit_profile'
  | 'manage_bookings'
  | 'invite_staff'
  | 'manage_staff'
  | 'view_analytics'
  | 'delete_venue';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  // Remove profileId/profileType - use memberships instead
}

export interface MemberInvitation {
  id: string;
  entityType: 'artist' | 'venue';
  entityId: string;
  entityName: string;
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
  role: string;
  permissions: string[];
  token: string;
  expiresAt: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

// Permission labels for UI
export const ARTIST_PERMISSION_LABELS: Record<ArtistPermission, string> = {
  'edit_profile': 'Edit band info, photos, description',
  'manage_bookings': 'Accept/decline booking requests',
  'invite_members': 'Invite new band members',
  'manage_members': 'Change member roles/permissions', 
  'view_analytics': 'See booking stats and inquiries',
  'delete_artist': 'Delete artist profile'
};

export const VENUE_PERMISSION_LABELS: Record<VenuePermission, string> = {
  'edit_profile': 'Edit venue info and details',
  'manage_bookings': 'Accept/decline show requests',
  'invite_staff': 'Invite venue staff/bookers',
  'manage_staff': 'Change staff roles/permissions',
  'view_analytics': 'See booking data and analytics',
  'delete_venue': 'Delete venue profile'
};

export const DEFAULT_ROLE_PERMISSIONS = {
  artist: {
    owner: ['edit_profile', 'manage_bookings', 'invite_members', 'manage_members', 'view_analytics', 'delete_artist'] as ArtistPermission[],
    admin: ['edit_profile', 'manage_bookings', 'invite_members', 'view_analytics'] as ArtistPermission[],
    member: ['edit_profile', 'view_analytics'] as ArtistPermission[]
  },
  venue: {
    owner: ['edit_profile', 'manage_bookings', 'invite_staff', 'manage_staff', 'view_analytics', 'delete_venue'] as VenuePermission[],
    booker: ['edit_profile', 'manage_bookings', 'view_analytics'] as VenuePermission[],
    staff: ['view_analytics'] as VenuePermission[]
  }
};

// Centralized capacity/draw options for consistency across venue capacity and artist expected draw
export const CAPACITY_OPTIONS = [
  { value: '15', label: 'Up to 15 people' },
  { value: '30', label: '30+ people' },
  { value: '50', label: '50+ people' },
  { value: '100', label: '100+ people' },
  { value: '200', label: '200+ people' },
  { value: '500', label: '500+ people' },
  { value: '1000', label: '1000+ people' }
] as const;

// Centralized Genre System - Conditional genres for each artist type
export const GENRE_CATEGORIES = {
  // Music Genres - for bands, solo artists, duos, collectives
  MUSIC: [
    { value: 'punk', label: 'Punk' },
    { value: 'hardcore', label: 'Hardcore' },
    { value: 'noise-rock', label: 'Noise Rock' },
    { value: 'grindcore', label: 'Grindcore' },
    { value: 'black-metal', label: 'Black Metal' },
    { value: 'death-metal', label: 'Death Metal' },
    { value: 'doom-sludge', label: 'Doom/Sludge' },
    { value: 'thrash-metal', label: 'Thrash Metal' },
    { value: 'post-punk', label: 'Post-Punk' },
    { value: 'screamo-emo', label: 'Screamo/Emo' },
    { value: 'crust-dbeat', label: 'Crust/D-Beat' },
    { value: 'power-violence', label: 'Power Violence' },
    { value: 'indie-rock', label: 'Indie Rock' },
    { value: 'garage-rock', label: 'Garage Rock' },
    { value: 'psych-rock', label: 'Psych Rock' },
    { value: 'math-rock', label: 'Math Rock' },
    { value: 'shoegaze', label: 'Shoegaze' },
    { value: 'folk-acoustic', label: 'Folk/Acoustic' },
    { value: 'singer-songwriter', label: 'Singer-Songwriter' },
    { value: 'experimental', label: 'Experimental' },
    { value: 'jazz', label: 'Jazz' },
    { value: 'blues', label: 'Blues' },
    { value: 'country', label: 'Country' },
    { value: 'bluegrass', label: 'Bluegrass' },
    { value: 'alternative', label: 'Alternative' },
    { value: 'grunge', label: 'Grunge' },
    { value: 'post-rock', label: 'Post-Rock' }
  ],

  // Electronic/DJ Genres
  ELECTRONIC: [
    { value: 'house', label: 'House' },
    { value: 'techno', label: 'Techno' },
    { value: 'drum-bass', label: 'Drum & Bass' },
    { value: 'dubstep', label: 'Dubstep' },
    { value: 'breakbeat', label: 'Breakbeat' },
    { value: 'ambient', label: 'Ambient' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'noise-electronic', label: 'Noise' },
    { value: 'experimental-electronic', label: 'Experimental Electronic' },
    { value: 'hardcore-electronic', label: 'Hardcore Electronic' },
    { value: 'jungle', label: 'Jungle' },
    { value: 'gabber', label: 'Gabber' },
    { value: 'idm', label: 'IDM' },
    { value: 'trap', label: 'Trap' },
    { value: 'vaporwave', label: 'Vaporwave' },
    { value: 'synthwave', label: 'Synthwave' },
    { value: 'footwork', label: 'Footwork' },
    { value: 'bass-music', label: 'Bass Music' },
    { value: 'trance', label: 'Trance' },
    { value: 'downtempo', label: 'Downtempo' },
    { value: 'glitch', label: 'Glitch' }
  ],

  // Hip-Hop/Rap Genres
  HIP_HOP: [
    { value: 'underground-hip-hop', label: 'Underground Hip-Hop' },
    { value: 'conscious-rap', label: 'Conscious Rap' },
    { value: 'battle-rap', label: 'Battle Rap' },
    { value: 'freestyle', label: 'Freestyle' },
    { value: 'boom-bap', label: 'Boom Bap' },
    { value: 'trap-rap', label: 'Trap' },
    { value: 'drill', label: 'Drill' },
    { value: 'lo-fi-hip-hop', label: 'Lo-Fi Hip-Hop' },
    { value: 'experimental-hip-hop', label: 'Experimental Hip-Hop' },
    { value: 'jazz-rap', label: 'Jazz Rap' },
    { value: 'hardcore-rap', label: 'Hardcore Rap' }
  ],

  // Comedy Styles
  COMEDY: [
    { value: 'stand-up', label: 'Stand-Up' },
    { value: 'improv', label: 'Improv' },
    { value: 'sketch', label: 'Sketch Comedy' },
    { value: 'storytelling-comedy', label: 'Storytelling' },
    { value: 'musical-comedy', label: 'Musical Comedy' },
    { value: 'observational', label: 'Observational' },
    { value: 'political-comedy', label: 'Political' },
    { value: 'dark-comedy', label: 'Dark Comedy' },
    { value: 'absurdist', label: 'Absurdist' },
    { value: 'character-comedy', label: 'Character Comedy' }
  ],

  // Spoken Word/Poetry Styles
  SPOKEN_WORD: [
    { value: 'slam-poetry', label: 'Slam Poetry' },
    { value: 'narrative-poetry', label: 'Narrative Poetry' },
    { value: 'political-poetry', label: 'Political Poetry' },
    { value: 'performance-poetry', label: 'Performance Poetry' },
    { value: 'experimental-poetry', label: 'Experimental Poetry' },
    { value: 'confessional', label: 'Confessional' },
    { value: 'beat-poetry', label: 'Beat Poetry' },
    { value: 'social-justice', label: 'Social Justice' },
    { value: 'love-poetry', label: 'Love Poetry' },
    { value: 'nature-poetry', label: 'Nature Poetry' }
  ],

  // Dance Styles
  DANCE: [
    { value: 'contemporary', label: 'Contemporary' },
    { value: 'hip-hop-dance', label: 'Hip-Hop' },
    { value: 'ballet', label: 'Ballet' },
    { value: 'modern-dance', label: 'Modern' },
    { value: 'jazz-dance', label: 'Jazz' },
    { value: 'tap', label: 'Tap' },
    { value: 'breakdancing', label: 'Breakdancing' },
    { value: 'experimental-dance', label: 'Experimental' },
    { value: 'cultural-dance', label: 'Cultural/Traditional' },
    { value: 'performance-art', label: 'Performance Art' }
  ],

  // Theater Styles
  THEATER: [
    { value: 'experimental-theater', label: 'Experimental Theater' },
    { value: 'devised-theater', label: 'Devised Theater' },
    { value: 'physical-theater', label: 'Physical Theater' },
    { value: 'musical-theater', label: 'Musical Theater' },
    { value: 'political-theater', label: 'Political Theater' },
    { value: 'immersive-theater', label: 'Immersive Theater' },
    { value: 'street-theater', label: 'Street Theater' },
    { value: 'puppet-theater', label: 'Puppet Theater' },
    { value: 'solo-performance', label: 'Solo Performance' },
    { value: 'community-theater', label: 'Community Theater' }
  ],

  // Lecture/Speaker Topics
  LECTURE: [
    { value: 'activism', label: 'Activism' },
    { value: 'social-justice', label: 'Social Justice' },
    { value: 'environmental', label: 'Environmental' },
    { value: 'technology', label: 'Technology' },
    { value: 'arts-culture', label: 'Arts & Culture' },
    { value: 'history', label: 'History' },
    { value: 'philosophy', label: 'Philosophy' },
    { value: 'science', label: 'Science' },
    { value: 'politics', label: 'Politics' },
    { value: 'education', label: 'Education' },
    { value: 'community-organizing', label: 'Community Organizing' }
  ],

  // Storytelling Styles
  STORYTELLING: [
    { value: 'personal-narrative', label: 'Personal Narrative' },
    { value: 'folklore', label: 'Folklore' },
    { value: 'historical-stories', label: 'Historical Stories' },
    { value: 'ghost-stories', label: 'Ghost Stories' },
    { value: 'comedy-storytelling', label: 'Comedy Storytelling' },
    { value: 'cultural-stories', label: 'Cultural Stories' },
    { value: 'adventure-stories', label: 'Adventure Stories' },
    { value: 'family-stories', label: 'Family Stories' },
    { value: 'travel-stories', label: 'Travel Stories' },
    { value: 'interactive-storytelling', label: 'Interactive Storytelling' }
  ],

  // Variety/Magic Acts
  VARIETY: [
    { value: 'magic', label: 'Magic' },
    { value: 'juggling', label: 'Juggling' },
    { value: 'circus-arts', label: 'Circus Arts' },
    { value: 'fire-performance', label: 'Fire Performance' },
    { value: 'balloon-art', label: 'Balloon Art' },
    { value: 'mentalism', label: 'Mentalism' },
    { value: 'escape-artistry', label: 'Escape Artistry' },
    { value: 'ventriloquism', label: 'Ventriloquism' },
    { value: 'mime', label: 'Mime' },
    { value: 'clowning', label: 'Clowning' },
    { value: 'street-performance', label: 'Street Performance' }
  ],

  // Visual Art Styles
  VISUAL_ART: [
    { value: 'live-painting', label: 'Live Painting' },
    { value: 'performance-art', label: 'Performance Art' },
    { value: 'installation-art', label: 'Installation Art' },
    { value: 'digital-art', label: 'Digital Art' },
    { value: 'street-art', label: 'Street Art' },
    { value: 'sculpture', label: 'Sculpture' },
    { value: 'mixed-media', label: 'Mixed Media' },
    { value: 'conceptual-art', label: 'Conceptual Art' },
    { value: 'interactive-art', label: 'Interactive Art' },
    { value: 'video-art', label: 'Video Art' }
  ]
} as const;

// Artist Type to Genre Category Mapping
export const ARTIST_TYPE_GENRES: Record<ArtistType, keyof typeof GENRE_CATEGORIES | null> = {
  'band': 'MUSIC',
  'solo': 'MUSIC',
  'duo': 'MUSIC',
  'collective': 'MUSIC',
  'singer-songwriter': 'MUSIC',
  'dj': 'ELECTRONIC',
  'rapper': 'HIP_HOP',
  'comedian': 'COMEDY',
  'poet': 'SPOKEN_WORD',
  'dancer': 'DANCE',
  'theater-group': 'THEATER',
  'lecturer': 'LECTURE',
  'storyteller': 'STORYTELLING',
  'variety': 'VARIETY',
  'experimental': 'MUSIC', // Can be music or other, defaulting to music
  'visual-artist': 'VISUAL_ART'
};

// Helper function to get genres for a specific artist type
export function getGenresForArtistType(artistType: ArtistType): Array<{value: string, label: string}> {
  const genreCategory = ARTIST_TYPE_GENRES[artistType];
  if (!genreCategory) return [];
  return GENRE_CATEGORIES[genreCategory] || [];
}

// Helper function to get genres for multiple artist types (for venues)
export function getGenresForArtistTypes(artistTypes: ArtistType[]): Array<{value: string, label: string}> {
  const allGenres = new Map<string, string>();
  
  artistTypes.forEach(artistType => {
    const genres = getGenresForArtistType(artistType);
    genres.forEach(genre => {
      allGenres.set(genre.value, genre.label);
    });
  });
  
  // Convert back to array and sort alphabetically
  return Array.from(allGenres.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Helper function to check if an artist type has genres
export function artistTypeHasGenres(artistType: ArtistType): boolean {
  return ARTIST_TYPE_GENRES[artistType] !== null;
} 
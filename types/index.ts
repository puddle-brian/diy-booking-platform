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
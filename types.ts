export interface BookingInquiry {
  id: string;
  artistId: string;
  venueId: string;
  proposedDate: string;
  status: 'pending' | 'hold' | 'confirmed' | 'declined' | 'cancelled';
  message: string;
  artistContact: {
    name: string;
    email: string;
    phone?: string;
  };
  venueResponse?: {
    message: string;
    respondedAt: string;
    respondedBy: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Show {
  id: string;
  artistId: string;
  venueId: string;
  date: string;
  
  // Basic Info
  city: string;
  state: string;
  venueName: string;
  artistName: string;
  
  // 🎵 NEW: Native lineup support - replaces complex workarounds
  lineup?: {
    artistId: string;
    artistName: string;
    billingPosition: 'HEADLINER' | 'CO_HEADLINER' | 'SUPPORT' | 'OPENER' | 'LOCAL_SUPPORT';
    performanceOrder: number;
    setLength?: number;
    guarantee?: number;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  }[];
  
  // 🎯 HOLD MANAGEMENT - Booking Details with sophisticated hold tracking
  status: 'hold' | 'confirmed' | 'cancelled' | 'completed' | 'accepted';
  holdPosition?: 'first' | 'second' | 'third'; // Current hold priority
  holdExpiresAt?: string; // When hold expires (auto-decline)
  holdNotes?: string; // Artist's internal notes
  promotedFrom?: 'second' | 'third'; // Track if this was promoted from lower priority
  promotedAt?: string; // When promotion happened
  originalBidId?: string; // Link back to the venue bid that created this
  
  // 🎯 BILLING POSITION - Simplified lineup position for confirmed shows
  billingOrder?: {
    position: 'headliner' | 'co-headliner' | 'support' | 'local-support';
    lineupPosition?: number; // 1 = headliner, 2 = direct support, etc.
    setLength?: number; // minutes
    otherActs?: string[]; // names of other acts on the bill
    notes?: string; // "co-headlining with X", "festival slot", etc.
  };
  
  // Financial
  guarantee?: number;
  doorDeal?: {
    split: string; // e.g. "70/30 after $500"
    minimumGuarantee?: number;
  };
  ticketPrice?: {
    advance?: number;
    door?: number;
  };
  
  // Venue Details
  capacity: number;
  ageRestriction: string;
  
  // Logistics
  loadIn?: string;
  soundcheck?: string;
  doorsOpen?: string;
  showTime?: string;
  curfew?: string;
  
  // Projections
  expectedDraw?: number;
  walkoutPotential?: 'low' | 'medium' | 'high';
  
  // Additional Info
  notes?: string;
  promotion?: {
    flyerUrl?: string;
    socialPosts?: string[];
    radioSpots?: boolean;
  };
  
  // System
  createdAt: string;
  updatedAt: string;
  createdBy: string; // userId who created/confirmed
}

// 🎯 PHASE 6: TourRequest interface removed - replaced by unified ShowRequest system

export interface VenueBid {
  id: string;
  showRequestId: string;
  venueId: string;
  venueName: string;
  
  // Offer Details
  proposedDate: string;
  alternativeDates?: string[]; // backup options
  
  // Financial Offer
  guarantee?: number;
  doorDeal?: {
    split: string; // "70/30 after $300"
    minimumGuarantee?: number;
  };
  ticketPrice: {
    advance?: number;
    door?: number;
  };
  merchandiseSplit?: string; // "90/10" (artist/venue)
  
  // Venue Details
  capacity: number;
  ageRestriction: string;
  
  // Equipment Available
  equipmentProvided: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  
  // Logistics
  loadIn: string;
  soundcheck: string;
  doorsOpen: string;
  showTime: string;
  curfew: string;
  
  // Additional Value
  promotion: {
    social: boolean;
    flyerPrinting: boolean;
    radioSpots: boolean;
    pressCoverage: boolean;
  };
  lodging?: {
    offered: boolean;
    type: 'floor-space' | 'couch' | 'private-room';
    details?: string;
  };
  
  // 🎯 BILLING POSITION - Simplified 4-option system for better UX
  billingPosition?: 'headliner' | 'co-headliner' | 'support' | 'local-support';
  lineupPosition?: number; // 1 = headliner, 2 = direct support, etc.
  setLength?: number; // minutes
  otherActs?: string; // names of other acts on the bill
  billingNotes?: string; // "co-headlining with X", "festival slot", etc.
  
  // Message & Terms
  message: string;
  additionalTerms?: string;
  
  // 🎯 BID STATUS - Simple industry-standard flow
  status: BidStatus;
  
  // 🎯 HOLD MANAGEMENT - Automatic priority system
  holdPosition?: 1 | 2 | 3; // Auto-assigned: first hold = 1, second = 2, etc.
  heldAt?: string; // When artist placed this bid on hold
  heldUntil?: string; // Hold expiration (typically 7-14 days)
  
  // 🎯 ACCEPTANCE/DECLINE
  acceptedAt?: string;
  declinedAt?: string;
  declinedReason?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  
  readByArtist: boolean;
  
  // Notification fields
  notifyVenue?: boolean; // Flag to trigger venue notification
  
  // System
  createdAt: string;
  updatedAt: string;
  expiresAt: string; // bids expire if not responded to
  
  // NEW: Hold state management for frozen bids
  holdState?: 'AVAILABLE' | 'FROZEN' | 'HELD' | 'ACCEPTED_HELD';
  frozenByHoldId?: string; // Reference to hold that froze this bid
  frozenAt?: string; // When this bid was frozen
  unfrozenAt?: string; // When this bid was unfrozen
  isFrozen?: boolean; // Computed property for easier access
  
  // 🎯 PHASE 1: Additional fields used by timeline system
  location?: string; // Derived location string for display
  artistId?: string; // Artist ID for bid tracking
  artistName?: string; // Artist name for display
  venue?: any; // Venue object for expanded details
}

// 🎯 NEW: Venue Offers - Direct offers from venues to specific artists
export interface VenueOffer {
  id: string;
  venueId: string;
  venueName: string;
  artistId: string; // Target artist
  artistName: string;
  createdById: string;
  
  // Offer Details
  title: string; // e.g., "Headlining Slot - June 15th"
  description?: string;
  proposedDate: string;
  alternativeDates?: string[]; // Optional backup dates
  message?: string; // Personal pitch to the artist
  
  // Financial Terms (consistent with VenueBid)
  amount?: number; // Guarantee amount
  doorDeal?: {
    split: string; // "70/30 after $300"
    minimumGuarantee?: number;
  };
  ticketPrice?: {
    advance?: number;
    door?: number;
  };
  merchandiseSplit?: string; // "90/10" (artist/venue)
  
  // Show Details (consistent with VenueBid) - Updated to simplified system
  billingPosition?: 'headliner' | 'co-headliner' | 'support' | 'local-support';
  lineupPosition?: number; // 1 = headliner, 2 = support, etc.
  setLength?: number; // Minutes
  otherActs?: string; // Other acts on the bill
  billingNotes?: string; // Additional billing context
  
  // Venue Details
  capacity?: number;
  ageRestriction?: string;
  
  // Equipment & Logistics (consistent with VenueBid)
  equipmentProvided?: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  loadIn?: string;
  soundcheck?: string;
  doorsOpen?: string;
  showTime?: string;
  curfew?: string;
  
  // Additional Value (consistent with VenueBid)
  promotion?: {
    social: boolean;
    flyerPrinting: boolean;
    radioSpots: boolean;
    pressCoverage: boolean;
  };
  lodging?: {
    offered: boolean;
    type: 'floor-space' | 'couch' | 'private-room';
    details?: string;
  };
  additionalTerms?: string;
  
  // Status Management (consistent with VenueBid)
  status: OfferStatus;
  acceptedAt?: string;
  declinedAt?: string;
  declinedReason?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  expiresAt?: string; // Auto-expire offers
  
  // System
  createdAt: string;
  updatedAt: string;
}

// 🎯 NEW: Venue Offer Templates - Save common offer configurations
export interface VenueOfferTemplate {
  id: string;
  venueId: string;
  name: string; // e.g., "Standard Headliner Offer", "Support Slot Package"
  isDefault: boolean;
  
  // Financial Template
  amount?: number; // Default guarantee
  doorDeal?: {
    split: string;
    minimumGuarantee?: number;
  };
  ticketPrice?: {
    advance?: number;
    door?: number;
  };
  merchandiseSplit?: string; // Default merch split
  
  // Show Template
  billingPosition?: string; // Default billing position
  setLength?: number; // Default set length
  
  // Venue Template
  equipmentProvided?: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  loadIn?: string; // Standard load-in time
  soundcheck?: string; // Standard soundcheck time
  doorsOpen?: string; // Standard doors time
  showTime?: string; // Standard show time
  curfew?: string; // Standard curfew
  
  // Value-Add Template
  promotion?: {
    social: boolean;
    flyerPrinting: boolean;
    radioSpots: boolean;
    pressCoverage: boolean;
  };
  lodging?: {
    offered: boolean;
    type: 'floor-space' | 'couch' | 'private-room';
    details?: string;
  };
  
  // Message Template
  messageTemplate?: string; // Boilerplate pitch message
  additionalTerms?: string; // Standard additional terms
  
  // System
  createdAt: string;
  updatedAt: string;
}

// Type definitions - Comprehensive DIY space types
export type SpaceType = 
  // Residential
  | 'house' | 'basement' | 'loft' | 'rooftop' | 'apartment'
  // Industrial/Warehouse  
  | 'warehouse' | 'factory' | 'garage' | 'storage-unit'
  // Rural/Alternative
  | 'barn' | 'farm' | 'park' | 'outdoor-space' | 'festival-ground'
  // Commercial/Retail
  | 'record-store' | 'book-store' | 'coffee-shop' | 'restaurant' | 'shop'
  // Nightlife
  | 'bar' | 'club' | 'comedy-club' | 'night-club' | 'dive-bar'
  // Institutional  
  | 'community-center' | 'church' | 'chapel' | 'vfw-hall' | 'legion-hall' | 'union-hall'
  // Arts/Culture
  | 'theater' | 'arts-center' | 'gallery' | 'museum' | 'library'
  // Alternative/DIY
  | 'co-op' | 'infoshop' | 'diy-space' | 'rehearsal-space' | 'squat'
  // Educational
  | 'school' | 'university' | 'conference-room'
  | 'other';

export type PerformerType = 
  // Music
  | 'band' | 'solo-musician' | 'dj' | 'electronic-artist' | 'choir'
  // Comedy/Performance
  | 'comedian' | 'performance-artist' | 'clown' | 'magician'
  // Literary/Spoken Word  
  | 'poet' | 'spoken-word-artist' | 'storyteller' | 'writer' | 'author'
  // Theater/Drama
  | 'theater-group' | 'actor' | 'improv-group' | 'puppeteer'
  // Movement/Dance
  | 'dancer' | 'dance-group' | 'choreographer'
  // Speaking/Education
  | 'lecturer' | 'speaker' | 'educator' | 'activist' | 'organizer'
  // Visual/Media
  | 'visual-artist' | 'filmmaker' | 'photographer' | 'installation-artist'
  // Alternative/Experimental
  | 'noise-artist' | 'sound-artist' | 'collective' | 'art-collective'
  | 'other';

// Legacy aliases for backward compatibility
export type VenueType = SpaceType;
export type ArtistType = PerformerType;

// Label mappings for display
export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  // Residential
  'house': 'House',
  'basement': 'Basement', 
  'loft': 'Loft',
  'rooftop': 'Rooftop',
  'apartment': 'Apartment',
  // Industrial/Warehouse
  'warehouse': 'Warehouse',
  'factory': 'Factory',
  'garage': 'Garage', 
  'storage-unit': 'Storage Unit',
  // Rural/Alternative
  'barn': 'Barn',
  'farm': 'Farm',
  'park': 'Park',
  'outdoor-space': 'Outdoor Space',
  'festival-ground': 'Festival Ground',
  // Commercial/Retail
  'record-store': 'Record Store',
  'book-store': 'Book Store',
  'coffee-shop': 'Coffee Shop',
  'restaurant': 'Restaurant',
  'shop': 'Shop',
  // Nightlife
  'bar': 'Bar',
  'club': 'Club',
  'comedy-club': 'Comedy Club',
  'night-club': 'Night Club',
  'dive-bar': 'Dive Bar',
  // Institutional
  'community-center': 'Community Center',
  'church': 'Church',
  'chapel': 'Chapel',
  'vfw-hall': 'VFW Hall',
  'legion-hall': 'Legion Hall',
  'union-hall': 'Union Hall',
  // Arts/Culture
  'theater': 'Theater',
  'arts-center': 'Arts Center',
  'gallery': 'Gallery',
  'museum': 'Museum',
  'library': 'Library',
  // Alternative/DIY
  'co-op': 'Co-op',
  'infoshop': 'Infoshop',
  'diy-space': 'DIY Space',
  'rehearsal-space': 'Rehearsal Space',
  'squat': 'Squat',
  // Educational
  'school': 'School',
  'university': 'University',
  'conference-room': 'Conference Room',
  'other': 'Other'
};

export const PERFORMER_TYPE_LABELS: Record<PerformerType, string> = {
  // Music
  'band': 'Band',
  'solo-musician': 'Solo Musician',
  'dj': 'DJ',
  'electronic-artist': 'Electronic Artist',
  'choir': 'Choir',
  // Comedy/Performance
  'comedian': 'Comedian',
  'performance-artist': 'Performance Artist',
  'clown': 'Clown',
  'magician': 'Magician',
  // Literary/Spoken Word
  'poet': 'Poet',
  'spoken-word-artist': 'Spoken Word Artist',
  'storyteller': 'Storyteller',
  'writer': 'Writer',
  'author': 'Author',
  // Theater/Drama
  'theater-group': 'Theater Group',
  'actor': 'Actor',
  'improv-group': 'Improv Group',
  'puppeteer': 'Puppeteer',
  // Movement/Dance
  'dancer': 'Dancer',
  'dance-group': 'Dance Group',
  'choreographer': 'Choreographer',
  // Speaking/Education
  'lecturer': 'Lecturer',
  'speaker': 'Speaker',
  'educator': 'Educator',
  'activist': 'Activist',
  'organizer': 'Organizer',
  // Visual/Media
  'visual-artist': 'Visual Artist',
  'filmmaker': 'Filmmaker',
  'photographer': 'Photographer',
  'installation-artist': 'Installation Artist',
  // Alternative/Experimental
  'noise-artist': 'Noise Artist',
  'sound-artist': 'Sound Artist',
  'collective': 'Collective',
  'art-collective': 'Art Collective',
  'other': 'Other'
};

// Legacy aliases for backward compatibility
export const VENUE_TYPE_LABELS = SPACE_TYPE_LABELS;
export const ARTIST_TYPE_LABELS = PERFORMER_TYPE_LABELS;

// Show Types
export interface ShowWithLineup extends Show {
  // 🎵 Lineup bids are just regular VenueBids with isLineupSlot=true and parentShowId set
  lineupBids?: (VenueBid & {
    isLineupSlot: true;
    parentShowId: string;
    lineupRole: 'HEADLINER' | 'DIRECT_SUPPORT' | 'OPENER' | 'LOCAL_OPENER';
    billingOrder: number;
    invitedByUserId: string;
  })[];
}

// Lineup invitation request/response types
// 🎵 Lineup support types - reusing existing VenueBid infrastructure
export type LineupPosition = 'HEADLINER' | 'DIRECT_SUPPORT' | 'OPENER' | 'LOCAL_OPENER';

export interface LineupInvitationRequest {
  showId: string;
  artistId: string;
  position: LineupPosition;
  billingOrder: number;
  guarantee?: number;
  doorDeal?: {
    split: string;
    minimumGuarantee?: number;
  };
  setLength?: number;
  message?: string;
}

// 🎯 PHASE 1.2: Unified Status Enums - Single source of truth for all status values
export type BidStatus = 'pending' | 'hold' | 'accepted' | 'declined' | 'cancelled';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type ShowRequestStatus = 'OPEN' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type ShowStatus = 'hold' | 'confirmed' | 'cancelled' | 'completed' | 'accepted';
export type LineupStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

// 🎯 PHASE 1.2: Status conversion utilities for legacy compatibility
export const StatusConverter = {
  // Convert between uppercase and lowercase bid statuses
  bidToUppercase: (status: BidStatus): string => {
    const map: Record<BidStatus, string> = {
      'pending': 'PENDING',
      'hold': 'HOLD', 
      'accepted': 'ACCEPTED',
      'declined': 'DECLINED',
      'cancelled': 'CANCELLED'
    };
    return map[status] || status.toUpperCase();
  },
  
  // Convert from uppercase to lowercase bid status
  bidToLowercase: (status: string): BidStatus => {
    const map: Record<string, BidStatus> = {
      'PENDING': 'pending',
      'HOLD': 'hold',
      'ACCEPTED': 'accepted', 
      'DECLINED': 'declined',
      'CANCELLED': 'cancelled'
    };
    return map[status] || status.toLowerCase() as BidStatus;
  },
  
  // Convert lineup status to bid status
  lineupToBid: (status: LineupStatus): BidStatus => {
    const map: Record<LineupStatus, BidStatus> = {
      'CONFIRMED': 'accepted',
      'PENDING': 'pending',
      'CANCELLED': 'cancelled'
    };
    return map[status];
  }
}; 
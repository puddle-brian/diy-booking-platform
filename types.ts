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
  
  // Booking Details  
  status: 'hold' | 'confirmed' | 'cancelled' | 'completed';
  holdPosition?: 'first' | 'second' | 'third';
  
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

export interface TourRequest {
  id: string;
  artistId: string;
  artistName: string;
  
  // Tour Details
  title: string; // e.g. "Pacific Northwest Tour March 2024"
  description: string;
  
  // Geography & Timing
  startDate: string;
  endDate: string;
  cities: string[]; // ["Seattle", "Portland", "Vancouver"] 
  regions: string[]; // ["Pacific Northwest", "California"] for broader requests
  flexibility: 'exact-cities' | 'region-flexible' | 'route-flexible';
  
  // Artist Info
  genres: string[];
  expectedDraw: {
    min: number;
    max: number;
    description: string; // "80-120 in major cities, 40-60 in smaller markets"
  };
  tourStatus: 'confirmed-routing' | 'flexible-routing' | 'exploring-interest';
  
  // Requirements
  ageRestriction?: 'all-ages' | '18+' | '21+' | 'flexible';
  equipment: {
    needsPA: boolean;
    needsMics: boolean;
    needsDrums: boolean;
    needsAmps: boolean;
    acoustic: boolean;
  };
  
  // Business
  guaranteeRange?: {
    min: number;
    max: number;
  };
  acceptsDoorDeals: boolean;
  merchandising: boolean;
  
  // Logistics
  travelMethod: 'van' | 'flying' | 'train' | 'other';
  lodging: 'floor-space' | 'hotel' | 'flexible';
  
  // Status
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  priority: 'high' | 'medium' | 'low';
  responses: number; // count of bids received
  
  // System
  createdAt: string;
  updatedAt: string;
  expiresAt: string; // auto-close after certain period
}

export interface VenueBid {
  id: string;
  tourRequestId: string;
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
  
  // Message & Terms
  message: string;
  additionalTerms?: string;
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  readByArtist: boolean;
  
  // System
  createdAt: string;
  updatedAt: string;
  expiresAt: string; // bids expire if not responded to
}

// Type definitions
export type VenueType = 'house-show' | 'community-space' | 'record-store' | 'vfw-hall' | 'arts-center' | 'warehouse' | 'bar' | 'club' | 'theater' | 'other';
export type ArtistType = 'band' | 'solo-artist' | 'collective' | 'electronic-artist' | 'dj' | 'other';

// Label mappings for display
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
  'other': 'Other'
};

export const ARTIST_TYPE_LABELS: Record<ArtistType, string> = {
  'band': 'Band',
  'solo-artist': 'Solo Artist',
  'collective': 'Collective',
  'electronic-artist': 'Electronic Artist',
  'dj': 'DJ',
  'other': 'Other'
}; 
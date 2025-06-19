/**
 * UNIFIED BOOKING OPPORTUNITY TYPES
 * 
 * These types provide a consistent interface for all booking opportunities
 * regardless of their original source (ShowRequest, VenueOffer, Show.lineup).
 */

export type BookingOpportunityStatus = 
  | 'OPEN'       // Available for bidding/offers
  | 'PENDING'    // Awaiting artist/venue response
  | 'CONFIRMED'  // Accepted and confirmed
  | 'DECLINED'   // Rejected
  | 'CANCELLED'  // Cancelled after confirmation
  | 'EXPIRED';   // Expired without response

export type BookingSourceType = 
  | 'SHOW_REQUEST'      // Originated from artist ShowRequest
  | 'VENUE_OFFER'       // Originated from venue VenueOffer
  | 'SHOW_LINEUP'       // Originated from Show.lineup
  | 'BOOKING_OPPORTUNITY'; // Created directly as unified opportunity

export type InitiatedBy = 'ARTIST' | 'VENUE';

export type BillingPosition = 
  | 'HEADLINER'
  | 'CO_HEADLINER'
  | 'SUPPORT'
  | 'OPENER'
  | 'LOCAL_SUPPORT';

export type AgeRestriction = 
  | 'ALL_AGES'
  | 'EIGHTEEN_PLUS'
  | 'TWENTY_ONE_PLUS';

export type HoldState = 
  | 'NONE'
  | 'FROZEN'
  | 'UNFROZEN';

// Financial structures
export interface FinancialOffer {
  guarantee?: number;
  doorDeal?: {
    percentage?: number;
    threshold?: number;
  };
  ticketPrice?: {
    door?: number;
    advance?: number;
  };
  merchandiseSplit?: number;
}

// Performance details
export interface PerformanceDetails {
  billingPosition?: BillingPosition;
  performanceOrder?: number;
  setLength?: number;
  otherActs?: string[];
  billingNotes?: string;
}

// Venue logistics
export interface VenueDetails {
  capacity?: number;
  ageRestriction?: AgeRestriction;
  equipment?: any; // JSON field for equipment details
  schedule?: {
    loadIn?: string;
    soundcheck?: string;
    doorsOpen?: string;
    showTime?: string;
    curfew?: string;
  };
}

// Additional value proposition
export interface AdditionalValue {
  promotion?: any; // JSON field for promotion details
  lodging?: any;   // JSON field for lodging details
  additionalTerms?: string;
}

// Location information
export interface LocationInfo {
  city?: string;
  stateProvince?: string;
  country?: string;
  venue: {
    id: string;
    name: string;
    capacity?: number;
  };
}

// Related entities (from Prisma includes)
export interface ArtistInfo {
  id: string;
  name: string;
  genres?: string[];
  images?: any;
}

export interface VenueInfo {
  id: string;
  name: string;
  capacity?: number;
  venueType?: string;
  location?: {
    city?: string;
    stateProvince?: string;
    country?: string;
  };
}

export interface UserInfo {
  id: string;
  username: string;
}

export interface ActiveHold {
  id: string;
  status: string;
  expiresAt?: string;
  reason?: string;
}

// Main BookingOpportunity interface
export interface BookingOpportunity {
  // Core identity
  id: string;
  artistId: string;
  venueId: string;
  
  // Basic information
  title: string;
  description?: string;
  proposedDate: string; // ISO string
  
  // Initiation tracking
  initiatedBy: InitiatedBy;
  initiatedById: string;
  initiatedByUser?: UserInfo;
  
  // Current state
  status: BookingOpportunityStatus;
  
  // Structured offer details
  financialOffer: FinancialOffer;
  performanceDetails: PerformanceDetails;
  venueDetails: VenueDetails;
  additionalValue: AdditionalValue;
  
  // Communication
  message?: string;
  
  // Metadata
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  expiresAt?: string; // ISO string
  
  // Source tracking for migration/debugging
  sourceType: BookingSourceType;
  sourceId: string;
  
  // Status history
  statusHistory?: any[]; // JSON array of status changes
  acceptedAt?: string;   // ISO string
  declinedAt?: string;   // ISO string
  declinedReason?: string;
  cancelledAt?: string;  // ISO string
  cancelledReason?: string;
  
  // Hold management
  holdState?: HoldState;
  frozenAt?: string;     // ISO string
  unfrozenAt?: string;   // ISO string
  activeHolds?: ActiveHold[];
  
  // Related entities (populated by API includes)
  artist?: ArtistInfo;
  venue?: VenueInfo;
  locationInfo?: LocationInfo;
}

// API Response types
export interface BookingOpportunitiesResponse {
  opportunities: BookingOpportunity[];
  metadata: {
    total: number;
    perspective: 'ARTIST' | 'VENUE';
    contextId: string;
    filters: {
      status?: string[] | null;
      dateRange?: {
        startDate?: string;
        endDate?: string;
      } | null;
      includeExpired?: boolean;
    };
  };
}

// API Request types
export interface CreateBookingOpportunityRequest {
  // Core entities
  artistId: string;
  venueId: string;
  
  // Basic info
  title: string;
  description?: string;
  proposedDate: string; // ISO string
  
  // Initiation
  initiatedBy: InitiatedBy;
  initiatedById: string;
  
  // Status
  status?: BookingOpportunityStatus;
  
  // Structured details
  financialOffer?: FinancialOffer;
  performanceDetails?: PerformanceDetails;
  venueDetails?: VenueDetails;
  additionalValue?: AdditionalValue;
  
  // Communication
  message?: string;
  
  // Metadata
  expiresAt?: string; // ISO string
  
  // Source tracking
  sourceType?: BookingSourceType;
  sourceId?: string;
}

export interface UpdateBookingOpportunityRequest {
  status?: BookingOpportunityStatus;
  declinedReason?: string;
  cancelledReason?: string;
  statusHistory?: any[];
}

// Query parameter types
export interface BookingOpportunityFilters {
  perspective: 'ARTIST' | 'VENUE';
  artistId?: string;
  venueId?: string;
  status?: string; // Comma-separated list
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
  includeExpired?: boolean;
} 
/**
 * Unified Booking Domain Types
 * 
 * This replaces the fragmented TourRequest/ShowRequest/Show system
 * with a cohesive domain model based on DDD principles.
 */

import { AgeRestriction, ShowRequestStatus, ShowStatus } from '@prisma/client';

// Core booking request domain entity
export interface BookingRequest {
  id: string;
  title: string;
  
  // Unified data types (no more string vs enum mismatches)
  ageRestriction: AgeRestriction | null;
  status: BookingRequestStatus;
  
  // Clear initiative model
  initiator: BookingParticipant;
  target: BookingParticipant;
  
  // Temporal data
  requestedDate: Date;
  confirmedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Business terms
  terms: BookingTerms;
  
  // Rich domain context
  context: BookingContext;
}

// Unified booking participant (artist or venue)
export interface BookingParticipant {
  type: 'artist' | 'venue';
  id: string;
  name: string;
  location?: {
    city: string;
    state: string;
    country: string;
  };
}

// Business terms for the booking
export interface BookingTerms {
  amount?: number;
  ticketPrice?: number | { min: number; max: number };
  capacity?: number;
  billingPosition?: 'headliner' | 'co-headliner' | 'support' | 'local-support';
  setLength?: number;
  merchandiseSplit?: string;
  doorDeal?: boolean;
  guarantee?: number;
  lodging?: 'provided' | 'not-provided' | 'partial';
  promotion?: {
    venue: string[];
    artist: string[];
  };
}

// Rich contextual information
export interface BookingContext {
  message?: string;
  genres: string[];
  additionalTerms?: string;
  equipmentProvided?: Record<string, boolean>;
  logistics?: {
    loadIn?: string;
    soundcheck?: string;
    doorsOpen?: string;
    showTime?: string;
    curfew?: string;
  };
}

// Unified status enum that encompasses all booking states
export type BookingRequestStatus = 
  | 'OPEN'           // Initial state (replaces ShowRequestStatus.OPEN)
  | 'PENDING'        // Bid submitted, awaiting response
  | 'ACCEPTED'       // Booking accepted
  | 'CONFIRMED'      // Show is confirmed (replaces ShowStatus.CONFIRMED)
  | 'DECLINED'       // Booking declined
  | 'CANCELLED'      // Booking cancelled
  | 'COMPLETED';     // Show completed

// Timeline entry for unified display
export interface TimelineEntry {
  id: string;
  type: 'booking-request' | 'confirmed-show';
  date: Date;
  status: BookingRequestStatus;
  
  // Normalized display data
  title: string;
  location: string;
  participants: {
    artist: BookingParticipant;
    venue: BookingParticipant;
  };
  
  // UI state
  isExpandable: boolean;
  metadata: {
    isVenueInitiated: boolean;
    hasActiveOffers: boolean;
    hasActiveBids: boolean;
    priority: 'high' | 'medium' | 'low';
  };
}

// Command pattern for booking operations
export interface CreateBookingRequestCommand {
  initiatorId: string;
  initiatorType: 'artist' | 'venue';
  targetId: string;
  targetType: 'venue' | 'artist';
  requestedDate: Date;
  terms: Partial<BookingTerms>;
  context: Partial<BookingContext>;
}

export interface AcceptBookingRequestCommand {
  requestId: string;
  acceptedBy: string;
  confirmedDate?: Date;
  finalTerms: BookingTerms;
}

// Domain events for better decoupling
export interface BookingDomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface BookingRequestCreated extends BookingDomainEvent {
  type: 'booking-request-created';
  data: {
    requestId: string;
    initiatorId: string;
    targetId: string;
    requestedDate: Date;
  };
}

export interface BookingRequestAccepted extends BookingDomainEvent {
  type: 'booking-request-accepted';
  data: {
    requestId: string;
    acceptedBy: string;
    confirmedDate: Date;
  };
}

// Migration helpers for existing data
export interface LegacyDataMigration {
  tourRequestToBookingRequest(tourRequest: any): BookingRequest;
  showRequestToBookingRequest(showRequest: any): BookingRequest;
  showToBookingRequest(show: any): BookingRequest;
  normalizeAgeRestriction(value: string | AgeRestriction): AgeRestriction;
} 
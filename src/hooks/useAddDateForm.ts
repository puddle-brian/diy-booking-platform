import { useState, useCallback } from 'react';
import { TechnicalRequirement, HospitalityRequirement } from '../../types/templates';

export interface AddDateFormState {
  type: 'request' | 'confirmed' | 'offer';
  date: string;
  startDate: string;
  endDate: string;
  requestDate: string;
  useSingleDate: boolean;
  location: string;
  artistId: string;
  artistName: string;
  venueId: string;
  venueName: string;
  title: string;
  description: string;
  guarantee: string;
  capacity: string;
  ageRestriction: 'all-ages' | '18+' | '21+' | 'flexible';
  loadIn: string;
  soundcheck: string;
  doorsOpen: string;
  showTime: string;
  curfew: string;
  notes: string;
  billingPosition: '' | 'headliner' | 'co-headliner' | 'direct-support' | 'opener' | 'local-opener';
  lineupPosition: string;
  setLength: string;
  otherActs: string;
  billingNotes: string;
  equipment: {
    needsPA: boolean;
    needsMics: boolean;
    needsDrums: boolean;
    needsAmps: boolean;
    acoustic: boolean;
  };
  technicalRequirements: TechnicalRequirement[];
  hospitalityRequirements: HospitalityRequirement[];
  guaranteeRange: {
    min: number;
    max: number;
  };
  acceptsDoorDeals: boolean;
  merchandising: boolean;
  travelMethod: 'van' | 'flying' | 'train' | 'other';
  lodging: 'floor-space' | 'hotel' | 'flexible';
  priority: 'high' | 'medium' | 'low';
}

export interface AddDateFormActions {
  updateForm: (updates: Partial<AddDateFormState>) => void;
  updateEquipment: (equipment: Partial<AddDateFormState['equipment']>) => void;
  updateGuaranteeRange: (range: Partial<AddDateFormState['guaranteeRange']>) => void;
  setVenueFromSearch: (venue: { id: string; name: string; city: string; state: string; capacity?: number }) => void;
  setArtistFromSearch: (artist: { id: string; name: string }) => void;
  resetForm: () => void;
  setFormType: (type: 'request' | 'confirmed' | 'offer') => void;
}

const getInitialFormState = (): AddDateFormState => ({
  type: 'offer',
  date: '',
  startDate: '',
  endDate: '',
  requestDate: '',
  useSingleDate: true,
  location: '',
  artistId: '',
  artistName: '',
  venueId: '',
  venueName: '',
  title: '',
  description: '',
  guarantee: '',
  capacity: '',
  ageRestriction: 'all-ages',
  loadIn: '',
  soundcheck: '',
  doorsOpen: '',
  showTime: '',
  curfew: '',
  notes: '',
  billingPosition: '',
  lineupPosition: '',
  setLength: '',
  otherActs: '',
  billingNotes: '',
  equipment: {
    needsPA: false,
    needsMics: false,
    needsDrums: false,
    needsAmps: false,
    acoustic: false
  },
  technicalRequirements: [],
  hospitalityRequirements: [],
  guaranteeRange: {
    min: 0,
    max: 0
  },
  acceptsDoorDeals: true,
  merchandising: true,
  travelMethod: 'van',
  lodging: 'flexible',
  priority: 'medium'
});

/**
 * 🎯 MICRO-PHASE E: Form State Consolidation Hook
 * 
 * Consolidates the massive 39-line addDateForm state object from TabbedTourItinerary
 * to reduce component complexity and improve form state management.
 * 
 * Extracted features:
 * - Complete form state with types
 * - Utility functions for common operations
 * - Venue/artist selection helpers
 * - Equipment and range updates
 * - Form reset and type switching
 */
export function useAddDateForm(): [AddDateFormState, AddDateFormActions, React.Dispatch<React.SetStateAction<AddDateFormState>>] {
  const [formState, setFormState] = useState<AddDateFormState>(getInitialFormState);

  const updateForm = useCallback((updates: Partial<AddDateFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateEquipment = useCallback((equipment: Partial<AddDateFormState['equipment']>) => {
    setFormState(prev => ({
      ...prev,
      equipment: { ...prev.equipment, ...equipment }
    }));
  }, []);

  const updateGuaranteeRange = useCallback((range: Partial<AddDateFormState['guaranteeRange']>) => {
    setFormState(prev => ({
      ...prev,
      guaranteeRange: { ...prev.guaranteeRange, ...range }
    }));
  }, []);

  const setVenueFromSearch = useCallback((venue: { id: string; name: string; city: string; state: string; capacity?: number }) => {
    setFormState(prev => ({
      ...prev,
      venueId: venue.id,
      venueName: venue.name,
      location: `${venue.city}, ${venue.state}`,
      capacity: venue.capacity?.toString() || ''
    }));
  }, []);

  const setArtistFromSearch = useCallback((artist: { id: string; name: string }) => {
    setFormState(prev => ({
      ...prev,
      artistId: artist.id,
      artistName: artist.name
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState(getInitialFormState());
  }, []);

  const setFormType = useCallback((type: 'request' | 'confirmed' | 'offer') => {
    setFormState(prev => ({ ...prev, type }));
  }, []);

  const actions: AddDateFormActions = {
    updateForm,
    updateEquipment,
    updateGuaranteeRange,
    setVenueFromSearch,
    setArtistFromSearch,
    resetForm,
    setFormType
  };

  return [formState, actions, setFormState];
} 
export type TemplateType = 'TECH_RIDER' | 'BUSINESS' | 'LOGISTICS' | 'COMPLETE';

export interface ArtistTemplate {
  id: string;
  artistId: string;
  name: string; // "Full Band Setup", "Acoustic Tour", "Festival Setup"
  type: TemplateType;
  isDefault: boolean;
  description?: string;
  
  // Tech Rider
  equipment?: {
    needsPA?: boolean;
    needsMics?: boolean;
    needsDrums?: boolean;
    needsAmps?: boolean;
    acoustic?: boolean;
    [key: string]: any; // Allow additional equipment fields
  };
  stageRequirements?: string;
  soundCheckTime?: number; // Minutes needed for soundcheck
  setLength?: number; // Set length in minutes
  
  // Business
  guaranteeRange?: {
    min: number;
    max: number;
  };
  acceptsDoorDeals?: boolean;
  merchandising?: boolean;
  
  // Logistics  
  travelMethod?: 'van' | 'flying' | 'train' | 'other' | string;
  lodging?: 'floor-space' | 'hotel' | 'flexible' | string;
  expectedDraw?: number | { min: number; max: number; description?: string };
  ageRestriction?: 'all-ages' | '18+' | '21+' | 'flexible' | string;
  tourStatus?: string;
  
  // Additional fields from database
  dietaryRestrictions?: string[];
  priority?: string;
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  TECH_RIDER: 'Tech Rider Only',
  BUSINESS: 'Business Terms Only', 
  LOGISTICS: 'Logistics Only',
  COMPLETE: 'Complete Template'
};

export interface TemplateFormData {
  name: string;
  type: TemplateType;
  isDefault: boolean;
  description?: string;
  
  // Tech Rider
  equipment?: {
    needsPA?: boolean;
    needsMics?: boolean;
    needsDrums?: boolean;
    needsAmps?: boolean;
    acoustic?: boolean;
  };
  stageRequirements?: string;
  soundCheckTime?: number;
  setLength?: number;
  
  // Business
  guaranteeRange?: {
    min: number;
    max: number;
  };
  acceptsDoorDeals?: boolean;
  merchandising?: boolean;
  
  // Logistics
  travelMethod?: string;
  lodging?: string;
  expectedDraw?: number;
  ageRestriction?: string;
  tourStatus?: string;
  notes?: string;
}

export interface TemplateSelectorProps {
  artistId: string;
  onTemplateApply: (template: ArtistTemplate) => void;
  className?: string;
  disabled?: boolean;
}

export interface TemplateManagerProps {
  artistId: string;
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated?: (template: ArtistTemplate) => void;
  onTemplateUpdated?: (template: ArtistTemplate) => void;
  onTemplateDeleted?: (templateId: string) => void;
} 
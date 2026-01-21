import React, { useState } from 'react';
import { VenueType, ArtistType, VENUE_TYPE_LABELS, ARTIST_TYPE_LABELS } from '../../../types/index';
import MediaEmbedSection from '../MediaEmbedSection';
import { EquipmentFeaturesModule, EquipmentState } from './EquipmentFeaturesModule';
import { PricingPaymentModule, PricingData } from './PricingPaymentModule';
import { ArtistDetailsModule, ArtistDetailsData } from './ArtistDetailsModule';

// Types for the modular form system
export interface EntityFormContext {
  mode: 'create' | 'edit' | 'admin';
  entityType: 'artist' | 'venue';
  userRole?: 'user' | 'moderator' | 'admin';
}

export interface BaseFormData {
  // Common fields between artists and venues
  name: string;
  location: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  images: string[];
}

export interface VenueFormData {
  // Basic Information
  name: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  description: string;
  images: string[];
  
  // Venue-specific basic fields
  streetAddress: string;
  addressLine2: string;
  postalCode: string;
  neighborhood: string;
  country: string;
  venueType: VenueType;
  capacity: string;
  agePolicy: string;
  contactName: string;
  contactWebsite: string;
  preferredContact: string;
  artistTypesWelcome: string[];
  allArtistTypesWelcome: boolean;
  genres: string[];
  
  // Additional Details (modular)
  equipment: EquipmentState;
  features: string[];
  pricing: PricingData;
  
  // Admin-only fields
  hasAccount?: boolean;
  adminNotes?: string;
}

export interface ArtistFormData {
  // Basic Information
  name: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  description: string;
  images: string[];
  
  // Artist-specific basic fields
  artistType: ArtistType;
  genres: string[];
  socialHandles: string;
  
  // Additional Details (modular)
  artistDetails: ArtistDetailsData;
  
  // Admin-only fields
  hasAccount?: boolean;
  adminNotes?: string;
}

// Expandable Section Component
interface ExpandableSectionProps {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  subtitle,
  expanded,
  onToggle,
  children,
  className = ""
}) => {
  return (
    <section className={`bg-bg-secondary border border-border-subtle p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-text-accent uppercase tracking-wider">
            <span className="text-text-muted mr-2">&gt;</span>
            {title.toUpperCase().replace(/\s+/g, '_')}
          </h3>
          {subtitle && <p className="text-2xs text-text-muted mt-1">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center space-x-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-2 border border-border-default hover:border-border-strong uppercase tracking-wider"
        >
          <span>{expanded ? '[HIDE]' : '[SHOW]'}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {expanded && (
        <div className="transition-all duration-300 ease-in-out">
          {children}
        </div>
      )}
    </section>
  );
};

// Detailed Information Module - handles images, embeds, advanced settings
interface DetailedInfoModuleProps {
  entityType: 'artist' | 'venue';
  entityId?: string;
  formData: BaseFormData;
  onChange: (updates: Partial<BaseFormData>) => void;
  context: EntityFormContext;
}

export const DetailedInfoModule: React.FC<DetailedInfoModuleProps> = ({
  entityType,
  entityId,
  formData,
  onChange,
  context
}) => {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setUploadError('');
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', entityType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const result = await response.json();
      
      // Add the new image to the form data
      onChange({
        images: [...formData.images, result.imageUrl]
      });

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = (indexToRemove: number) => {
    onChange({
      images: formData.images.filter((_, index) => index !== indexToRemove)
    });
  };

  return (
    <div className="space-y-8">
      {/* Images Section */}
      <div>
        <h4 className="text-xs font-medium text-text-accent mb-4 uppercase tracking-wider">IMAGES</h4>
        
        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
            UPLOAD_IMAGES
          </label>
          <div className="border-2 border-dashed border-border-default p-6 text-center hover:border-text-accent transition-colors bg-bg-tertiary">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
              id="image-upload"
              disabled={uploadingImage}
            />
            <label
              htmlFor="image-upload"
              className={`cursor-pointer ${uploadingImage ? 'opacity-50' : ''}`}
            >
              <div className="space-y-2">
                <div className="text-3xl text-text-muted">◇</div>
                <div className="text-xs text-text-secondary uppercase tracking-wider">
                  {uploadingImage ? 'UPLOADING...' : 'CLICK_TO_UPLOAD'}
                </div>
                <p className="text-2xs text-text-muted">PNG, JPG, GIF up to 10MB</p>
              </div>
            </label>
          </div>
          {uploadError && (
            <p className="mt-2 text-xs text-status-error">{uploadError}</p>
          )}
        </div>

        {/* Image Gallery */}
        {formData.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`${entityType} image ${index + 1}`}
                  className="w-full h-32 object-cover border border-border-subtle"
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className="absolute top-2 right-2 bg-status-error text-white w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Embeds Section */}
      {entityId && (
        <div>
          <h4 className="text-xs font-medium text-text-accent mb-4 uppercase tracking-wider">MEDIA_&_LINKS</h4>
          <MediaEmbedSection
            entityType={entityType}
            entityId={entityId}
          />
        </div>
      )}

      {/* Additional Description */}
      <div>
        <h4 className="text-xs font-medium text-text-accent mb-4 uppercase tracking-wider">ADDITIONAL_INFO</h4>
        <div>
          <label htmlFor="detailed-description" className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
            DETAILED_DESCRIPTION
          </label>
          <textarea
            id="detailed-description"
            rows={6}
            value={formData.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            className="w-full px-4 py-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
            placeholder={`Tell us more about ${entityType === 'venue' ? 'your space, what makes it special' : 'your music, influences, and what makes you unique'}`}
          />
        </div>
      </div>
    </div>
  );
};

// Admin-Only Module - Contains admin-specific features
export interface AdminOnlyModuleProps {
  data: {
    hasAccount?: boolean;
    adminNotes?: string;
    // Add any other admin-specific fields as needed
  };
  onChange: (field: string, value: any) => void;
  entityType: 'venue' | 'artist';
  entityId?: string;
  className?: string;
}

export const AdminOnlyModule: React.FC<AdminOnlyModuleProps> = ({
  data,
  onChange,
  entityType,
  entityId,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-status-error/5 border border-status-error/30 ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-status-error/10 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <span className="text-status-error text-lg">⚠</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-status-error uppercase tracking-wider">ADMIN_CONTROLS</h3>
            <p className="text-2xs text-text-muted">Administrative tools and settings</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <svg 
            className={`w-4 h-4 text-status-error transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Account Management */}
          <div>
            <h4 className="text-xs font-medium text-text-accent mb-3 uppercase tracking-wider">ACCOUNT_STATUS</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.hasAccount !== false}
                  onChange={(e) => onChange('hasAccount', e.target.checked)}
                  className="h-4 w-4 text-text-accent focus:ring-text-accent border-border-default bg-bg-tertiary"
                />
                <span className="ml-2 text-xs text-text-secondary uppercase">
                  {entityType === 'venue' ? 'VENUE' : 'ARTIST'}_HAS_ACCOUNT
                </span>
              </label>
              <p className="text-2xs text-text-muted ml-6">
                Uncheck if added by admin but no account yet
              </p>
            </div>
          </div>

          {/* Admin Notes Section */}
          <div>
            <h4 className="text-xs font-medium text-text-accent mb-3 uppercase tracking-wider">ADMIN_NOTES</h4>
            <textarea
              value={data.adminNotes || ''}
              onChange={(e) => onChange('adminNotes', e.target.value)}
              rows={3}
              className="w-full p-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
              placeholder="Internal notes (not visible to users)"
            />
            <p className="text-2xs text-text-muted mt-1">
              Only visible to administrators
            </p>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-xs font-medium text-text-accent mb-3 uppercase tracking-wider">QUICK_ACTIONS</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  alert('Verification email sent (feature to be implemented)');
                }}
                className="px-3 py-2 bg-status-info/10 border border-status-info/30 text-status-info hover:bg-status-info/20 transition-colors text-2xs uppercase tracking-wider"
              >
                [VERIFY_EMAIL]
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Password reset initiated (feature to be implemented)');
                }}
                className="px-3 py-2 bg-status-warning/10 border border-status-warning/30 text-status-warning hover:bg-status-warning/20 transition-colors text-2xs uppercase tracking-wider"
              >
                [RESET_PWD]
              </button>
              {entityId && (
                <button
                  type="button"
                  onClick={() => {
                    window.open(`/${entityType}s/${entityId}`, '_blank');
                  }}
                  className="px-3 py-2 bg-status-success/10 border border-status-success/30 text-status-success hover:bg-status-success/20 transition-colors text-2xs uppercase tracking-wider"
                >
                  [VIEW_PUBLIC]
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to suspend this ${entityType}?`)) {
                    alert('Account suspended (feature to be implemented)');
                  }
                }}
                className="px-3 py-2 bg-status-error/10 border border-status-error/30 text-status-error hover:bg-status-error/20 transition-colors text-2xs uppercase tracking-wider"
              >
                [SUSPEND]
              </button>
            </div>
            <p className="text-2xs text-text-muted mt-2">
              Actions to be implemented in future updates
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Form Wrapper Component that provides consistent styling and behavior
interface FormWrapperProps {
  title: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitText?: string;
  children: React.ReactNode;
  submitMessage?: string;
}

export const FormWrapper: React.FC<FormWrapperProps> = ({
  title,
  subtitle,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText = 'Submit',
  children,
  submitMessage
}) => {
  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 border border-border-default flex items-center justify-center">
              <span className="text-text-accent font-bold text-sm">⚡</span>
            </div>
            <h1 className="text-sm font-medium text-text-primary uppercase tracking-wider">DIYSHOWS <span className="text-text-muted">beta</span></h1>
          </div>
          <h2 className="text-xl font-medium text-text-accent mb-4 uppercase tracking-wider">
            <span className="text-text-muted mr-2">&gt;</span>
            {title.toUpperCase().replace(/\s+/g, '_')}
          </h2>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>

        {/* Success/Error Message */}
        {submitMessage && (
          <div className={`mb-6 p-4 ${
            submitMessage.startsWith('Error') 
              ? 'bg-status-error/10 border border-status-error/30 text-status-error' 
              : 'bg-status-success/10 border border-status-success/30 text-status-success'
          } text-sm`}>
            {submitMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-8">
          {children}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-text-accent text-bg-primary py-4 px-6 hover:bg-text-primary transition-colors font-medium text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '[SUBMITTING...]' : `[${submitText.toUpperCase().replace(/\s+/g, '_')}]`}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 border border-border-default bg-bg-secondary text-text-secondary py-4 px-6 hover:bg-bg-hover transition-colors font-medium text-sm uppercase tracking-wider"
              >
                [CANCEL]
              </button>
            )}
          </div>

          <p className="text-2xs text-text-muted text-center uppercase tracking-wider">
            By submitting, you agree to our{' '}
            <a href="/guidelines" className="text-text-accent hover:text-text-primary underline">GUIDELINES</a>.
          </p>
        </form>
      </div>
    </div>
  );
};

// New Additional Details Module - UNIFIED with all submodules
export interface AdditionalDetailsModuleProps {
  data: {
    description: string;
    equipment: EquipmentState;
    features: string[];
    pricing: PricingData;
    images: string[];
    website?: string;
  };
  onChange: (field: string, value: any) => void;
  context: EntityFormContext;
  entityId?: string;
  className?: string;
}

export const AdditionalDetailsModule: React.FC<AdditionalDetailsModuleProps> = ({
  data,
  onChange,
  context,
  entityId,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange('description', e.target.value);
  };

  const handleEquipmentChange = (equipment: EquipmentState) => {
    onChange('equipment', equipment);
  };

  const handleFeaturesChange = (features: string[]) => {
    onChange('features', features);
  };

  const handlePricingChange = (pricing: PricingData) => {
    onChange('pricing', pricing);
  };

  // Image upload functionality (from DetailedInfoModule)
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setUploadError('');
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', context.entityType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const result = await response.json();
      
      // Add the new image to the form data
      onChange('images', [...data.images, result.imageUrl]);

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = (indexToRemove: number) => {
    onChange('images', data.images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <ExpandableSection
      title="Additional Details"
      subtitle="Description, images, equipment, features, and pricing"
      expanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      className={className}
    >
      <div className="space-y-8">
        {/* Description */}
        <div>
          <h4 className="text-xs font-medium text-text-accent mb-3 uppercase tracking-wider">DESCRIPTION</h4>
          <p className="text-2xs text-text-muted mb-4">
            Tell artists about your {context.entityType}, the vibe, what makes it special...
          </p>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={data.description}
            onChange={handleDescriptionChange}
            className="w-full px-4 py-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
            placeholder={`Describe your ${context.entityType} - atmosphere, style, what makes it unique...`}
          />
        </div>

        {/* Images & Media Submodule */}
        <div className="border-t border-border-subtle pt-6">
          <h4 className="text-xs font-medium text-text-accent mb-3 uppercase tracking-wider">IMAGES_&_MEDIA</h4>
          
          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
              UPLOAD_IMAGES
            </label>
            <div 
              className="border-2 border-dashed border-border-default p-6 text-center hover:border-text-accent transition-colors cursor-pointer bg-bg-tertiary"
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                const imageFile = files.find(file => file.type.startsWith('image/'));
                if (imageFile) {
                  handleImageUpload(imageFile);
                } else {
                  setUploadError('Please drop an image file (JPG, PNG, or WebP)');
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
                id="image-upload"
                disabled={uploadingImage}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${uploadingImage ? 'opacity-50' : ''}`}
              >
                <div className="space-y-2">
                  <div className="text-3xl text-text-muted">◇</div>
                  <div className="text-xs text-text-secondary uppercase tracking-wider">
                    {uploadingImage ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-text-accent"></div>
                        <span>UPLOADING...</span>
                      </div>
                    ) : (
                      <>CLICK_TO_UPLOAD or drag and drop</>
                    )}
                  </div>
                  <p className="text-2xs text-text-muted">PNG, JPG, WebP up to 10MB</p>
                </div>
              </label>
            </div>
            {uploadError && (
              <p className="mt-2 text-xs text-status-error">{uploadError}</p>
            )}
          </div>

          {/* Image Gallery */}
          {data.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {data.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`${context.entityType} image ${index + 1}`}
                    className="w-full h-32 object-cover border border-border-subtle"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-2 right-2 bg-status-error text-white w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Media Embeds Section */}
          {entityId ? (
            <div>
              <h5 className="text-2xs font-medium text-text-secondary mb-3 uppercase tracking-wider">MEDIA_&_LINKS</h5>
              <MediaEmbedSection
                entityType={context.entityType}
                entityId={entityId}
              />
            </div>
          ) : (
            <div>
              <h5 className="text-2xs font-medium text-text-secondary mb-3 uppercase tracking-wider">MEDIA_&_LINKS</h5>
              <div className="bg-bg-tertiary border border-border-subtle p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-text-accent flex-shrink-0">[i]</span>
                  <div>
                    <h6 className="text-xs font-medium text-text-accent uppercase">AVAILABLE_AFTER_CREATION</h6>
                    <p className="text-2xs text-text-muted mt-1">
                      Once your {context.entityType} is created, you can add YouTube, Spotify, SoundCloud, and other media.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Equipment & Features (only for venues) */}
        {context.entityType === 'venue' && (
          <div className="border-t border-gray-200 pt-6">
            <EquipmentFeaturesModule
              equipment={data.equipment}
              features={data.features}
              onEquipmentChange={handleEquipmentChange}
              onFeaturesChange={handleFeaturesChange}
            />
          </div>
        )}

        {/* Pricing & Payment (only for venues) */}
        {context.entityType === 'venue' && (
          <div className="border-t border-gray-200 pt-6">
            <PricingPaymentModule
              pricing={data.pricing}
              onPricingChange={handlePricingChange}
              showAdvancedOptions={context.userRole === 'admin'}
            />
          </div>
        )}
      </div>
    </ExpandableSection>
  );
};

// Artist-specific Additional Details Module
export interface ArtistAdditionalDetailsModuleProps {
  data: {
    description: string;
    artistDetails: ArtistDetailsData;
    images: string[];
    website?: string;
    socialLinks?: string;
    artistType: ArtistType;
  };
  onChange: (field: string, value: any) => void;
  context: EntityFormContext;
  entityId?: string;
  className?: string;
}

export const ArtistAdditionalDetailsModule: React.FC<ArtistAdditionalDetailsModuleProps> = ({
  data,
  onChange,
  context,
  entityId,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange('description', e.target.value);
  };

  const handleArtistDetailsChange = (details: ArtistDetailsData) => {
    onChange('artistDetails', details);
  };

  const handleSocialLinksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('socialLinks', e.target.value);
  };

  // Image upload functionality (same as venue module)
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setUploadError('');
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', context.entityType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const result = await response.json();
      
      // Add the new image to the form data
      onChange('images', [...data.images, result.imageUrl]);

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = (indexToRemove: number) => {
    onChange('images', data.images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <ExpandableSection
      title="Additional Details"
      subtitle="Performance details, images, social media, and description"
      expanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      className={className}
    >
      <div className="space-y-8">
        {/* Description */}
        <div>
          <h4 className="text-xs font-medium text-text-accent mb-3 uppercase tracking-wider">ARTIST_DESCRIPTION</h4>
          <p className="text-2xs text-text-muted mb-4">
            Describe your sound, influences, what makes you unique...
          </p>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={data.description}
            onChange={handleDescriptionChange}
            className="w-full px-4 py-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
            placeholder="Tell venues about your music, style, influences, and what makes you special..."
          />
        </div>

        {/* Images & Media Submodule */}
        <div className="border-t border-border-subtle pt-6">
          <h4 className="text-xs font-medium text-text-accent mb-3 uppercase tracking-wider">IMAGES_&_MEDIA</h4>
          
          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
              UPLOAD_IMAGES
            </label>
            <div 
              className="border-2 border-dashed border-border-default p-6 text-center hover:border-text-accent transition-colors cursor-pointer bg-bg-tertiary"
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                const imageFile = files.find(file => file.type.startsWith('image/'));
                if (imageFile) {
                  handleImageUpload(imageFile);
                } else {
                  setUploadError('Please drop an image file (JPG, PNG, or WebP)');
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
                id="image-upload"
                disabled={uploadingImage}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${uploadingImage ? 'opacity-50' : ''}`}
              >
                <div className="space-y-2">
                  <div className="text-3xl text-text-muted">◇</div>
                  <div className="text-xs text-text-secondary uppercase tracking-wider">
                    {uploadingImage ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-text-accent"></div>
                        <span>UPLOADING...</span>
                      </div>
                    ) : (
                      <>CLICK_TO_UPLOAD or drag and drop</>
                    )}
                  </div>
                  <p className="text-2xs text-text-muted">PNG, JPG, WebP up to 10MB</p>
                </div>
              </label>
            </div>
            {uploadError && (
              <p className="mt-2 text-xs text-status-error">{uploadError}</p>
            )}
          </div>

          {/* Image Gallery */}
          {data.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {data.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`${context.entityType} image ${index + 1}`}
                    className="w-full h-32 object-cover border border-border-subtle"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-2 right-2 bg-status-error text-white w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Social Media */}
          <div className="mb-6">
            <label htmlFor="social-handles" className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
              SOCIAL_MEDIA (optional)
            </label>
            <input
              id="social-handles"
              name="socialHandles"
              type="text"
              value={data.socialLinks || ''}
              onChange={handleSocialLinksChange}
              className="w-full px-4 py-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
              placeholder="@yourband on Instagram, Facebook, etc."
            />
          </div>

          {/* Media Embeds Section */}
          {entityId ? (
            <div>
              <h5 className="text-2xs font-medium text-text-secondary mb-3 uppercase tracking-wider">MEDIA_&_LINKS</h5>
              <MediaEmbedSection
                entityType={context.entityType}
                entityId={entityId}
              />
            </div>
          ) : (
            <div>
              <h5 className="text-2xs font-medium text-text-secondary mb-3 uppercase tracking-wider">MEDIA_&_LINKS</h5>
              <div className="bg-bg-tertiary border border-border-subtle p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-text-accent flex-shrink-0">[i]</span>
                  <div>
                    <h6 className="text-xs font-medium text-text-accent uppercase">AVAILABLE_AFTER_CREATION</h6>
                    <p className="text-2xs text-text-muted mt-1">
                      Once your {context.entityType} is created, you can add YouTube, Spotify, SoundCloud, and other media.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Artist Performance Details (only for artists) */}
        {context.entityType === 'artist' && (
          <div className="border-t border-gray-200 pt-6">
            <ArtistDetailsModule
              artistType={data.artistType}
              details={data.artistDetails}
              onDetailsChange={handleArtistDetailsChange}
            />
          </div>
        )}
      </div>
    </ExpandableSection>
  );
}; 
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
    <section className={`bg-gray-50 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center space-x-2 text-sm font-medium text-black hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-lg px-3 py-2"
        >
          <span>{expanded ? 'Hide Details' : 'Show Details'}</span>
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
        <h4 className="text-lg font-semibold mb-4">Images</h4>
        
        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Images
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-sm text-gray-600">
                  {uploadingImage ? 'Uploading...' : 'Click to upload an image'}
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </label>
          </div>
          {uploadError && (
            <p className="mt-2 text-sm text-red-600">{uploadError}</p>
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
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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
          <h4 className="text-lg font-semibold mb-4">Media & Links</h4>
          <MediaEmbedSection
            entityType={entityType}
            entityId={entityId}
          />
        </div>
      )}

      {/* Additional Description */}
      <div>
        <h4 className="text-lg font-semibold mb-4">Additional Information</h4>
        <div>
          <label htmlFor="detailed-description" className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description
          </label>
          <textarea
            id="detailed-description"
            rows={6}
            value={formData.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder={`Tell us more about ${entityType === 'venue' ? 'your space, what makes it special, any unique features or history' : 'your music, influences, experience, and what makes you unique as an artist'}`}
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
    <div className={`bg-red-50 border border-red-200 rounded-xl ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-red-100 transition-colors rounded-xl"
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-red-900">Admin Controls</h3>
            <p className="text-sm text-red-700">Administrative tools and settings</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <svg 
            className={`w-5 h-5 text-red-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
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
            <h4 className="text-lg font-medium text-red-900 mb-3">Account Status</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.hasAccount !== false}
                  onChange={(e) => onChange('hasAccount', e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {entityType === 'venue' ? 'Venue' : 'Artist'} has platform account
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Uncheck if this {entityType} was added by admin but doesn't have their own account yet
              </p>
            </div>
          </div>

          {/* Admin Notes Section */}
          <div>
            <h4 className="text-lg font-medium text-red-900 mb-3">Admin Notes</h4>
            <textarea
              value={data.adminNotes || ''}
              onChange={(e) => onChange('adminNotes', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Internal notes for admin use only (not visible to users)"
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes are only visible to administrators
            </p>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-lg font-medium text-red-900 mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  alert('Verification email sent (feature to be implemented)');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Send Verification Email
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Password reset initiated (feature to be implemented)');
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                Reset Password
              </button>
              {entityId && (
                <button
                  type="button"
                  onClick={() => {
                    window.open(`/${entityType}s/${entityId}`, '_blank');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  View Public Profile
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to suspend this ${entityType}?`)) {
                    alert('Account suspended (feature to be implemented)');
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Suspend Account
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              These actions will be implemented in future updates
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
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img 
              src="/logo.png" 
              alt="diyshows logo" 
              className="w-8 h-8 rounded-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center hidden">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">diyshows <span className="text-sm font-normal text-gray-500">beta</span></h1>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        </div>

        {/* Success/Error Message */}
        {submitMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            submitMessage.startsWith('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
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
              className="flex-1 bg-black text-white py-4 px-6 rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : submitText}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 border border-gray-300 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg"
              >
                Cancel
              </button>
            )}
          </div>

          <p className="text-sm text-gray-600 text-center">
            By submitting, you agree to our{' '}
            <a href="/guidelines" className="text-black hover:underline">community guidelines</a>.
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
          <h4 className="text-lg font-medium text-gray-800 mb-3">Description</h4>
          <p className="text-sm text-gray-600 mb-4">
            Tell artists about your {context.entityType}, the vibe, what makes it special...
          </p>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={data.description}
            onChange={handleDescriptionChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder={`Describe your ${context.entityType} - atmosphere, style, what makes it unique...`}
          />
        </div>

        {/* Images & Media Submodule */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-800 mb-3">Images & Media</h4>
          
          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
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
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    {uploadingImage ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB</p>
                </div>
              </label>
            </div>
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
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
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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
              <h5 className="text-md font-medium text-gray-700 mb-3">Media & Links</h5>
              <MediaEmbedSection
                entityType={context.entityType}
                entityId={entityId}
              />
            </div>
          ) : (
            <div>
              <h5 className="text-md font-medium text-gray-700 mb-3">Media & Links</h5>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h6 className="text-sm font-medium text-blue-800">Media content available after creation</h6>
                    <p className="text-sm text-blue-700 mt-1">
                      Once your {context.entityType} is created, you'll be able to add YouTube videos, Spotify tracks, SoundCloud sets, and other media content to showcase your work.
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
          <h4 className="text-lg font-medium text-gray-800 mb-3">Artist Description</h4>
          <p className="text-sm text-gray-600 mb-4">
            Describe your sound, influences, what makes you unique...
          </p>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={data.description}
            onChange={handleDescriptionChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Tell venues about your music, style, influences, and what makes you special..."
          />
        </div>

        {/* Images & Media Submodule */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-800 mb-3">Images & Media</h4>
          
          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
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
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    {uploadingImage ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB</p>
                </div>
              </label>
            </div>
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
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
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Social Media */}
          <div className="mb-6">
            <label htmlFor="social-handles" className="block text-sm font-medium text-gray-700 mb-2">
              Social Media (optional)
            </label>
            <input
              id="social-handles"
              name="socialHandles"
              type="text"
              value={data.socialLinks || ''}
              onChange={handleSocialLinksChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="@yourband on Instagram, Facebook, etc."
            />
          </div>

          {/* Media Embeds Section */}
          {entityId ? (
            <div>
              <h5 className="text-md font-medium text-gray-700 mb-3">Media & Links</h5>
              <MediaEmbedSection
                entityType={context.entityType}
                entityId={entityId}
              />
            </div>
          ) : (
            <div>
              <h5 className="text-md font-medium text-gray-700 mb-3">Media & Links</h5>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h6 className="text-sm font-medium text-blue-800">Media content available after creation</h6>
                    <p className="text-sm text-blue-700 mt-1">
                      Once your {context.entityType} is created, you'll be able to add YouTube videos, Spotify tracks, SoundCloud sets, and other media content to showcase your work.
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
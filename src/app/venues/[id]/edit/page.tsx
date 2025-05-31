'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EntityForm from '../../../../components/forms/EntityForm';
import { VenueFormData, ArtistFormData, EntityFormContext, AdditionalDetailsModule } from '../../../../components/forms/EntityFormModules';
import { EquipmentState } from '../../../../components/forms/EquipmentFeaturesModule';
import { PricingData } from '../../../../components/forms/PricingPaymentModule';
import LocationAutocomplete from '../../../../components/LocationAutocomplete';
import { Venue, VenueType, VENUE_TYPE_LABELS, CAPACITY_OPTIONS, ArtistType, ARTIST_TYPE_LABELS, getGenresForArtistTypes } from '../../../../../types/index';
import { useAuth } from '../../../../contexts/AuthContext';

export default function EditVenue({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [venueId, setVenueId] = useState<string>('');
  const [showGenreDetails, setShowGenreDetails] = useState(false);
  
  // Form state - using the new modular structure
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: '',
    images: [],
    // Venue-specific fields (same structure as add a space)
    streetAddress: '',
    addressLine2: '',
    postalCode: '',
    neighborhood: '',
    country: 'USA',
    venueType: 'house-show' as VenueType,
    capacity: '',
    agePolicy: 'all-ages',
    contactName: '',
    contactWebsite: '',
    preferredContact: 'email',
    artistTypesWelcome: [],
    allArtistTypesWelcome: false,
    genres: [],
    // Additional Details (modular)
    equipment: {},
    features: [],
    pricing: {
      guarantee: 0,
      door: false,
      merchandise: false,
    },
  });

  // Additional state for fields not yet fully integrated into modular system
  const [additionalData, setAdditionalData] = useState({
    city: '',
    state: '',
    hasAccount: true,
    unavailableDates: [] as string[],
  });

  useEffect(() => {
    const loadVenueAndCheckPermission = async () => {
      try {
        const resolvedParams = await params;
        setVenueId(resolvedParams.id);
        
        // Load venue data
        const response = await fetch(`/api/venues/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Venue not found');
        }
        const venueData = await response.json();
        setVenue(venueData);
        
        // Check permissions (same logic as original)
        if (!user) {
          setHasPermission(false);
          setCheckingPermission(false);
          return;
        }

        const membersResponse = await fetch(`/api/members?entityType=venue&entityId=${resolvedParams.id}`);
        if (membersResponse.ok) {
          const members = await membersResponse.json();
          const userMembership = members.find((member: any) => member.id === user.id);
          
          if (userMembership && (userMembership.role === 'Owner' || userMembership.role === 'Staff')) {
            setHasPermission(true);
          } else if (user.role === 'admin') {
            setHasPermission(true);
          } else {
            setHasPermission(false);
          }
        } else {
          setHasPermission(false);
        }
        
        // Map venue data to modular structure
        setFormData({
          name: venueData.name || '',
          location: `${venueData.city || ''}, ${venueData.state || ''}${venueData.country && venueData.country !== 'USA' ? ', ' + venueData.country : ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
          contactEmail: venueData.contact?.email || '',
          contactPhone: venueData.contact?.phone || '',
          website: venueData.contact?.website || '',
          description: venueData.description || '',
          images: venueData.images || [],
          // Venue-specific
          streetAddress: venueData.streetAddress || '',
          addressLine2: venueData.addressLine2 || '',
          postalCode: venueData.postalCode || '',
          neighborhood: venueData.neighborhood || '',
          country: venueData.country || 'USA',
          venueType: venueData.venueType,
          capacity: venueData.capacity?.toString() || '',
          agePolicy: venueData.ageRestriction || 'all-ages',
          contactName: venueData.contactName || '',
          contactWebsite: venueData.contact?.website || '',
          preferredContact: 'email',
          artistTypesWelcome: venueData.artistTypesWelcome || [],
          allArtistTypesWelcome: !venueData.artistTypesWelcome || venueData.artistTypesWelcome.length === 0,
          genres: venueData.genres || [],
          // Additional Details (modular)
          equipment: venueData.equipment || {},
          features: venueData.features || [],
          pricing: venueData.pricing || {
            guarantee: 0,
            door: false,
            merchandise: false,
          },
        });

        // Additional data not yet in modular system
        setAdditionalData({
          city: venueData.city || '',
          state: venueData.state || '',
          hasAccount: venueData.hasAccount !== undefined ? venueData.hasAccount : true,
          unavailableDates: venueData.unavailableDates || [],
        });
      } catch (error) {
        console.error('Failed to load venue:', error);
        setError('Failed to load venue');
      } finally {
        setLoading(false);
        setCheckingPermission(false);
      }
    };

    if (user !== undefined) {
      loadVenueAndCheckPermission();
    }
  }, [params, user]);

  // Form handlers (same as add a space form)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
  };

  const handleCheckboxChange = (name: string, value: string) => {
    setFormData(prev => {
      const currentValue = prev[name as keyof VenueFormData];
      
      // Only handle array properties
      if (Array.isArray(currentValue)) {
        return {
          ...prev,
          [name]: currentValue.includes(value)
            ? currentValue.filter(item => item !== value)
            : [...currentValue, value]
        };
      }
      
      return prev;
    });
  };

  const handleAllArtistTypesChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allArtistTypesWelcome: checked,
      artistTypesWelcome: checked ? [] : prev.artistTypesWelcome,
      genres: checked ? [] : prev.genres
    }));
    if (checked) {
      setShowGenreDetails(false);
    }
  };

  // Handler for Additional Details Module
  const handleAdditionalDetailsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit handler - integrates with modular system
  const handleSubmit = async (completeData: VenueFormData | ArtistFormData) => {
    // Type guard to ensure we're working with venue data
    if (!('venueType' in completeData)) {
      throw new Error('Invalid data type for venue form');
    }
    
    const venueData = completeData as VenueFormData;
    
    // Parse location back to city/state/country (same logic as add a space)
    const locationParts = formData.location.split(',').map(part => part.trim());
    let city = '';
    let state = '';
    let country = 'USA';

    if (locationParts.length >= 2) {
      city = locationParts[0];
      if (locationParts.length === 2) {
        const secondPart = locationParts[1];
        if (secondPart.length > 2 && !['USA', 'US'].includes(secondPart.toUpperCase())) {
          country = secondPart;
          state = '';
        } else {
          state = secondPart;
          country = 'USA';
        }
      } else if (locationParts.length >= 3) {
        state = locationParts[1];
        country = locationParts[2];
      }
    } else if (locationParts.length === 1) {
      city = locationParts[0];
    }

    // Combine all data for API (same format as original)
    const finalData = {
      ...venueData, // Includes all modular form data
      ...additionalData, // Include the additional fields
      city,
      state,
      country,
      capacity: formData.capacity ? parseInt(formData.capacity) : 0,
      ageRestriction: formData.agePolicy,
      contact: {
        email: formData.contactEmail,
        phone: formData.contactPhone,
        website: formData.website,
        social: '', // Keep for compatibility
      },
      artistTypesWelcome: formData.allArtistTypesWelcome ? [] : formData.artistTypesWelcome,
      genres: formData.allArtistTypesWelcome ? [] : formData.genres,
    };

    const response = await fetch(`/api/venues/${venueId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update venue');
    }

    // Redirect to venue profile
    router.push(`/venues/${venueId}`);
  };

  const handleCancel = () => {
    router.push(`/venues/${venueId}`);
  };

  // Context for the modular system
  const context: EntityFormContext = {
    mode: 'edit',
    entityType: 'venue',
    userRole: user?.role === 'admin' ? 'admin' : 'user'
  };

  // Loading and permission checks (same as original)
  if (loading || checkingPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit this venue profile. Only members with edit permissions can make changes.
          </p>
          <Link 
            href={`/venues/${venue?.id}`}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue not found</h1>
          <Link href="/?tab=venues" className="text-blue-600 hover:text-blue-800">
            ← Back to venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <EntityForm
      entityType="venue"
      context={context}
      initialData={formData}
      entityId={venueId}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title="Edit Venue Profile"
      subtitle={`Update ${venue.name}'s information`}
      submitText="Save Changes"
      disableAutoDetailedInfo={true}
    >
      {/* 
        EXACT SAME BASIC FORM SECTIONS FROM ADD A SPACE
        Using the same modular components and structure
      */}
      
      {/* Basic Information - EXACT SAME as add a space */}
      <section className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-6">Basic Information</h3>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="space-name" className="block text-sm font-medium text-gray-700 mb-2">
              Space Name *
            </label>
            <input
              id="space-name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="The space name (e.g., Joe's Basement, The Red House)"
            />
          </div>

          {/* Address Fields */}
          <div>
            <label htmlFor="street-address" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              id="street-address"
              name="streetAddress"
              type="text"
              value={formData.streetAddress}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="123 Main Street (optional but helpful for touring bands)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="address-line-2" className="block text-sm font-medium text-gray-700 mb-2">
                Apt/Suite/Unit (optional)
              </label>
              <input
                id="address-line-2"
                name="addressLine2"
                type="text"
                value={formData.addressLine2}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Apt 2B, Suite 100, etc."
              />
            </div>
            <div>
              <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700 mb-2">
                ZIP/Postal Code
              </label>
              <input
                id="postal-code"
                name="postalCode"
                type="text"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="12345"
              />
            </div>
          </div>

          <div>
            <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
              Neighborhood/District (optional)
            </label>
            <input
              id="neighborhood"
              name="neighborhood"
              type="text"
              value={formData.neighborhood}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="e.g., East Village, Five Points, Williamsburg"
            />
          </div>

          {/* Location Autocomplete - EXACT SAME as add a space */}
          <LocationAutocomplete
            value={formData.location}
            onChange={handleLocationChange}
            placeholder="e.g., London, UK or Portland, OR"
            required
            label="Location"
            showLabel={true}
            className=""
          />

          <div>
            <label htmlFor="space-type" className="block text-sm font-medium text-gray-700 mb-2">
              Space Type *
            </label>
            <select
              id="space-type"
              name="venueType"
              required
              value={formData.venueType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Select space type...</option>
              {Object.entries(VENUE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Space Details - EXACT SAME as add a space */}
      <section className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-6">Space Details</h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Capacity
              </label>
              <select
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Select capacity...</option>
                {CAPACITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="age-policy" className="block text-sm font-medium text-gray-700 mb-2">
                Age Policy
              </label>
              <select
                id="age-policy"
                name="agePolicy"
                value={formData.agePolicy}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all-ages">All Ages</option>
                <option value="18+">18+</option>
                <option value="21+">21+</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Booking - EXACT SAME as add a space */}
      <section className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-6">Contact & Booking</h3>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">
              Booking Contact Name *
            </label>
            <input
              id="contact-name"
              name="contactName"
              type="text"
              required
              value={formData.contactName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Who should bands contact for booking?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                id="contact-email"
                name="contactEmail"
                type="email"
                required
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="booking@email.com"
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone (optional)
              </label>
              <input
                id="contact-phone"
                name="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Phone number"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-website" className="block text-sm font-medium text-gray-700 mb-2">
              Website (optional)
            </label>
            <input
              id="contact-website"
              name="contactWebsite"
              type="url"
              value={formData.contactWebsite}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label htmlFor="preferred-contact" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Contact Method
            </label>
            <select
              id="preferred-contact"
              name="preferredContact"
              value={formData.preferredContact}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="text">Text Message</option>
              <option value="social">Social Media</option>
            </select>
          </div>
        </div>
      </section>

      {/* Artist Types Welcome - EXACT SAME as add a space */}
      <section className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-6">Artist Types Welcome</h3>
        
        <div className="space-y-6">
          {/* All Artist Types Welcome Checkbox */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allArtistTypesWelcome}
                onChange={(e) => handleAllArtistTypesChange(e.target.checked)}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">All Artist Types Welcome</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Check this if you welcome all types of performers, or uncheck to specify particular types.
            </p>
          </div>

          {/* Specific Artist Types - only show if "All Types" is unchecked */}
          {!formData.allArtistTypesWelcome && (
            <div className="transition-all duration-300 ease-in-out">
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Specific Artist Types (check all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(ARTIST_TYPE_LABELS).map(([value, label]) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="checkbox"
                        name="artistTypesWelcome"
                        value={value}
                        checked={formData.artistTypesWelcome.includes(value)}
                        onChange={(e) => handleCheckboxChange('artistTypesWelcome', value)}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Progressive Disclosure: Genre Categories - only show if specific types are selected */}
          {!formData.allArtistTypesWelcome && formData.artistTypesWelcome.length > 0 && (
            <div className="transition-all duration-300 ease-in-out">
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Genre Preferences (optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGenreDetails(!showGenreDetails)}
                    className="text-sm text-black hover:underline focus:outline-none"
                  >
                    {showGenreDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Select specific genres you specialize in, or leave blank to welcome all styles within your selected artist types.
                </p>
                
                {showGenreDetails && (
                  <div className="space-y-4">
                    {/* Music Genres */}
                    {formData.artistTypesWelcome.some(type => 
                      ['band', 'solo', 'duo', 'collective', 'singer-songwriter', 'experimental'].includes(type)
                    ) && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Music Genres</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {getGenresForArtistTypes(
                            formData.artistTypesWelcome.filter(type => 
                              ['band', 'solo', 'duo', 'collective', 'singer-songwriter', 'experimental'].includes(type)
                            ) as ArtistType[]
                          ).map((genre) => (
                            <label key={`music-${genre.value}`} className="flex items-center">
                              <input
                                type="checkbox"
                                name="genres"
                                value={genre.value}
                                checked={formData.genres.includes(genre.value)}
                                onChange={(e) => handleCheckboxChange('genres', genre.value)}
                                className="h-3 w-3 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <span className="ml-2 text-xs text-gray-700">{genre.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Electronic Genres */}
                    {formData.artistTypesWelcome.includes('dj') && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Electronic Styles</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {getGenresForArtistTypes(['dj'] as ArtistType[]).map((genre) => (
                            <label key={`electronic-${genre.value}`} className="flex items-center">
                              <input
                                type="checkbox"
                                name="genres"
                                value={genre.value}
                                checked={formData.genres.includes(genre.value)}
                                onChange={(e) => handleCheckboxChange('genres', genre.value)}
                                className="h-3 w-3 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <span className="ml-2 text-xs text-gray-700">{genre.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hip-Hop Genres */}
                    {formData.artistTypesWelcome.includes('rapper') && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Hip-Hop Styles</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {getGenresForArtistTypes(['rapper'] as ArtistType[]).map((genre) => (
                            <label key={`hiphop-${genre.value}`} className="flex items-center">
                              <input
                                type="checkbox"
                                name="genres"
                                value={genre.value}
                                checked={formData.genres.includes(genre.value)}
                                onChange={(e) => handleCheckboxChange('genres', genre.value)}
                                className="h-3 w-3 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <span className="ml-2 text-xs text-gray-700">{genre.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comedy Styles */}
                    {formData.artistTypesWelcome.includes('comedian') && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Comedy Styles</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {getGenresForArtistTypes(['comedian'] as ArtistType[]).map((genre) => (
                            <label key={`comedy-${genre.value}`} className="flex items-center">
                              <input
                                type="checkbox"
                                name="genres"
                                value={genre.value}
                                checked={formData.genres.includes(genre.value)}
                                onChange={(e) => handleCheckboxChange('genres', genre.value)}
                                className="h-3 w-3 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <span className="ml-2 text-xs text-gray-700">{genre.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Spoken Word */}
                    {formData.artistTypesWelcome.includes('poet') && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Poetry & Spoken Word</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {getGenresForArtistTypes(['poet'] as ArtistType[]).map((genre) => (
                            <label key={`poetry-${genre.value}`} className="flex items-center">
                              <input
                                type="checkbox"
                                name="genres"
                                value={genre.value}
                                checked={formData.genres.includes(genre.value)}
                                onChange={(e) => handleCheckboxChange('genres', genre.value)}
                                className="h-3 w-3 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <span className="ml-2 text-xs text-gray-700">{genre.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other Performance Types */}
                    {formData.artistTypesWelcome.some(type => 
                      ['dancer', 'theater-group', 'storyteller', 'variety', 'visual-artist', 'lecturer'].includes(type)
                    ) && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Performance Styles</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {getGenresForArtistTypes(
                            formData.artistTypesWelcome.filter(type => 
                              ['dancer', 'theater-group', 'storyteller', 'variety', 'visual-artist', 'lecturer'].includes(type)
                            ) as ArtistType[]
                          ).map((genre) => (
                            <label key={`performance-${genre.value}`} className="flex items-center">
                              <input
                                type="checkbox"
                                name="genres"
                                value={genre.value}
                                checked={formData.genres.includes(genre.value)}
                                onChange={(e) => handleCheckboxChange('genres', genre.value)}
                                className="h-3 w-3 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <span className="ml-2 text-xs text-gray-700">{genre.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* NEW MODULAR ADDITIONAL DETAILS SECTION */}
      <AdditionalDetailsModule
        data={{
          description: formData.description,
          equipment: formData.equipment,
          features: formData.features,
          pricing: formData.pricing,
          images: formData.images,
          website: formData.website,
        }}
        onChange={handleAdditionalDetailsChange}
        context={context}
        entityId={venueId}
      />
    </EntityForm>
  );
} 
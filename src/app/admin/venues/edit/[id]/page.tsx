'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EntityForm from '../../../../../components/forms/EntityForm';
import { VenueFormData, ArtistFormData, EntityFormContext, AdditionalDetailsModule, AdminOnlyModule } from '../../../../../components/forms/EntityFormModules';
import LocationAutocomplete from '../../../../../components/LocationAutocomplete';
import { 
  Venue, 
  VenueType, 
  VENUE_TYPE_LABELS, 
  CAPACITY_OPTIONS, 
  getGenresForArtistTypes, 
  ARTIST_TYPE_LABELS,
  ArtistType
} from '../../../../../../types/index';

export default function EditVenue({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state using the new modular structure
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: '',
    images: [],
    // Venue-specific basic fields
    streetAddress: '',
    addressLine2: '',
    postalCode: '',
    neighborhood: '',
    country: 'USA',
    venueType: 'house-show' as VenueType,
    capacity: '50-100',
    agePolicy: 'all-ages',
    contactName: '',
    contactWebsite: '',
    preferredContact: 'email',
    artistTypesWelcome: [],
    allArtistTypesWelcome: false,
    genres: [],
    // Additional Details (modular)
    equipment: {
      pa: false,
      mics: false,
      drums: false,
      amps: false,
      piano: false,
      monitors: false,
      lighting: false,
      projector: false,
    },
    features: [],
    pricing: {
      guarantee: 0,
      door: false,
      merchandise: true,
    },
    // Admin-only fields
    hasAccount: true,
    adminNotes: '',
  });

  useEffect(() => {
    const loadVenue = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/venues/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Venue not found');
        }
        const venueData = await response.json();
        setVenue(venueData);
        
        // Transform venue data to match modular form structure
        const location = [venueData.city, venueData.state, venueData.country]
          .filter(Boolean)
          .join(', ');

        setFormData({
          name: venueData.name || '',
          location: location,
          contactEmail: venueData.contact?.email || '',
          contactPhone: venueData.contact?.phone || '',
          website: venueData.contact?.website || '',
          description: venueData.description || '',
          images: venueData.images || [],
          // Venue-specific basic fields
          streetAddress: venueData.streetAddress || '',
          addressLine2: venueData.addressLine2 || '',
          postalCode: venueData.postalCode || '',
          neighborhood: venueData.neighborhood || '',
          country: venueData.country || 'USA',
          venueType: venueData.venueType || 'house-show',
          capacity: venueData.capacity?.toString() || '50-100',
          agePolicy: venueData.ageRestriction || 'all-ages',
          contactName: venueData.contactName || '',
          contactWebsite: venueData.contact?.website || '',
          preferredContact: venueData.preferredContact || 'email',
          artistTypesWelcome: venueData.artistTypesWelcome || [],
          allArtistTypesWelcome: venueData.allArtistTypesWelcome || false,
          genres: venueData.genres || [],
          // Additional Details (modular)
          equipment: {
            pa: venueData.equipment?.pa || false,
            mics: venueData.equipment?.mics || false,
            drums: venueData.equipment?.drums || false,
            amps: venueData.equipment?.amps || false,
            piano: venueData.equipment?.piano || false,
            monitors: venueData.equipment?.monitors || false,
            lighting: venueData.equipment?.lighting || false,
            projector: venueData.equipment?.projector || false,
          },
          features: venueData.features || [],
          pricing: {
            guarantee: venueData.pricing?.guarantee || 0,
            door: venueData.pricing?.door || false,
            merchandise: venueData.pricing?.merchandise !== false,
          },
          // Admin-only fields
          hasAccount: venueData.hasAccount !== undefined ? venueData.hasAccount : true,
          adminNotes: venueData.adminNotes || '',
        });
      } catch (error) {
        console.error('Failed to load venue:', error);
        setError('Failed to load venue');
      } finally {
        setLoading(false);
      }
    };

    loadVenue();
  }, [params]);

  // Handler for Additional Details Module
  const handleAdditionalDetailsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for Admin Module
  const handleAdminChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit handler - integrates with modular system
  const handleSubmit = async (completeData: VenueFormData | ArtistFormData) => {
    // Type guard to ensure we're working with venue data
    if ('artistType' in completeData) {
      throw new Error('Invalid data type for venue form');
    }
    
    const venueData = completeData as VenueFormData;
    
    // Parse location back to city/state/country (same logic as regular edit form)
    const locationParts = venueData.location.split(',').map(part => part.trim());
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

    // Transform form data to match API expectations (same as original)
    const finalData = {
      name: venueData.name,
      city: city,
      state: state,
      country: country,
      streetAddress: venueData.streetAddress,
      addressLine2: venueData.addressLine2,
      postalCode: venueData.postalCode,
      neighborhood: venueData.neighborhood,
      venueType: venueData.venueType,
      capacity: parseInt(venueData.capacity) || 0,
      ageRestriction: venueData.agePolicy,
      artistTypesWelcome: venueData.artistTypesWelcome,
      allArtistTypesWelcome: venueData.allArtistTypesWelcome,
      genres: venueData.genres,
      equipment: venueData.equipment,
      features: venueData.features,
      pricing: {
        guarantee: venueData.pricing.guarantee || 0,
        door: venueData.pricing.door || false,
        merchandise: venueData.pricing.merchandise,
      },
      contact: {
        email: venueData.contactEmail,
        phone: venueData.contactPhone || undefined,
        social: venueData.contactName || undefined, // Map contactName to social for now
        website: venueData.website || undefined,
      },
      description: venueData.description,
      images: venueData.images,
      // Admin-only fields
      hasAccount: venueData.hasAccount,
      adminNotes: venueData.adminNotes,
    };

    const resolvedParams = await params;
    const response = await fetch(`/api/venues/${resolvedParams.id}`, {
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

    // Redirect back to admin dashboard
    router.push('/admin');
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  // Form handlers for basic sections
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
  };

  const handleCheckboxChange = (name: string, value: string) => {
    setFormData(prev => {
      if (name === 'artistTypesWelcome') {
        const currentTypes = prev.artistTypesWelcome;
        return {
          ...prev,
          artistTypesWelcome: currentTypes.includes(value)
            ? currentTypes.filter(item => item !== value)
            : [...currentTypes, value]
        };
      } else if (name === 'genres') {
        const currentGenres = prev.genres;
        return {
          ...prev,
          genres: currentGenres.includes(value)
            ? currentGenres.filter(item => item !== value)
            : [...currentGenres, value]
        };
      }
      return prev;
    });
  };

  const handleAllArtistTypesChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allArtistTypesWelcome: checked,
      artistTypesWelcome: checked ? [] : prev.artistTypesWelcome
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h1>
          <p className="text-gray-600 mb-6">
            The venue you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            href="/admin"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  // Context for the modular system (admin mode)
  const context: EntityFormContext = {
    mode: 'admin',
    entityType: 'venue',
    userRole: 'admin'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Venue (Admin)</h1>
              <p className="text-gray-600 mt-1">Update {venue.name}'s profile</p>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Main Site
              </Link>
              <Link 
                href="/admin"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <EntityForm
          entityType="venue"
          context={context}
          initialData={formData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          title={`Edit ${venue.name} (Admin)`}
          subtitle="Administrative venue profile management"
          submitText="Save Changes"
          disableAutoDetailedInfo={true}
          disableAutoAdminSection={true}
        >
          {/* Basic Information */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Basic Information</h3>
                
            <div className="space-y-6">
              <div>
                <label htmlFor="venue-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  id="venue-name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Your venue name"
                />
              </div>

              {/* Location Autocomplete */}
              <LocationAutocomplete
                value={formData.location}
                onChange={handleLocationChange}
                placeholder="e.g., Portland, OR or London, UK"
                required
                label="Location"
                showLabel={true}
                className=""
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="venue-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Type *
                  </label>
                  <select
                    id="venue-type"
                    name="venueType"
                    required
                    value={formData.venueType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select venue type...</option>
                    {Object.entries(VENUE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity *
                  </label>
                  <select
                    id="capacity"
                    name="capacity"
                    required
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
              </div>

              <div>
                <label htmlFor="age-policy" className="block text-sm font-medium text-gray-700 mb-2">
                  Age Policy *
                </label>
                <select
                  id="age-policy"
                  name="agePolicy"
                  required
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
          </section>

          {/* Contact & Booking */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Contact & Booking</h3>
            
            <div className="space-y-6">
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
                    placeholder="booking@yourvenue.com"
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
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website (optional)
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="https://yourvenue.com"
                />
              </div>
            </div>
          </section>

          {/* Artist Types Welcome */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Artist Types Welcome</h3>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allArtistTypesWelcome}
                    onChange={(e) => handleAllArtistTypesChange(e.target.checked)}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Welcome all artist types
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Check this if you're open to any type of performance
                </p>
              </div>

              {!formData.allArtistTypesWelcome && (
                <div className="transition-all duration-300 ease-in-out">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select specific artist types you welcome:
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
                  <p className="text-xs text-gray-500 mt-2">
                    Artists will see if your venue welcomes their type of performance
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Genres (only show if specific artist types are selected) */}
          {!formData.allArtistTypesWelcome && formData.artistTypesWelcome.length > 0 && (
            <section className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-6">Genres</h3>
              
              <div className="space-y-6">
                <div className="transition-all duration-300 ease-in-out">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Genres you typically book (optional):
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getGenresForArtistTypes(formData.artistTypesWelcome as ArtistType[]).map((genre) => (
                      <label key={genre.value} className="flex items-center">
                        <input
                          type="checkbox"
                          name="genres"
                          value={genre.value}
                          checked={formData.genres.includes(genre.value)}
                          onChange={(e) => handleCheckboxChange('genres', genre.value)}
                          className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{genre.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This helps artists find venues that match their style
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* UNIFIED VENUE ADDITIONAL DETAILS MODULE */}
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
            entityId={venue.id}
          />

          {/* ADMIN-ONLY MODULE */}
          <AdminOnlyModule
            data={{
              hasAccount: formData.hasAccount,
              adminNotes: formData.adminNotes,
            }}
            onChange={handleAdminChange}
            entityType="venue"
            entityId={venue.id}
          />
        </EntityForm>
      </main>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationAutocomplete from '../../../components/LocationAutocomplete';
import { VenueType, VENUE_TYPE_LABELS, CAPACITY_OPTIONS, ArtistType, ARTIST_TYPE_LABELS, getGenresForArtistTypes } from '../../../../types/index';

interface VenueFormData {
  name: string;
  streetAddress: string;
  addressLine2: string;
  postalCode: string;
  neighborhood: string;
  location: string; // Combined city, state, country instead of separate fields
  country: string;
  venueType: VenueType;
  capacity: string;
  agePolicy: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactWebsite: string;
  preferredContact: string;
  artistTypesWelcome: string[]; // Changed from genres to artist types
  allArtistTypesWelcome: boolean; // New field for "all types welcome"
  genres: string[];
}

export default function SubmitVenue() {
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    streetAddress: '',
    addressLine2: '',
    postalCode: '',
    neighborhood: '',
    location: '', // Combined location field
    country: 'USA',
    venueType: 'house-show' as VenueType, // Default to most common DIY venue type
    capacity: '50', // Default to common DIY venue size
    agePolicy: 'all-ages',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactWebsite: '',
    preferredContact: 'email',
    artistTypesWelcome: [], // Start empty since "all types" is checked by default
    allArtistTypesWelcome: true, // Default to all types welcome
    genres: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showGenreDetails, setShowGenreDetails] = useState(false); // New state for collapsing genres

  const router = useRouter();

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
      artistTypesWelcome: checked ? [] : prev.artistTypesWelcome, // Clear specific types if "all" is checked
      genres: checked ? [] : prev.genres // Clear genres if "all" is checked
    }));
    if (checked) {
      setShowGenreDetails(false); // Collapse genre details if "all" is checked
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Parse location into city, state, and country
      const locationParts = formData.location.split(',').map(part => part.trim());
      let city = '';
      let state = '';
      let country = formData.country; // Default to form country

      if (locationParts.length >= 2) {
        city = locationParts[0];
        
        // Handle different international formats:
        // "Portland, OR" (US)
        // "London, UK" (International without state)
        // "Toronto, ON, Canada" (International with state)
        if (locationParts.length === 2) {
          const secondPart = locationParts[1];
          // Check if it's a country (more than 2 chars, not a typical US state)
          if (secondPart.length > 2 && !['USA', 'US'].includes(secondPart.toUpperCase())) {
            // Likely "City, Country" format
            country = secondPart;
            state = '';
          } else {
            // Likely "City, State" format (US)
            state = secondPart;
            country = 'USA';
          }
        } else if (locationParts.length >= 3) {
          // "City, State, Country" format
          state = locationParts[1];
          country = locationParts[2];
        }
      } else if (locationParts.length === 1) {
        city = locationParts[0];
      }

      // Transform form data to match API expectations
      const venueData = {
        name: formData.name,
        streetAddress: formData.streetAddress || undefined,
        addressLine2: formData.addressLine2 || undefined,
        postalCode: formData.postalCode || undefined,
        neighborhood: formData.neighborhood || undefined,
        city: city,
        state: state,
        country: country,
        venueType: formData.venueType,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        agePolicy: formData.agePolicy,
        description: '',
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || undefined,
        contactWebsite: formData.contactWebsite || undefined,
        preferredContact: formData.preferredContact,
        artistTypesWelcome: formData.allArtistTypesWelcome ? [] : formData.artistTypesWelcome, // Send empty array if all types welcome
        genres: formData.allArtistTypesWelcome ? [] : formData.genres, // Send empty array if all types welcome
        sceneInfo: '',
      };

      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(venueData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit venue');
      }

      const createdVenue = await response.json();
      setSubmitMessage(`Success! ${createdVenue.name} has been added to DIY Shows and is now live on the site!`);
      
      // Redirect to the new venue's profile after a short delay
      setTimeout(() => {
        router.push(`/venues/${createdVenue.id}`);
      }, 2000);

    } catch (error) {
      setSubmitMessage(`Error: ${error instanceof Error ? error.message : 'Failed to submit venue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Check if there's browser history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to homepage if no history
      router.push('/');
    }
  };

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
                // Fallback to the original "B" logo if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center hidden">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">diyshows <span className="text-sm font-normal text-gray-500">beta</span></h1>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">List A Space</h2>
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
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
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

              {/* Location Autocomplete - replaces separate city/state fields */}
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

          {/* Space Details */}
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

          {/* Contact & Booking */}
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

          {/* Scene Context */}
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

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-black text-white py-4 px-6 rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Space Listing'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 border border-gray-300 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg"
            >
              Cancel
            </button>
          </div>

          <p className="text-sm text-gray-600 text-center">
            By submitting, you agree to our{' '}
            <a href="/guidelines" className="text-black hover:underline">community guidelines</a>.
            Your space listing will be live immediately and visible to artists looking for venues. You can apply for verification later to get a verified badge.
          </p>
        </form>
      </div>
    </div>
  );
} 
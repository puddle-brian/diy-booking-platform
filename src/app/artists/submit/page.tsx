'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationAutocomplete from '../../../components/LocationAutocomplete';
import { ArtistType, ARTIST_TYPE_LABELS, CAPACITY_OPTIONS, getGenresForArtistType, artistTypeHasGenres } from '../../../../types/index';

interface ArtistFormData {
  name: string;
  location: string; // Combined city, state instead of separate fields
  country: string;
  artistType: ArtistType;
  genres: string[];
  members: string;
  yearFormed: string;
  tourStatus: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  socialHandles: string;
  equipmentNeeds: string[];
  description: string;
  expectedDraw: string;
}

export default function SubmitArtist() {
  const [formData, setFormData] = useState<ArtistFormData>({
    name: '',
    location: '', // Combined location field
    country: 'USA',
    artistType: 'band' as ArtistType, // Default to most common type
    genres: [],
    members: '4', // Default to most common band size
    yearFormed: new Date().getFullYear().toString(), // Default to current year
    tourStatus: 'active',
    contactEmail: '',
    contactPhone: '',
    website: '',
    socialHandles: '',
    equipmentNeeds: [],
    description: '',
    expectedDraw: '50', // Default to match venue capacity default
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
  };

  const handleCheckboxChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name as keyof ArtistFormData].includes(value)
        ? (prev[name as keyof ArtistFormData] as string[]).filter(item => item !== value)
        : [...(prev[name as keyof ArtistFormData] as string[]), value]
    }));
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
      const artistData = {
        name: formData.name,
        city: city,
        state: state,
        country: country,
        artistType: formData.artistType,
        genres: formData.genres,
        // Only include members for artist types that show the field
        members: (['band', 'duo', 'collective', 'theater-group'].includes(formData.artistType) && formData.members) 
          ? parseInt(formData.members) 
          : undefined,
        // Only include yearFormed for artist types that show the field
        yearFormed: (['band', 'duo', 'collective', 'theater-group'].includes(formData.artistType) && formData.yearFormed) 
          ? (formData.yearFormed === 'earlier' ? 2000 : parseInt(formData.yearFormed)) 
          : undefined,
        tourStatus: formData.tourStatus,
        contactEmail: formData.contactEmail,
        website: formData.website || undefined,
        socialHandles: formData.socialHandles ? { social: formData.socialHandles } : undefined,
        equipmentNeeds: formData.equipmentNeeds.reduce((acc, item) => {
          acc[item] = true;
          return acc;
        }, {} as Record<string, boolean>),
        description: formData.description || undefined,
        expectedDraw: formData.expectedDraw || undefined,
        images: [], // We can add this later
      };

      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(artistData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit artist');
      }

      const createdArtist = await response.json();
      setSubmitMessage(`Success! ${createdArtist.name} has been added to DIY Shows and is now live on the site!`);
      
      // Redirect to the new artist's profile after a short delay
      setTimeout(() => {
        router.push(`/artists/${createdArtist.id}`);
      }, 2000);
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        country: 'USA',
        artistType: 'band' as ArtistType,
        genres: [],
        members: '4',
        yearFormed: new Date().getFullYear().toString(),
        tourStatus: 'active',
        contactEmail: '',
        contactPhone: '',
        website: '',
        socialHandles: '',
        equipmentNeeds: [],
        description: '',
        expectedDraw: '50',
      });

    } catch (error) {
      setSubmitMessage(`Error: ${error instanceof Error ? error.message : 'Failed to submit artist'}`);
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4">List An Artist</h2>
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
                <label htmlFor="artist-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Artist/Band Name *
                </label>
                <input
                  id="artist-name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Your artist or band name"
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
                <label htmlFor="artist-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Artist Type *
                </label>
                <select
                  id="artist-type"
                  name="artistType"
                  required
                  value={formData.artistType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select artist type...</option>
                  {Object.entries(ARTIST_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Artist Details */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Artist Details</h3>
            
            <div className="space-y-6">
              {/* Conditional Members - only show for multi-member artist types */}
              {(['band', 'duo', 'collective', 'theater-group'].includes(formData.artistType)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ease-in-out">
                  <div>
                    <label htmlFor="members" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Members
                    </label>
                    <select
                      id="members"
                      name="members"
                      value={formData.members}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7+</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="year-formed" className="block text-sm font-medium text-gray-700 mb-2">
                      Year Formed
                    </label>
                    <select
                      id="year-formed"
                      name="yearFormed"
                      value={formData.yearFormed}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">Select year...</option>
                      {Array.from({length: 15}, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        );
                      })}
                      <option value="earlier">Earlier than {new Date().getFullYear() - 14}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Conditional Genres - show for artist types that have genres */}
              {artistTypeHasGenres(formData.artistType) && (
                <div className="transition-all duration-300 ease-in-out">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {formData.artistType === 'dj' ? 'Electronic Styles (check all that apply)' : 
                     formData.artistType === 'rapper' ? 'Hip-Hop Styles (check all that apply)' :
                     formData.artistType === 'comedian' ? 'Comedy Styles (check all that apply)' :
                     formData.artistType === 'poet' ? 'Poetry Styles (check all that apply)' :
                     formData.artistType === 'dancer' ? 'Dance Styles (check all that apply)' :
                     formData.artistType === 'theater-group' ? 'Theater Styles (check all that apply)' :
                     formData.artistType === 'lecturer' ? 'Lecture Topics (check all that apply)' :
                     formData.artistType === 'storyteller' ? 'Storytelling Styles (check all that apply)' :
                     formData.artistType === 'variety' ? 'Performance Types (check all that apply)' :
                     formData.artistType === 'visual-artist' ? 'Art Styles (check all that apply)' :
                     'Genres (check all that apply)'}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getGenresForArtistType(formData.artistType).map((genre) => (
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
                    Select the styles that best describe your work. This helps venues find the right fit.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="tour-status" className="block text-sm font-medium text-gray-700 mb-2">
                  Tour Status
                </label>
                <select
                  id="tour-status"
                  name="tourStatus"
                  value={formData.tourStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="active">Actively touring</option>
                  <option value="seeking-shows">Looking for shows</option>
                  <option value="local-only">Local shows only</option>
                  <option value="hiatus">On hiatus</option>
                </select>
              </div>

              <div>
                <label htmlFor="expected-draw" className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Draw
                </label>
                <select
                  id="expected-draw"
                  name="expectedDraw"
                  value={formData.expectedDraw}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select expected draw...</option>
                  {CAPACITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Artist Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Describe your sound, influences, what makes you unique..."
                />
              </div>
            </div>
          </section>

          {/* Contact & Links */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Contact & Links</h3>
            
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
                    placeholder="booking@yourband.com"
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
                  placeholder="https://yourband.com"
                />
              </div>

              <div>
                <label htmlFor="social-handles" className="block text-sm font-medium text-gray-700 mb-2">
                  Social Media (optional)
                </label>
                <input
                  id="social-handles"
                  name="socialHandles"
                  type="text"
                  value={formData.socialHandles}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="@yourband on Instagram, Facebook, etc."
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-black text-white py-4 px-6 rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Artist Profile'}
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
            Your artist profile will be live immediately and visible to venues looking for acts to book.
          </p>
        </form>
      </div>
    </div>
  );
} 
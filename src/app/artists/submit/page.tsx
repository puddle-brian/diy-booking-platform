'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EntityForm from '../../../components/forms/EntityForm';
import { ArtistFormData, VenueFormData, EntityFormContext, ArtistAdditionalDetailsModule } from '../../../components/forms/EntityFormModules';
import { ArtistDetailsData } from '../../../components/forms/ArtistDetailsModule';
import LocationAutocomplete from '../../../components/LocationAutocomplete';
import { 
  ARTIST_TYPE_LABELS, 
  CAPACITY_OPTIONS, 
  getGenresForArtistType, 
  artistTypeHasGenres,
  ARTIST_STATUS_OPTIONS,
  type ArtistType,
  type ArtistStatus
} from '../../../../types/index';
import SubmitChoice from '../../../components/SubmitChoice';

export default function SubmitArtist() {
  return (
    <SubmitChoice entityType="artist">
      <ArtistForm />
    </SubmitChoice>
  );
}

function ArtistForm() {
  const router = useRouter();

  // Form state using the new modular structure
  const [formData, setFormData] = useState<ArtistFormData>({
    name: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: '',
    images: [],
    // Artist-specific basic fields
    artistType: 'band' as ArtistType,
    genres: [],
    socialHandles: '',
    // Additional Details (modular)
    artistDetails: {
      members: '4',
      yearFormed: new Date().getFullYear().toString(),
      status: 'seeking-shows' as ArtistStatus,
      expectedDraw: '50',
    },
  });

  // Form handlers (same as before)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
  };

  const handleCheckboxChange = (name: string, value: string) => {
    setFormData(prev => {
      if (name === 'genres') {
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

  // Handler for Additional Details Module
  const handleAdditionalDetailsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit handler - integrates with modular system
  const handleSubmit = async (completeData: ArtistFormData | VenueFormData) => {
    // Type guard to ensure we're working with artist data
    if (!('artistType' in completeData)) {
      throw new Error('Invalid data type for artist form');
    }
    
    const artistData = completeData as ArtistFormData;
    
    // Parse location back to city/state/country (same logic as before)
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

    // Transform form data to match API expectations
    const finalData = {
      name: artistData.name,
      city: city,
      state: state,
      country: country,
      artistType: artistData.artistType,
      genres: artistData.genres,
      // Only include members for artist types that show the field
      members: (['band', 'duo', 'collective', 'theater-group'].includes(artistData.artistType) && artistData.artistDetails.members) 
        ? parseInt(artistData.artistDetails.members) 
        : undefined,
      // Only include yearFormed for artist types that show the field
      yearFormed: (['band', 'duo', 'collective', 'theater-group'].includes(artistData.artistType) && artistData.artistDetails.yearFormed) 
        ? (artistData.artistDetails.yearFormed === 'earlier' ? 2000 : parseInt(artistData.artistDetails.yearFormed)) 
        : undefined,
      status: artistData.artistDetails.status,
      contactEmail: artistData.contactEmail,
      website: artistData.website || undefined,
      socialHandles: artistData.socialHandles || undefined,
      expectedDraw: artistData.artistDetails.expectedDraw || undefined,
      description: artistData.description,
      images: artistData.images,
    };

    const response = await fetch('/api/artists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit artist');
    }

    const createdArtist = await response.json();
    
    // Redirect to the new artist's profile
    setTimeout(() => {
      router.push(`/artists/${createdArtist.id}`);
    }, 2000);
  };

  const handleCancel = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Context for the modular system
  const context: EntityFormContext = {
    mode: 'create',
    entityType: 'artist',
    userRole: 'user'
  };

  return (
    <EntityForm
      entityType="artist"
      context={context}
      initialData={formData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title="List An Artist"
      submitText="Submit Artist"
      disableAutoDetailedInfo={true}
    >
      {/* 
        EXACT SAME BASIC FORM SECTIONS FROM ORIGINAL
        Using the same structure and components
      */}
      
      {/* Basic Information */}
      <section className="bg-bg-secondary border border-border-subtle p-6">
        <h3 className="text-sm font-medium text-text-accent mb-6 uppercase tracking-wider">Basic Information</h3>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="artist-name" className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
              Artist/Band Name *
            </label>
            <input
              id="artist-name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
              placeholder="Your artist or band name"
            />
          </div>

          {/* Location Autocomplete */}
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
            <label htmlFor="artist-type" className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
              Artist Type *
            </label>
            <select
              id="artist-type"
              name="artistType"
              required
              value={formData.artistType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
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

      {/* Genres Section - only show for artist types that have genres */}
      {artistTypeHasGenres(formData.artistType) && (
        <section className="bg-bg-secondary border border-border-subtle p-6">
          <h3 className="text-sm font-medium text-text-accent mb-6 uppercase tracking-wider">
            {formData.artistType === 'dj' ? 'Electronic Styles' : 
             formData.artistType === 'rapper' ? 'Hip-Hop Styles' :
             formData.artistType === 'comedian' ? 'Comedy Styles' :
             formData.artistType === 'poet' ? 'Poetry Styles' :
             formData.artistType === 'dancer' ? 'Dance Styles' :
             formData.artistType === 'theater-group' ? 'Theater Styles' :
             formData.artistType === 'lecturer' ? 'Lecture Topics' :
             formData.artistType === 'storyteller' ? 'Storytelling Styles' :
             formData.artistType === 'variety' ? 'Performance Types' :
             formData.artistType === 'visual-artist' ? 'Art Styles' :
             'Genres'}
          </h3>
          
          <div className="space-y-6">
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
          </div>
        </section>
      )}

      {/* Contact & Links */}
      <section className="bg-bg-secondary border border-border-subtle p-6">
        <h3 className="text-sm font-medium text-text-accent mb-6 uppercase tracking-wider">Contact & Links</h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-email" className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                Email *
              </label>
              <input
                id="contact-email"
                name="contactEmail"
                type="email"
                required
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
                placeholder="booking@yourband.com"
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                Phone (optional)
              </label>
              <input
                id="contact-phone"
                name="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
                placeholder="Phone number"
              />
            </div>
          </div>

          <div>
            <label htmlFor="website" className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
              Website (optional)
            </label>
            <input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
              placeholder="https://yourband.com"
            />
          </div>
        </div>
      </section>

      {/* UNIFIED ARTIST ADDITIONAL DETAILS MODULE */}
      <ArtistAdditionalDetailsModule
        data={{
          description: formData.description,
          artistDetails: formData.artistDetails,
          images: formData.images,
          website: formData.website,
          socialLinks: formData.socialHandles,
          artistType: formData.artistType,
        }}
        onChange={handleAdditionalDetailsChange}
        context={context}
      />
    </EntityForm>
  );
} 
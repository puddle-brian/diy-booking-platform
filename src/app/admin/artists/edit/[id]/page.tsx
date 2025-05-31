'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EntityForm from '../../../../../components/forms/EntityForm';
import { ArtistFormData, VenueFormData, EntityFormContext, ArtistAdditionalDetailsModule, AdminOnlyModule } from '../../../../../components/forms/EntityFormModules';
import { ArtistDetailsData } from '../../../../../components/forms/ArtistDetailsModule';
import LocationAutocomplete from '../../../../../components/LocationAutocomplete';
import { 
  Artist, 
  ArtistType, 
  ARTIST_TYPE_LABELS, 
  getGenresForArtistType, 
  artistTypeHasGenres,
  type ArtistStatus
} from '../../../../../../types/index';

export default function EditArtist({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    // Admin-only fields
    hasAccount: true,
    adminNotes: '',
  });

  useEffect(() => {
    const loadArtist = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/artists/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Artist not found');
        }
        const artistData = await response.json();
        setArtist(artistData);
        
        // Transform artist data to match modular form structure
        const location = [artistData.city, artistData.state, artistData.country]
          .filter(Boolean)
          .join(', ');

        setFormData({
          name: artistData.name || '',
          location: location,
          contactEmail: artistData.contact?.email || '',
          contactPhone: artistData.contact?.phone || '',
          website: artistData.contact?.website || '',
          description: artistData.description || '',
          images: artistData.images || [],
          // Artist-specific basic fields
          artistType: artistData.artistType || 'band',
          genres: artistData.genres || [],
          socialHandles: artistData.contact?.social || '',
          // Additional Details (modular)
          artistDetails: {
            members: artistData.members?.toString() || '4',
            yearFormed: artistData.yearFormed?.toString() || new Date().getFullYear().toString(),
            status: artistData.tourStatus || 'seeking-shows',
            expectedDraw: artistData.expectedDraw || '50',
          },
          // Admin-only fields
          hasAccount: artistData.hasAccount !== undefined ? artistData.hasAccount : true,
          adminNotes: artistData.adminNotes || '',
        });
      } catch (error) {
        console.error('Failed to load artist:', error);
        setError('Failed to load artist');
      } finally {
        setLoading(false);
      }
    };

    loadArtist();
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
  const handleSubmit = async (completeData: ArtistFormData | VenueFormData) => {
    // Type guard to ensure we're working with artist data
    if (!('artistType' in completeData)) {
      throw new Error('Invalid data type for artist form');
    }
    
    const artistData = completeData as ArtistFormData;
    
    // Parse location back to city/state/country (same logic as regular edit form)
    const locationParts = artistData.location.split(',').map(part => part.trim());
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
      tourStatus: artistData.artistDetails.status,
      contact: {
        email: artistData.contactEmail,
        phone: artistData.contactPhone || undefined,
        social: artistData.socialHandles || undefined,
        website: artistData.website || undefined,
      },
      expectedDraw: artistData.artistDetails.expectedDraw || undefined,
      description: artistData.description,
      images: artistData.images,
      // Admin-only fields
      hasAccount: artistData.hasAccount,
      adminNotes: artistData.adminNotes,
    };

    const resolvedParams = await params;
    const response = await fetch(`/api/artists/${resolvedParams.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update artist');
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

  if (!artist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Artist Not Found</h1>
          <p className="text-gray-600 mb-6">
            The artist you're looking for doesn't exist or has been removed.
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
    entityType: 'artist',
    userRole: 'admin'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Artist (Admin)</h1>
              <p className="text-gray-600 mt-1">Update {artist.name}'s profile</p>
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
          entityType="artist"
          context={context}
          initialData={formData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          title={`Edit ${artist.name} (Admin)`}
          subtitle="Administrative artist profile management"
          submitText="Save Changes"
          disableAutoDetailedInfo={true}
          disableAutoAdminSection={true}
        >
          {/* 
            EXACT SAME BASIC FORM SECTIONS FROM USER EDIT FORM
            Using the same structure and components for consistency
          */}
          
          {/* Basic Information */}
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

          {/* Genres Section - only show for artist types that have genres */}
          {artistTypeHasGenres(formData.artistType) && (
            <section className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-6">
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
            </div>
          </section>

          {/* UNIFIED ARTIST ADDITIONAL DETAILS MODULE */}
          <ArtistAdditionalDetailsModule
            data={{
              description: formData.description,
              artistDetails: formData.artistDetails,
              images: formData.images,
              website: formData.website,
              socialHandles: formData.socialHandles,
              artistType: formData.artistType,
            }}
            onChange={handleAdditionalDetailsChange}
            context={context}
            entityId={artist.id}
          />

          {/* ADMIN-ONLY MODULE */}
          <AdminOnlyModule
            data={{
              hasAccount: formData.hasAccount,
              adminNotes: formData.adminNotes,
            }}
            onChange={handleAdminChange}
            entityType="artist"
            entityId={artist.id}
          />
        </EntityForm>
      </main>
    </div>
  );
} 
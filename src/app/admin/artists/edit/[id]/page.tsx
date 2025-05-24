'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Artist, ArtistType, ARTIST_TYPE_LABELS } from '../../../../../../types';

export default function EditArtist({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    country: 'USA',
    artistType: 'band' as ArtistType,
    genres: [] as string[],
    members: 1,
    yearFormed: new Date().getFullYear(),
    tourStatus: 'active' as 'active' | 'hiatus' | 'selective' | 'local-only',
    equipment: {
      needsPA: false,
      needsMics: false,
      needsDrums: false,
      needsAmps: false,
      acoustic: false,
    },
    features: [] as string[],
    contact: {
      email: '',
      phone: '',
      social: '',
      website: '',
    },
    images: [] as string[],
    description: '',
    expectedDraw: '',
    tourRadius: 'regional' as 'local' | 'regional' | 'national' | 'international',
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
        
        // Populate form with artist data
        setFormData({
          name: artistData.name,
          city: artistData.city,
          state: artistData.state,
          country: artistData.country,
          artistType: artistData.artistType,
          genres: artistData.genres || [],
          members: artistData.members,
          yearFormed: artistData.yearFormed,
          tourStatus: artistData.tourStatus,
          equipment: artistData.equipment,
          features: artistData.features || [],
          contact: artistData.contact,
          description: artistData.description,
          expectedDraw: artistData.expectedDraw,
          tourRadius: artistData.tourRadius,
          images: artistData.images || [],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const resolvedParams = await params;
      const response = await fetch(`/api/artists/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update artist');
      }

      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'artist');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const result = await response.json();
      
      // Add the image URL to the form data
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, result.imageUrl]
      }));

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const availableGenres = ['punk', 'hardcore', 'folk', 'indie', 'rock', 'metal', 'emo', 'acoustic', 'experimental', 'post-hardcore', 'alternative'];
  const availableFeatures = ['touring', 'experienced', 'draw', 'professional', 'acoustic', 'energetic', 'intimate', 'legendary', 'merchandise'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading artist...</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Artist not found</h1>
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            ← Back to admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Artist</h1>
              <p className="text-gray-600 mt-1">Update {artist.name}'s profile</p>
            </div>
            <div className="flex space-x-4">
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Artist/Band Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Against Me!"
                />
              </div>

              <div>
                <label htmlFor="artistType" className="block text-sm font-medium text-gray-700 mb-2">
                  Artist Type *
                </label>
                <select
                  id="artistType"
                  required
                  value={formData.artistType}
                  onChange={(e) => setFormData({ ...formData, artistType: e.target.value as ArtistType })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {(Object.entries(ARTIST_TYPE_LABELS) as [ArtistType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Gainesville"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province *
                </label>
                <input
                  type="text"
                  id="state"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="FL"
                />
              </div>

              <div>
                <label htmlFor="members" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Members
                </label>
                <input
                  type="number"
                  id="members"
                  min="1"
                  max="20"
                  value={formData.members}
                  onChange={(e) => setFormData({ ...formData, members: parseInt(e.target.value) || 1 })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="yearFormed" className="block text-sm font-medium text-gray-700 mb-2">
                  Year Formed
                </label>
                <input
                  type="number"
                  id="yearFormed"
                  min="1950"
                  max={new Date().getFullYear()}
                  value={formData.yearFormed}
                  onChange={(e) => setFormData({ ...formData, yearFormed: parseInt(e.target.value) || new Date().getFullYear() })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Artist Images</h2>
            
            {/* Image Upload */}
            <div className="mb-6">
              <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images
              </label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> artist images
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or WebP (MAX. 5MB)</p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                        e.target.value = ''; // Reset input
                      }
                    }}
                  />
                </label>
              </div>
              {uploadingImage && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                  <span className="ml-2 text-sm text-gray-600">Uploading image...</span>
                </div>
              )}
            </div>

            {/* Image Previews */}
            {formData.images.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Uploaded Images ({formData.images.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.includes('/uploads/') 
                          ? image.replace('/uploads/', '/uploads/thumbnails/').replace('.webp', '-thumb.webp')
                          : image
                        }
                        alt={`Artist image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.src = image; // Fallback to original if thumbnail doesn't exist
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleImageRemove(index)}
                          className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tour Status & Reach */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Tour Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tourStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  Tour Status
                </label>
                <select
                  id="tourStatus"
                  value={formData.tourStatus}
                  onChange={(e) => setFormData({ ...formData, tourStatus: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="active">Actively Touring</option>
                  <option value="selective">Selective Shows</option>
                  <option value="local-only">Local Only</option>
                  <option value="hiatus">On Hiatus</option>
                </select>
              </div>

              <div>
                <label htmlFor="tourRadius" className="block text-sm font-medium text-gray-700 mb-2">
                  Tour Radius
                </label>
                <select
                  id="tourRadius"
                  value={formData.tourRadius}
                  onChange={(e) => setFormData({ ...formData, tourRadius: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="local">Local (within 50 miles)</option>
                  <option value="regional">Regional (within state/region)</option>
                  <option value="national">National</option>
                  <option value="international">International</option>
                </select>
              </div>

              <div>
                <label htmlFor="expectedDraw" className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Draw
                </label>
                <input
                  type="text"
                  id="expectedDraw"
                  value={formData.expectedDraw}
                  onChange={(e) => setFormData({ ...formData, expectedDraw: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="200-500 people"
                />
              </div>
            </div>
          </div>

          {/* Equipment Needs */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Equipment Needs</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(formData.equipment).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: { ...formData.equipment, [key]: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {key === 'needsPA' ? 'Needs PA System' :
                     key === 'needsMics' ? 'Needs Microphones' :
                     key === 'needsDrums' ? 'Needs Drum Kit' :
                     key === 'needsAmps' ? 'Needs Amplifiers' :
                     'Acoustic Performance'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Genres</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableGenres.map((genre) => (
                <label key={genre} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.genres.includes(genre)}
                    onChange={() => handleGenreToggle(genre)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{genre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Artist Features</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableFeatures.map((feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.contact.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, email: e.target.value }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="booking@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.contact.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, phone: e.target.value }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="social" className="block text-sm font-medium text-gray-700 mb-2">
                  Social Media
                </label>
                <input
                  type="text"
                  id="social"
                  value={formData.contact.social}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, social: e.target.value }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="@bandname"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  value={formData.contact.website}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, website: e.target.value }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Description</h2>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                About the Artist
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Describe the artist's style, experience, and what makes them unique..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
} 
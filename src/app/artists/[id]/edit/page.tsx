'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MediaEmbedSection from '../../../../components/MediaEmbedSection';
import { Artist, ArtistType, ARTIST_TYPE_LABELS, CAPACITY_OPTIONS, getGenresForArtistType, artistTypeHasGenres } from '../../../../../types/index';
import { useAuth } from '../../../../contexts/AuthContext';

export default function EditArtist({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
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
    const loadArtistAndCheckPermission = async () => {
      try {
        const resolvedParams = await params;
        
        // Load artist data
        const response = await fetch(`/api/artists/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Artist not found');
        }
        const artistData = await response.json();
        setArtist(artistData);
        
        // Check if user has permission to edit this artist
        if (!user) {
          setHasPermission(false);
          setCheckingPermission(false);
          return;
        }

        // Check membership and permissions
        const membersResponse = await fetch(`/api/members?entityType=artist&entityId=${resolvedParams.id}`);
        if (membersResponse.ok) {
          const members = await membersResponse.json();
          const userMembership = members.find((member: any) => member.id === user.id);
          
          if (userMembership && (userMembership.role === 'Owner' || userMembership.role === 'Member' || userMembership.role === 'Admin')) {
            setHasPermission(true);
          } else if (user.role === 'admin') {
            // Admins can always edit
            setHasPermission(true);
          } else {
            setHasPermission(false);
          }
        } else {
          setHasPermission(false);
        }
        
        // Populate form with artist data
        setFormData({
          name: artistData.name || '',
          city: artistData.city || '',
          state: artistData.state || '',
          country: artistData.country || 'USA',
          artistType: artistData.artistType || 'band',
          genres: artistData.genres || [],
          members: artistData.members || 1,
          yearFormed: artistData.yearFormed || new Date().getFullYear(),
          tourStatus: artistData.tourStatus || 'active',
          equipment: artistData.equipment || {
            needsPA: false,
            needsMics: false,
            needsDrums: false,
            needsAmps: false,
            acoustic: false,
          },
          features: artistData.features || [],
          contact: artistData.contact || {
            email: '',
            phone: '',
            social: '',
            website: '',
          },
          description: artistData.description || '',
          expectedDraw: artistData.expectedDraw || '',
          tourRadius: artistData.tourRadius || 'regional',
          images: artistData.images || [],
        });
      } catch (error) {
        console.error('Failed to load artist:', error);
        setError('Failed to load artist');
      } finally {
        setLoading(false);
        setCheckingPermission(false);
      }
    };

    if (user !== undefined) {
      loadArtistAndCheckPermission();
    }
  }, [params, user]);

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

      // Redirect back to artist profile
      router.push(`/artists/${resolvedParams.id}`);
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
      
      // Replace placeholder images with the new upload
      setFormData(prev => {
        // Filter out any placeholder images (those that start with /api/placeholder)
        const nonPlaceholderImages = prev.images.filter(img => !img.includes('/api/placeholder'));
        
        // Add the new image
        return {
          ...prev,
          images: [...nonPlaceholderImages, result.imageUrl]
        };
      });

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
            You don't have permission to edit this artist profile. Only members with edit permissions can make changes.
          </p>
          <Link 
            href={`/artists/${artist?.id}`}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Artist not found</h1>
          <Link href="/?tab=artists" className="text-blue-600 hover:text-blue-800">
            ← Back to artists
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
              <h1 className="text-3xl font-bold text-gray-900">Edit Artist Profile</h1>
              <p className="text-gray-600 mt-1">Update {artist.name}'s information</p>
            </div>
            <Link 
              href={`/artists/${artist.id}`}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Profile
            </Link>
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
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  id="country"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '' })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="USA">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Japan">Japan</option>
                  <option value="Australia">Australia</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Denmark">Denmark</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province {(formData.country === 'USA' || formData.country === 'Canada') ? '*' : ''}
                </label>
                <input
                  type="text"
                  id="state"
                  required={formData.country === 'USA' || formData.country === 'Canada'}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder={formData.country === 'USA' ? 'FL' : formData.country === 'Canada' ? 'ON' : 'Optional'}
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
                {formData.images.some(img => img.includes('/api/placeholder')) 
                  ? 'Replace Placeholder with Custom Image' 
                  : 'Upload Images'
                }
              </label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="image-upload" className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  formData.images.some(img => img.includes('/api/placeholder'))
                    ? 'border-blue-400 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className={`w-8 h-8 mb-4 ${
                      formData.images.some(img => img.includes('/api/placeholder'))
                        ? 'text-blue-500'
                        : 'text-gray-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className={`mb-2 text-sm ${
                      formData.images.some(img => img.includes('/api/placeholder'))
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }`}>
                      <span className="font-semibold">Click to upload</span> {
                        formData.images.some(img => img.includes('/api/placeholder'))
                          ? 'and replace placeholder'
                          : 'artist images'
                      }
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
                <h3 className="text-lg font-medium mb-4">Artist Images ({formData.images.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => {
                    const isPlaceholder = image.includes('/api/placeholder');
                    return (
                      <div key={index} className="relative group">
                        <img
                          src={image.includes('/uploads/') 
                            ? image.replace('/uploads/', '/uploads/thumbnails/').replace('.webp', '-thumb.webp')
                            : image
                          }
                          alt={`Artist image ${index + 1}`}
                          className={`w-full h-32 object-cover rounded-lg border ${
                            isPlaceholder ? 'border-yellow-300 border-2' : 'border-gray-300'
                          }`}
                          onError={(e) => {
                            e.currentTarget.src = image; // Fallback to original if thumbnail doesn't exist
                          }}
                        />
                        {isPlaceholder && (
                          <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                            Placeholder
                          </div>
                        )}
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
                    );
                  })}
                </div>
                
                {/* Show helpful message if there are placeholder images */}
                {formData.images.some(img => img.includes('/api/placeholder')) && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Tip:</strong> Upload a new image to automatically replace the placeholder thumbnail with your custom image.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tour Status & Reach */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Tour Status & Reach</h2>
            
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
                  <option value="local-only">Local Shows Only</option>
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
                  <option value="local">Local (same city/metro)</option>
                  <option value="regional">Regional (neighboring states)</option>
                  <option value="national">National</option>
                  <option value="international">International</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="expectedDraw" className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Draw
                </label>
                <select
                  id="expectedDraw"
                  value={formData.expectedDraw}
                  onChange={(e) => setFormData({ ...formData, expectedDraw: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select expected draw...</option>
                  {CAPACITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Genres</h2>
            {/* Conditional Genres */}
            {artistTypeHasGenres(formData.artistType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getGenresForArtistType(formData.artistType).map((genre) => (
                    <label key={genre.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.genres.includes(genre.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, genres: [...formData.genres, genre.value] });
                          } else {
                            setFormData({ ...formData, genres: formData.genres.filter(g => g !== genre.value) });
                          }
                        }}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{genre.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Equipment Needs */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Equipment Needs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.equipment.needsPA}
                  onChange={(e) => setFormData({
                    ...formData,
                    equipment: { ...formData.equipment, needsPA: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm">PA System</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.equipment.needsMics}
                  onChange={(e) => setFormData({
                    ...formData,
                    equipment: { ...formData.equipment, needsMics: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm">Microphones</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.equipment.needsDrums}
                  onChange={(e) => setFormData({
                    ...formData,
                    equipment: { ...formData.equipment, needsDrums: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm">Drum Kit</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.equipment.needsAmps}
                  onChange={(e) => setFormData({
                    ...formData,
                    equipment: { ...formData.equipment, needsAmps: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm">Amplifiers</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.equipment.acoustic}
                  onChange={(e) => setFormData({
                    ...formData,
                    equipment: { ...formData.equipment, acoustic: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm">Acoustic Set</span>
              </label>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Artist Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableFeatures.map((feature) => (
                <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm capitalize">{feature}</span>
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
                  placeholder="band@example.com"
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
                  placeholder="https://bandname.com"
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
                  placeholder="@bandname or social links"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Description</h2>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Tell venues and fans about your music, style, and what makes your live shows special..."
            />
          </div>

          {/* Media Embeds */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Media & Links</h2>
            <p className="text-gray-600 mb-6">Add YouTube videos, Spotify tracks, Bandcamp releases, and other media to showcase your music.</p>
            <MediaEmbedSection
              entityId={artist.id}
              entityType="artist"
              canEdit={true}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href={`/artists/${artist.id}`}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
} 
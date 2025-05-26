'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Venue, VenueType, VENUE_TYPE_LABELS } from '../../../../../../types/index';

export default function EditVenue({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [venueId, setVenueId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    country: 'USA',
    venueType: 'house-show' as VenueType,
    genres: [] as string[],
    capacity: 0,
    ageRestriction: 'all-ages' as 'all-ages' | '18+' | '21+',
    equipment: {
      pa: false,
      mics: false,
      drums: false,
      amps: false,
      piano: false,
    },
    features: [] as string[],
    pricing: {
      guarantee: 0,
      door: false,
      merchandise: false,
    },
    contact: {
      email: '',
      phone: '',
      social: '',
      website: '',
    },
    images: [] as string[],
    description: '',
    hasAccount: true,
    unavailableDates: [] as string[],
  });

  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const genreOptions = ['punk', 'hardcore', 'folk', 'indie', 'metal', 'electronic', 'experimental', 'country', 'hip-hop', 'jazz'];
  const featureOptions = ['basement', 'outdoor', 'stage', 'bar', 'kitchen', 'parking', 'accessible', 'professional', 'intimate'];

  useEffect(() => {
    const loadVenue = async () => {
      try {
        const resolvedParams = await params;
        setVenueId(resolvedParams.id);
        
        const response = await fetch(`/api/venues/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Venue not found');
        }
        
        const venue: Venue = await response.json();
        
        // Pre-populate form with existing data
        setFormData({
          name: venue.name,
          city: venue.city,
          state: venue.state,
          country: venue.country,
          venueType: venue.venueType,
          genres: venue.genres,
          capacity: venue.capacity,
          ageRestriction: venue.ageRestriction,
          equipment: venue.equipment,
          features: venue.features,
          pricing: venue.pricing,
          contact: {
            email: venue.contact.email,
            phone: venue.contact.phone || '',
            social: venue.contact.social || '',
            website: venue.contact.website || '',
          },
          images: venue.images,
          description: venue.description,
          hasAccount: venue.hasAccount,
          unavailableDates: venue.unavailableDates || [],
        });
      } catch (error) {
        setSubmitMessage(`Error loading venue: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadVenue();
  }, [params]);

  const handleGenreChange = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleFeatureChange = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadMessage('');

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('type', 'venue');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj,
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 501) {
          // Serverless environment - provide helpful message
          throw new Error(`${result.error}\n\nFor development: Use 'npm run dev' instead of the production build.\nFor production: Configure cloud storage (AWS S3, Cloudinary, etc.)`);
        }
        throw new Error(result.error || 'Upload failed');
      }

      // Add the uploaded image URL to the images array
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, result.imageUrl]
      }));

      setUploadMessage('Image uploaded successfully!');
    } catch (error) {
      setUploadMessage(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileUpload(imageFile);
    } else {
      setUploadMessage('Please drop an image file (JPG, PNG, or WebP)');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const addImage = () => {
    if (imageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()]
      }));
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.images.length === 0) {
      setSubmitMessage('Error: At least one image is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update venue');
      }

      setSubmitMessage('Venue updated successfully!');
      
      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
      
    } catch (error) {
      setSubmitMessage(`Error: ${error instanceof Error ? error.message : 'Failed to update venue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading venue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin"
            className="inline-flex items-center text-gray-600 hover:text-black mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Venue</h1>
          <p className="text-gray-600 mt-1">Update venue information and settings</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {submitMessage && (
            <div className={`mb-6 p-4 rounded-lg ${
              submitMessage.startsWith('Error') 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {submitMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Venue Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.contact.email}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* Venue Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Venue Type</label>
                <select
                  value={formData.venueType}
                  onChange={(e) => setFormData(prev => ({ ...prev, venueType: e.target.value as VenueType }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {(Object.entries(VENUE_TYPE_LABELS) as [VenueType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Restriction</label>
                <select
                  value={formData.ageRestriction}
                  onChange={(e) => setFormData(prev => ({ ...prev, ageRestriction: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="all-ages">All Ages</option>
                  <option value="18+">18+</option>
                  <option value="21+">21+</option>
                </select>
              </div>
            </div>

            {/* Genres */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genres</label>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map(genre => (
                  <label key={genre} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.genres.includes(genre)}
                      onChange={() => handleGenreChange(genre)}
                      className="mr-2"
                    />
                    <span className="text-sm">{genre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Images * (At least one required)</label>
              
              {/* Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-4 ${
                  isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                    <p className="text-blue-600 font-medium">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600 mb-2">
                      <strong>Drag and drop</strong> your venue photos here, or{' '}
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                        browse files
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-500">JPG, PNG, WebP up to 5MB</p>
                  </div>
                )}
              </div>

              {/* Upload Message */}
              {uploadMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  uploadMessage.includes('error') || uploadMessage.includes('Please drop') 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {uploadMessage}
                </div>
              )}

              {/* Alternative URL Input */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Or add image by URL:</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/venue-photo.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {/* Image Preview List */}
              {formData.images.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Current Images:</p>
                  {formData.images.map((img, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                      <img 
                        src={img} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.src = '/api/placeholder/other';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {img.startsWith('/uploads/') ? 'Uploaded file' : 'External URL'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{img}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Equipment</label>
              <div className="flex flex-wrap gap-4">
                {Object.entries(formData.equipment).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        equipment: { ...prev.equipment, [key]: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{key === 'pa' ? 'PA System' : key}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
              <div className="flex flex-wrap gap-2">
                {featureOptions.map(feature => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.features.includes(feature)}
                      onChange={() => handleFeatureChange(feature)}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Typical Guarantee ($)</label>
              <input
                type="number"
                value={formData.pricing.guarantee}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pricing: { ...prev.pricing, guarantee: parseInt(e.target.value) || 0 }
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Describe the venue, atmosphere, what makes it special..."
              />
            </div>

            {/* Platform Management */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform Management</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasAccount"
                  checked={formData.hasAccount}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasAccount: e.target.checked }))}
                  className="mr-3"
                />
                <label htmlFor="hasAccount" className="text-sm text-gray-700">
                  Venue actively manages bookings through this platform
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                If unchecked, artists will be directed to contact the venue directly
              </p>
            </div>

            {/* Unavailable Dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unavailable Dates</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="date"
                    id="newUnavailableDate"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const dateInput = document.getElementById('newUnavailableDate') as HTMLInputElement;
                      if (dateInput.value && !formData.unavailableDates.includes(dateInput.value)) {
                        setFormData(prev => ({
                          ...prev,
                          unavailableDates: [...prev.unavailableDates, dateInput.value].sort()
                        }));
                        dateInput.value = '';
                      }
                    }}
                    className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Add
                  </button>
                </div>
                
                {formData.unavailableDates && formData.unavailableDates.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Booked Dates:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.unavailableDates.map((date, index) => (
                        <div key={index} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-1">
                          <span className="text-sm text-red-700">{date}</span>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              unavailableDates: prev.unavailableDates.filter((_, i) => i !== index)
                            }))}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Add dates that are already booked to prevent double-booking requests
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting || formData.images.length === 0}
                className="flex-1 bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating Venue...' : 'Update Venue'}
              </button>
              <Link
                href="/admin"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
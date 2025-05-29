'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MediaEmbedSection from '../../../../components/MediaEmbedSection';
import { Venue, VenueType, VENUE_TYPE_LABELS } from '../../../../../types/index';
import { useAuth } from '../../../../contexts/AuthContext';

export default function EditVenue({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
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
    streetAddress: '',
    addressLine2: '',
    postalCode: '',
    neighborhood: '',
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

  useEffect(() => {
    const loadVenueAndCheckPermission = async () => {
      try {
        const resolvedParams = await params;
        
        // Load venue data
        const response = await fetch(`/api/venues/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Venue not found');
        }
        const venueData = await response.json();
        setVenue(venueData);
        
        // Check if user has permission to edit this venue
        if (!user) {
          setHasPermission(false);
          setCheckingPermission(false);
          return;
        }

        // Check membership and permissions
        const membersResponse = await fetch(`/api/members?entityType=venue&entityId=${resolvedParams.id}`);
        if (membersResponse.ok) {
          const members = await membersResponse.json();
          const userMembership = members.find((member: any) => member.id === user.id);
          
          if (userMembership && (userMembership.role === 'Owner' || userMembership.role === 'Staff')) {
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
        
        // Populate form with venue data
        setFormData({
          name: venueData.name || '',
          city: venueData.city || '',
          state: venueData.state || '',
          country: venueData.country || 'USA',
          streetAddress: venueData.streetAddress || '',
          addressLine2: venueData.addressLine2 || '',
          postalCode: venueData.postalCode || '',
          neighborhood: venueData.neighborhood || '',
          venueType: venueData.venueType,
          genres: venueData.genres || [],
          capacity: venueData.capacity || 0,
          ageRestriction: venueData.ageRestriction,
          equipment: venueData.equipment || {
            pa: false,
            mics: false,
            drums: false,
            amps: false,
            piano: false,
          },
          features: venueData.features || [],
          pricing: venueData.pricing || {
            guarantee: 0,
            door: false,
            merchandise: false,
          },
          contact: {
            email: venueData.contact?.email || '',
            phone: venueData.contact?.phone || '',
            social: venueData.contact?.social || '',
            website: venueData.contact?.website || '',
          },
          images: venueData.images || [],
          description: venueData.description || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const resolvedParams = await params;
      const response = await fetch(`/api/venues/${resolvedParams.id}`, {
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

      // Redirect back to venue profile
      router.push(`/venues/${resolvedParams.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

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
    setUploadingImage(true);
    setError('');

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
        if (response.status === 500 && result.error?.includes('Cloud storage not configured')) {
          // Cloudinary not configured
          throw new Error(`${result.error}\n\nPlease follow the setup guide in CLOUDINARY_SETUP.md to configure your free Cloudinary account.`);
        }
        throw new Error(result.error || 'Upload failed');
      }

      // Add the uploaded image URL to the images array
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

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const genreOptions = ['punk', 'hardcore', 'folk', 'indie', 'metal', 'electronic', 'experimental', 'country', 'hip-hop', 'jazz'];
  const featureOptions = ['basement', 'outdoor', 'stage', 'bar', 'kitchen', 'parking', 'accessible', 'professional', 'intimate'];

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Venue Profile</h1>
              <p className="text-gray-600 mt-1">Update {venue.name}'s information</p>
            </div>
            <Link 
              href={`/venues/${venue.id}`}
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
                  Venue Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="The Venue Name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.contact.email}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="venue@example.com"
                />
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
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="New York"
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
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="NY"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
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
                <label htmlFor="venueType" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Type
                </label>
                <select
                  id="venueType"
                  value={formData.venueType}
                  onChange={(e) => setFormData(prev => ({ ...prev, venueType: e.target.value as VenueType }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {(Object.entries(VENUE_TYPE_LABELS) as [VenueType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Address Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  id="streetAddress"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="123 Main Street (optional but helpful for touring bands)"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-2">
                    Apt/Suite/Unit
                  </label>
                  <input
                    type="text"
                    id="addressLine2"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Apt 2B, Suite 100, etc."
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="12345"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
                  Neighborhood/District
                </label>
                <input
                  type="text"
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g., East Village, Five Points, Williamsburg"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.contact.phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Phone number (optional)"
                />
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="text"
                  id="website"
                  value={formData.contact.website}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact: { ...prev.contact, website: e.target.value }
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="venue.com or https://venue.com (optional)"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="social" className="block text-sm font-medium text-gray-700 mb-2">
                Social Media
              </label>
              <input
                type="text"
                id="social"
                value={formData.contact.social}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  contact: { ...prev.contact, social: e.target.value }
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Instagram, Facebook, etc. (optional)"
              />
            </div>
          </div>

          {/* Venue Details */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Venue Details</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity
                </label>
                <input
                  type="number"
                  id="capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="50"
                />
              </div>
              <div>
                <label htmlFor="ageRestriction" className="block text-sm font-medium text-gray-700 mb-2">
                  Age Restriction
                </label>
                <select
                  id="ageRestriction"
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
          </div>

          {/* Genres */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Preferred Genres</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {genreOptions.map((genre) => (
                <label key={genre} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.genres.includes(genre)}
                    onChange={() => handleGenreChange(genre)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm capitalize">{genre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Available Equipment</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.equipment.pa}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    equipment: { ...prev.equipment, pa: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm">PA System</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.equipment.mics}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    equipment: { ...prev.equipment, mics: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm">Microphones</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.equipment.drums}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    equipment: { ...prev.equipment, drums: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm">Drum Kit</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.equipment.amps}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    equipment: { ...prev.equipment, amps: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm">Amplifiers</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.equipment.piano}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    equipment: { ...prev.equipment, piano: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm">Piano/Keyboard</span>
              </label>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Venue Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {featureOptions.map((feature) => (
                <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureChange(feature)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm capitalize">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Pricing & Payment</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="guarantee" className="block text-sm font-medium text-gray-700 mb-2">
                  Guarantee Amount ($)
                </label>
                <input
                  type="number"
                  id="guarantee"
                  min="0"
                  value={formData.pricing.guarantee}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, guarantee: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="0"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pricing.door}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, door: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm">Door Split Available</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pricing.merchandise}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, merchandise: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm">Merchandise Sales OK</span>
                </label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Venue Images</h2>
            
            {/* Image Upload */}
            <div className="mb-6">
              <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images
              </label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> venue images
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
                        handleFileUpload(file);
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
                <h3 className="text-lg font-medium mb-4">Venue Images ({formData.images.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Venue image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
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

          {/* Description */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Description</h2>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Describe your venue, atmosphere, and what makes it special for live music..."
            />
          </div>

          {/* Media Embeds */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Media & Links</h2>
            <p className="text-gray-600 mb-6">Add YouTube videos, virtual tours, and other media to showcase your venue.</p>
            <MediaEmbedSection
              entityId={venue.id}
              entityType="venue"
              canEdit={true}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href={`/venues/${venue.id}`}
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
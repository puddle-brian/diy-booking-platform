'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VenueFormData {
  name: string;
  streetAddress: string;
  addressLine2: string;
  postalCode: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  venueType: string;
  capacity: string;
  agePolicy: string;
  equipment: string[];
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactWebsite: string;
  preferredContact: string;
  genres: string[];
  sceneInfo: string;
}

export default function SubmitVenue() {
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    streetAddress: '',
    addressLine2: '',
    postalCode: '',
    neighborhood: '',
    city: '',
    state: '',
    country: 'USA',
    venueType: '',
    capacity: '',
    agePolicy: 'all-ages',
    equipment: [],
    description: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactWebsite: '',
    preferredContact: 'email',
    genres: [],
    sceneInfo: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name as keyof VenueFormData].includes(value)
        ? (prev[name as keyof VenueFormData] as string[]).filter(item => item !== value)
        : [...(prev[name as keyof VenueFormData] as string[]), value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Transform form data to match API expectations
      const venueData = {
        name: formData.name,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        streetAddress: formData.streetAddress || undefined,
        addressLine2: formData.addressLine2 || undefined,
        postalCode: formData.postalCode || undefined,
        neighborhood: formData.neighborhood || undefined,
        venueType: formData.venueType,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        ageRestriction: formData.agePolicy,
        contact: {
          email: formData.contactEmail,
          phone: formData.contactPhone || undefined,
          website: formData.contactWebsite || undefined,
        },
        equipment: formData.equipment.reduce((acc, item) => {
          acc[item] = true;
          return acc;
        }, {} as Record<string, boolean>),
        description: formData.description || undefined,
        features: [], // We can add this later
        pricing: {}, // We can add this later
        images: [], // We can add this later
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

      setSubmitMessage('Success! Your venue has been submitted for review. We\'ll be in touch soon!');
      
      // Reset form
      setFormData({
        name: '',
        streetAddress: '',
        addressLine2: '',
        postalCode: '',
        neighborhood: '',
        city: '',
        state: '',
        country: 'USA',
        venueType: '',
        capacity: '',
        agePolicy: 'all-ages',
        equipment: [],
        description: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        contactWebsite: '',
        preferredContact: 'email',
        genres: [],
        sceneInfo: '',
      });

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province *
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="State/Province"
                  />
                </div>
              </div>

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
                  <option value="house-show">House/Basement Show</option>
                  <option value="vfw-hall">VFW Hall</option>
                  <option value="community-center">Community Center</option>
                  <option value="record-store">Record Store</option>
                  <option value="coffee-shop">Cafe/Coffee Shop</option>
                  <option value="other">Art Gallery/Space</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="other">Church/Religious Space</option>
                  <option value="other">Other DIY Space</option>
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
                    Capacity
                  </label>
                  <input
                    id="capacity"
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Approximate capacity"
                  />
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Equipment Available (check all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'PA System', value: 'pa-system' },
                    { label: 'Microphones', value: 'microphones' },
                    { label: 'Drum Kit', value: 'drum-kit' },
                    { label: 'Guitar Amps', value: 'guitar-amps' },
                    { label: 'Bass Amp', value: 'bass-amp' },
                    { label: 'Keyboards/Piano', value: 'keyboards-piano' },
                    { label: 'Stage Lighting', value: 'stage-lighting' },
                    { label: 'Recording Setup', value: 'recording-setup' }
                  ].map((equipment) => (
                    <label key={equipment.value} className="flex items-center">
                      <input
                        type="checkbox"
                        name="equipment"
                        value={equipment.value}
                        checked={formData.equipment.includes(equipment.value)}
                        onChange={(e) => handleCheckboxChange('equipment', equipment.value)}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{equipment.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Space Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Describe your space, the vibe, what makes it special, any unique features..."
                />
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
            <h3 className="text-xl font-semibold mb-6">Scene Context</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Genres Welcome (check all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Punk', value: 'punk' },
                    { label: 'Hardcore', value: 'hardcore' },
                    { label: 'Folk/Acoustic', value: 'folk-acoustic' },
                    { label: 'Indie Rock', value: 'indie-rock' },
                    { label: 'Metal', value: 'metal' },
                    { label: 'Electronic', value: 'electronic' },
                    { label: 'Hip-Hop', value: 'hip-hop' },
                    { label: 'Experimental', value: 'experimental' },
                    { label: 'Jazz', value: 'jazz' },
                    { label: 'Any/All Genres', value: 'any-all-genres' }
                  ].map((genre) => (
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
              </div>

              <div>
                <label htmlFor="scene-info" className="block text-sm font-medium text-gray-700 mb-2">
                  Local Scene Info
                </label>
                <textarea
                  id="scene-info"
                  name="sceneInfo"
                  rows={3}
                  value={formData.sceneInfo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Tell touring bands about your local scene - active spaces, radio stations, record stores, other resources..."
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
            <a href="#" className="text-black hover:underline">community guidelines</a>.
            All listings are reviewed before going live.
          </p>
        </form>
      </div>
    </div>
  );
} 
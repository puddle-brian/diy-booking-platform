'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ArtistFormData {
  name: string;
  city: string;
  state: string;
  country: string;
  artistType: string;
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
    city: '',
    state: '',
    country: 'USA',
    artistType: '',
    genres: [],
    members: '',
    yearFormed: '',
    tourStatus: 'active',
    contactEmail: '',
    contactPhone: '',
    website: '',
    socialHandles: '',
    equipmentNeeds: [],
    description: '',
    expectedDraw: '',
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
      // Transform form data to match API expectations
      const artistData = {
        name: formData.name,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        artistType: formData.artistType,
        genres: formData.genres,
        members: formData.members ? parseInt(formData.members) : undefined,
        yearFormed: formData.yearFormed ? parseInt(formData.yearFormed) : undefined,
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
        city: '',
        state: '',
        country: 'USA',
        artistType: '',
        genres: [],
        members: '',
        yearFormed: '',
        tourStatus: 'active',
        contactEmail: '',
        contactPhone: '',
        website: '',
        socialHandles: '',
        equipmentNeeds: [],
        description: '',
        expectedDraw: '',
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
                  <option value="band">Band</option>
                  <option value="solo">Solo Artist</option>
                  <option value="collective">Collective</option>
                  <option value="dj">DJ</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </section>

          {/* Artist Details */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Artist Details</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="members" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Members
                  </label>
                  <input
                    id="members"
                    name="members"
                    type="number"
                    value={formData.members}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Number of band members"
                  />
                </div>
                <div>
                  <label htmlFor="year-formed" className="block text-sm font-medium text-gray-700 mb-2">
                    Year Formed
                  </label>
                  <input
                    id="year-formed"
                    name="yearFormed"
                    type="number"
                    value={formData.yearFormed}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., 2020"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Genres (check all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Punk', value: 'punk' },
                    { label: 'Hardcore', value: 'hardcore' },
                    { label: 'Folk/Acoustic', value: 'folk' },
                    { label: 'Indie Rock', value: 'indie' },
                    { label: 'Metal', value: 'metal' },
                    { label: 'Electronic', value: 'electronic' },
                    { label: 'Hip-Hop', value: 'hip-hop' },
                    { label: 'Experimental', value: 'experimental' },
                    { label: 'Jazz', value: 'jazz' },
                    { label: 'Country', value: 'country' }
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
                <input
                  id="expected-draw"
                  name="expectedDraw"
                  type="text"
                  value={formData.expectedDraw}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., 50-100 people, local following, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Equipment Needs (check all that apply)
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
                        name="equipmentNeeds"
                        value={equipment.value}
                        checked={formData.equipmentNeeds.includes(equipment.value)}
                        onChange={(e) => handleCheckboxChange('equipmentNeeds', equipment.value)}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{equipment.label}</span>
                    </label>
                  ))}
                </div>
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
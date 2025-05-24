export default function SubmitVenue() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Book Yr Life</h1>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">List Your Venue</h2>
          <p className="text-xl text-gray-600">
            Help touring artists find your space and connect with your community
          </p>
        </div>

        {/* Form */}
        <form className="space-y-8">
          {/* Basic Info */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Basic Information</h3>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="venue-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  id="venue-name"
                  name="venue-name"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="The venue name (e.g., Joe's Basement, The Red House)"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="State/Province"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="venue-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Type *
                </label>
                <select
                  id="venue-type"
                  name="venue-type"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select venue type...</option>
                  <option value="house">House/Basement Show</option>
                  <option value="vfw">VFW Hall</option>
                  <option value="community-center">Community Center</option>
                  <option value="record-store">Record Store</option>
                  <option value="cafe">Cafe/Coffee Shop</option>
                  <option value="art-space">Art Gallery/Space</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="church">Church/Religious Space</option>
                  <option value="other">Other DIY Space</option>
                </select>
              </div>
            </div>
          </section>

          {/* Venue Details */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Venue Details</h3>
            
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
                    name="age-policy"
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
                    'PA System',
                    'Microphones',
                    'Drum Kit',
                    'Guitar Amps',
                    'Bass Amp',
                    'Keyboards/Piano',
                    'Stage Lighting',
                    'Recording Setup'
                  ].map((equipment) => (
                    <label key={equipment} className="flex items-center">
                      <input
                        type="checkbox"
                        name="equipment"
                        value={equipment.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{equipment}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Describe your venue, the vibe, what makes it special, any unique features..."
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
                  name="contact-name"
                  type="text"
                  required
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
                    name="contact-email"
                    type="email"
                    required
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
                    name="contact-phone"
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="preferred-contact" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  id="preferred-contact"
                  name="preferred-contact"
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
                    'Punk',
                    'Hardcore',
                    'Folk/Acoustic',
                    'Indie Rock',
                    'Metal',
                    'Electronic',
                    'Hip-Hop',
                    'Experimental',
                    'Jazz',
                    'Any/All Genres'
                  ].map((genre) => (
                    <label key={genre} className="flex items-center">
                      <input
                        type="checkbox"
                        name="genres"
                        value={genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{genre}</span>
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
                  name="scene-info"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Tell touring bands about your local scene - active venues, radio stations, record stores, other resources..."
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              className="flex-1 bg-black text-white py-4 px-6 rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg"
            >
              Submit Venue Listing
            </button>
            <a
              href="/"
              className="flex-1 border border-gray-300 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg text-center"
            >
              Cancel
            </a>
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
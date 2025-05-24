export default function VenueDirectory() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <a href="/" className="text-2xl font-bold tracking-tight">Book Yr Life</a>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="/venues" className="text-black font-medium">Browse Directory</a>
            <a href="/venues/submit" className="text-gray-700 hover:text-black">Submit Space</a>
            <a href="#" className="text-gray-700 hover:text-black">Scene Reports</a>
            <a href="/auth/login" className="text-gray-700 hover:text-black">Sign In</a>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Find DIY Spaces</h1>          <p className="text-xl text-gray-600 max-w-2xl mx-auto">            Browse authentic spaces by location. Connect directly with scene-invested bookers.          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by city, state, space name..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <button className="absolute right-2 top-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Geographic Browsing */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Browse by Location</h2>
          
          {/* Country/Region Selection */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">United States</h3>
              <div className="space-y-2">
                                <a href="#" className="block text-gray-700 hover:text-black">California (324 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">New York (189 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">Texas (156 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">Oregon (143 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">Pennsylvania (121 spaces)</a>
                <a href="#" className="text-black font-medium">View all US states →</a>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Canada</h3>
              <div className="space-y-2">
                                <a href="#" className="block text-gray-700 hover:text-black">Ontario (89 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">British Columbia (67 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">Quebec (45 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">Alberta (32 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">Nova Scotia (23 spaces)</a>
                <a href="#" className="text-black font-medium">View all provinces →</a>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Europe</h3>
              <div className="space-y-2">
                                <a href="#" className="block text-gray-700 hover:text-black">Germany (178 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">United Kingdom (134 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">France (98 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">Netherlands (87 spaces)</a>                <a href="#" className="block text-gray-700 hover:text-black">Spain (65 spaces)</a>
                <a href="#" className="text-black font-medium">View all countries →</a>
              </div>
            </div>
          </div>

          {/* Sample Venue Listings */}
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold mb-8">Recent Additions</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample Venue Cards */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">The Red House</h3>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">All Ages</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">House Show • Portland, OR</p>
                <p className="text-gray-700 text-sm mb-4">Intimate basement space, full PA, welcoming community...</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Capacity: ~30</span>
                  <button className="text-black font-medium text-sm hover:underline">View Details</button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">ABC Community Center</h3>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">All Ages</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">Community Center • Chicago, IL</p>
                <p className="text-gray-700 text-sm mb-4">Great for touring bands, full sound system, punk/hardcore shows...</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Capacity: ~100</span>
                  <button className="text-black font-medium text-sm hover:underline">View Details</button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">Resonance Records</h3>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">All Ages</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">Record Store • Austin, TX</p>
                <p className="text-gray-700 text-sm mb-4">In-store performances, acoustic sets, great for folk/indie...</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Capacity: ~25</span>
                  <button className="text-black font-medium text-sm hover:underline">View Details</button>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-black text-white rounded-xl p-8 mt-12 text-center">
                        <h3 className="text-2xl font-bold mb-4">Don't see your city?</h3>            <p className="text-lg mb-6 opacity-90">Help us build the directory by adding spaces in your area</p>            <a href="/venues/submit" className="bg-white text-black px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium">              Submit a Space            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 
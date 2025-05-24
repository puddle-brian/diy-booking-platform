export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Book Yr Life</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-700 hover:text-black">Browse Directory</a>
            <a href="#" className="text-gray-700 hover:text-black">Submit Listing</a>
            <a href="#" className="text-gray-700 hover:text-black">Scene Reports</a>
            <a href="/auth/login" className="text-gray-700 hover:text-black">Sign In</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}      <section className="container mx-auto px-4 py-20 text-center">        <div className="max-w-5xl mx-auto">          <h2 className="text-5xl md:text-7xl font-bold text-black mb-6 leading-tight">            Connect DIY venues<br />            with touring artists          </h2>          <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">            The comprehensive directory of authentic venues, scene-invested bookers, and underground communities worldwide.             No gatekeepers, just real connections.          </p>                    {/* Main CTAs */}          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">            <button className="bg-black text-white px-8 py-6 rounded-xl hover:bg-gray-800 transition-colors font-semibold text-lg">              <div className="flex items-center justify-center space-x-3">                <span className="text-2xl">🏠</span>                <span>Add Your Venue</span>              </div>              <div className="text-sm opacity-80 mt-1">List your space, connect with artists</div>            </button>            <button className="bg-black text-white px-8 py-6 rounded-xl hover:bg-gray-800 transition-colors font-semibold text-lg">              <div className="flex items-center justify-center space-x-3">                <span className="text-2xl">🎵</span>                <span>Add Your Band</span>              </div>              <div className="text-sm opacity-80 mt-1">Get discovered, find touring partners</div>            </button>          </div>          {/* Search/Browse Entry Point */}          <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">            <h3 className="text-lg font-semibold mb-6">Or browse existing listings by location</h3>            <div className="grid md:grid-cols-3 gap-4 mb-6">              <button className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-sm transition-shadow">                <div className="font-medium">United States</div>                <div className="text-sm text-gray-600">2,400+ venues</div>              </button>              <button className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-sm transition-shadow">                <div className="font-medium">Canada</div>                <div className="text-sm text-gray-600">650+ venues</div>              </button>              <button className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-sm transition-shadow">                <div className="font-medium">Europe</div>                <div className="text-sm text-gray-600">1,200+ venues</div>              </button>            </div>            <input               type="text"               placeholder="Search by city, state, venue name, or band..."              className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"            />          </div>        </div>      </section>

      

      {/* What You'll Find */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">Everything you need to tour independently</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">🏠</span>
                </div>
                <h4 className="font-semibold mb-2">DIY Venues</h4>
                <p className="text-sm text-gray-600">Basements, VFW halls, record stores, community centers — authentic spaces run by people who care</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">🎵</span>
                </div>
                <h4 className="font-semibold mb-2">Local Bands</h4>
                <p className="text-sm text-gray-600">Connect with like-minded artists in every city for touring partners and scene connections</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">📻</span>
                </div>
                <h4 className="font-semibold mb-2">Scene Infrastructure</h4>
                <p className="text-sm text-gray-600">Labels, radio stations, record stores, zines — the community backbone that supports touring artists</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">🗺️</span>
                </div>
                <h4 className="font-semibold mb-2">Scene Reports</h4>
                <p className="text-sm text-gray-600">Real stories from touring artists about local scenes, venues, and communities worth connecting with</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Call */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold mb-6">Built by the community, for the community</h3>
                        <p className="text-lg mb-8 opacity-90">              This directory lives and breathes through community contributions.               Know a great DIY venue? Run a killer record store? Help us map the underground.            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-black px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                Submit a Venue
              </button>
              <button className="border border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-black transition-colors font-medium">
                Add Your Band
              </button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              No corporate venues. No gatekeepers. Just authentic connections in the underground music ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">B</span>
                </div>
                <span className="font-bold">Book Yr Life</span>
              </div>
                            <p className="text-sm text-gray-600">                Connecting DIY venues with touring artists worldwide.              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Browse</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><a href="#" className="hover:text-black">Venues by State</a></li>
                <li><a href="#" className="hover:text-black">International</a></li>
                <li><a href="#" className="hover:text-black">All-Ages Shows</a></li>
                <li><a href="#" className="hover:text-black">Scene Reports</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><a href="#" className="hover:text-black">Submit Listing</a></li>
                <li><a href="#" className="hover:text-black">Write Scene Report</a></li>
                <li><a href="#" className="hover:text-black">Update Venue Info</a></li>
                <li><a href="#" className="hover:text-black">Guidelines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">About</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><a href="#" className="hover:text-black">Our Story</a></li>
                <li><a href="#" className="hover:text-black">Our Mission</a></li>
                <li><a href="#" className="hover:text-black">Contact</a></li>
                <li><a href="#" className="hover:text-black">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
            <p>© 2024 Book Yr Life. Continuing the legacy of independent music touring.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
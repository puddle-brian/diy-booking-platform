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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-gray-600 mb-4">
            Filling the 13-year void • The digital successor to BYOFL
          </p>
          <h2 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
            The definitive DIY<br />
            touring resource
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect with authentic venues, scene-invested bookers, and underground communities worldwide. 
            No gatekeepers, just the connections that matter.
          </p>
          
          {/* Search/Browse Entry Point */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-12 max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold mb-6">Start exploring by location</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <button className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-sm transition-shadow">
                <div className="font-medium">United States</div>
                <div className="text-sm text-gray-600">2,400+ venues</div>
              </button>
              <button className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-sm transition-shadow">
                <div className="font-medium">Canada</div>
                <div className="text-sm text-gray-600">650+ venues</div>
              </button>
              <button className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-sm transition-shadow">
                <div className="font-medium">Europe</div>
                <div className="text-sm text-gray-600">1,200+ venues</div>
              </button>
            </div>
            <div className="mt-4">
              <input 
                type="text" 
                placeholder="Or search by city, state, or venue name..."
                className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors font-medium">
              Browse Directory
            </button>
            <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Submit Your Venue
            </button>
          </div>
        </div>
      </section>

      {/* Legacy Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-6">Honoring a legendary tradition</h3>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              From 1992-2011, <em>Book Your Own Fuckin' Life</em> was the essential touring guide for DIY bands. 
              Started as Maximum Rocknroll's column, it became the comprehensive resource that enabled thousands 
              of artists to tour independently, creating connections across underground scenes worldwide.
            </p>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <blockquote className="bg-white p-6 rounded-lg border-l-4 border-black">
                <p className="text-gray-700 mb-4">"Book Your Own Fuckin' Life was this holy grail of information... It was how I got ahold of ABC No Rio for the first time."</p>
                <cite className="text-sm font-medium">— Laura Jane Grace, Against Me!</cite>
              </blockquote>
              <blockquote className="bg-white p-6 rounded-lg border-l-4 border-black">
                <p className="text-gray-700 mb-4">"We put our stuff in there and used that to book pretty much all of the first Lillingtons tour."</p>
                <cite className="text-sm font-medium">— Kody Templeman, Lillingtons</cite>
              </blockquote>
              <blockquote className="bg-white p-6 rounded-lg border-l-4 border-black">
                <p className="text-gray-700 mb-4">"The great thing about BYOFL was all the people who didn't work at clubs... They were just invested in having a scene."</p>
                <cite className="text-sm font-medium">— Ted Leo, Chisel</cite>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

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
            <p className="text-lg mb-8 opacity-90">
              Like the original BYOFL, this directory lives and breathes through community contributions. 
              Know a great DIY venue? Run a killer record store? Help us map the underground.
            </p>
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
              <p className="text-sm text-gray-600">
                The digital successor to the legendary Book Your Own Fuckin' Life zine.
              </p>
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
                <li><a href="#" className="hover:text-black">BYOFL History</a></li>
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
'use client';

import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <Link href="/" className="text-2xl font-bold tracking-tight">
              diyshows <span className="text-sm font-normal text-gray-500">beta</span>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-black">Home</Link>
            <Link href="/?tab=venues" className="text-gray-700 hover:text-black">Venues</Link>
            <Link href="/?tab=artists" className="text-gray-700 hover:text-black">Artists</Link>
            <Link href="/auth/login" className="text-gray-700 hover:text-black">Sign In</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Support DIY Shows</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help us build the strongest crowdsourced booking network for independent music
          </p>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">The Power of Community</h2>
            <p className="text-gray-700 mb-4">
              DIY Shows works because of people like you. Every venue listed, every artist profile created, and every connection made strengthens the entire network. The more comprehensive our database becomes, the better we can serve the DIY music community.
            </p>
            <p className="text-gray-700 mb-4">
              This isn't just a platform - it's a movement to democratize music booking and put power back in the hands of artists and venues.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How You Can Help</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">🎵 Add Artists You Know</h3>
                <p className="text-gray-700 mb-4">
                  Know a great band that should be touring? Help them get discovered by adding their profile to our network.
                </p>
                <ul className="space-y-2 text-gray-700 mb-4">
                  <li>• Local bands in your scene</li>
                  <li>• Touring artists you've seen live</li>
                  <li>• Friends' bands and projects</li>
                  <li>• Artists you think deserve more shows</li>
                </ul>
                <Link 
                  href="/admin/artists"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add an Artist
                </Link>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-900 mb-4">🏢 Add Venues & Spaces</h3>
                <p className="text-gray-700 mb-4">
                  Every DIY space matters. Help artists find places to play by adding venues to our growing directory.
                </p>
                <ul className="space-y-2 text-gray-700 mb-4">
                  <li>• House show venues</li>
                  <li>• Community centers and art spaces</li>
                  <li>• Record stores that host shows</li>
                  <li>• Any space that supports live music</li>
                </ul>
                <Link 
                  href="/admin/venues"
                  className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Add a Venue
                </Link>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Spread the Word</h2>
            <p className="text-gray-700 mb-4">
              The best way to support DIY Shows is to tell people about it. Share it with:
            </p>
            <ul className="space-y-2 text-gray-700 mb-6">
              <li>• <strong>Artists</strong> looking for shows and tour opportunities</li>
              <li>• <strong>Venue owners</strong> who want to book more independent acts</li>
              <li>• <strong>Show promoters</strong> in your local scene</li>
              <li>• <strong>Music fans</strong> who care about supporting DIY culture</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Every new person who joins makes the network more valuable for everyone.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quality Over Quantity</h2>
            <p className="text-gray-700 mb-4">
              When adding artists and venues, focus on quality information:
            </p>
            <div className="bg-yellow-50 p-6 rounded-lg mb-6">
              <h4 className="font-semibold text-yellow-900 mb-3">For Artist Profiles:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Include accurate contact information</li>
                <li>• Add music links (Bandcamp, Spotify, etc.)</li>
                <li>• Upload quality photos</li>
                <li>• Write compelling descriptions</li>
                <li>• Specify tour status and availability</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-3">For Venue Listings:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Provide accurate capacity and equipment info</li>
                <li>• Include clear contact details</li>
                <li>• Add photos of the space</li>
                <li>• Specify what types of shows they host</li>
                <li>• Note any special requirements or policies</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Guidelines</h2>
            <p className="text-gray-700 mb-4">
              Help us maintain a supportive, inclusive community:
            </p>
            <ul className="space-y-2 text-gray-700 mb-4">
              <li>• Only add artists and venues with permission when possible</li>
              <li>• Provide accurate, up-to-date information</li>
              <li>• Respect the DIY ethos of mutual support</li>
              <li>• Report any inappropriate content or behavior</li>
            </ul>
            <p className="text-gray-700">
              Read our full <Link href="/guidelines" className="text-blue-600 hover:text-blue-800 underline">Community Guidelines</Link> for more details.
            </p>
          </section>

          <section className="bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Help?</h2>
            <p className="text-gray-700 mb-6">
              Every contribution makes a difference. Whether you add one venue or fifty artists, you're helping build something that benefits the entire DIY music community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/admin/artists"
                className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-center"
              >
                Add an Artist
              </Link>
              <Link 
                href="/admin/venues"
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-200 text-center"
              >
                Add a Venue
              </Link>
            </div>
            
            <p className="text-center text-gray-600 mt-4 text-sm">
              Questions? Feedback? We'd love to hear from you.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">DIY Shows</h3>
              <p className="text-gray-400">
                Book your own shows. Skip the agents and middlemen. Add your DIY space or act to the crowdsourced network.
              </p>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-3">For Artists</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/admin/artists" className="hover:text-white">List an Artist</Link></li>
                <li><Link href="/?tab=venues" className="hover:text-white">Find Venues</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-3">For Venues</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/admin/venues" className="hover:text-white">List Your Space</Link></li>
                <li><Link href="/?tab=artists" className="hover:text-white">Browse Artists</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About DIY Shows</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
                <li><Link href="/guidelines" className="hover:text-white">Guidelines</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex justify-between items-center">
            <p className="text-gray-400">
              © 2025 DIY Shows. Built by and for the DIY music community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
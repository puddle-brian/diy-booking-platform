'use client';

import Link from 'next/link';

export default function AboutPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About DIY Shows</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Skip the agents and middlemen. Book your own shows.
          </p>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              DIY Shows is a crowdsourced booking platform that connects independent artists directly with DIY venues and spaces. We believe in cutting out the middlemen and empowering artists and venues to work together without the barriers of traditional booking agencies.
            </p>
            <p className="text-gray-700 mb-4">
              Our platform enables venues to find artists looking for shows in their area and place bids, while artists can request shows anywhere and have venues discover and bid on their tour requests.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">🎵 For Artists</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Create your artist profile with music, photos, and tour info</li>
                  <li>• Submit tour requests for specific dates and locations</li>
                  <li>• Receive bids from venues interested in booking you</li>
                  <li>• Browse and connect with DIY spaces directly</li>
                  <li>• Manage your show dates and bookings</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-900 mb-4">🏢 For Venues</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• List your space with photos, capacity, and equipment details</li>
                  <li>• Browse touring artists looking for shows</li>
                  <li>• Place bids on tour requests that fit your space</li>
                  <li>• Connect directly with artists without booking fees</li>
                  <li>• Build your venue's reputation in the DIY community</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">The DIY Ethos</h2>
            <p className="text-gray-700 mb-4">
              We're inspired by the DIY (Do It Yourself) music community that has always thrived on direct connections, mutual support, and grassroots organizing. From house shows to community centers, from record stores to art spaces - these venues are the backbone of independent music.
            </p>
            <p className="text-gray-700 mb-4">
              Our platform celebrates and supports this ecosystem by making it easier for artists and venues to find each other, while keeping the spirit of community and direct collaboration that makes DIY culture special.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Community First</h2>
            <p className="text-gray-700 mb-4">
              DIY Shows is built by and for the DIY music community. We're not here to extract value or impose corporate structures on independent music. Instead, we're creating tools that amplify what the community already does best: supporting each other.
            </p>
            <p className="text-gray-700 mb-4">
              Every venue listed, every artist profile, and every successful booking makes the network stronger for everyone. This is crowdsourced booking - the more people participate, the better it works for all of us.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Involved</h2>
            <p className="text-gray-700 mb-6">
              Ready to be part of the movement? Whether you're an artist looking to tour or a venue wanting to support independent music, we'd love to have you in the community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/admin/artists"
                className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-center"
              >
                List an Artist
              </Link>
              <Link 
                href="/admin/venues"
                className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-center"
              >
                List Your Space
              </Link>
            </div>
          </section>

          <section className="bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h2>
            <p className="text-gray-700 mb-4">
              We're always here to help. If you have questions about how the platform works, need help with your listing, or want to share feedback, don't hesitate to reach out.
            </p>
            <p className="text-gray-700">
              This is a community project, and your input helps make it better for everyone.
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
                Skip the agents and middlemen. This platform enables venues to find artists looking for shows in their area and place bids, while artists can request shows anywhere and have venues discover and bid on their tour requests.
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
'use client';

import Link from 'next/link';

export default function GuidelinesPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Community Guidelines</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Building a supportive, inclusive DIY music community together
          </p>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Values</h2>
            <p className="text-gray-700 mb-4">
              DIY Shows is built on the principles that have always made DIY music culture special: mutual support, inclusivity, authenticity, and community over profit. These guidelines help us maintain a space where everyone can thrive.
            </p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Core Principles</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Mutual Support:</strong> We're here to help each other succeed</li>
                <li>• <strong>Inclusivity:</strong> All people are welcome in our community</li>
                <li>• <strong>Authenticity:</strong> Be genuine in your interactions and listings</li>
                <li>• <strong>Respect:</strong> Treat others as you'd want to be treated</li>
                <li>• <strong>Community First:</strong> Prioritize collective benefit over individual gain</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">For Artists</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Profile Guidelines</h3>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li>• Use accurate information about your music, location, and availability</li>
                <li>• Include working links to your music (Bandcamp, Spotify, etc.)</li>
                <li>• Upload quality photos that represent your act</li>
                <li>• Write honest descriptions of your sound and live performance</li>
                <li>• Keep your tour status and contact information up to date</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Tour Requests & Booking</h3>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li>• Be realistic about your draw and experience level</li>
                <li>• Respond promptly to venue inquiries and bids</li>
                <li>• Honor your commitments - don't ghost venues</li>
                <li>• Be flexible and understanding with DIY spaces</li>
                <li>• Promote shows appropriately and help with turnout</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">Remember</h3>
              <p className="text-gray-700">
                DIY venues often operate on tight budgets and volunteer labor. Be patient, communicative, and appreciative of the work they do to support independent music.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">For Venues</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Venue Listings</h3>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li>• Provide accurate capacity, equipment, and facility information</li>
                <li>• Be clear about your booking policies and requirements</li>
                <li>• Include working contact information</li>
                <li>• Upload photos that accurately represent your space</li>
                <li>• Specify what types of music and events you host</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Working with Artists</h3>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li>• Respond to inquiries in a timely manner</li>
                <li>• Be transparent about payment, door splits, and expectations</li>
                <li>• Provide clear load-in information and technical details</li>
                <li>• Support the artists you book with promotion and hospitality</li>
                <li>• Honor your agreements and communicate any changes promptly</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Safety First</h3>
              <p className="text-gray-700">
                Ensure your venue meets basic safety requirements and create an environment where all attendees feel welcome and secure.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Standards</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Prohibited Content & Behavior</h3>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li>• Harassment, discrimination, or hate speech of any kind</li>
                <li>• Spam, fake listings, or misleading information</li>
                <li>• Commercial promotion unrelated to DIY music</li>
                <li>• Sharing personal information without consent</li>
                <li>• Attempting to circumvent platform safety features</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Inclusive Spaces</h3>
              <p className="text-gray-700 mb-4">
                DIY Shows is committed to supporting venues and artists that create inclusive, safe spaces for all people regardless of:
              </p>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li>• Race, ethnicity, or national origin</li>
                <li>• Gender identity or expression</li>
                <li>• Sexual orientation</li>
                <li>• Religion or beliefs</li>
                <li>• Disability or accessibility needs</li>
                <li>• Age (within legal requirements)</li>
                <li>• Economic background</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Practices</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Communication</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Be clear and professional in all interactions</li>
                  <li>• Respond to messages within 48 hours when possible</li>
                  <li>• Ask questions if something isn't clear</li>
                  <li>• Keep records of important agreements</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">Collaboration</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Work together to make shows successful</li>
                  <li>• Share resources and knowledge with others</li>
                  <li>• Support other artists and venues in your scene</li>
                  <li>• Give constructive feedback when appropriate</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Reporting & Enforcement</h2>
            <p className="text-gray-700 mb-4">
              If you encounter behavior that violates these guidelines, please report it. We take all reports seriously and will investigate promptly.
            </p>
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900 mb-3">How to Report</h3>
              <p className="text-gray-700 mb-3">
                Use the feedback widget on any page or contact us directly. Include:
              </p>
              <ul className="space-y-1 text-gray-700">
                <li>• Description of the issue</li>
                <li>• Links to relevant profiles or content</li>
                <li>• Any screenshots or evidence</li>
                <li>• Your contact information (kept confidential)</li>
              </ul>
            </div>
          </section>

          <section className="bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Building Community Together</h2>
            <p className="text-gray-700 mb-4">
              These guidelines aren't just rules - they're a reflection of the values that make DIY music culture special. By following them, you're helping create a space where independent music can thrive.
            </p>
            <p className="text-gray-700 mb-6">
              Have suggestions for improving these guidelines? We'd love to hear from you. This is a community project, and your input helps make it better for everyone.
            </p>
            
            <div className="text-center">
              <Link 
                href="/support"
                className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Learn How to Support DIY Shows
              </Link>
            </div>
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
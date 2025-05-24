'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BookingInquiryForm from '../../../components/BookingInquiryForm';
import TeamManagement from '../../../components/TeamManagement';
import TourItinerary from '../../../components/TourItinerary';

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  venueType: 'house-show' | 'community-space' | 'record-store' | 'vfw-hall' | 'arts-center' | 'warehouse' | 'bar' | 'club' | 'theater' | 'other';
  genres: string[];
  capacity: number;
  ageRestriction: 'all-ages' | '18+' | '21+';
  equipment: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  features: string[];
  pricing: {
    guarantee: number;
    door: boolean;
    merchandise: boolean;
  };
  contact: {
    email: string;
    phone?: string;
    social?: string;
    website?: string;
  };
  images: string[];
  description: string;
  rating: number;
  showsThisYear: number;
  hasAccount: boolean;
  unavailableDates: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function VenueDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [isClaimingMode, setIsClaimingMode] = useState(false);
  const [hasSentInquiry, setHasSentInquiry] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    artistName: '',
    email: '',
    phone: '',
    showDate: '',
    expectedDraw: '',
    genre: '',
    message: '',
  });
  const [claimingForm, setClaimingForm] = useState({
    venueName: '',
    contactEmail: '',
    contactPhone: '',
    contactName: '',
    message: '',
  });
  const [bookingStatus, setBookingStatus] = useState('');
  const [dateAvailable, setDateAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const loadVenue = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/venues/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Venue not found');
        }
        const venueData = await response.json();
        setVenue(venueData);
      } catch (error) {
        console.error('Failed to load venue:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadVenue();
  }, [params, router]);

  // Check if selected date is available
  const checkDateAvailability = (date: string) => {
    if (!venue || !date) {
      setDateAvailable(null);
      return;
    }
    
    const isAvailable = !venue.unavailableDates.includes(date);
    setDateAvailable(isAvailable);
  };

  // Get booking widget content based on venue account status and date availability
  const getBookingContent = () => {
    if (!venue) {
      return {
        type: 'loading',
        title: 'Loading...',
        message: '',
        action: null
      };
    }

    if (!venue.hasAccount) {
      return {
        type: 'no-account',
        title: 'Contact Directly',
        message: 'This venue doesn\'t manage bookings through our platform.',
        action: null
      };
    }

    if (bookingForm.showDate && dateAvailable === false) {
      return {
        type: 'date-unavailable',
        title: 'Date Not Available',
        message: 'This date is already booked. Please try another date.',
        action: null
      };
    }

    if (bookingForm.showDate && dateAvailable === true) {
      return {
        type: 'can-book',
        title: 'Request Booking',
        message: 'This date is available! Send your booking request.',
        action: 'book'
      };
    }

    return {
      type: 'select-date',
      title: 'Check Availability',
      message: 'Select a date to check availability and request booking.',
      action: 'check'
    };
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatus('Sending inquiry...');
    
    try {
      const response = await fetch('/api/booking/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bookingForm,
          venueId: venue?.id,
          venueName: venue?.name,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send inquiry');
      }

      setBookingStatus('Inquiry sent! The venue will contact you soon.');
      setShowBookingForm(false);
      
      // Reset form
      setBookingForm({
        artistName: '',
        email: '',
        phone: '',
        showDate: '',
        expectedDraw: '',
        genre: '',
        message: '',
      });
      
      setTimeout(() => setBookingStatus(''), 5000);
    } catch (error) {
      setBookingStatus(`Error: ${error instanceof Error ? error.message : 'Failed to send inquiry'}`);
      setTimeout(() => setBookingStatus(''), 5000);
    }
  };

  // Check if user has already sent an inquiry to this venue
  useEffect(() => {
    if (venue) {
      const sentInquiries = JSON.parse(localStorage.getItem('sentBookingInquiries') || '[]');
      const alreadySent = sentInquiries.includes(venue.id);
      setHasSentInquiry(alreadySent);
    }
  }, [venue]);

  const markInquiryAsSent = (venueId: string) => {
    const sentInquiries = JSON.parse(localStorage.getItem('sentBookingInquiries') || '[]');
    if (!sentInquiries.includes(venueId)) {
      sentInquiries.push(venueId);
      localStorage.setItem('sentBookingInquiries', JSON.stringify(sentInquiries));
    }
    setHasSentInquiry(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading venue...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue not found</h1>
          <Link href="/?tab=venues" className="text-blue-600 hover:text-blue-800">
            ← Back to spaces
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/?tab=venues"
            className="inline-flex items-center text-gray-600 hover:text-black"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to spaces
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Venue Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
          <div className="flex items-center text-gray-600 space-x-4">
            <span>{venue.city}, {venue.state}</span>
            <span>•</span>
            <span className="capitalize">{venue.venueType.replace('-', ' ')}</span>
            <span>•</span>
            <span>{venue.capacity} capacity</span>
            {venue.rating > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400 fill-current mr-1" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{venue.rating.toFixed(1)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status Message */}
        {bookingStatus && (
          <div className={`mb-6 p-4 rounded-lg ${
            bookingStatus.includes('sent') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {bookingStatus}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="grid grid-cols-4 gap-2 h-96">
                <div className="col-span-2 row-span-2">
                  <img
                    src={venue.images[selectedImage] || '/api/placeholder/other'}
                    alt={venue.name}
                    className="w-full h-full object-cover rounded-lg cursor-pointer"
                    onError={(e) => {
                      e.currentTarget.src = '/api/placeholder/other';
                    }}
                  />
                </div>
                {venue.images.slice(1, 5).map((image, index) => (
                  <div key={index + 1} className="h-48">
                    <img
                      src={image}
                      alt={`${venue.name} ${index + 2}`}
                      className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(index + 1)}
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/other';
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {/* Image Thumbnails */}
              {venue.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {venue.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 ${
                        selectedImage === index ? 'border-black' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/api/placeholder/other';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">About this venue</h2>
              <p className="text-gray-700 leading-relaxed">{venue.description}</p>
            </div>

            {/* Venue Details */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Equipment */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Available Equipment</h3>
                <div className="space-y-2">
                  {Object.entries(venue.equipment).map(([key, available]) => (
                    <div key={key} className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-3 ${available ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="capitalize text-gray-700">
                        {key === 'pa' ? 'PA System' : key}
                      </span>
                      {available && <span className="ml-auto text-green-600 text-sm">Available</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Venue Features</h3>
                <div className="flex flex-wrap gap-2">
                  {venue.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Genres */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Preferred Genres</h3>
              <div className="flex flex-wrap gap-2">
                {venue.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700">{venue.contact.email}</span>
                </div>
                {venue.contact.phone && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-700">{venue.contact.phone}</span>
                  </div>
                )}
                {venue.contact.website && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                    </svg>
                    <a href={venue.contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      {venue.contact.website}
                    </a>
                  </div>
                )}
                {venue.contact.social && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2z" />
                    </svg>
                    <span className="text-gray-700">{venue.contact.social}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
                <div className="mb-6">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    ${venue.pricing.guarantee} <span className="text-lg font-normal text-gray-600">typical guarantee</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {venue.ageRestriction} • {venue.capacity} capacity
                  </div>
                  {!venue.hasAccount && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      Not actively managed on platform
                    </div>
                  )}
                </div>

                {(() => {
                  const bookingContent = getBookingContent();
                  
                  if (bookingContent.type === 'no-account') {
                    return !showInquiryForm ? (
                      <div className="space-y-4">
                        <div className="text-center py-4">
                          <h3 className="font-semibold text-gray-900 mb-2">{bookingContent.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{bookingContent.message}</p>
                          
                          {/* Contact Directly Section */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">Contact options:</p>
                            
                            {/* Send Booking Inquiry Button */}
                            <button
                              onClick={() => {
                                if (!hasSentInquiry) {
                                  setShowInquiryForm(true);
                                }
                              }}
                              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors mb-3 ${
                                hasSentInquiry 
                                  ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                                  : 'bg-black text-white hover:bg-gray-800'
                              }`}
                              disabled={hasSentInquiry}
                            >
                              {hasSentInquiry ? (
                                <span className="flex items-center justify-center">
                                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Inquiry Sent ✓
                                </span>
                              ) : (
                                'Send Booking Inquiry'
                              )}
                            </button>
                            
                            {hasSentInquiry && (
                              <button
                                onClick={() => setShowInquiryForm(true)}
                                className="w-full text-sm text-gray-600 hover:text-gray-800 py-1"
                              >
                                Send Another Inquiry
                              </button>
                            )}
                            
                            {/* Direct Contact */}
                            <div className="text-center">
                              <p className="text-sm text-gray-600 mb-2">Or contact directly:</p>
                              <a 
                                href={`mailto:${venue.contact.email}`}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {venue.contact.email}
                              </a>
                              {venue.contact.phone && (
                                <p className="text-sm text-gray-600 mt-1">{venue.contact.phone}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Claim Venue Section */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <div className="flex items-center justify-center mb-2">
                              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0H3m0 0h4M9 7h6m-6 4h6m-2 4h2M7 7h2v2H7V7z" />
                              </svg>
                              <span className="font-semibold text-blue-800">Is this your venue?</span>
                            </div>
                            <p className="text-sm text-blue-700 mb-3">
                              Claim your venue to manage bookings, update info, and connect directly with artists.
                            </p>
                            <button 
                              onClick={() => {
                                setIsClaimingMode(true);
                                setShowBookingForm(true);
                                setClaimingForm({
                                  venueName: venue.name,
                                  contactEmail: venue.contact.email,
                                  contactPhone: venue.contact.phone || '',
                                  contactName: '',
                                  message: `I am the owner/manager of ${venue.name} and would like to claim this venue profile to manage bookings and venue information.`,
                                });
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              Claim This Venue
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Booking Inquiry Form for no-account venues
                      <BookingInquiryForm
                        recipientType="venue"
                        recipientId={venue.id}
                        recipientName={venue.name}
                        onSuccess={() => {
                          setShowInquiryForm(false);
                          markInquiryAsSent(venue.id);
                          setBookingStatus('Booking inquiry sent! We\'ll forward this to the venue via email.');
                          setTimeout(() => setBookingStatus(''), 8000);
                        }}
                        onCancel={() => setShowInquiryForm(false)}
                      />
                    );
                  }

                  if (bookingContent.type === 'date-unavailable') {
                    return (
                      <div className="space-y-4">
                        <div className="text-center py-4">
                          <h3 className="font-semibold text-red-600 mb-2">{bookingContent.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{bookingContent.message}</p>
                          <div className="bg-red-50 rounded-lg p-4">
                            <p className="text-sm text-red-700">Try selecting a different date above.</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (bookingContent.type === 'can-book') {
                    return !showBookingForm && !showInquiryForm ? (
                      <div className="space-y-4">
                        <div className="text-center py-2">
                          <h3 className="font-semibold text-green-600 mb-2">{bookingContent.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{bookingContent.message}</p>
                        </div>
                        
                        {/* Send Booking Inquiry Button */}
                        <button
                          onClick={() => {
                            if (!hasSentInquiry) {
                              setShowInquiryForm(true);
                            }
                          }}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors mb-3 ${
                            hasSentInquiry 
                              ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                              : 'bg-black text-white hover:bg-gray-800'
                          }`}
                          disabled={hasSentInquiry}
                        >
                          {hasSentInquiry ? (
                            <span className="flex items-center justify-center">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Inquiry Sent ✓
                            </span>
                          ) : (
                            'Send Booking Inquiry'
                          )}
                        </button>
                        
                        {hasSentInquiry && (
                          <button
                            onClick={() => setShowInquiryForm(true)}
                            className="w-full text-sm text-gray-600 hover:text-gray-800 py-1"
                          >
                            Send Another Inquiry
                          </button>
                        )}
                        
                        {/* Quick Form Option */}
                        <button
                          onClick={() => {
                            setIsClaimingMode(false);
                            setShowBookingForm(true);
                          }}
                          className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                          Quick Contact Form
                        </button>
                      </div>
                    ) : showInquiryForm ? (
                      // Professional Booking Inquiry Form
                      <BookingInquiryForm
                        recipientType="venue"
                        recipientId={venue.id}
                        recipientName={venue.name}
                        onSuccess={() => {
                          setShowInquiryForm(false);
                          markInquiryAsSent(venue.id);
                          setBookingStatus('Booking inquiry sent! We\'ll forward this to the venue via email.');
                          setTimeout(() => setBookingStatus(''), 8000);
                        }}
                        onCancel={() => setShowInquiryForm(false)}
                      />
                    ) : isClaimingMode ? (
                      // Venue Claiming Form
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        
                        const submitClaim = async () => {
                          try {
                            setBookingStatus('Submitting claim request...');
                            
                            const response = await fetch('/api/venue-claims', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                ...claimingForm,
                                venueId: venue.id,
                                timestamp: new Date().toISOString(),
                              }),
                            });

                            const result = await response.json();

                            if (!response.ok) {
                              throw new Error(result.error || 'Failed to submit claim request');
                            }

                            setBookingStatus('Claim request sent! We will verify ownership and contact you within 24-48 hours.');
                            setShowBookingForm(false);
                            setIsClaimingMode(false);
                            
                            // Reset claim form
                            setClaimingForm({
                              venueName: '',
                              contactEmail: '',
                              contactPhone: '',
                              contactName: '',
                              message: '',
                            });
                            
                            setTimeout(() => setBookingStatus(''), 8000);
                          } catch (error) {
                            setBookingStatus(`Error: ${error instanceof Error ? error.message : 'Failed to submit claim request'}`);
                            setTimeout(() => setBookingStatus(''), 5000);
                          }
                        };
                        
                        submitClaim();
                      }} className="space-y-4">
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <h3 className="font-semibold text-blue-800 mb-2">Venue Claiming Request</h3>
                          <p className="text-sm text-blue-700">
                            We'll verify your ownership and set up your account to manage this venue.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                          <input
                            type="text"
                            required
                            value={claimingForm.contactName}
                            onChange={(e) => setClaimingForm(prev => ({ ...prev, contactName: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Your full name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                          <input
                            type="text"
                            required
                            value={claimingForm.venueName}
                            onChange={(e) => setClaimingForm(prev => ({ ...prev, venueName: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Venue name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                          <input
                            type="email"
                            required
                            value={claimingForm.contactEmail}
                            onChange={(e) => setClaimingForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="your@email.com"
                          />
                          <p className="text-xs text-gray-500 mt-1">Must match the venue's listed contact email for verification</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={claimingForm.contactPhone}
                            onChange={(e) => setClaimingForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="(555) 123-4567"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
                          <textarea
                            rows={4}
                            value={claimingForm.message}
                            onChange={(e) => setClaimingForm(prev => ({ ...prev, message: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Tell us about your role at the venue and any verification details..."
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Submit Claim Request
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowBookingForm(false);
                              setIsClaimingMode(false);
                            }}
                            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Regular Booking Form
                      <form onSubmit={handleBookingSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Artist/Band Name</label>
                          <input
                            type="text"
                            required
                            value={bookingForm.artistName}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, artistName: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Your band name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            required
                            value={bookingForm.email}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="your@email.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={bookingForm.phone}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="(555) 123-4567"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Show Date (Available ✓)</label>
                          <input
                            type="date"
                            required
                            value={bookingForm.showDate}
                            onChange={(e) => {
                              setBookingForm(prev => ({ ...prev, showDate: e.target.value }));
                              checkDateAvailability(e.target.value);
                            }}
                            className="w-full p-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Draw</label>
                          <input
                            type="number"
                            value={bookingForm.expectedDraw}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, expectedDraw: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="How many people you expect"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                          <select
                            value={bookingForm.genre}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, genre: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          >
                            <option value="">Select genre</option>
                            {venue.genres.map(genre => (
                              <option key={genre} value={genre}>{genre}</option>
                            ))}
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                          <textarea
                            rows={3}
                            value={bookingForm.message}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, message: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Tell us about your music, tour dates, etc."
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className="flex-1 bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                          >
                            Send Inquiry
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowBookingForm(false)}
                            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    );
                  }

                  // Default: select date to check availability
                  return (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{bookingContent.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">{bookingContent.message}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                        <input
                          type="date"
                          value={bookingForm.showDate}
                          onChange={(e) => {
                            setBookingForm(prev => ({ ...prev, showDate: e.target.value }));
                            checkDateAvailability(e.target.value);
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          min={new Date().toISOString().split('T')[0]} // Prevent past dates
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Age Restriction:</span>
                      <span className="font-medium">{venue.ageRestriction}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Door Split:</span>
                      <span className="font-medium">{venue.pricing.door ? 'Available' : 'Not available'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Merch Sales:</span>
                      <span className="font-medium">{venue.pricing.merchandise ? 'Allowed' : 'Not allowed'}</span>
                    </div>
                    {venue.hasAccount && (
                      <div className="flex justify-between">
                        <span>Platform:</span>
                        <span className="font-medium text-green-600">Managed on-site</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Management Section - FOR TESTING */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">🧪 Testing Venue Team Management</h3>
            <p className="text-sm text-yellow-700">
              This section shows how venue owners/managers would manage their team. In production, this would only appear for authenticated venue staff.
            </p>
          </div>
          
          <TeamManagement
            entityType="venue"
            entityId={venue.id}
            entityName={venue.name}
            currentUserId="test-venue-user-456"
            canManageMembers={true}
          />
        </div>

        {/* Venue Booking Calendar */}
        <div className="mb-8">
          <TourItinerary venueId={venue.id} title="Booking Calendar" editable={false} />
        </div>
      </div>
    </div>
  );
} 
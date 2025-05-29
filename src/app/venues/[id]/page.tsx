'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BookingInquiryForm from '../../../components/BookingInquiryForm';
import MessageButton from '../../../components/MessageButton';
import TeamMembers from '../../../components/TeamMembers';
import InviteMemberModal from '../../../components/InviteMemberModal';
import ClaimEntityModal from '../../../components/ClaimEntityModal';
import MediaSection from '../../../components/MediaSection';
import TabbedTourItinerary from '../../../components/TabbedTourItinerary';
import UserStatus from '../../../components/UserStatus';
import { useAuth } from '../../../contexts/AuthContext';

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
  streetAddress?: string;
  postalCode?: string;
  neighborhood?: string;
  addressLine2?: string;
}

export default function VenueDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
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
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

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
        
        // Load members
        await loadMembers(resolvedParams.id);
      } catch (error) {
        console.error('Failed to load venue:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadVenue();
  }, [params, router]);

  const loadMembers = async (id: string) => {
    try {
      setLoadingMembers(true);
      const response = await fetch(`/api/members?entityType=venue&entityId=${id}`);
      
      if (response.ok) {
        const membersData = await response.json();
        setMembers(Array.isArray(membersData) ? membersData : []);
      } else {
        console.warn('Failed to load members:', response.status);
        setMembers([]);
      }
    } catch (error) {
      console.warn('Could not load members:', error);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

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
          <div className="flex items-center justify-between">
            <Link 
              href="/?tab=venues"
              className="inline-flex items-center text-gray-600 hover:text-black"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to spaces
            </Link>
            
            {/* User Status - Shows notifications and user menu */}
            <UserStatus />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Venue Title */}
        <div className="mb-6">
          {/* Mobile-First Responsive Layout */}
          <div className="space-y-4">
            {/* Top Row: Thumbnail + Name + Location/Info */}
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Venue Thumbnail */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src={venue.images[0] || '/api/placeholder/other'}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/api/placeholder/other';
                  }}
                />
              </div>
              
              {/* Venue Name + Location/Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-1">
                  {venue.name}
                </h1>
                
                {/* Location & Details - directly below name */}
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {venue.city}, {venue.state}
                    {venue.capacity && (
                      <>
                        <span className="text-gray-400 mx-2">•</span>
                        <span>{venue.capacity >= 1000 ? `${(venue.capacity / 1000).toFixed(venue.capacity % 1000 === 0 ? 0 : 1)}k` : venue.capacity} cap</span>
                      </>
                    )}
                    <span className="text-gray-400 mx-2">•</span>
                    {venue.rating && venue.rating > 0 ? (
                      <span className="text-gray-700">★ {venue.rating.toFixed(1)}</span>
                    ) : (
                      <span className="text-gray-400">★ N/A</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Second Row: Message Button - Aligned with title/info */}
            <div className="pl-[60px] sm:pl-20 lg:pl-20">
              <div className="flex items-center gap-3">
                <MessageButton 
                  recipientId={venue.id}
                  recipientName={venue.name}
                  recipientType="venue"
                  variant="primary"
                  size="sm"
                  className="text-sm"
                  context={{
                    fromPage: 'venue-profile',
                    entityName: venue.name,
                    entityType: 'venue'
                  }}
                  isOwnEntity={(() => {
                    if (!user) return false;
                    // Check if user is a member of this venue (indicating ownership/membership)
                    const isMember = members.some(member => member.id === user.id);
                    return isMember;
                  })()}
                >
                  Send Message
                </MessageButton>
                
                {/* Edit Profile Button - Only show for members with edit permissions */}
                {(() => {
                  if (!user) return null;
                  
                  // Check if user is a member with edit permissions
                  const userMembership = members.find(member => member.id === user.id);
                  const canEdit = userMembership && (userMembership.role === 'Owner' || userMembership.role === 'Staff') || user.role === 'admin';
                  
                  if (!canEdit) return null;
                  
                  return (
                    <Link
                      href={`/venues/${venue.id}/edit`}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </Link>
                  );
                })()}
              </div>
            </div>
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

        {/* Members - Moved to top for trust/credibility */}
        {!loadingMembers && (
          <div className="mb-6">
            <TeamMembers 
              members={members}
              entityType="venue"
              entityName={venue.name}
              entityId={venue.id}
              maxDisplay={8}
              canInviteMembers={(() => {
                if (!user) return false;
                // Check if user is a member of this venue (either direct owner or member)
                const isMember = members.some(member => member.id === user.id);
                return isMember;
              })()}
              onInviteClick={() => setShowInviteModal(true)}
              onClaimClick={members.length === 0 ? () => setShowClaimModal(true) : undefined}
            />
          </div>
        )}

        {/* Show Dates Table - CORE BOOKING FUNCTIONALITY - Highest Priority */}
        <div className="mb-8">
          <TabbedTourItinerary 
            venueId={venue.id} 
            venueName={venue.name}
            title="Show Dates" 
            editable={(() => {
              if (!user) return false;
              // Check if user is a member of this venue (either direct owner or member)
              const isMember = members.some(member => member.id === user.id);
              return isMember;
            })()}
            viewerType="public" 
          />
        </div>

        {/* Compact Media Section - Supporting content */}
        <div className="mb-8">
          <MediaSection
            entityId={venue.id}
            entityType="venue"
            className="w-full"
            compact={true}
          />
        </div>

        <div>
          {/* Venue Details */}
          <div className="mb-8">
            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">About {venue.name}</h2>
              <p className="text-gray-700 leading-relaxed">{venue.description}</p>
            </div>

            {/* Features */}
            {venue.features && venue.features.length > 0 && (
              <div className="mb-8">
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
            )}
          </div>

          {/* Genres */}
          {venue.genres && venue.genres.length > 0 && (
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
          )}

          {/* Contact Info */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
            <div className="space-y-2">
              {/* Address - if available */}
              {venue.streetAddress && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="text-gray-700">
                    <div>{venue.streetAddress}</div>
                    {venue.addressLine2 && <div>{venue.addressLine2}</div>}
                    <div>
                      {venue.city}, {venue.state} {venue.postalCode}
                    </div>
                    {venue.neighborhood && (
                      <div className="text-sm text-gray-500">({venue.neighborhood})</div>
                    )}
                  </div>
                </div>
              )}
              
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

          {/* Equipment */}
          <div className="mb-8">
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

          {/* Pricing Info */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Pricing & Policies</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Typical Guarantee:</span>
                <span className="font-medium">${venue.pricing.guarantee}</span>
              </div>
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

        {/* Invite Member Modal */}
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          entityType="venue"
          entityName={venue.name}
          entityId={venue.id}
          onSuccess={() => {
            setBookingStatus('Invitation sent successfully! They will receive an email from DIY Shows.');
            setTimeout(() => setBookingStatus(''), 5000);
            // Reload members
            loadMembers(venue.id);
          }}
        />

        {/* Claim Entity Modal */}
        <ClaimEntityModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          entityType="venue"
          entityName={venue.name}
          entityId={venue.id}
          onSuccess={() => {
            setBookingStatus('Venue claimed successfully! You are now a member.');
            setTimeout(() => setBookingStatus(''), 5000);
            // Reload members
            loadMembers(venue.id);
          }}
        />
      </div>
    </div>
  );
} 
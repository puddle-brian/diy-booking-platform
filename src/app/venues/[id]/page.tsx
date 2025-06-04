'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import ProfileLayout from '../../../components/profile/ProfileLayout';
import { ProfileContext, Venue } from '../../../components/profile/ProfileModules';
import UserStatus from '../../../components/UserStatus';
import BookingInquiryForm from '../../../components/BookingInquiryForm';
import InviteMemberModal from '../../../components/InviteMemberModal';
import ClaimEntityModal from '../../../components/ClaimEntityModal';

// Use the same interface as the original
interface VenueData {
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
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  
  // Booking inquiry state
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [hasSentInquiry, setHasSentInquiry] = useState(false);
  const [isClaimingMode, setIsClaimingMode] = useState(false);
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
  
  // Modal state
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
      setShowInquiryForm(false);
      
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

  const handleMembersUpdate = () => {
    if (venue) {
      loadMembers(venue.id);
    }
  };

  // Transform venue data to match modular system interface
  const transformedVenue: Venue | null = venue ? {
    id: venue.id,
    name: venue.name,
    city: venue.city,
    state: venue.state,
    country: venue.country,
    images: venue.images || [],
    description: venue.description || '',
    rating: venue.rating,
    contact: {
      email: venue.contact?.email || '',
      phone: venue.contact?.phone,
      website: venue.contact?.website,
      social: venue.contact?.social
    },
    venueType: venue.venueType,
    capacity: venue.capacity,
    ageRestriction: venue.ageRestriction,
    genres: venue.genres || [],
    equipment: {
      pa: venue.equipment?.pa || false,
      mics: venue.equipment?.mics || false,
      drums: venue.equipment?.drums || false,
      amps: venue.equipment?.amps || false,
      piano: venue.equipment?.piano || false
    },
    features: venue.features || [],
    pricing: {
      guarantee: venue.pricing?.guarantee || 0,
      door: venue.pricing?.door || false,
      merchandise: venue.pricing?.merchandise || false
    },
    streetAddress: venue.streetAddress,
    neighborhood: venue.neighborhood,
    postalCode: venue.postalCode
  } : null;

  // Determine user context and permissions
  const context: ProfileContext = {
    viewerType: (() => {
      if (!user) return 'public';
      if (user.role === 'admin') return 'admin';
      
      // Check if user is a member of this venue
      const isMember = members.some(member => member.id === user.id);
      if (isMember) return 'venue';
      
      // If not a venue member, check if user is an artist
      // We'll check this by looking at the user's entity memberships
      // For now, we'll use a simple check - if user has any artist memberships
      // TODO: This could be improved by actually fetching user's artist memberships
      // But for now, we'll assume any logged-in non-venue member could be an artist
      return 'artist';
    })(),
    entityType: 'venue',
    isOwner: (() => {
      if (!user) return false;
      return members.some(member => member.id === user.id);
    })(),
    canEdit: (() => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      // Check if user has edit permissions
      const userMembership = members.find(member => member.id === user.id);
      return userMembership && (
        userMembership.role === 'Owner' || 
        userMembership.role === 'Staff'
      );
    })()
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

  if (!venue || !transformedVenue) {
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

      {/* Status Message */}
      {bookingStatus && (
        <div className="container mx-auto px-4 pt-4">
          <div className={`p-4 rounded-lg ${
            bookingStatus.includes('sent') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {bookingStatus}
          </div>
        </div>
      )}

      {/* Modular Profile Layout */}
      <ProfileLayout
        entity={transformedVenue}
        context={context}
        members={members}
        loadingMembers={loadingMembers}
        onMembersUpdate={handleMembersUpdate}
        onBookingInquiry={() => setShowInquiryForm(true)}
        hasSentInquiry={hasSentInquiry}
      >
        {/* Legacy Booking Inquiry Form - Only show when form is active */}
        {showInquiryForm && (
          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            {isClaimingMode ? (
              // Venue Claiming Form
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Venue Claiming Request</h3>
                  <p className="text-sm text-blue-700">
                    We'll verify your connection to the venue and set up your account to manage this profile.
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
                  <p className="text-xs text-gray-500 mt-1">Preferably matches the venue's listed contact email</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification Details</label>
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
                      setShowInquiryForm(false);
                      setIsClaimingMode(false);
                    }}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              // Booking Inquiry Form
              <BookingInquiryForm
                recipientType="venue"
                recipientId={venue.id}
                recipientName={venue.name}
                onSuccess={() => {
                  setShowInquiryForm(false);
                  markInquiryAsSent(venue.id);
                  setBookingStatus('Booking inquiry sent! We\'ll forward this to the venue.');
                  setTimeout(() => setBookingStatus(''), 8000);
                }}
                onCancel={() => setShowInquiryForm(false)}
              />
            )}
          </div>
        )}
      </ProfileLayout>

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
  );
} 
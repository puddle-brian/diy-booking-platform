'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import ProfileLayout from '../../../components/profile/ProfileLayout';
import { ProfileContext, Artist } from '../../../components/profile/ProfileModules';
import UserStatus from '../../../components/UserStatus';
import BookingInquiryForm from '../../../components/BookingInquiryForm';
import InviteMemberModal from '../../../components/InviteMemberModal';
import ClaimEntityModal from '../../../components/ClaimEntityModal';
import TemplateModal from '../../../components/TemplateModal';

// Use the same interfaces as the original
interface ArtistData {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  artistType: 'band' | 'solo' | 'duo' | 'collective';
  genres: string[];
  members: number;
  yearFormed: number;
  tourStatus: 'active' | 'hiatus' | 'selective' | 'local-only';
  equipment: {
    needsPA: boolean;
    needsMics: boolean;
    needsDrums: boolean;
    needsAmps: boolean;
    acoustic: boolean;
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
  expectedDraw: string;
  tourRadius: 'local' | 'regional' | 'national' | 'international';
  hasAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TourRequest {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  cities: string[];
  regions: string[];
  flexibility: 'exact-cities' | 'region-flexible' | 'route-flexible';
  genres: string[];
  expectedDraw: {
    min: number;
    max: number;
    description: string;
  };
  tourStatus: 'confirmed-routing' | 'flexible-routing' | 'exploring-interest';
  ageRestriction?: 'all-ages' | '18+' | '21+' | 'flexible';
  equipment: {
    needsPA: boolean;
    needsMics: boolean;
    needsDrums: boolean;
    needsAmps: boolean;
    acoustic: boolean;
  };
  guaranteeRange?: {
    min: number;
    max: number;
  };
  acceptsDoorDeals: boolean;
  merchandising: boolean;
  travelMethod: 'van' | 'flying' | 'train' | 'other';
  lodging: 'floor-space' | 'hotel' | 'flexible';
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  priority: 'high' | 'medium' | 'low';
  responses: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export default function ArtistDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingTourRequests, setLoadingTourRequests] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [venue, setVenue] = useState<any>(null);
  
  // Booking inquiry state
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [hasSentInquiry, setHasSentInquiry] = useState(false);
  const [isClaimingMode, setIsClaimingMode] = useState(false);
  const [claimingForm, setClaimingForm] = useState({
    artistName: '',
    contactEmail: '',
    contactPhone: '',
    contactName: '',
    message: '',
  });
  const [contactStatus, setContactStatus] = useState('');
  
  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        
        // Load all data in parallel to reduce total loading time
        await Promise.all([
          loadArtist(resolvedParams.id),
          loadTourRequests(resolvedParams.id),
          loadMembers(resolvedParams.id),
          // Skip venue loading for now since profileType doesn't exist in User interface
          Promise.resolve(null)
        ]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadVenue = async (venueId: string) => {
    try {
      const response = await fetch(`/api/venues/${venueId}`);
      if (response.ok) {
        const venueData = await response.json();
        setVenue(venueData);
      }
    } catch (error) {
      console.error('Error loading venue:', error);
    }
  };

  const loadArtist = async (id: string) => {
    try {
      console.log('🎯 Loading artist with ID:', id);
      
      const response = await fetch(`/api/artists/${id}`);
      console.log('🎯 Artist API response:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('🎯 Artist API error:', errorData);
        throw new Error(errorData.error || `Failed to load artist (${response.status})`);
      }
      
      const artistData = await response.json();
      console.log('🎯 Artist data loaded:', artistData.name, artistData.id);
      setArtist(artistData);
      setError(null);
    } catch (error) {
      console.error('🎯 Failed to load artist:', error);
      setError(error instanceof Error ? error.message : 'Failed to load artist');
    }
  };

  // Load tour requests separately
  const loadTourRequests = async (id: string) => {
    try {
      setLoadingTourRequests(true);
      console.log('🔍 Loading tour requests for artist:', id, artist?.name);
      const response = await fetch(`/api/tour-requests?artistId=${id}&activeOnly=true`);
      console.log('📡 Tour requests response:', response.status, response.statusText);
      
      if (response.ok) {
        const requestsData = await response.json();
        console.log('📊 Tour requests data:', requestsData);
        console.log('📊 Tour requests array?', Array.isArray(requestsData));
        console.log('📊 Tour requests length:', requestsData?.length);
        
        // Handle both array and object with requests property
        const requests = Array.isArray(requestsData) ? requestsData : (requestsData.requests || []);
        setTourRequests(requests);
        console.log('✅ Tour requests set:', requests.length, 'requests');
      } else {
        console.warn('⚠️ Tour requests API failed:', response.status);
        setTourRequests([]);
      }
    } catch (error) {
      console.warn('⚠️ Could not load tour requests:', error);
      setTourRequests([]);
    } finally {
      setLoadingTourRequests(false);
      console.log('🏁 Tour requests loading finished');
    }
  };

  const loadMembers = async (id: string) => {
    try {
      setLoadingMembers(true);
      const response = await fetch(`/api/members?entityType=artist&entityId=${id}`);
      
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

  // Check if user has already sent an inquiry to this artist
  useEffect(() => {
    if (artist) {
      const sentInquiries = JSON.parse(localStorage.getItem('sentBookingInquiries') || '[]');
      const alreadySent = sentInquiries.includes(`artist-${artist.id}`);
      setHasSentInquiry(alreadySent);
    }
  }, [artist]);

  const markInquiryAsSent = (artistId: string) => {
    const sentInquiries = JSON.parse(localStorage.getItem('sentBookingInquiries') || '[]');
    const inquiryKey = `artist-${artistId}`;
    if (!sentInquiries.includes(inquiryKey)) {
      sentInquiries.push(inquiryKey);
      localStorage.setItem('sentBookingInquiries', JSON.stringify(sentInquiries));
      setHasSentInquiry(true);
    }
  };

  const getContactContent = () => {
    if (!artist) {
      return {
        type: 'loading',
        title: 'Loading...',
        message: '',
        action: null
      };
    }

    if (!artist.hasAccount) {
      return {
        type: 'no-account',
        title: 'Contact Directly',
        message: 'This artist doesn\'t manage bookings through our platform.',
        action: null
      };
    }

    return {
      type: 'can-contact',
      title: 'Send Booking Request',
      message: 'Contact this artist about potential shows.',
      action: 'contact'
    };
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('Submitting claim request...');
    
    try {
      const response = await fetch('/api/artist-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...claimingForm,
          artistId: artist?.id,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit claim request');
      }

      setContactStatus('Claim request sent! We will verify your connection to the artist and contact you within 24-48 hours.');
      setShowInquiryForm(false);
      setIsClaimingMode(false);
      
      // Reset form
      setClaimingForm({
        artistName: '',
        contactEmail: '',
        contactPhone: '',
        contactName: '',
        message: '',
      });
      
      setTimeout(() => setContactStatus(''), 8000);
    } catch (error) {
      setContactStatus(`Error: ${error instanceof Error ? error.message : 'Failed to submit claim request'}`);
      setTimeout(() => setContactStatus(''), 5000);
    }
  };

  const handleBidSuccess = (bid: any) => {
    setShowInquiryForm(false);
    setContactStatus('Bid submitted successfully! The artist will review your offer and get back to you.');
    setTimeout(() => setContactStatus(''), 8000);
    
    // Refresh tour requests to update bid count
    if (artist) {
      fetch(`/api/tour-requests?artistId=${artist.id}&activeOnly=true`)
        .then(response => response.json())
        .then(data => {
          const requests = Array.isArray(data) ? data : (data.requests || []);
          setTourRequests(requests);
        })
        .catch(console.error);
    }
  };

  const handleMembersUpdate = () => {
    if (artist) {
      loadMembers(artist.id);
    }
  };

  // Transform artist data to match modular system interface
  const transformedArtist: Artist | null = artist ? {
    id: artist.id,
    name: artist.name,
    city: artist.city,
    state: artist.state,
    country: artist.country,
    images: artist.images || [],
    description: artist.description || '',
    rating: artist.rating,
    contact: {
      email: artist.contact?.email || '',
      phone: artist.contact?.phone,
      website: artist.contact?.website,
      social: artist.contact?.social
    },
    artistType: artist.artistType,
    genres: artist.genres || [],
    tourStatus: artist.tourStatus || 'active',
    yearFormed: artist.yearFormed,
    members: artist.members,
    expectedDraw: artist.expectedDraw,
    equipment: {
      needsPA: artist.equipment?.needsPA || false,
      needsMics: artist.equipment?.needsMics || false,
      needsDrums: artist.equipment?.needsDrums || false,
      needsAmps: artist.equipment?.needsAmps || false,
      acoustic: artist.equipment?.acoustic || false
    }
  } : null;

  // Determine user context and permissions
  const context: ProfileContext = {
    viewerType: (() => {
      if (!user) return 'public';
      if (user.role === 'admin') return 'admin';
      
      // Check if user is a member of this artist
      const isMember = members.some(member => member.id === user.id);
      if (isMember) return 'artist';
      
      // Check if user is a venue user (has venue association)
      // This allows venue users to bid on tour requests even when viewing artist pages
      const hasVenueMembership = user.memberships?.some(membership => membership.entityType === 'venue');
      if (venue || hasVenueMembership) return 'venue';
      
      return 'public';
    })(),
    entityType: 'artist',
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
        userMembership.role === 'Member' || 
        userMembership.role === 'Admin'
      );
    })()
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading artist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎸</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
            <Link href="/?tab=artists" className="block text-blue-600 hover:text-blue-800">
              ← Back to artists
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!artist || !transformedArtist) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Artist not found</h1>
          <Link href="/?tab=artists" className="text-blue-600 hover:text-blue-800">
            ← Back to artists
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
              href="/?tab=artists"
              className="inline-flex items-center text-gray-600 hover:text-black"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to artists
            </Link>
            
            {/* User Status - Shows notifications and user menu */}
            <UserStatus />
          </div>
        </div>
      </header>

      {/* Status Message */}
      {contactStatus && (
        <div className="container mx-auto px-4 pt-4">
          <div className={`p-4 rounded-lg ${
            contactStatus.includes('sent') || contactStatus.includes('submitted') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {contactStatus}
          </div>
        </div>
      )}

      {/* Modular Profile Layout */}
      <ProfileLayout
        entity={transformedArtist}
        context={context}
        members={members}
        loadingMembers={loadingMembers}
        onMembersUpdate={handleMembersUpdate}
        onBookingInquiry={() => setShowInquiryForm(true)}
        onTemplateManage={() => setShowTemplateModal(true)}
        hasSentInquiry={hasSentInquiry}
      >
        {/* Legacy Booking Inquiry Form - Only show when form is active */}
        {showInquiryForm && (
          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            {isClaimingMode ? (
              // Artist Claiming Form
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Artist Claiming Request</h3>
                  <p className="text-sm text-blue-700">
                    We'll verify your connection to the artist and set up your account to manage this profile.
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Artist/Band Name</label>
                  <input
                    type="text"
                    required
                    value={claimingForm.artistName}
                    onChange={(e) => setClaimingForm(prev => ({ ...prev, artistName: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Artist name"
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
                  <p className="text-xs text-gray-500 mt-1">Preferably matches the artist's listed contact email</p>
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
                    placeholder="Tell us about your role in the band/project and any verification details..."
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
                recipientType="artist"
                recipientId={artist.id}
                recipientName={artist.name}
                onSuccess={() => {
                  setShowInquiryForm(false);
                  markInquiryAsSent(artist.id);
                  setContactStatus('Booking inquiry sent! We\'ll forward this to the artist via email.');
                  setTimeout(() => setContactStatus(''), 8000);
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
        entityType="artist"
        entityName={artist.name}
        entityId={artist.id}
        onSuccess={() => {
          setContactStatus('Invitation sent successfully! They will receive an email from DIY Shows.');
          setTimeout(() => setContactStatus(''), 5000);
          // Reload members
          loadMembers(artist.id);
        }}
      />

      {/* Claim Entity Modal */}
      <ClaimEntityModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        entityType="artist"
        entityName={artist.name}
        entityId={artist.id}
        onSuccess={() => {
          setContactStatus('Artist claimed successfully! You are now a member.');
          setTimeout(() => setContactStatus(''), 5000);
          // Reload members
          loadMembers(artist.id);
        }}
      />

      {/* Template Modal */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        artistId={artist.id}
        artistName={artist.name}
      />
    </div>
  );
} 
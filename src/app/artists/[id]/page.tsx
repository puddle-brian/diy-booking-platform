'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TabbedTourItinerary from '../../../components/TabbedTourItinerary';
import BookingInquiryForm from '../../../components/BookingInquiryForm';
// import TeamManagement from '../../../components/TeamManagement';
import TeamMembers from '../../../components/TeamMembers';
import InviteMemberModal from '../../../components/InviteMemberModal';
import ClaimEntityModal from '../../../components/ClaimEntityModal';
import MessageButton from '../../../components/MessageButton';
import MediaSection from '../../../components/MediaSection';
import { useAuth } from '../../../contexts/AuthContext';

interface Artist {
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
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTourRequests, setLoadingTourRequests] = useState(true);
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
  const [error, setError] = useState<string | null>(null);
  const [venue, setVenue] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        
        // Load all data in parallel to reduce total loading time
        const [artistResult, tourRequestsResult, membersResult, venueResult] = await Promise.all([
          loadArtist(resolvedParams.id),
          loadTourRequests(resolvedParams.id),
          loadMembers(resolvedParams.id),
          // Only load venue data if user is a venue
          user?.profileType === 'venue' && user.profileId 
            ? loadVenue(user.profileId) 
            : Promise.resolve(null)
        ]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.profileId]); // Simplified dependencies - params change will trigger component remount

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
      // Don't redirect immediately, show error state instead
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

  if (!artist) {
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
          <Link 
            href="/?tab=artists"
            className="inline-flex items-center text-gray-600 hover:text-black"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to artists
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Artist Title */}
        <div className="mb-6">
          {/* Mobile-First Responsive Layout */}
          <div className="space-y-4">
            {/* Top Row: Thumbnail + Name + Location/Info */}
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Artist Thumbnail */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src={artist.images?.[0] || `/api/placeholder/${artist.artistType}`}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `/api/placeholder/${artist.artistType}`;
                  }}
                />
              </div>
              
              {/* Artist Name + Location/Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-1">
                  {artist.name}
                </h1>
                
                {/* Location & Details - directly below name */}
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {artist.city}, {artist.state}
                    {artist.artistType && (
                      <>
                        <span className="text-gray-400 mx-2">•</span>
                        <span className="capitalize">{artist.artistType.replace('-', ' ')}</span>
                      </>
                    )}
                    <span className="text-gray-400 mx-2">•</span>
                    {artist.rating && artist.rating > 0 ? (
                      <span className="text-gray-700">★ {artist.rating.toFixed(1)}</span>
                    ) : (
                      <span className="text-gray-400">★ N/A</span>
                    )}
                  </p>
                  
                  {/* Additional info on second line */}
                  {(artist.yearFormed || (artist.genres && artist.genres.length > 0)) && (
                    <p className="text-xs text-gray-500">
                      {artist.yearFormed && `Est. ${artist.yearFormed}`}
                      {artist.yearFormed && artist.genres && artist.genres.length > 0 && ' • '}
                      {artist.genres && artist.genres.length > 0 && (
                        <>
                          {artist.genres.slice(0, 3).join(', ')}
                          {artist.genres.length > 3 && ` +${artist.genres.length - 3} more`}
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Second Row: Message Button - Aligned with title/info */}
            <div className="pl-[60px] sm:pl-20 lg:pl-20">
              <div className="flex items-center gap-3">
                <MessageButton 
                  recipientId={artist.id}
                  recipientName={artist.name}
                  recipientType="artist"
                  variant="primary"
                  size="sm"
                  className="text-sm"
                  context={{
                    fromPage: 'artist-profile',
                    entityName: artist.name,
                    entityType: 'artist'
                  }}
                >
                  Send Message
                </MessageButton>
                
                {/* Edit Profile Button - Only show for members with edit permissions */}
                {(() => {
                  if (!user) return null;
                  
                  // Check if user is a member with edit permissions
                  const userMembership = members.find(member => member.id === user.id);
                  const canEdit = userMembership && (userMembership.role === 'Owner' || userMembership.role === 'Member') || user.role === 'admin';
                  
                  if (!canEdit) return null;
                  
                  return (
                    <Link
                      href={`/artists/${artist.id}/edit`}
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
        {contactStatus && (
          <div className={`mb-6 p-4 rounded-lg ${
            contactStatus.includes('sent') || contactStatus.includes('submitted') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {contactStatus}
          </div>
        )}

        {/* Members - Moved to top for trust/credibility */}
        {!loadingMembers && (
          <div className="mb-6">
            <TeamMembers 
              members={members}
              entityType="artist"
              entityName={artist.name}
              entityId={artist.id}
              maxDisplay={6}
              canInviteMembers={(() => {
                if (!user) return false;
                // Check if user is a member of this artist (either direct owner or member)
                const isMember = members.some(member => member.id === user.id);
                return isMember;
              })()}
              onInviteClick={() => setShowInviteModal(true)}
              onClaimClick={members.length === 0 ? () => setShowClaimModal(true) : undefined}
            />
          </div>
        )}

        {/* Tour Itinerary - CORE BOOKING FUNCTIONALITY - High Priority */}
        <div className="mb-8">
          <TabbedTourItinerary 
            artistId={artist.id} 
            artistName={artist.name}
            title="Tour Dates" 
            editable={(() => {
              if (!user) return false;
              // Check if user is a member of this artist (either direct owner or member)
              const isMember = members.some(member => member.id === user.id);
              return isMember;
            })()} 
            viewerType={(() => {
              if (!user) return 'public';
              if (user.profileType === 'venue') return 'venue';
              if (user.profileType === 'artist') return 'artist';
              return 'public';
            })()} 
            venueId={user?.profileType === 'venue' ? user.profileId : undefined}
            venueName={user?.profileType === 'venue' && venue ? venue.name : undefined}
          />
        </div>

        {/* Compact Media Section - Supporting content */}
        <div className="mb-8">
          <MediaSection
            entityId={artist.id}
            entityType="artist"
            className="w-full"
            compact={true}
          />
        </div>

        <div>
          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">About {artist.name}</h2>
            <p className="text-gray-700 leading-relaxed">{artist.description}</p>
          </div>

          {/* Genres */}
          {artist.genres && artist.genres.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {artist.genres.map((genre) => (
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
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700">{artist.contact.email}</span>
              </div>
              {artist.contact.phone && (
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-700">{artist.contact.phone}</span>
                </div>
              )}
              {artist.contact.website && (
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                  </svg>
                  <a href={artist.contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {artist.contact.website}
                  </a>
                </div>
              )}
              {artist.contact.social && (
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2z" />
                  </svg>
                  <span className="text-gray-700">{artist.contact.social}</span>
                </div>
              )}
            </div>
            
            {/* Contact Buttons */}
            <div className="mt-4 space-y-3">
              {/* Booking Inquiry Button */}
              {(() => {
                const contactContent = getContactContent();
                
                if (contactContent.type === 'no-account') {
                  return !showInquiryForm ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          if (!hasSentInquiry) {
                            setShowInquiryForm(true);
                          }
                        }}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          hasSentInquiry 
                            ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                        disabled={hasSentInquiry}
                      >
                        {hasSentInquiry ? 'Inquiry Sent ✓' : 'Send Booking Inquiry'}
                      </button>
                      
                      {hasSentInquiry && (
                        <button
                          onClick={() => setShowInquiryForm(true)}
                          className="block text-sm text-gray-600 hover:text-gray-800 py-1 w-full text-center"
                        >
                          Send Another Inquiry
                        </button>
                      )}
                    </div>
                  ) : null;
                }

                if (contactContent.type === 'can-contact') {
                  return !showInquiryForm ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          if (!hasSentInquiry) {
                            setShowInquiryForm(true);
                          }
                        }}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          hasSentInquiry 
                            ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                        disabled={hasSentInquiry}
                      >
                        {hasSentInquiry ? 'Inquiry Sent ✓' : 'Send Booking Inquiry'}
                      </button>
                      
                      {hasSentInquiry && (
                        <button
                          onClick={() => setShowInquiryForm(true)}
                          className="block text-sm text-gray-600 hover:text-gray-800 py-1 w-full text-center"
                        >
                          Send Another Inquiry
                        </button>
                      )}
                    </div>
                  ) : null;
                }

                return null;
              })()}
            </div>
          </div>
          
          {/* Show booking inquiry form if needed */}
          {showInquiryForm && (
            <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6">
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
        </div>
      </div>

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
    </div>
  );
} 
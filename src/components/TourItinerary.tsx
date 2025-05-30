'use client';

import React, { useState, useEffect } from 'react';
import { Show, TourRequest } from '../../types';
import VenueBidForm from './VenueBidForm';
import TemplateSelector from './TemplateSelector';
import { ArtistTemplate } from '../../types/templates';

interface VenueBid {
  id: string;
  tourRequestId: string;
  venueId: string;
  venueName: string;
  proposedDate: string;
  guarantee?: number;
  doorDeal?: {
    split: string;
    minimumGuarantee?: number;
  };
  ticketPrice: {
    advance?: number;
    door?: number;
  };
  capacity: number;
  ageRestriction: string;
  equipmentProvided: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  loadIn: string;
  soundcheck: string;
  doorsOpen: string;
  showTime: string;
  curfew: string;
  promotion: {
    social: boolean;
    flyerPrinting: boolean;
    radioSpots: boolean;
    pressCoverage: boolean;
  };
  message: string;
  status: 'pending' | 'hold' | 'accepted' | 'declined' | 'cancelled';
  readByArtist: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  
  // 🎯 HOLD MANAGEMENT - Automatic priority system
  holdPosition?: 1 | 2 | 3; // Auto-assigned: first hold = 1, second = 2, etc.
  heldAt?: string; // When artist placed this bid on hold
  heldUntil?: string; // Hold expiration (typically 7-14 days)
  
  // 🎯 ACCEPTANCE/DECLINE
  acceptedAt?: string; // When artist accepted this bid
  declinedAt?: string; // When artist declined this bid
  declinedReason?: string; // Why artist declined
  
  // 🎯 CANCELLATION (automatic when another bid accepted)
  cancelledAt?: string;
  cancelledReason?: string; // e.g., "Another venue was selected for this date"
}

interface TourItineraryProps {
  artistId?: string;
  artistName?: string;
  venueId?: string;
  venueName?: string;
  title?: string;
  editable?: boolean;
  viewerType?: 'artist' | 'venue' | 'public';
}

interface TimelineEntry {
  type: 'show' | 'tour-request' | 'venue-bid';
  date: string;
  endDate?: string;
  data: Show | TourRequest | VenueBid;
  parentTourRequest?: TourRequest;
}

export default function TourItinerary({ 
  artistId, 
  artistName, 
  venueId, 
  venueName,
  title,
  editable = false,
  viewerType = 'public'
}: TourItineraryProps) {
  const [shows, setShows] = useState<Show[]>([]);
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [venueBids, setVenueBids] = useState<VenueBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBids, setExpandedBids] = useState<Set<string>>(new Set());
  const [showBidForm, setShowBidForm] = useState(false);
  const [selectedTourRequest, setSelectedTourRequest] = useState<TourRequest | null>(null);
  const [holdActions, setHoldActions] = useState<Record<string, boolean>>({});
  const [bidActions, setBidActions] = useState<Record<string, boolean>>({});
  const [holdNotes, setHoldNotes] = useState<{[bidId: string]: string}>({});
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<VenueBid | null>(null);
  const [showBidDetailsModal, setShowBidDetailsModal] = useState(false);
  const [showTourRequestForm, setShowTourRequestForm] = useState(false);
  const [showAddDateForm, setShowAddDateForm] = useState(false);
  const [addDateForm, setAddDateForm] = useState({
    type: 'request' as 'request' | 'confirmed',
    date: '',
    startDate: '',
    endDate: '',
    location: '',
    artistId: '',
    artistName: '',
    venueId: '',
    venueName: '',
    title: '',
    description: '',
    guarantee: '',
    capacity: '',
    ageRestriction: 'all-ages' as 'all-ages' | '18+' | '21+',
    loadIn: '',
    soundcheck: '',
    doorsOpen: '',
    showTime: '',
    curfew: '',
    notes: ''
  });
  const [venues, setVenues] = useState<any[]>([]);
  const [venueSearchResults, setVenueSearchResults] = useState<any[]>([]);
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const [artistSearchResults, setArtistSearchResults] = useState<any[]>([]);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);
  const [tourRequestForm, setTourRequestForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    radius: 50,
    flexibility: 'route-flexible' as 'exact-cities' | 'region-flexible' | 'route-flexible',
    genres: [] as string[],
    expectedDraw: {
      min: 0,
      max: 0,
      description: ''
    },
    tourStatus: 'exploring-interest' as 'confirmed-routing' | 'flexible-routing' | 'exploring-interest',
    ageRestriction: 'flexible' as 'all-ages' | '18+' | '21+' | 'flexible',
    equipment: {
      needsPA: false,
      needsMics: false,
      needsDrums: false,
      needsAmps: false,
      acoustic: false
    },
    guaranteeRange: {
      min: 0,
      max: 0
    },
    acceptsDoorDeals: true,
    merchandising: true,
    travelMethod: 'van' as 'van' | 'flying' | 'train' | 'other',
    lodging: 'flexible' as 'floor-space' | 'hotel' | 'flexible',
    priority: 'medium' as 'high' | 'medium' | 'low'
  });

  // Fetch venues for search functionality
  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venues');
      if (response.ok) {
        const venuesData = await response.json();
        setVenues(venuesData);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  // Fetch artists for search functionality
  const fetchArtists = async () => {
    try {
      const response = await fetch('/api/artists');
      if (response.ok) {
        const artistsData = await response.json();
        setArtists(artistsData);
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  };

  // Handle venue search
  const handleVenueSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setVenueSearchResults([]);
      setShowVenueDropdown(false);
      return;
    }

    const filtered = venues.filter(venue => 
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setVenueSearchResults(filtered.slice(0, 5)); // Limit to 5 results
    setShowVenueDropdown(filtered.length > 0);
  };

  // Handle artist search
  const handleArtistSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setArtistSearchResults([]);
      setShowArtistDropdown(false);
      return;
    }

    const filtered = artists.filter(artist => 
      artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setArtistSearchResults(filtered.slice(0, 5)); // Limit to 5 results
    setShowArtistDropdown(filtered.length > 0);
  };

  // Select venue from search results
  const selectVenue = (venue: any) => {
    setAddDateForm(prev => ({
      ...prev,
      venueId: venue.id,
      venueName: venue.name,
      location: `${venue.city}, ${venue.state}`,
      capacity: venue.capacity?.toString() || '',
      ageRestriction: venue.ageRestriction || 'all-ages'
    }));
    setShowVenueDropdown(false);
    setVenueSearchResults([]);
  };

  // Select artist from search results
  const selectArtist = (artist: any) => {
    setAddDateForm(prev => ({
      ...prev,
      artistId: artist.id,
      artistName: artist.name
    }));
    setShowArtistDropdown(false);
    setArtistSearchResults([]);
  };

  // Data fetching function
  const fetchData = async () => {
    if (!artistId && !venueId) return;
    
    setLoading(true);
    try {
      // Fetch shows
      const params = new URLSearchParams();
      if (artistId) {
        params.append('artistId', artistId);
      }
      if (venueId) {
        params.append('venueId', venueId);
      }
      const showsResponse = await fetch(`/api/shows?${params}`);
      if (!showsResponse.ok) {
        throw new Error('Failed to fetch shows');
      }
      const showsData = await showsResponse.json();
      setShows(Array.isArray(showsData) ? showsData : []);

      if (artistId) {
        // Fetch tour requests for artists
        const requestsResponse = await fetch(`/api/tour-requests?artistId=${artistId}`);
        const requestsData = await requestsResponse.json();
        
        // Fetch bids for each request and attach them
        const requestsWithBids = await Promise.all(
          (requestsData.requests || []).map(async (request: TourRequest) => {
            try {
              const bidsResponse = await fetch(`/api/tour-requests/${request.id}/bids`);
              if (bidsResponse.ok) {
                const bidsData = await bidsResponse.json();
                return { ...request, bids: Array.isArray(bidsData) ? bidsData : [] };
              } else {
                return { ...request, bids: [] };
              }
            } catch (error) {
              console.error(`Error fetching bids for ${request.id}:`, error);
              return { ...request, bids: [] };
            }
          })
        );
        
        setTourRequests(requestsWithBids);
        
        // Also populate the venueBids array for backward compatibility
        const allBids = requestsWithBids.flatMap(request => 
          (request.bids || []).map((bid: VenueBid) => ({ 
            ...bid, 
            tourRequestId: request.id 
          }))
        );
        setVenueBids(allBids);
      } else if (venueId) {
        // Fetch venue bids for venues
        try {
          const venueBidsResponse = await fetch(`/api/venues/${venueId}/bids`);
          if (venueBidsResponse.ok) {
            const venueBidsData = await venueBidsResponse.json();
            
            // Fetch tour request details for each bid to get artist information
            const bidsWithTourRequests = await Promise.all(
              (Array.isArray(venueBidsData) ? venueBidsData : []).map(async (bid: VenueBid) => {
                try {
                  // Fetch tour requests to find the matching one
                  const tourRequestsResponse = await fetch('/api/tour-requests');
                  if (tourRequestsResponse.ok) {
                    const tourRequestsData = await tourRequestsResponse.json();
                    const matchingRequest = tourRequestsData.requests?.find((req: any) => req.id === bid.tourRequestId);
                    
                    if (matchingRequest) {
                      return { 
                        ...bid, 
                        tourRequest: matchingRequest,
                        artistName: matchingRequest.artistName,
                        location: matchingRequest.location
                      };
                    }
                  }
                  
                  // Fallback if tour request not found
                  return { 
                    ...bid, 
                    artistName: 'Unknown Artist',
                    location: venueName || 'Unknown Location'
                  };
                } catch (error) {
                  console.error(`Error fetching tour request ${bid.tourRequestId}:`, error);
                  return { 
                    ...bid, 
                    artistName: 'Unknown Artist',
                    location: venueName || 'Unknown Location'
                  };
                }
              })
            );
            
            setVenueBids(bidsWithTourRequests);
          }
        } catch (error) {
          console.error('Error fetching venue bids:', error);
          setVenueBids([]);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchVenues(); // Fetch venues for search functionality
    fetchArtists(); // Fetch artists for search functionality
  }, [artistId, viewerType, venueId]);

  // Combine shows, tour requests, and bids into unified timeline
  const createTimelineEntries = (): TimelineEntry[] => {
    const entries: TimelineEntry[] = [];
    
    // Add confirmed shows
    shows.forEach(show => {
      entries.push({
        type: 'show',
        date: show.date,
        data: show
      });
    });
    
    if (artistId) {
      // Add tour requests as date ranges for artists
      tourRequests.forEach(request => {
        if (request.status === 'active') {
          entries.push({
            type: 'tour-request',
            date: request.startDate,
            endDate: request.endDate,
            data: request
          });
        }
      });
    } else if (venueId) {
      // Add venue bids for venues
      venueBids.forEach(bid => {
        if (!['expired', 'cancelled', 'declined'].includes(bid.status)) {
          entries.push({
            type: 'venue-bid',
            date: bid.proposedDate,
            data: bid
          });
        }
      });
    }
    
    // Sort by date
    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const timelineEntries = createTimelineEntries();

  const toggleBidExpansion = (requestId: string) => {
    setExpandedBids(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const handleBidSuccess = (bid: any) => {
    setShowBidForm(false);
    setSelectedTourRequest(null);
    fetchData();
  };

  const handlePlaceBid = (tourRequest: TourRequest) => {
    setSelectedTourRequest(tourRequest);
    setShowBidForm(true);
  };

  const handleViewBidDetails = (bid: VenueBid) => {
    setSelectedBid(bid);
    setShowBidDetailsModal(true);
  };

  const handleConfirmShow = async (bid: VenueBid & { artistName?: string; location?: string }) => {
    if (!confirm(`Confirm this show with ${bid.artistName || 'the artist'} on ${new Date(bid.proposedDate).toLocaleDateString()}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/shows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId: (bid as any).tourRequest?.artistId || 'unknown',
          artistName: bid.artistName || 'Unknown Artist',
          venueId: venueId,
          venueName: venueName,
          date: bid.proposedDate,
          city: bid.location?.split(',')[0] || venueName || 'Unknown',
          state: bid.location?.split(',')[1]?.trim() || 'Unknown',
          capacity: bid.capacity,
          ageRestriction: bid.ageRestriction,
          guarantee: bid.guarantee,
          doorDeal: bid.doorDeal,
          showTime: bid.showTime,
          loadIn: bid.loadIn,
          soundcheck: bid.soundcheck,
          doorsOpen: bid.doorsOpen,
          curfew: bid.curfew,
          status: 'confirmed',
          bidId: bid.id,
          tourRequestId: bid.tourRequestId,
          createdBy: 'venue'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm show');
      }

      // Refresh data to show the new confirmed show
      await fetchData();
      
      alert('Show confirmed! This booking is now official.');
    } catch (error) {
      console.error('Error confirming show:', error);
      alert(`Failed to confirm show: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancelBid = async (bid: VenueBid & { artistName?: string; location?: string }) => {
    if (!confirm(`Cancel your bid for ${bid.artistName || 'this artist'} on ${new Date(bid.proposedDate).toLocaleDateString()}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tour-requests/${bid.tourRequestId}/bids/${bid.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel bid');
      }

      // Refresh data to remove the cancelled bid
      await fetchData();
      
      alert('Bid cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling bid:', error);
      alert('Failed to cancel bid. Please try again.');
    }
  };

  const handleBidAction = async (bid: VenueBid, action: string, reason?: string) => {
    const bidId = bid.id;
    setBidActions(prev => ({ ...prev, [bidId]: true }));

    try {
      const response = await fetch(`/api/tour-requests/${bid.tourRequestId}/bids/${bidId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          declineReason: reason
        }),
      });

      if (response.ok) {
        // Refresh the data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to ${action} bid: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${action} bid:`, error);
      alert(`Failed to ${action} bid. Please try again.`);
    } finally {
      setBidActions(prev => ({ ...prev, [bidId]: false }));
    }
  };

  const getBidStatusBadge = (bid: VenueBid) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (bid.status) {
      case 'pending':
        return {
          className: `${baseClasses} bg-yellow-100 text-yellow-800`,
          text: 'Pending Review'
        };
      case 'hold':
        const holdColor = bid.holdPosition === 1 
          ? 'bg-blue-100 text-blue-800' 
          : bid.holdPosition === 2
          ? 'bg-purple-100 text-purple-800'
          : 'bg-gray-100 text-gray-800';
        
        const holdText = bid.holdPosition === 1 
          ? 'First Hold' 
          : bid.holdPosition === 2
          ? 'Second Hold'
          : bid.holdPosition === 3
          ? 'Third Hold'
          : 'On Hold';
          
        return {
          className: `${baseClasses} ${holdColor}`,
          text: holdText
        };
      case 'accepted':
        return {
          className: `${baseClasses} bg-green-100 text-green-800`,
          text: 'Accepted'
        };
      case 'declined':
        return {
          className: `${baseClasses} bg-red-100 text-red-800`,
          text: 'Declined'
        };
      default:
        return {
          className: `${baseClasses} bg-gray-100 text-gray-800`,
          text: bid.status
        };
    }
  };

  const handleDeleteShowRequest = async (requestId: string, requestName: string) => {
    if (!confirm(`Are you sure you want to delete "${requestName}"? This will cancel all bids and cannot be undone.`)) {
      return;
    }

    setDeleteLoading(requestId);
    
    try {
      const response = await fetch(`/api/tour-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete show request');
      }

      await fetchData();
      
    } catch (error) {
      console.error('Delete show request failed:', error);
      alert('Failed to delete show request');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleTourRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistId || !artistName) {
      alert('Missing artist information. Please try again.');
      return;
    }

    try {
      const response = await fetch('/api/tour-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tourRequestForm,
          artistId,
          artistName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tour request');
      }

      const newRequest = await response.json();
      
      // Reset form and close modal
      setShowTourRequestForm(false);
      setTourRequestForm({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        radius: 50,
        flexibility: 'route-flexible',
        genres: [],
        expectedDraw: { min: 0, max: 0, description: '' },
        tourStatus: 'exploring-interest',
        ageRestriction: 'flexible',
        equipment: { needsPA: false, needsMics: false, needsDrums: false, needsAmps: false, acoustic: false },
        guaranteeRange: { min: 0, max: 0 },
        acceptsDoorDeals: true,
        merchandising: true,
        travelMethod: 'van',
        lodging: 'flexible',
        priority: 'medium'
      });

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error creating tour request:', error);
      alert(`Failed to create tour request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (addDateForm.type === 'request') {
        // Create a tour request
        if (!artistId || !artistName) {
          alert('Missing artist information. Please try again.');
          return;
        }

        const response = await fetch('/api/tour-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: addDateForm.title || `${addDateForm.location} - ${new Date(addDateForm.startDate).toLocaleDateString()}`,
            description: addDateForm.description || `Looking for a show in ${addDateForm.location}`,
            startDate: addDateForm.startDate,
            endDate: addDateForm.endDate,
            location: addDateForm.location,
            radius: 50,
            flexibility: 'exact-cities',
            genres: [],
            expectedDraw: { min: 0, max: 0, description: '' },
            tourStatus: 'exploring-interest',
            ageRestriction: addDateForm.ageRestriction,
            equipment: { needsPA: false, needsMics: false, needsDrums: false, needsAmps: false, acoustic: false },
            guaranteeRange: { min: 0, max: 0 },
            acceptsDoorDeals: true,
            merchandising: true,
            travelMethod: 'van',
            lodging: 'flexible',
            priority: 'medium',
            artistId,
            artistName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create tour request');
        }
      } else {
        // Create a confirmed show
        const response = await fetch('/api/shows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artistId: artistId || addDateForm.artistId || 'external-artist',
            artistName: artistName || addDateForm.artistName,
            venueId: venueId || addDateForm.venueId,
            venueName: venueName || addDateForm.venueName,
            date: addDateForm.date,
            city: addDateForm.location.split(',')[0]?.trim() || 'Unknown',
            state: addDateForm.location.split(',')[1]?.trim() || 'Unknown',
            capacity: parseInt(addDateForm.capacity) || 0,
            ageRestriction: addDateForm.ageRestriction,
            guarantee: addDateForm.guarantee ? parseInt(addDateForm.guarantee) : undefined,
            loadIn: addDateForm.loadIn,
            soundcheck: addDateForm.soundcheck,
            doorsOpen: addDateForm.doorsOpen,
            showTime: addDateForm.showTime,
            curfew: addDateForm.curfew,
            notes: addDateForm.notes,
            status: 'confirmed',
            createdBy: viewerType || 'user'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create show');
        }
      }

      // Reset form and close modal
      setShowAddDateForm(false);
      setAddDateForm({
        type: 'request',
        date: '',
        startDate: '',
        endDate: '',
        location: '',
        artistId: '',
        artistName: '',
        venueId: '',
        venueName: '',
        title: '',
        description: '',
        guarantee: '',
        capacity: '',
        ageRestriction: 'all-ages',
        loadIn: '',
        soundcheck: '',
        doorsOpen: '',
        showTime: '',
        curfew: '',
        notes: ''
      });

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error adding date:', error);
      alert(`Failed to add date: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAutoFillTourRequest = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const cities = ['Seattle, WA', 'Portland, OR', 'San Francisco, CA', 'Los Angeles, CA', 'Denver, CO', 'Austin, TX', 'Nashville, TN', 'Atlanta, GA', 'Chicago, IL', 'Detroit, MI', 'New York, NY', 'Boston, MA'];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    
    setTourRequestForm({
      title: `${randomCity.split(',')[0]} Show - ${new Date().getFullYear()}`,
      description: 'Looking for a great venue to play an energetic show. We bring our own energy and expect the same from the crowd!',
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      location: randomCity,
      radius: 50,
      flexibility: 'route-flexible',
      genres: ['rock', 'indie'],
      expectedDraw: { min: 50, max: 200, description: 'varies by market' },
      tourStatus: 'exploring-interest',
      ageRestriction: 'flexible',
      equipment: { needsPA: true, needsMics: true, needsDrums: false, needsAmps: false, acoustic: false },
      guaranteeRange: { min: 200, max: 800 },
      acceptsDoorDeals: true,
      merchandising: true,
      travelMethod: 'van',
      lodging: 'flexible',
      priority: 'medium'
    });
  };

  const handleTemplateApply = (template: ArtistTemplate) => {
    console.log('Applying template to tour request form:', template);
    
    setTourRequestForm(prev => ({
      ...prev,
      // Apply template values while preserving existing form data
      equipment: {
        needsPA: template.equipment?.needsPA ?? prev.equipment.needsPA,
        needsMics: template.equipment?.needsMics ?? prev.equipment.needsMics,
        needsDrums: template.equipment?.needsDrums ?? prev.equipment.needsDrums,
        needsAmps: template.equipment?.needsAmps ?? prev.equipment.needsAmps,
        acoustic: template.equipment?.acoustic ?? prev.equipment.acoustic,
      },
      guaranteeRange: template.guaranteeRange || prev.guaranteeRange,
      acceptsDoorDeals: template.acceptsDoorDeals ?? prev.acceptsDoorDeals,
      merchandising: template.merchandising ?? prev.merchandising,
      travelMethod: (template.travelMethod as 'van' | 'flying' | 'train' | 'other') || prev.travelMethod,
      lodging: (template.lodging as 'floor-space' | 'hotel' | 'flexible') || prev.lodging,
      ageRestriction: (template.ageRestriction as 'all-ages' | '18+' | '21+' | 'flexible') || prev.ageRestriction,
      tourStatus: (template.tourStatus as 'exploring-interest' | 'confirmed-routing' | 'flexible-routing') || prev.tourStatus,
    }));
  };

  const handleAutoFillAddDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + Math.floor(Math.random() * 30) + 1); // Random date in next 30 days
    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 3); // 3 days later for end date
    
    const cities = ['Seattle, WA', 'Portland, OR', 'San Francisco, CA', 'Los Angeles, CA', 'Denver, CO', 'Austin, TX', 'Nashville, TN', 'Atlanta, GA', 'Chicago, IL', 'Detroit, MI', 'New York, NY', 'Boston, MA'];
    const venues = ['The Underground', 'Basement Shows', 'DIY Warehouse', 'Community Center', 'Record Store', 'Art Gallery', 'Coffee House', 'Local Bar'];
    const artists = ['The Midnight Riders', 'Electric Dreams', 'Broken Compass', 'Neon Wolves', 'Paper Tigers', 'Ghost Machine', 'Wild Hearts', 'Silver Lining'];
    
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomVenue = venues[Math.floor(Math.random() * venues.length)];
    const randomArtist = artists[Math.floor(Math.random() * artists.length)];
    
    setAddDateForm(prev => ({
      ...prev,
      date: tomorrow.toISOString().split('T')[0],
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      location: randomCity,
      title: `${randomCity.split(',')[0]} Show - ${new Date().getFullYear()}`,
      description: 'Test show for debugging purposes. Great venue, good crowd expected!',
      venueName: randomVenue,
      artistName: randomArtist,
      guarantee: '300',
      capacity: '150',
      ageRestriction: 'all-ages',
      loadIn: '18:00',
      soundcheck: '19:00',
      doorsOpen: '20:00',
      showTime: '21:00',
      curfew: '23:30',
      notes: 'Auto-filled for testing purposes - external artist not on platform'
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-center">
          <p>Error loading itinerary: {error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold">
            {title || (artistId ? 'Show Dates' : 'Booking Calendar')}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {shows.length} confirmed show{shows.length !== 1 ? 's' : ''}
            {artistId && tourRequests.length > 0 && (
              <span> • {tourRequests.length} active show request{tourRequests.length !== 1 ? 's' : ''}</span>
            )}
            {artistId && venueBids.filter(b => !['expired', 'cancelled', 'declined'].includes(b.status)).length > 0 && (
              <span> • {venueBids.filter(b => !['expired', 'cancelled', 'declined'].includes(b.status)).length} active bid{venueBids.filter(b => !['expired', 'cancelled', 'declined'].includes(b.status)).length !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed min-w-[1000px]">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm font-medium text-gray-600">
              <th className="px-6 py-3 w-[12%]">Date</th>
              <th className="px-6 py-3 w-[15%]">Location</th>
              <th className="px-6 py-3 w-[22%]">{venueId ? 'Artist/Request' : artistId ? 'Venue/Request' : 'Artist'}</th>
              <th className="px-6 py-3 w-[12%]">Status</th>
              <th className="px-6 py-3 w-[18%]">Details</th>
              <th className="px-6 py-3 w-[21%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {timelineEntries.length === 0 && viewerType !== 'artist' && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📅</span>
                  </div>
                  <p className="mb-2">No upcoming shows</p>
                  <p className="text-sm">Confirmed bookings will appear here</p>
                </td>
              </tr>
            )}
            
            {timelineEntries.map((entry, index) => {
              if (entry.type === 'show') {
                const show = entry.data as Show;
                return (
                  <tr key={`show-${show.id}`} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(show.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(show.date).getFullYear()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{show.city}, {show.state}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {artistId ? (
                          // Show venue name - link if it's a platform venue
                          show.venueId && show.venueId !== 'external-venue' ? (
                            <a 
                              href={`/venues/${show.venueId}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                              title="View venue page"
                            >
                              {show.venueName}
                            </a>
                          ) : (
                            show.venueName
                          )
                        ) : (
                          // Show artist name - link if it's a platform artist
                          show.artistId && show.artistId !== 'external-artist' ? (
                            <a 
                              href={`/artists/${show.artistId}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                              title="View artist page"
                            >
                              {show.artistName}
                            </a>
                          ) : (
                            show.artistName
                          )
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {show.capacity} capacity • {show.ageRestriction}
                        {artistId && show.venueId && show.venueId !== 'external-venue' && (
                          <span className="ml-2 text-blue-500">• Platform venue</span>
                        )}
                        {venueId && show.artistId && show.artistId !== 'external-artist' && (
                          <span className="ml-2 text-blue-500">• Platform artist</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        show.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        show.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        show.status === 'hold' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {show.status === 'accepted' ? 'Pending Confirmation' : show.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {show.guarantee && `$${show.guarantee} guarantee`}
                        {show.doorDeal && ` • ${show.doorDeal.split}`}
                      </div>
                      {show.showTime && (
                        <div className="text-sm text-gray-500">
                          Show: {show.showTime}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {/* Actions for shows */}
                    </td>
                  </tr>
                );
              } else if (entry.type === 'tour-request') {
                const request = entry.data as TourRequest;
                const requestBids = (request as any).bids || [];
                
                return (
                  <React.Fragment key={`request-${request.id}`}>
                    <tr 
                      className="bg-blue-50 cursor-pointer transition-colors duration-150 hover:bg-blue-100 hover:shadow-sm border-l-4 border-blue-400 hover:border-blue-500"
                      onClick={() => toggleBidExpansion(request.id)}
                      title={`Click to ${expandedBids.has(request.id) ? 'hide' : 'view'} bids for this show request`}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-blue-900">
                          {new Date(request.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                          {' - '}
                          {new Date(request.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-blue-600">Show Request</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-blue-900">
                          {request.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-blue-900">{request.title}</div>
                        <div className="text-sm text-blue-600">
                          {request.expectedDraw.min}-{request.expectedDraw.max} draw
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {requestBids.length} bid{requestBids.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-blue-900">{request.flexibility.replace('-', ' ')}</div>
                        {request.guaranteeRange && (
                          <div className="text-sm text-blue-600">
                            ${request.guaranteeRange.min}-{request.guaranteeRange.max}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        {/* Artist Actions - Delete Button */}
                        {viewerType === 'artist' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row expansion when clicking delete
                              handleDeleteShowRequest(request.id, request.title);
                            }}
                            disabled={deleteLoading === request.id}
                            className="inline-flex items-center px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Delete tour request"
                          >
                            {deleteLoading === request.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}

                        {/* Venue Actions - Place Bid Button */}
                        {viewerType === 'venue' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row expansion when clicking place bid
                              handlePlaceBid(request);
                            }}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Place Bid
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Bids Section */}
                    {expandedBids.has(request.id) && requestBids.length > 0 && (
                      <>
                        {requestBids
                          .filter((bid: VenueBid) => !['cancelled', 'declined', 'expired'].includes(bid.status))
                          .map((bid: VenueBid) => (
                          <tr key={`bid-${bid.id}`} className="bg-yellow-50 border-l-4 border-yellow-400">
                            <td className="px-6 py-4 pl-12">
                              <div className="text-sm font-medium text-yellow-900">
                                {new Date(bid.proposedDate).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-sm text-yellow-600">Venue Bid</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-yellow-900">{bid.venueName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-yellow-900">
                                {bid.guarantee ? `$${bid.guarantee} guarantee` : 'Door deal only'}
                              </div>
                              {bid.doorDeal && (
                                <div className="text-sm text-yellow-600">
                                  {bid.doorDeal.split} split
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={getBidStatusBadge(bid).className}>
                                {getBidStatusBadge(bid).text}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-yellow-900 truncate max-w-xs">
                                "{bid.message}"
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                              {/* Artist Actions */}
                              {viewerType === 'artist' && (
                                <>
                                  {bid.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleBidAction(bid, 'accept')}
                                        disabled={bidActions[bid.id]}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleBidAction(bid, 'hold')}
                                        disabled={bidActions[bid.id]}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                                      >
                                        Hold
                                      </button>
                                      <button
                                        onClick={() => {
                                          const reason = prompt('Reason for declining (optional):');
                                          if (reason !== null) handleBidAction(bid, 'decline', reason);
                                        }}
                                        disabled={bidActions[bid.id]}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {bid.status === 'hold' && (
                                    <>
                                      <button
                                        onClick={() => handleBidAction(bid, 'accept')}
                                        disabled={bidActions[bid.id]}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => {
                                          const reason = prompt('Reason for declining (optional):');
                                          if (reason !== null) handleBidAction(bid, 'decline', reason);
                                        }}
                                        disabled={bidActions[bid.id]}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  <button
                                    onClick={() => handleViewBidDetails(bid)}
                                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                  >
                                    Details
                                  </button>
                                </>
                              )}

                              {/* Venue Actions */}
                              {viewerType === 'venue' && (
                                <>
                                  {bid.status === 'pending' && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-yellow-800 bg-yellow-100">
                                      Pending Review
                                    </span>
                                  )}

                                  {bid.status === 'hold' && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-800 bg-blue-100">
                                      {bid.holdPosition === 1 ? 'First Hold' : bid.holdPosition === 2 ? 'Second Hold' : bid.holdPosition === 3 ? 'Third Hold' : 'On Hold'}
                                    </span>
                                  )}

                                  {bid.status === 'accepted' && (
                                    <button
                                      onClick={() => handleConfirmShow(bid)}
                                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                    >
                                      Confirm Show
                                    </button>
                                  )}

                                  {(bid.status === 'pending' || bid.status === 'hold') && (
                                    <button
                                      onClick={() => handleCancelBid(bid)}
                                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700"
                                    >
                                      Cancel Bid
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </React.Fragment>
                );
              } else if (entry.type === 'venue-bid') {
                const bid = entry.data as VenueBid & { artistName?: string; location?: string };
                return (
                  <tr key={`bid-${bid.id}`} className="bg-yellow-50 border-l-4 border-yellow-400">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-yellow-900">
                        {new Date(bid.proposedDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-yellow-600">Your Bid</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-yellow-900">
                        {bid.location || venueName || 'Location TBD'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-yellow-900">
                        {bid.artistName || 'Unknown Artist'}
                      </div>
                      <div className="text-sm text-yellow-600">
                        Your bid: {bid.guarantee ? `$${bid.guarantee} guarantee` : 'Door deal only'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getBidStatusBadge(bid).className}>
                        {getBidStatusBadge(bid).text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-yellow-900">
                        {bid.guarantee ? `$${bid.guarantee} guarantee` : 'Door deal only'}
                      </div>
                      {bid.doorDeal && (
                        <div className="text-sm text-yellow-600">
                          {bid.doorDeal.split} split
                        </div>
                      )}
                      <div className="text-sm text-yellow-600 truncate max-w-xs mt-1">
                        "{bid.message}"
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      {/* Artist Actions */}
                      {viewerType === 'artist' && (
                        <>
                          {bid.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleBidAction(bid, 'accept')}
                                disabled={bidActions[bid.id]}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleBidAction(bid, 'hold')}
                                disabled={bidActions[bid.id]}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                              >
                                Hold
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Reason for declining (optional):');
                                  if (reason !== null) handleBidAction(bid, 'decline', reason);
                                }}
                                disabled={bidActions[bid.id]}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {bid.status === 'hold' && (
                            <>
                              <button
                                onClick={() => handleBidAction(bid, 'accept')}
                                disabled={bidActions[bid.id]}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Reason for declining (optional):');
                                  if (reason !== null) handleBidAction(bid, 'decline', reason);
                                }}
                                disabled={bidActions[bid.id]}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleViewBidDetails(bid)}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Details
                          </button>
                        </>
                      )}

                      {/* Venue Actions */}
                      {viewerType === 'venue' && (
                        <>
                          {bid.status === 'pending' && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-yellow-800 bg-yellow-100">
                              Pending Review
                            </span>
                          )}

                          {bid.status === 'hold' && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-800 bg-blue-100">
                              {bid.holdPosition === 1 ? 'First Hold' : bid.holdPosition === 2 ? 'Second Hold' : bid.holdPosition === 3 ? 'Third Hold' : 'On Hold'}
                            </span>
                          )}

                          {bid.status === 'accepted' && (
                            <button
                              onClick={() => handleConfirmShow(bid)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                            >
                              Confirm Show
                            </button>
                          )}

                          {(bid.status === 'pending' || bid.status === 'hold') && (
                            <button
                              onClick={() => handleCancelBid(bid)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700"
                            >
                              Cancel Bid
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              }
              return null;
            })}
            
            {/* Add Date Row for Artists - Only show if user is viewing their own artist profile */}
            {artistId && viewerType === 'artist' && editable && (
              <tr>
                <td colSpan={6} className="px-6 py-3">
                  <button
                    onClick={() => {
                      // Initialize form with default values for artists
                      setAddDateForm(prev => ({
                        ...prev,
                        type: 'request',
                        artistId: artistId || '',
                        artistName: artistName || '',
                        venueId: '',
                        venueName: ''
                      }));
                      setShowAddDateForm(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Date</span>
                  </button>
                </td>
              </tr>
            )}

            {/* Add Date Row for Venues - Only show if user is viewing their own venue profile */}
            {venueId && viewerType === 'venue' && editable && (
              <tr>
                <td colSpan={6} className="px-6 py-3">
                  <button
                    onClick={() => {
                      // Initialize form with default values for venues
                      setAddDateForm(prev => ({
                        ...prev,
                        type: 'confirmed',
                        artistId: '',
                        artistName: '',
                        venueId: venueId || '',
                        venueName: venueName || ''
                      }));
                      setShowAddDateForm(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Date</span>
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Venue Bid Form Modal */}
      {showBidForm && selectedTourRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <VenueBidForm
              tourRequest={selectedTourRequest}
              venueId={venueId || 'unknown'}
              venueName={venueName || 'Unknown Venue'}
              onSuccess={handleBidSuccess}
              onCancel={() => {
                setShowBidForm(false);
                setSelectedTourRequest(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Bid Details Modal */}
      {showBidDetailsModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bid Details - {selectedBid.venueName}
                </h3>
                <button
                  onClick={() => {
                    setShowBidDetailsModal(false);
                    setSelectedBid(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Proposed Date:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedBid.proposedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <p className="text-sm">
                      <span className={getBidStatusBadge(selectedBid).className}>
                        {getBidStatusBadge(selectedBid).text}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Capacity:</span>
                    <p className="text-sm text-gray-900">{selectedBid.capacity} people</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Age Restriction:</span>
                    <p className="text-sm text-gray-900">{selectedBid.ageRestriction}</p>
                  </div>
                </div>
              </div>

              {/* Financial Terms */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Financial Terms</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Guarantee:</span>
                    <p className="text-sm text-gray-900">
                      {selectedBid.guarantee ? `$${selectedBid.guarantee}` : 'None'}
                    </p>
                  </div>
                  {selectedBid.doorDeal && (
                    <>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Door Split:</span>
                        <p className="text-sm text-gray-900">{selectedBid.doorDeal.split}</p>
                      </div>
                      {selectedBid.doorDeal.minimumGuarantee && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Minimum Guarantee:</span>
                          <p className="text-sm text-gray-900">${selectedBid.doorDeal.minimumGuarantee}</p>
                        </div>
                      )}
                    </>
                  )}
                  {selectedBid.ticketPrice && (
                    <>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Advance Tickets:</span>
                        <p className="text-sm text-gray-900">
                          ${selectedBid.ticketPrice.advance || 'TBD'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Door Tickets:</span>
                        <p className="text-sm text-gray-900">
                          ${selectedBid.ticketPrice.door || 'TBD'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Schedule</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Load-in:</span>
                    <p className="text-sm text-gray-900">{selectedBid.loadIn}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Soundcheck:</span>
                    <p className="text-sm text-gray-900">{selectedBid.soundcheck}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Doors Open:</span>
                    <p className="text-sm text-gray-900">{selectedBid.doorsOpen}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Show Time:</span>
                    <p className="text-sm text-gray-900">{selectedBid.showTime}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Curfew:</span>
                    <p className="text-sm text-gray-900">{selectedBid.curfew}</p>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              {selectedBid.equipmentProvided && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Equipment Provided</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedBid.equipmentProvided).map(([equipment, provided]) => (
                      <div key={equipment} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${provided ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-900 capitalize">{equipment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promotion */}
              {selectedBid.promotion && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Promotional Support</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedBid.promotion).map(([promo, offered]) => (
                      <div key={promo} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${offered ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-900 capitalize">
                          {promo.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Message from Venue</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 italic">"{selectedBid.message}"</p>
                </div>
              </div>

              {/* Additional Terms */}
              {(selectedBid as any).additionalTerms && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Additional Terms</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900">{(selectedBid as any).additionalTerms}</p>
                  </div>
                </div>
              )}

              {/* Submission Info */}
              <div className="border-t pt-4">
                <div className="text-xs text-gray-500">
                  Submitted on {new Date(selectedBid.createdAt).toLocaleDateString()} at{' '}
                  {new Date(selectedBid.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Date Form Modal */}
      {showAddDateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add Date
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleAutoFillAddDate}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Auto-Fill
                  </button>
                  <button
                    onClick={() => setShowAddDateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleAddDateSubmit} className="px-6 py-4 space-y-6">
              {/* Type Selection - Only for Artists */}
              {artistId && viewerType === 'artist' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    required
                    value={addDateForm.type}
                    onChange={(e) => setAddDateForm(prev => ({ ...prev, type: e.target.value as 'request' | 'confirmed' }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="request">Request (looking for venues)</option>
                    <option value="confirmed">Confirmed (already booked)</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    {addDateForm.type === 'request' 
                      ? 'Create a tour request to find venues for this date'
                      : 'Add a confirmed show that was booked outside the platform'
                    }
                  </p>
                </div>
              )}

              {/* Basic Information */}
              {addDateForm.type === 'request' ? (
                // Date range for requests
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={addDateForm.startDate}
                        onChange={(e) => setAddDateForm(prev => ({ ...prev, startDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={addDateForm.endDate}
                        onChange={(e) => setAddDateForm(prev => ({ ...prev, endDate: e.target.value }))}
                        min={addDateForm.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={addDateForm.location}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Seattle, WA"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                // Single date for confirmed shows
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={addDateForm.date}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={addDateForm.location}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Seattle, WA"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Conditional Fields for Confirmed Shows */}
              {(addDateForm.type === 'confirmed' || (venueId && viewerType === 'venue')) && (
                <>
                  {/* Artist/Venue Information */}
                  {venueId && viewerType === 'venue' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Artist Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={addDateForm.artistName}
                          onChange={(e) => {
                            const value = e.target.value;
                            setAddDateForm(prev => ({ ...prev, artistName: value, artistId: '' }));
                            handleArtistSearch(value);
                          }}
                          onFocus={() => {
                            if (addDateForm.artistName && artistSearchResults.length > 0) {
                              setShowArtistDropdown(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay hiding dropdown to allow clicks
                            setTimeout(() => setShowArtistDropdown(false), 200);
                          }}
                          placeholder="Search artists or enter any name"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        
                        {/* Artist Search Dropdown */}
                        {showArtistDropdown && artistSearchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {artistSearchResults.map((artist) => (
                              <button
                                key={artist.id}
                                type="button"
                                onClick={() => selectArtist(artist)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{artist.name}</div>
                                <div className="text-sm text-gray-500">
                                  {artist.city}, {artist.state} • {artist.genres?.join(', ') || 'Various genres'}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {addDateForm.artistId 
                            ? '✓ Artist found on platform - will be linked' 
                            : 'Type to search platform artists or enter any name'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Capacity
                        </label>
                        <input
                          type="number"
                          value={addDateForm.capacity}
                          onChange={(e) => setAddDateForm(prev => ({ ...prev, capacity: e.target.value }))}
                          placeholder="Expected attendance"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {artistId && viewerType === 'artist' && addDateForm.type === 'confirmed' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Venue Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={addDateForm.venueName}
                          onChange={(e) => {
                            const value = e.target.value;
                            setAddDateForm(prev => ({ ...prev, venueName: value, venueId: '' }));
                            handleVenueSearch(value);
                          }}
                          onFocus={() => {
                            if (addDateForm.venueName && venueSearchResults.length > 0) {
                              setShowVenueDropdown(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay hiding dropdown to allow clicks
                            setTimeout(() => setShowVenueDropdown(false), 200);
                          }}
                          placeholder="Search venues or enter any name"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        
                        {/* Venue Search Dropdown */}
                        {showVenueDropdown && venueSearchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {venueSearchResults.map((venue) => (
                              <button
                                key={venue.id}
                                type="button"
                                onClick={() => selectVenue(venue)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{venue.name}</div>
                                <div className="text-sm text-gray-500">
                                  {venue.city}, {venue.state} • {venue.capacity} capacity
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {addDateForm.venueId 
                            ? '✓ Venue found on platform - will be linked' 
                            : 'Type to search platform venues or enter any name'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Guarantee ($)
                        </label>
                        <input
                          type="number"
                          value={addDateForm.guarantee}
                          onChange={(e) => setAddDateForm(prev => ({ ...prev, guarantee: e.target.value }))}
                          placeholder="0"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Show Times */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Load In
                      </label>
                      <input
                        type="time"
                        value={addDateForm.loadIn}
                        onChange={(e) => setAddDateForm(prev => ({ ...prev, loadIn: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Doors
                      </label>
                      <input
                        type="time"
                        value={addDateForm.doorsOpen}
                        onChange={(e) => setAddDateForm(prev => ({ ...prev, doorsOpen: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Show Time
                      </label>
                      <input
                        type="time"
                        value={addDateForm.showTime}
                        onChange={(e) => setAddDateForm(prev => ({ ...prev, showTime: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Curfew
                      </label>
                      <input
                        type="time"
                        value={addDateForm.curfew}
                        onChange={(e) => setAddDateForm(prev => ({ ...prev, curfew: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Title and Description for Requests */}
              {addDateForm.type === 'request' && artistId && viewerType === 'artist' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={addDateForm.title}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Seattle Show - June 2025"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={addDateForm.description}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell venues about what you're looking for..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Age Restriction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Restriction
                </label>
                <select
                  value={addDateForm.ageRestriction}
                  onChange={(e) => setAddDateForm(prev => ({ ...prev, ageRestriction: e.target.value as 'all-ages' | '18+' | '21+' }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all-ages">All Ages</option>
                  <option value="18+">18+</option>
                  <option value="21+">21+</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={addDateForm.notes}
                  onChange={(e) => setAddDateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional details..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {addDateForm.type === 'request' || (venueId && viewerType === 'venue') 
                    ? (addDateForm.type === 'request' ? 'Create Request' : 'Add Confirmed Date')
                    : 'Add Confirmed Show'
                  }
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDateForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tour Request Form Modal */}
      {showTourRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create Tour Request
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleAutoFillTourRequest}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Auto-Fill
                  </button>
                  <button
                    onClick={() => setShowTourRequestForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleTourRequestSubmit} className="px-6 py-4 space-y-6">
              {/* Template Selector */}
              {artistId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <TemplateSelector
                    artistId={artistId}
                    onTemplateApply={handleTemplateApply}
                    className="mb-0"
                  />
                </div>
              )}
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tour Request Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={tourRequestForm.title}
                    onChange={(e) => setTourRequestForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Seattle Show - June 2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={tourRequestForm.location}
                    onChange={(e) => setTourRequestForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Seattle, WA or Pacific Northwest"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={tourRequestForm.startDate}
                    onChange={(e) => setTourRequestForm(prev => ({ ...prev, startDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={tourRequestForm.endDate}
                    onChange={(e) => setTourRequestForm(prev => ({ ...prev, endDate: e.target.value }))}
                    min={tourRequestForm.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={tourRequestForm.description}
                  onChange={(e) => setTourRequestForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell venues about your tour, music style, and what you're looking for..."
                />
              </div>

              {/* Expected Draw */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Expected Draw
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min Attendance</label>
                    <input
                      type="number"
                      min="0"
                      value={tourRequestForm.expectedDraw.min}
                      onChange={(e) => setTourRequestForm(prev => ({ 
                        ...prev, 
                        expectedDraw: { ...prev.expectedDraw, min: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max Attendance</label>
                    <input
                      type="number"
                      min="0"
                      value={tourRequestForm.expectedDraw.max}
                      onChange={(e) => setTourRequestForm(prev => ({ 
                        ...prev, 
                        expectedDraw: { ...prev.expectedDraw, max: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                    <input
                      type="text"
                      value={tourRequestForm.expectedDraw.description}
                      onChange={(e) => setTourRequestForm(prev => ({ 
                        ...prev, 
                        expectedDraw: { ...prev.expectedDraw, description: e.target.value }
                      }))}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., varies by market"
                    />
                  </div>
                </div>
              </div>

              {/* Guarantee Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Guarantee Range (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minimum ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={tourRequestForm.guaranteeRange.min}
                      onChange={(e) => setTourRequestForm(prev => ({ 
                        ...prev, 
                        guaranteeRange: { ...prev.guaranteeRange, min: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Maximum ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={tourRequestForm.guaranteeRange.max}
                      onChange={(e) => setTourRequestForm(prev => ({ 
                        ...prev, 
                        guaranteeRange: { ...prev.guaranteeRange, max: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Tour Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowTourRequestForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
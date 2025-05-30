'use client';

import React, { useState, useEffect } from 'react';
import { Show, TourRequest } from '../../types';
import { TechnicalRequirement, HospitalityRequirement } from '../../types/templates';
import VenueBidForm from './VenueBidForm';
import ShowDetailModal from './ShowDetailModal';
import TourRequestDetailModal from './TourRequestDetailModal';
import TemplateSelector from './TemplateSelector';
import LocationAutocomplete from './LocationAutocomplete';
import TechnicalRequirementsTable from './TechnicalRequirementsTable';
import HospitalityRiderTable from './HospitalityRiderTable';

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
  
  // 🎯 BILLING ORDER - What type of show the venue is offering
  billingPosition?: 'headliner' | 'co-headliner' | 'direct-support' | 'opener' | 'local-opener';
  lineupPosition?: number; // 1 = headliner, 2 = direct support, etc.
  setLength?: number; // minutes
  otherActs?: string; // names of other acts on the bill
  billingNotes?: string; // "co-headlining with X", "festival slot", etc.
}

interface TabbedTourItineraryProps {
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

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  entries: TimelineEntry[];
  count: number;
}

export default function TabbedTourItinerary({ 
  artistId, 
  artistName, 
  venueId, 
  venueName,
  title,
  editable = false,
  viewerType = 'public'
}: TabbedTourItineraryProps) {
  const [shows, setShows] = useState<Show[]>([]);
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [venueBids, setVenueBids] = useState<VenueBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBids, setExpandedBids] = useState<Set<string>>(new Set());
  const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set());
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
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
  const [activeMonthTab, setActiveMonthTab] = useState<string>('');
  const [addDateLoading, setAddDateLoading] = useState(false);
  const [deleteShowLoading, setDeleteShowLoading] = useState<string | null>(null);
  const [selectedShowForDetail, setSelectedShowForDetail] = useState<Show | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [tourRequestDetailModal, setTourRequestDetailModal] = useState(false);
  
  // All the form states from original component
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
    ageRestriction: 'all-ages' as 'all-ages' | '18+' | '21+' | 'flexible',
    loadIn: '',
    soundcheck: '',
    doorsOpen: '',
    showTime: '',
    curfew: '',
    notes: '',
    // Billing order fields
    billingPosition: '' as '' | 'headliner' | 'co-headliner' | 'direct-support' | 'opener' | 'local-opener',
    lineupPosition: '',
    setLength: '',
    otherActs: '',
    billingNotes: '',
    equipment: {
      needsPA: false,
      needsMics: false,
      needsDrums: false,
      needsAmps: false,
      acoustic: false
    },
    // New dynamic requirement arrays
    technicalRequirements: [] as TechnicalRequirement[],
    hospitalityRequirements: [] as HospitalityRequirement[],
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
  
  // Search functionality states
  const [venues, setVenues] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [venueSearchResults, setVenueSearchResults] = useState<any[]>([]);
  const [artistSearchResults, setArtistSearchResults] = useState<any[]>([]);
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
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
    // New dynamic requirement arrays
    technicalRequirements: [] as TechnicalRequirement[],
    hospitalityRequirements: [] as HospitalityRequirement[],
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

  // All the utility functions from original component (keeping them identical)
  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venues');
      if (response.ok) {
        const data = await response.json();
        setVenues(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.warn('Failed to fetch venues:', error);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await fetch('/api/artists');
      if (response.ok) {
        const data = await response.json();
        setArtists(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.warn('Failed to fetch artists:', error);
    }
  };

  const handleVenueSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setVenueSearchResults([]);
      setShowVenueDropdown(false);
      return;
    }

    const filtered = venues.filter(venue =>
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.state.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    setVenueSearchResults(filtered);
    setShowVenueDropdown(filtered.length > 0);
  };

  const handleArtistSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setArtistSearchResults([]);
      setShowArtistDropdown(false);
      return;
    }

    const filtered = artists.filter(artist =>
      artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.state?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    setArtistSearchResults(filtered);
    setShowArtistDropdown(filtered.length > 0);
  };

  const selectVenue = (venue: any) => {
    setAddDateForm(prev => ({
      ...prev,
      venueId: venue.id,
      venueName: venue.name,
      location: `${venue.city}, ${venue.state}`,
      capacity: venue.capacity?.toString() || ''
    }));
    setShowVenueDropdown(false);
  };

  const selectArtist = (artist: any) => {
    setAddDateForm(prev => ({
      ...prev,
      artistId: artist.id,
      artistName: artist.name
    }));
    setShowArtistDropdown(false);
  };

  // Data fetching function (identical to original)
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
        if (!requestsResponse.ok) {
          throw new Error('Failed to fetch tour requests');
        }
        const requestsData = await requestsResponse.json();
        
        // Handle both array and object with requests property
        const requests = Array.isArray(requestsData) ? requestsData : (requestsData.requests || []);
        setTourRequests(requests);

        // Fetch bids for each tour request
        const allBids: VenueBid[] = [];
        for (const request of requests) {
          try {
            const bidsResponse = await fetch(`/api/tour-requests/${request.id}/bids`);
            if (bidsResponse.ok) {
              const bidsData = await bidsResponse.json();
              allBids.push(...(Array.isArray(bidsData) ? bidsData : []));
            }
          } catch (error) {
            console.warn(`Failed to fetch bids for request ${request.id}:`, error);
          }
        }
        setVenueBids(allBids);
      }

      if (venueId) {
        // Fetch venue bids
        try {
          const bidsResponse = await fetch(`/api/venues/${venueId}/bids`);
          if (bidsResponse.ok) {
            const bidsData = await bidsResponse.json();
            setVenueBids(Array.isArray(bidsData) ? bidsData : []);
          }
        } catch (error) {
          console.warn('Failed to fetch venue bids:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchVenues();
    fetchArtists();
  }, [artistId, venueId]);

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

  // NEW: Group timeline entries by month
  const groupEntriesByMonth = (entries: TimelineEntry[]): MonthGroup[] => {
    const monthGroups: { [key: string]: MonthGroup } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {
          monthKey,
          monthLabel,
          entries: [],
          count: 0
        };
      }
      
      monthGroups[monthKey].entries.push(entry);
      monthGroups[monthKey].count++;
    });
    
    // Sort months chronologically
    return Object.values(monthGroups).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  };

  const timelineEntries = createTimelineEntries();
  const monthGroups = groupEntriesByMonth(timelineEntries);

  // Set active tab to first month with entries, or current month if no entries
  useEffect(() => {
    // Always ensure we have an active month tab when there are month groups
    if (monthGroups.length > 0) {
      // If no active tab is set, or the current active tab doesn't exist in monthGroups
      const currentTabExists = monthGroups.some(group => group.monthKey === activeMonthTab);
      
      if (!activeMonthTab || !currentTabExists) {
        // Find the soonest month with shows (not just any entries)
        const monthWithShows = monthGroups.find(group => 
          group.entries.some(entry => entry.type === 'show')
        );
        
        if (monthWithShows) {
          setActiveMonthTab(monthWithShows.monthKey);
        } else {
          // If no shows, use the first month with any entries
          setActiveMonthTab(monthGroups[0].monthKey);
        }
      }
    } else if (monthGroups.length === 0) {
      // Set to current month if no entries
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setActiveMonthTab(currentMonth);
    }
  }, [monthGroups.length, monthGroups.map(g => g.monthKey).join(',')]); // Better dependencies

  const activeMonthEntries = monthGroups.find(group => group.monthKey === activeMonthTab)?.entries || [];

  // All the handler functions from original component
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

  const toggleShowExpansion = (showId: string) => {
    setExpandedShows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(showId)) {
        newSet.delete(showId);
      } else {
        newSet.add(showId);
      }
      return newSet;
    });
  };

  const toggleRequestExpansion = (requestId: string) => {
    setExpandedRequests(prev => {
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

  const handleTemplateApply = (template: any) => {
    console.log('Applying template:', template);
    
    setAddDateForm(prev => ({
      ...prev,
      // Technical requirements
      equipment: template.equipment ? {
        needsPA: template.equipment.needsPA || false,
        needsMics: template.equipment.needsMics || false,
        needsDrums: template.equipment.needsDrums || false,
        needsAmps: template.equipment.needsAmps || false,
        acoustic: template.equipment.acoustic || false
      } : prev.equipment,
      
      // New dynamic requirements
      technicalRequirements: template.technicalRequirements || [],
      hospitalityRequirements: template.hospitalityRequirements || [],
      
      // Business terms
      guaranteeRange: template.guaranteeRange ? { 
        min: template.guaranteeRange.min, 
        max: 0 
      } : prev.guaranteeRange,
      
      acceptsDoorDeals: template.acceptsDoorDeals !== undefined ? template.acceptsDoorDeals : prev.acceptsDoorDeals,
      merchandising: template.merchandising !== undefined ? template.merchandising : prev.merchandising,
      
      // Travel & logistics
      travelMethod: template.travelMethod || prev.travelMethod,
      lodging: template.lodging || prev.lodging,
      
      // Age restriction (if specified in template)
      ageRestriction: template.ageRestriction || prev.ageRestriction
    }));
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
          // Transfer billing order information from bid to show
          billingOrder: bid.billingPosition ? {
            position: bid.billingPosition,
            lineupPosition: bid.lineupPosition,
            setLength: bid.setLength,
            otherActs: bid.otherActs ? bid.otherActs.split(',').map(act => act.trim()).filter(act => act) : [],
            notes: bid.billingNotes
          } : undefined,
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
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel bid');
      }

      await fetchData();
      alert('Bid cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling bid:', error);
      alert(`Failed to cancel bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBidAction = async (bid: VenueBid, action: string, reason?: string) => {
    setBidActions(prev => ({ ...prev, [bid.id]: true }));
    
    try {
      const response = await fetch(`/api/tour-requests/${bid.tourRequestId}/bids/${bid.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reason,
          notes: holdNotes[bid.id] || ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} bid`);
      }

      await fetchData();
      
      const actionMessages = {
        accept: 'Bid accepted! You can now coordinate with the venue to finalize details.',
        hold: 'Bid placed on hold. You have time to consider other options.',
        decline: 'Bid declined.'
      };
      
      alert(actionMessages[action as keyof typeof actionMessages] || `Bid ${action}ed successfully.`);
    } catch (error) {
      console.error(`Error ${action}ing bid:`, error);
      alert(`Failed to ${action} bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBidActions(prev => ({ ...prev, [bid.id]: false }));
    }
  };

  const getBidStatusBadge = (bid: VenueBid) => {
    switch (bid.status) {
      case 'pending':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
          text: 'Pending'
        };
      case 'hold':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
          text: bid.holdPosition === 1 ? 'First Hold' : bid.holdPosition === 2 ? 'Second Hold' : bid.holdPosition === 3 ? 'Third Hold' : 'On Hold'
        };
      case 'accepted':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800',
          text: 'Accepted'
        };
      case 'declined':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800',
          text: 'Declined'
        };
      case 'cancelled':
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
          text: 'Cancelled'
        };
      default:
        return {
          className: 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
          text: bid.status
        };
    }
  };

  const handleDeleteShowRequest = async (requestId: string, requestName: string) => {
    if (!confirm(`Delete "${requestName}"? This will also delete all associated bids and cannot be undone.`)) {
      return;
    }

    setDeleteLoading(requestId);
    try {
      const response = await fetch(`/api/tour-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete tour request');
      }

      await fetchData();
      alert('Tour request deleted successfully.');
    } catch (error) {
      console.error('Error deleting tour request:', error);
      alert(`Failed to delete tour request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Simplified handlers for form submissions (keeping core logic)
  const handleTourRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation would be identical to original
    console.log('Tour request submit:', tourRequestForm);
    setShowTourRequestForm(false);
  };

  const handleAddDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎯 TabbedTourItinerary: Form submission started', {
      type: addDateForm.type,
      artistId,
      artistName,
      venueId,
      venueName,
      formData: addDateForm
    });
    
    if (addDateLoading) {
      console.log('🚨 TabbedTourItinerary: Form submission already in progress');
      return;
    }
    
    try {
      setAddDateLoading(true);
      console.log('🎯 TabbedTourItinerary: Loading state set to true');

      if (addDateForm.type === 'request') {
        // Create a tour request
        if (!artistId || !artistName) {
          console.error('🚨 TabbedTourItinerary: Missing artist information', { artistId, artistName });
          alert('Missing artist information. Please try again.');
          return;
        }

        console.log('🎯 TabbedTourItinerary: Creating tour request...');
        const requestBody = {
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
        };
        
        console.log('🎯 TabbedTourItinerary: Request body prepared', requestBody);

        const response = await fetch('/api/tour-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('🎯 TabbedTourItinerary: API response received', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('🚨 TabbedTourItinerary: Tour request creation failed', errorData);
          throw new Error(errorData.error || 'Failed to create tour request');
        }

        const createdRequest = await response.json();
        console.log('✅ TabbedTourItinerary: Tour request created successfully', createdRequest);
        
      } else {
        // Create a confirmed show
        console.log('🎯 TabbedTourItinerary: Creating confirmed show...');
        const requestBody = {
          title: addDateForm.title,
          date: addDateForm.date,
          artistId: addDateForm.artistId || artistId,
          artistName: addDateForm.artistName || artistName,
          venueId: addDateForm.venueId || venueId,
          venueName: addDateForm.venueName || venueName,
          guarantee: addDateForm.guarantee ? parseFloat(addDateForm.guarantee) : undefined,
          capacity: addDateForm.capacity ? parseInt(addDateForm.capacity) : undefined,
          ageRestriction: addDateForm.ageRestriction,
          loadIn: addDateForm.loadIn,
          soundcheck: addDateForm.soundcheck,
          doorsOpen: addDateForm.doorsOpen,
          showTime: addDateForm.showTime,
          curfew: addDateForm.curfew,
          notes: addDateForm.notes,
          status: 'confirmed'
        };
        
        console.log('🎯 TabbedTourItinerary: Show request body prepared', requestBody);

        const response = await fetch('/api/shows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('🎯 TabbedTourItinerary: Shows API response received', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('🚨 TabbedTourItinerary: Show creation failed', errorData);
          throw new Error(errorData.error || 'Failed to create show');
        }

        const createdShow = await response.json();
        console.log('✅ TabbedTourItinerary: Show created successfully', createdShow);
      }

      console.log('🎯 TabbedTourItinerary: Closing form and resetting state...');
      
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
        notes: '',
        // Billing order fields
        billingPosition: '',
        lineupPosition: '',
        setLength: '',
        otherActs: '',
        billingNotes: '',
        equipment: {
          needsPA: false,
          needsMics: false,
          needsDrums: false,
          needsAmps: false,
          acoustic: false
        },
        // New dynamic requirement arrays
        technicalRequirements: [],
        hospitalityRequirements: [],
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

      // Force refresh data with a small delay to ensure the API has processed the new data
      console.log('🔄 TabbedTourItinerary: Starting data refresh...');
      setTimeout(async () => {
        console.log('🔄 TabbedTourItinerary: Executing fetchData...');
        await fetchData();
        console.log('✅ TabbedTourItinerary: Data refresh completed');
      }, 500); // 500ms delay to ensure the database has been updated

    } catch (error) {
      console.error('🚨 TabbedTourItinerary: Error adding date:', error);
      alert(`Failed to add date: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('🎯 TabbedTourItinerary: Setting loading state to false');
      setAddDateLoading(false);
    }
  };

  // Auto-fill functions
  const handleAutoFillAddDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    if (addDateForm.type === 'request') {
      setAddDateForm(prev => ({
        ...prev,
        startDate: tomorrowStr,
        endDate: nextWeekStr,
        location: 'Seattle, WA',
        title: 'Tour Request',
        description: 'Looking for venues in the area'
      }));
    } else {
      setAddDateForm(prev => ({
        ...prev,
        date: tomorrowStr,
        location: 'Seattle, WA',
        guarantee: '300',
        capacity: '150',
        ageRestriction: 'all-ages',
        loadIn: '18:00',
        soundcheck: '19:00',
        doorsOpen: '20:00',
        showTime: '21:00',
        curfew: '23:30'
      }));
    }
  };

  const handleDeleteShow = async (showId: string, showName: string) => {
    if (!confirm(`Are you sure you want to delete "${showName}"?`)) {
      return;
    }

    setDeleteShowLoading(showId);
    try {
      const response = await fetch(`/api/shows/${showId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete show');
      }

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error deleting show:', error);
      alert('Failed to delete show. Please try again.');
    } finally {
      setDeleteShowLoading(null);
    }
  };

  const handleShowDetailModal = (show: Show) => {
    setSelectedShowForDetail(show);
    setShowDetailModal(true);
  };

  const handleTourRequestDetailModal = (request: TourRequest) => {
    setSelectedTourRequest(request);
    setTourRequestDetailModal(true);
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
      {/* Header */}
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
            {artistId && venueBids.filter(b => !['expired'].includes(b.status)).length > 0 && (
              <span> • {venueBids.filter(b => !['expired'].includes(b.status)).length} total bid{venueBids.filter(b => !['expired'].includes(b.status)).length !== 1 ? 's' : ''}</span>
            )}
            {artistId && venueBids.filter(b => b.status === 'hold').length > 0 && (
              <span> • {venueBids.filter(b => b.status === 'hold').length} hold{venueBids.filter(b => b.status === 'hold').length !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
      </div>

      {/* Month Tabs */}
      {monthGroups.length > 0 && (
        <div className="border-b border-gray-200">
          <div className="px-6">
            <nav className="flex space-x-8 overflow-x-auto">
              {monthGroups.map((group) => (
                <button
                  key={group.monthKey}
                  onClick={() => setActiveMonthTab(group.monthKey)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeMonthTab === group.monthKey
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {group.monthLabel} ({group.entries.length})
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] table-fixed">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium text-gray-600">
              <th className="px-4 py-1.5 w-[10%]">Date</th>
              <th className="px-4 py-1.5 w-[15%]">Location</th>
              <th className="px-4 py-1.5 w-[20%]">{venueId ? 'Artist/Request' : artistId ? 'Venue/Request' : 'Artist'}</th>
              <th className="px-4 py-1.5 w-[10%]">Status</th>
              <th className="px-4 py-1.5 w-[8%]">Capacity</th>
              <th className="px-4 py-1.5 w-[8%]">Age</th>
              <th className="px-4 py-1.5 w-[10%]">Offers</th>
              <th className="px-4 py-1.5 w-[8%]">Bids</th>
              <th className="px-4 py-1.5 w-[11%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Empty state - show when no entries in active month */}
            {activeMonthEntries.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📅</span>
                  </div>
                  {monthGroups.length === 0 ? (
                    // No shows at all
                    <>
                      <p className="mb-2 font-medium">No shows booked</p>
                      <p className="text-sm">
                        {editable 
                          ? "Get started by adding your first date below"
                          : "Confirmed bookings will appear here"
                        }
                      </p>
                    </>
                  ) : (
                    // No shows this month, but shows exist in other months
                    <>
                      <p className="mb-2">No shows this month</p>
                      <p className="text-sm">Check other months for upcoming shows</p>
                    </>
                  )}
                </td>
              </tr>
            )}
            
            {/* Render entries for active month */}
            {activeMonthEntries.map((entry, index) => {
              if (entry.type === 'show') {
                const show = entry.data as Show;
                return (
                  <React.Fragment key={`show-${show.id}`}>
                    <tr 
                      className="hover:bg-green-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => toggleShowExpansion(show.id)}
                      title={`Click to ${expandedShows.has(show.id) ? 'hide' : 'view'} show details`}
                    >
                      {/* Date */}
                      <td className="px-4 py-1.5">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(show.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      
                      {/* Location */}
                      <td className="px-4 py-1.5">
                        <div className="text-sm text-gray-900 truncate">{show.city}, {show.state}</div>
                      </td>
                      
                      {/* Venue/Artist Name */}
                      <td className="px-4 py-1.5">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {artistId ? (
                              show.venueId && show.venueId !== 'external-venue' ? (
                                <a 
                                  href={`/venues/${show.venueId}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                  title="View venue page"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {show.venueName}
                                </a>
                              ) : (
                                show.venueName
                              )
                            ) : (
                              show.artistId && show.artistId !== 'external-artist' ? (
                                <a 
                                  href={`/artists/${show.artistId}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                  title="View artist page"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {show.artistName}
                                </a>
                              ) : (
                                show.artistName
                              )
                            )}
                          </div>
                          
                          {/* User Badge for Platform Users */}
                          {((artistId && show.venueId && show.venueId !== 'external-venue') || 
                            (venueId && show.artistId && show.artistId !== 'external-artist')) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Open messaging modal
                                alert(`Message ${artistId ? show.venueName : show.artistName}`);
                              }}
                              className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                              title={`Message ${artistId ? show.venueName : show.artistName}`}
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-1.5">
                        <div className="flex items-center space-x-1">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Confirmed
                          </span>
                          {/* Quick Info Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowDetailModal(show);
                            }}
                            className="inline-flex items-center justify-center w-5 h-5 text-green-600 hover:text-green-800 hover:bg-green-200 rounded transition-colors"
                            title="View detailed show information"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      
                      {/* Capacity */}
                      <td className="px-4 py-1.5">
                        <div className="text-xs text-gray-600">{show.capacity}</div>
                      </td>
                      
                      {/* Age */}
                      <td className="px-4 py-1.5">
                        <div className="text-xs text-gray-600">{show.ageRestriction}</div>
                      </td>
                      
                      {/* Offers */}
                      <td className="px-4 py-1.5">
                        <div className="text-xs text-gray-600">
                          {show.guarantee ? `$${show.guarantee}` : '-'}
                        </div>
                      </td>
                      
                      {/* Bids (N/A for shows) */}
                      <td className="px-4 py-1.5">
                        <div className="text-xs text-gray-400">-</div>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-4 py-1.5">
                        <div className="flex items-center space-x-2">
                          {/* Delete button for members */}
                          {editable && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const showName = `${show.artistName || 'Show'} at ${show.venueName || show.city}`;
                                handleDeleteShow(show.id, showName);
                              }}
                              disabled={deleteShowLoading === show.id}
                              className="inline-flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              title="Delete show"
                            >
                              {deleteShowLoading === show.id ? (
                                <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                                </svg>
                              )}
                            </button>
                          )}
                          
                          {/* Expand/Collapse Indicator */}
                          <div className="flex items-center text-gray-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d={expandedShows.has(show.id) ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                            </svg>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Show Details */}
                    {expandedShows.has(show.id) && (
                      <>
                        {/* Timeline Header Row */}
                        <tr className="bg-yellow-50">
                          <td className="px-4 py-2 text-left font-medium text-yellow-700 text-sm w-[10%]">Time</td>
                          <td className="px-4 py-2 text-left font-medium text-yellow-700 text-sm w-[15%]">Event</td>
                          <td className="px-4 py-2 text-left font-medium text-yellow-700 text-sm w-[20%]">Details</td>
                          <td className="px-4 py-2 text-left font-medium text-yellow-700 text-sm w-[10%]"></td>
                          <td className="px-4 py-2 text-left font-medium text-yellow-700 text-sm w-[8%]"></td>
                          <td className="px-4 py-2 text-left font-medium text-yellow-700 text-sm w-[8%]"></td>
                          <td className="px-4 py-2 text-left font-medium text-yellow-700 text-sm w-[10%]"></td>
                          <td className="px-4 py-2 text-left font-medium text-yellow-700 text-sm w-[8%]"></td>
                          <td className="px-4 py-2 text-left font-medium text-yellow-700 text-sm w-[11%]">Actions</td>
                        </tr>
                        
                        {/* Timeline Events */}
                        {(() => {
                          const events = [];
                          
                          if (show.loadIn) {
                            events.push({
                              time: show.loadIn,
                              event: 'Load-in',
                              details: 'Gear arrives at venue',
                              type: 'loadIn'
                            });
                          }
                          
                          if (show.soundcheck) {
                            events.push({
                              time: show.soundcheck,
                              event: 'Soundcheck',
                              details: 'Technical setup and sound testing',
                              type: 'soundcheck'
                            });
                          }
                          
                          if (show.doorsOpen) {
                            events.push({
                              time: show.doorsOpen,
                              event: 'Doors Open',
                              details: 'Venue opens to public',
                              type: 'doorsOpen'
                            });
                          }
                          
                          if (show.showTime) {
                            events.push({
                              time: show.showTime,
                              event: 'Show Start',
                              details: 'Performance begins',
                              type: 'showTime'
                            });
                          }
                          
                          if (show.curfew) {
                            events.push({
                              time: show.curfew,
                              event: 'Curfew',
                              details: 'Music must end',
                              type: 'curfew'
                            });
                          }
                          
                          // Sort events by time
                          events.sort((a, b) => a.time.localeCompare(b.time));
                          
                          return events.map((event, index) => (
                            <tr key={index} className="hover:bg-yellow-100 bg-yellow-50">
                              <td className="px-4 py-1.5 font-mono text-sm text-gray-900 w-[10%]">{event.time}</td>
                              <td className="px-4 py-1.5 font-medium text-sm text-gray-900 w-[15%]">{event.event}</td>
                              <td className="px-4 py-1.5 text-sm text-gray-600 w-[20%]">{event.details}</td>
                              <td className="px-4 py-1.5 w-[10%]"></td>
                              <td className="px-4 py-1.5 w-[8%]"></td>
                              <td className="px-4 py-1.5 w-[8%]"></td>
                              <td className="px-4 py-1.5 w-[10%]"></td>
                              <td className="px-4 py-1.5 w-[8%]"></td>
                              <td className="px-4 py-1.5 text-left w-[11%]">
                                <div className="flex items-center space-x-2">
                                  <button className="inline-flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                          title="Delete event">
                                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                                    </svg>
                                  </button>
                                  <button className="text-gray-400 hover:text-gray-600" title="Edit event">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                        
                        {/* Add Event Row */}
                        <tr className="bg-yellow-100">
                          <td colSpan={8} className="px-4 py-1.5 text-left">
                            <button className="w-full text-left text-sm text-yellow-600 hover:text-yellow-800 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Event
                            </button>
                          </td>
                          <td className="px-4 py-1.5 text-left w-[11%]">
                            <div className="flex items-center">
                              {/* Empty space to align with action buttons above */}
                            </div>
                          </td>
                        </tr>
                      </>
                    )}
                  </React.Fragment>
                );
              } else if (entry.type === 'tour-request') {
                const request = entry.data as TourRequest;
                const requestBids = venueBids.filter(bid => bid.tourRequestId === request.id);
                
                return (
                  <React.Fragment key={`request-${request.id}`}>
                    <tr 
                      className="bg-blue-50 cursor-pointer transition-colors duration-150 hover:bg-blue-100 hover:shadow-sm border-l-4 border-blue-400 hover:border-blue-500"
                      onClick={() => toggleRequestExpansion(request.id)}
                      title={`Click to ${expandedRequests.has(request.id) ? 'hide' : 'view'} bids for this show request`}
                    >
                      {/* Date Range */}
                      <td className="px-4 py-1.5">
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
                      </td>
                      
                      {/* Location */}
                      <td className="px-4 py-1.5">
                        <div className="text-sm text-blue-900 truncate">{request.location}</div>
                      </td>
                      
                      {/* Title */}
                      <td className="px-4 py-1.5">
                        <div className="text-sm font-medium text-blue-900 truncate">{request.title}</div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-1.5">
                        <div className="flex items-center space-x-1">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Requested
                          </span>
                          {/* Quick Info Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTourRequestDetailModal(request);
                            }}
                            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded transition-colors"
                            title="View detailed request information"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      
                      {/* Capacity (Expected Draw) */}
                      <td className="px-4 py-1.5">
                        <div className="text-xs text-gray-600">{request.expectedDraw.min}-{request.expectedDraw.max}</div>
                      </td>
                      
                      {/* Age */}
                      <td className="px-4 py-1.5">
                        <div className="text-xs text-gray-600">{request.ageRestriction || 'Flexible'}</div>
                      </td>
                      
                      {/* Guarantee Range */}
                      <td className="px-4 py-1.5">
                        <div className="text-xs text-gray-600">
                          {request.guaranteeRange ? `$${request.guaranteeRange.min}-${request.guaranteeRange.max}` : '-'}
                        </div>
                      </td>
                      
                      {/* Bids Count */}
                      <td className="px-4 py-1.5">
                        <div className="text-xs">
                          {requestBids.length > 0 ? (
                            <span className="text-blue-600 font-medium">{requestBids.length}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-4 py-1.5">
                        <div className="flex items-center space-x-2">
                          {/* Delete button for artists */}
                          {viewerType === 'artist' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteShowRequest(request.id, request.title);
                              }}
                              disabled={deleteLoading === request.id}
                              className="inline-flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              title="Delete tour request"
                            >
                              {deleteLoading === request.id ? (
                                <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Place Bid button for venues */}
                          {viewerType === 'venue' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaceBid(request);
                              }}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              Bid
                            </button>
                          )}

                          {/* Expand/Collapse Indicator */}
                          <div className="flex items-center text-gray-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d={expandedRequests.has(request.id) ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                            </svg>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Bids Section */}
                    {expandedRequests.has(request.id) && (
                      <>
                        {/* Venue Bids - Compact Table Format */}
                        {requestBids.length > 0 && (
                          <tr>
                            <td colSpan={9} className="px-0 py-0">
                              <div className="bg-yellow-50 border-l-4 border-yellow-400">
                                {/* Compact Bids Table */}
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[1000px] table-fixed">
                                    <thead className="bg-yellow-100">
                                      <tr className="text-left text-xs font-medium text-yellow-700">
                                        <th className="px-4 py-1.5 w-[10%]">Date</th>
                                        <th className="px-4 py-1.5 w-[15%]">Location</th>
                                        <th className="px-4 py-1.5 w-[20%]">Venue</th>
                                        <th className="px-4 py-1.5 w-[10%]">Status</th>
                                        <th className="px-4 py-1.5 w-[8%]">Capacity</th>
                                        <th className="px-4 py-1.5 w-[8%]">Age</th>
                                        <th className="px-4 py-1.5 w-[10%]">Offers</th>
                                        <th className="px-4 py-1.5 w-[8%]">Bids</th>
                                        <th className="px-4 py-1.5 w-[11%]">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-yellow-200">
                                      {requestBids
                                        .filter((bid: VenueBid) => !['expired'].includes(bid.status))
                                        .map((bid: VenueBid) => (
                                        <tr key={`bid-${bid.id}`} className="bg-yellow-50 hover:bg-yellow-100 transition-colors duration-150">
                                          {/* Date */}
                                          <td className="px-4 py-1.5">
                                            <div className="text-sm font-medium text-yellow-900">
                                              {new Date(bid.proposedDate).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                              })}
                                            </div>
                                          </td>
                                          
                                          {/* Location - Extract from venue or use placeholder */}
                                          <td className="px-4 py-1.5">
                                            <div className="text-sm text-yellow-900 truncate">
                                              {/* TODO: Add venue location data to bid response */}
                                              -
                                            </div>
                                          </td>
                                          
                                          {/* Venue */}
                                          <td className="px-4 py-1.5">
                                            <div className="flex items-center space-x-2">
                                              <div className="text-sm font-medium text-yellow-900 truncate">{bid.venueName}</div>
                                              {/* Message indicator if there's a message */}
                                              {bid.message && (
                                                <div 
                                                  className="inline-flex items-center justify-center w-4 h-4 bg-yellow-200 text-yellow-800 rounded-full text-xs"
                                                  title={bid.message}
                                                >
                                                  💬
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                          
                                          {/* Status */}
                                          <td className="px-4 py-1.5">
                                            <span className={getBidStatusBadge(bid).className}>
                                              {getBidStatusBadge(bid).text}
                                            </span>
                                          </td>
                                          
                                          {/* Capacity */}
                                          <td className="px-4 py-1.5">
                                            <div className="text-xs text-gray-600">{bid.capacity}</div>
                                          </td>
                                          
                                          {/* Age */}
                                          <td className="px-4 py-1.5">
                                            <div className="text-xs text-gray-600">
                                              {bid.ageRestriction === 'ALL_AGES' ? 'all-ages' : 
                                               bid.ageRestriction === 'EIGHTEEN_PLUS' ? '18+' : 
                                               bid.ageRestriction === 'TWENTY_ONE_PLUS' ? '21+' : 
                                               bid.ageRestriction === '18_PLUS' ? '18+' : 
                                               bid.ageRestriction === '21_PLUS' ? '21+' : 
                                               bid.ageRestriction?.toLowerCase().replace('_', '-') || 'all-ages'}
                                            </div>
                                          </td>
                                          
                                          {/* Offers */}
                                          <td className="px-4 py-1.5">
                                            <div className="text-xs text-gray-600">
                                              {bid.guarantee ? `$${bid.guarantee}` : '-'}
                                              {bid.doorDeal && (
                                                <span className="text-yellow-600 ml-1">
                                                  ({bid.doorDeal.split} split)
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          
                                          {/* Bids (replaces the "Billing" column for bid rows) */}
                                          <td className="px-4 py-1.5">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewBidDetails(bid);
                                              }}
                                              className="inline-flex items-center justify-center w-5 h-5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-200 rounded transition-colors"
                                              title="View detailed bid information"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                              </svg>
                                            </button>
                                          </td>
                                          
                                          {/* Actions */}
                                          <td className="px-4 py-1.5">
                                            <div className="flex items-center space-x-0.5 flex-wrap">
                                              {viewerType === 'artist' && (
                                                <>
                                                  {bid.status === 'pending' && (
                                                    <>
                                                      <button
                                                        onClick={() => handleBidAction(bid, 'accept')}
                                                        disabled={bidActions[bid.id]}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                        title="Accept this bid"
                                                      >
                                                        ✓
                                                      </button>
                                                      <button
                                                        onClick={() => handleBidAction(bid, 'hold')}
                                                        disabled={bidActions[bid.id]}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                                                        title="Place on hold"
                                                      >
                                                        ⏸
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          const reason = prompt('Reason for declining (optional):');
                                                          if (reason !== null) handleBidAction(bid, 'decline', reason);
                                                        }}
                                                        disabled={bidActions[bid.id]}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                        title="Decline this bid"
                                                      >
                                                        ✕
                                                      </button>
                                                    </>
                                                  )}

                                                  {bid.status === 'hold' && (
                                                    <>
                                                      <button
                                                        onClick={() => handleBidAction(bid, 'accept')}
                                                        disabled={bidActions[bid.id]}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                        title="Accept this bid"
                                                      >
                                                        ✓
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          const reason = prompt('Reason for declining (optional):');
                                                          if (reason !== null) handleBidAction(bid, 'decline', reason);
                                                        }}
                                                        disabled={bidActions[bid.id]}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                        title="Decline this bid"
                                                      >
                                                        ✕
                                                      </button>
                                                    </>
                                                  )}

                                                  {bid.status === 'accepted' && (
                                                    <>
                                                      <button
                                                        onClick={() => {
                                                          if (confirm('Undo acceptance and return this bid to pending status? The venue will be notified.')) {
                                                            handleBidAction(bid, 'undo-accept');
                                                          }
                                                        }}
                                                        disabled={bidActions[bid.id]}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-colors"
                                                        title="Undo acceptance - return to pending"
                                                      >
                                                        ↶
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          const reason = prompt('Reason for declining (optional):');
                                                          if (reason !== null) handleBidAction(bid, 'decline', reason);
                                                        }}
                                                        disabled={bidActions[bid.id]}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                        title="Decline this bid"
                                                      >
                                                        ✕
                                                      </button>
                                                    </>
                                                  )}
                                                </>
                                              )}

                                              {viewerType === 'venue' && (
                                                <>
                                                  {bid.status === 'pending' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full text-yellow-800 bg-yellow-100">
                                                      Pending
                                                    </span>
                                                  )}

                                                  {bid.status === 'hold' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full text-blue-800 bg-blue-100">
                                                      {bid.holdPosition === 1 ? '1st Hold' : bid.holdPosition === 2 ? '2nd Hold' : bid.holdPosition === 3 ? '3rd Hold' : 'On Hold'}
                                                    </span>
                                                  )}

                                                  {bid.status === 'accepted' && (
                                                    <button
                                                      onClick={() => handleConfirmShow(bid)}
                                                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 transition-colors"
                                                      title="Confirm this show"
                                                    >
                                                      Confirm
                                                    </button>
                                                  )}

                                                  {(bid.status === 'pending' || bid.status === 'hold') && (
                                                    <button
                                                      onClick={() => handleCancelBid(bid)}
                                                      className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 transition-colors ml-1"
                                                      title="Cancel this bid"
                                                    >
                                                      ✕
                                                    </button>
                                                  )}
                                                </>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              }
              return null;
            })}
            
            {/* Add Date Row - Only show when no shows at all and user is a member */}
            {monthGroups.length === 0 && editable && (
              <tr>
                <td colSpan={9} className="px-6 py-3">
                  <button
                    onClick={() => {
                      if (artistId) {
                        setAddDateForm(prev => ({
                          ...prev,
                          type: 'request',
                          artistId: artistId || '',
                          artistName: artistName || '',
                          venueId: '',
                          venueName: ''
                        }));
                      } else if (venueId) {
                        setAddDateForm(prev => ({
                          ...prev,
                          type: 'confirmed',
                          artistId: '',
                          artistName: '',
                          venueId: venueId || '',
                          venueName: venueName || ''
                        }));
                      }
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

      {/* Add floating Add Date button when there are entries */}
      {monthGroups.length > 0 && editable && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              if (artistId) {
                setAddDateForm(prev => ({
                  ...prev,
                  type: 'request',
                  artistId: artistId || '',
                  artistName: artistName || '',
                  venueId: '',
                  venueName: ''
                }));
              } else if (venueId) {
                setAddDateForm(prev => ({
                  ...prev,
                  type: 'confirmed',
                  artistId: '',
                  artistName: '',
                  venueId: venueId || '',
                  venueName: venueName || ''
                }));
              }
              setShowAddDateForm(true);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Date</span>
          </button>
        </div>
      )}

      {/* All the modals from original component would go here */}
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
                      ? 'Create a show request to find venues for this date'
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
                    <LocationAutocomplete
                      value={addDateForm.location}
                      onChange={(value) => setAddDateForm(prev => ({ ...prev, location: value }))}
                      placeholder="e.g., Seattle, WA or Pacific Northwest"
                      required
                      label="Location"
                      showLabel={false}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={addDateForm.title}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., West Coast Tour"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Template Selector - Auto-fill the fields below */}
                  {artistId && viewerType === 'artist' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <TemplateSelector
                        artistId={artistId}
                        onTemplateApply={handleTemplateApply}
                        className="mb-0"
                      />
                    </div>
                  )}

             

                  {/* Business Terms */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Business Terms</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Guarantee ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={addDateForm.guaranteeRange?.min || ''}
                          onChange={(e) => setAddDateForm(prev => ({ 
                            ...prev, 
                            guaranteeRange: { 
                              ...prev.guaranteeRange, 
                              min: parseInt(e.target.value) || 0 
                            }
                          }))}
                          placeholder="e.g., 500"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Age Restriction
                        </label>
                        <select
                          value={addDateForm.ageRestriction}
                          onChange={(e) => setAddDateForm(prev => ({ 
                            ...prev, 
                            ageRestriction: e.target.value as 'all-ages' | '18+' | '21+' | 'flexible'
                          }))}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="flexible">Flexible</option>
                          <option value="all-ages">All Ages</option>
                          <option value="18+">18+</option>
                          <option value="21+">21+</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={addDateForm.acceptsDoorDeals || false}
                          onChange={(e) => setAddDateForm(prev => ({
                            ...prev,
                            acceptsDoorDeals: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Accepts Door Deals</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={addDateForm.merchandising || false}
                          onChange={(e) => setAddDateForm(prev => ({
                            ...prev,
                            merchandising: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Merchandising</span>
                      </label>
                    </div>
                  </div>

                  {/* Travel & Logistics */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Travel & Logistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Travel Method
                        </label>
                        <select
                          value={addDateForm.travelMethod}
                          onChange={(e) => setAddDateForm(prev => ({ 
                            ...prev, 
                            travelMethod: e.target.value as 'van' | 'flying' | 'train' | 'other'
                          }))}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="van">Van/Vehicle</option>
                          <option value="flying">Flying</option>
                          <option value="train">Train</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lodging Preference
                        </label>
                        <select
                          value={addDateForm.lodging}
                          onChange={(e) => setAddDateForm(prev => ({ 
                            ...prev, 
                            lodging: e.target.value as 'floor-space' | 'hotel' | 'flexible'
                          }))}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="flexible">Flexible</option>
                          <option value="floor-space">Floor Space</option>
                          <option value="hotel">Hotel</option>
                        </select>
                      </div>
                    </div>
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
                    <LocationAutocomplete
                      value={addDateForm.location}
                      onChange={(value) => setAddDateForm(prev => ({ ...prev, location: value }))}
                      placeholder="e.g., Seattle, WA or Pacific Northwest"
                      required
                      label="Location"
                      showLabel={false}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={addDateForm.title}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., West Coast Tour"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={addDateForm.description}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details about the tour request..."
                      rows={3}
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

                  {/* Financial Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guarantee ($)
                      </label>
                      <input
                        type="number"
                        value={addDateForm.guarantee}
                        onChange={(e) => setAddDateForm(prev => ({ ...prev, guarantee: e.target.value }))}
                        placeholder="300"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
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
                  </div>

                  {/* Show Timeline */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Show Timeline</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Load-in
                        </label>
                        <input
                          type="time"
                          value={addDateForm.loadIn}
                          onChange={(e) => setAddDateForm(prev => ({ ...prev, loadIn: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Soundcheck
                        </label>
                        <input
                          type="time"
                          value={addDateForm.soundcheck}
                          onChange={(e) => setAddDateForm(prev => ({ ...prev, soundcheck: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Doors Open
                        </label>
                        <input
                          type="time"
                          value={addDateForm.doorsOpen}
                          onChange={(e) => setAddDateForm(prev => ({ ...prev, doorsOpen: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Show Time
                        </label>
                        <input
                          type="time"
                          value={addDateForm.showTime}
                          onChange={(e) => setAddDateForm(prev => ({ ...prev, showTime: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Curfew
                        </label>
                        <input
                          type="time"
                          value={addDateForm.curfew}
                          onChange={(e) => setAddDateForm(prev => ({ ...prev, curfew: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Order Information */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Billing & Lineup</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Billing Position
                        </label>
                        <select
                          value={addDateForm.billingPosition}
                          onChange={(e) => setAddDateForm(prev => ({ ...prev, billingPosition: e.target.value as any }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select position...</option>
                          <option value="headliner">Headliner</option>
                          <option value="co-headliner">Co-Headliner</option>
                          <option value="direct-support">Direct Support</option>
                          <option value="opener">Opener</option>
                          <option value="local-opener">Local Opener</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Set Length (minutes)
                        </label>
                        <input
                          type="number"
                          value={addDateForm.setLength}
                          onChange={(e) => setAddDateForm(prev => ({ ...prev, setLength: e.target.value }))}
                          placeholder="45"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Other Acts on Bill
                      </label>
                      <input
                        type="text"
                        value={addDateForm.otherActs}
                        onChange={(e) => setAddDateForm(prev => ({ ...prev, otherActs: e.target.value }))}
                        placeholder="Band 1, Band 2, Local Opener"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={addDateForm.notes}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about the show..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Dynamic Technical Requirements Table - Moved to bottom */}
              {addDateForm.type === 'request' && (
                <TechnicalRequirementsTable
                  requirements={addDateForm.technicalRequirements}
                  onChange={(requirements) => setAddDateForm(prev => ({ ...prev, technicalRequirements: requirements }))}
                />
              )}

              {/* Dynamic Hospitality Rider Table - Moved to bottom */}
              {addDateForm.type === 'request' && (
                <HospitalityRiderTable
                  requirements={addDateForm.hospitalityRequirements}
                  onChange={(requirements) => setAddDateForm(prev => ({ ...prev, hospitalityRequirements: requirements }))}
                />
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddDateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDateLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {addDateLoading ? 'Adding...' : `Add ${addDateForm.type === 'request' ? 'Tour Request' : 'Show'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show Detail Modal */}
      {showDetailModal && selectedShowForDetail && (
        <ShowDetailModal
          show={selectedShowForDetail}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedShowForDetail(null);
          }}
          viewerType={viewerType}
        />
      )}

      {/* Tour Request Detail Modal */}
      {tourRequestDetailModal && selectedTourRequest && (
        <TourRequestDetailModal
          tourRequest={selectedTourRequest}
          isOpen={tourRequestDetailModal}
          onClose={() => {
            setTourRequestDetailModal(false);
            setSelectedTourRequest(null);
          }}
          onPlaceBid={() => {
            setTourRequestDetailModal(false);
            setShowBidForm(true);
          }}
          viewerType={viewerType}
        />
      )}
    </div>
  );
} 

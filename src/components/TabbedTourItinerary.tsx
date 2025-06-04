'use client';

import React, { useState, useEffect } from 'react';
import { Show, TourRequest } from '../../types';
import { TechnicalRequirement, HospitalityRequirement } from '../../types/templates';
import VenueBidForm from './VenueBidForm';
import ShowDetailModal from './ShowDetailModal';
import TourRequestDetailModal from './TourRequestDetailModal';
import TemplateSelector from './TemplateSelector';
import TemplateFormRenderer from './TemplateFormRenderer';
import LocationVenueAutocomplete from './LocationVenueAutocomplete';
import UnifiedShowRequestForm from './UnifiedShowRequestForm';
import TechnicalRequirementsTable from './TechnicalRequirementsTable';
import HospitalityRiderTable from './HospitalityRiderTable';
import VenueOfferForm from './VenueOfferForm';
import { InlineOfferDisplay } from './OfferDisplay';
import OfferInput, { ParsedOffer, parsedOfferToLegacyFormat } from './OfferInput';
import ShowDocumentModal from './ShowDocumentModal';
import UniversalMakeOfferModal from './UniversalMakeOfferModal';
import MakeOfferButton from './MakeOfferButton';
import { ItineraryDate } from './DateDisplay';
import OfferFormCore from './OfferFormCore';
import { useAlert } from './UniversalAlertModal';

// Import our new custom hooks and utilities
import { useTourItineraryData } from '../hooks/useTourItineraryData';
import { useVenueArtistSearch } from '../hooks/useVenueArtistSearch';
import { createTimelineEntries, groupEntriesByMonth, getDefaultActiveMonth } from '../utils/timelineUtils';

interface VenueBid {
  id: string;
  showRequestId: string;
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
  location?: string;
  holdPosition?: 1 | 2 | 3;
  heldAt?: string;
  heldUntil?: string;
  acceptedAt?: string;
  declinedAt?: string;
  declinedReason?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  billingPosition?: 'headliner' | 'co-headliner' | 'direct-support' | 'opener' | 'local-opener';
  lineupPosition?: number;
  setLength?: number;
  otherActs?: string;
  billingNotes?: string;
  // 🎯 NEW: Artist information for proper display in venue timelines
  artistId?: string;
  artistName?: string;
}

interface VenueOffer {
  id: string;
  venueId: string;
  venueName: string;
  artistId: string;
  artistName: string;
  title: string;
  description?: string;
  proposedDate: string;
  alternativeDates?: string[];
  message?: string;
  amount?: number;
  doorDeal?: {
    split: string;
    minimumGuarantee?: number;
    afterExpenses?: boolean;
  };
  ticketPrice?: {
    advance?: number;
    door?: number;
  };
  merchandiseSplit?: string;
  billingPosition?: 'headliner' | 'co-headliner' | 'direct-support' | 'opener' | 'local-opener';
  lineupPosition?: number;
  setLength?: number;
  otherActs?: string;
  billingNotes?: string;
  capacity?: number;
  ageRestriction?: string;
  equipmentProvided?: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  loadIn?: string;
  soundcheck?: string;
  doorsOpen?: string;
  showTime?: string;
  curfew?: string;
  promotion?: {
    social: boolean;
    flyerPrinting: boolean;
    radioSpots: boolean;
    pressCoverage: boolean;
  };
  lodging?: {
    offered: boolean;
    type: 'floor-space' | 'couch' | 'private-room';
    details?: string;
  };
  additionalTerms?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  venue?: {
    id: string;
    name: string;
    venueType?: string;
    capacity?: number;
    location?: {
      city: string;
      stateProvince: string;
      country: string;
    };
  };
  artist?: {
    id: string;
    name: string;
    genres?: string[];
  };
}

interface TabbedTourItineraryProps {
  artistId?: string;
  artistName?: string;
  venueId?: string;
  venueName?: string;
  title?: string;
  showTitle?: boolean;
  editable?: boolean;
  viewerType?: 'artist' | 'venue' | 'public';
}

interface TimelineEntry {
  type: 'show' | 'tour-request';
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
  showTitle = true,
  editable = false,
  viewerType = 'public'
}: TabbedTourItineraryProps) {
  // Initialize Universal Alert Modal system
  const { AlertModal, confirm, error: showError, success: showSuccess, info: showInfo, toast } = useAlert();

  // Use editable prop to determine if user has permissions
  const actualViewerType = viewerType !== 'public' ? viewerType : 
    (editable && artistId) ? 'artist' : 
    (editable && venueId) ? 'venue' : 
    'public';

  // 🎯 UX FIX: Determine venue offer permissions separately from general editing
  const canMakeOffers = (() => {
    // Artists can always make requests and manage their timeline
    if (actualViewerType === 'artist' && editable) return true;
    
    // Venues can make offers on artist pages (even when editable=false)
    if (actualViewerType === 'venue' && artistId && venueId && venueName) return true;
    
    // Venues can manage their own timeline when editable=true
    if (actualViewerType === 'venue' && venueId && editable) return true;
    
    return false;
  })();

  // 🎯 REFACTORED: Use custom hook for data fetching
  const {
    shows,
    tourRequests,
    venueBids,
    venueOffers,
    loading,
    fetchError,
    fetchData
  } = useTourItineraryData({ artistId, venueId, venueName });

  // 🎯 REFACTORED: Use custom hook for venue/artist search
  const {
    venues,
    artists,
    venueSearchResults,
    artistSearchResults,
    showVenueDropdown,
    showArtistDropdown,
    handleVenueSearch,
    handleArtistSearch,
    selectVenue: selectVenueFromSearch,
    selectArtist: selectArtistFromSearch,
    setShowVenueDropdown,
    setShowArtistDropdown
  } = useVenueArtistSearch({
    onVenueSelect: (venue) => {
      setAddDateForm(prev => ({
        ...prev,
        venueId: venue.id,
        venueName: venue.name,
        location: `${venue.city}, ${venue.state}`,
        capacity: venue.capacity?.toString() || ''
      }));
    },
    onArtistSelect: (artist) => {
      setAddDateForm(prev => ({
        ...prev,
        artistId: artist.id,
        artistName: artist.name
      }));
    }
  });

  // Remaining state management
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
  
  // Track declined bids locally to avoid flashing
  const [declinedBids, setDeclinedBids] = useState<Set<string>>(new Set());
  
  // Track deleted tour requests locally to avoid flashing  
  const [deletedRequests, setDeletedRequests] = useState<Set<string>>(new Set());
  
  // Track deleted shows locally to avoid flashing
  const [deletedShows, setDeletedShows] = useState<Set<string>>(new Set());
  
  // Add optimistic bid status tracking to prevent blinking during switches
  const [bidStatusOverrides, setBidStatusOverrides] = useState<Map<string, 'pending' | 'accepted' | 'hold' | 'declined'>>(new Map());
  
  // Track recent undo actions to prevent race conditions
  const [recentUndoActions, setRecentUndoActions] = useState<Set<string>>(new Set());
  
  // Add venue offer form state
  const [showVenueOfferForm, setShowVenueOfferForm] = useState(false);
  
  // Show Document Modal state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocumentShow, setSelectedDocumentShow] = useState<Show | null>(null);
  const [selectedDocumentBid, setSelectedDocumentBid] = useState<VenueBid | null>(null);
  const [selectedDocumentTourRequest, setSelectedDocumentTourRequest] = useState<TourRequest | null>(null);
  
  // All the form states from original component
  const [addDateForm, setAddDateForm] = useState({
    type: 'offer' as 'request' | 'confirmed' | 'offer',
    date: '',
    startDate: '',
    endDate: '',
    requestDate: '',
    useSingleDate: true,
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
  
  // Universal Make Offer Modal state
  const [showUniversalOfferModal, setShowUniversalOfferModal] = useState(false);
  const [offerTargetArtist, setOfferTargetArtist] = useState<{ id: string; name: string } | null>(null);
  const [offerTourRequest, setOfferTourRequest] = useState<{ id: string; title: string; artistName: string } | null>(null);
  const [offerPreSelectedDate, setOfferPreSelectedDate] = useState<string | null>(null);
  const [offerExistingBid, setOfferExistingBid] = useState<any>(null);

  // 🎯 REFACTORED: Timeline creation using utility functions
  const filteredShows = shows.filter(show => !deletedShows.has(show.id));
  const filteredTourRequests = tourRequests.filter(request => !deletedRequests.has(request.id));
  // Filter venue offers - exclude offers whose synthetic request IDs are in deletedRequests
  const filteredVenueOffers = venueOffers.filter(offer => {
    const syntheticRequestId = `venue-offer-${offer.id}`;
    return !deletedRequests.has(syntheticRequestId);
  });
  // 🎯 NEW: Filter venue bids - exclude bids whose synthetic request IDs are in deletedRequests
  const filteredVenueBids = venueBids.filter(bid => {
    const syntheticRequestId = `venue-bid-${bid.id}`;
    return !deletedRequests.has(syntheticRequestId);
  });
  const timelineEntries = createTimelineEntries(filteredShows, filteredTourRequests, filteredVenueOffers, filteredVenueBids, artistId, venueId);
  const monthGroups = groupEntriesByMonth(timelineEntries);

  // 🎯 UX IMPROVEMENT: Helper function to determine when venues should see offer buttons
  const shouldShowOfferButton = (request: TourRequest & { isVenueInitiated?: boolean }) => {
    // When viewing artist pages: show for all requests (maximum discoverability!)
    if (artistId) {
      return true;
    }
    
    // When viewing venue's own timeline: only show for artist-initiated requests (preserves existing behavior)
    if (venueId && !artistId) {
      return !request.isVenueInitiated;
    }
    
    // Fallback to existing behavior
    return !request.isVenueInitiated;
  };

  // Set active tab to first month with entries, or current month if no entries
  useEffect(() => {
    if (monthGroups.length > 0) {
      const currentTabExists = monthGroups.some(group => group.monthKey === activeMonthTab);
      
      if (!activeMonthTab || !currentTabExists) {
        const defaultMonth = getDefaultActiveMonth(monthGroups);
        setActiveMonthTab(defaultMonth);
      }
    } else if (monthGroups.length === 0) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setActiveMonthTab(currentMonth);
    }
  }, [monthGroups.length, activeMonthTab]);

  // 🎯 FIX: Reset optimistic state when switching between venues/artists
  useEffect(() => {
    // Clear all optimistic state when artistId or venueId changes
    setBidStatusOverrides(new Map());
    setDeclinedBids(new Set());
    setDeletedRequests(new Set());
    setDeletedShows(new Set());
    setBidActions({});
    setHoldActions({});
    setHoldNotes({});
    setRecentUndoActions(new Set());
  }, [artistId, venueId]);

  const activeMonthEntries = monthGroups.find(group => group.monthKey === activeMonthTab)?.entries || [];

  // Handler functions that are still needed in the component
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

  // Additional handler functions
  const handlePlaceBid = (tourRequest: TourRequest) => {
    if (venueId && venueName) {
      setSelectedTourRequest(tourRequest);
      setShowBidForm(true);
      return;
    }
    
    if (actualViewerType === 'venue') {
      setOfferTargetArtist({
        id: tourRequest.artistId,
        name: tourRequest.artistName
      });
      setShowUniversalOfferModal(true);
      return;
    }
    
    alert('To submit a bid, we need your venue information. Please visit your venue profile page first to set up bidding.');
  };

  const handleDeleteShow = async (showId: string, showName: string) => {
    confirm(
      'Delete Show',
      `Are you sure you want to delete "${showName}"?`,
      async () => {
        try {
          setDeleteShowLoading(showId);
          
          // Optimistic update - immediately hide the show
          setDeletedShows(prev => new Set([...prev, showId]));
          
          const response = await fetch(`/api/shows/${showId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete show');
          }

          // Don't call fetchData() to avoid flashing - the optimistic update already handles UI
          showSuccess('Show Deleted', 'Show deleted successfully');
        } catch (error) {
          console.error('Error deleting show:', error);
          
          // Revert optimistic update on error
          setDeletedShows(prev => {
            const newSet = new Set(prev);
            newSet.delete(showId);
            return newSet;
          });
          
          showError('Delete Failed', 'Failed to delete show. Please try again.');
        } finally {
          setDeleteShowLoading(null);
        }
      }
    );
  };

  // Add all the missing handler functions
  
  // Helper function to check for date conflicts when accepting bids/offers
  const checkDateConflict = (proposedDate: string, excludeBidId?: string, excludeOfferId?: string) => {
    const targetDate = proposedDate.split('T')[0]; // Get just the date part
    
    // Check for accepted bids on the same date (using real backend status for conflict detection)
    const acceptedBid = venueBids.find(bid => 
      bid.status === 'accepted' && 
      bid.proposedDate.split('T')[0] === targetDate &&
      bid.id !== excludeBidId
    );
    
    // Check for accepted offers on the same date
    const acceptedOffer = venueOffers.find(offer => 
      (offer.status === 'accepted' || offer.status === 'ACCEPTED') && 
      offer.proposedDate.split('T')[0] === targetDate &&
      offer.id !== excludeOfferId
    );
    
    return { acceptedBid, acceptedOffer };
  };

  // Helper function to get effective bid status (with optimistic overrides)
  const getEffectiveBidStatus = (bid: VenueBid): 'pending' | 'hold' | 'accepted' | 'declined' | 'cancelled' => {
    const override = bidStatusOverrides.get(bid.id);
    if (override) {
      return override;
    }
    return bid.status;
  };

  // Extract the original bid action logic into a separate function (defined first)
  const proceedWithBidAction = async (bid: VenueBid, action: string, reason?: string) => {
    setBidActions(prev => ({ ...prev, [bid.id]: true }));
    
    // Optimistic update for decline action to avoid flashing
    if (action === 'decline') {
      // Immediately add to declined bids set
      setDeclinedBids(prev => new Set([...prev, bid.id]));
    }
    
    try {
      const response = await fetch(`/api/show-requests/${bid.showRequestId}/bids`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidId: bid.id,
          action,
          reason,
          notes: holdNotes[bid.id] || ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} bid`);
      }

      // Only refetch data for non-decline actions
      if (action !== 'decline') {
        await fetchData();
      }
      
      const actionMessages = {
        accept: 'Bid accepted! You can now coordinate with the venue to finalize details.',
        hold: 'Bid placed on hold. You have time to consider other options.',
        decline: 'Bid declined and removed from your itinerary.'
      };
      
      const message = actionMessages[action as keyof typeof actionMessages] || `Bid ${action}ed successfully.`;
      
      if (action === 'decline') {
        showSuccess('Bid Declined', 'The bid has been removed from your itinerary.');
      }
    } catch (error) {
      console.error(`Error ${action}ing bid:`, error);
      
      // Revert optimistic update on error
      if (action === 'decline') {
        setDeclinedBids(prev => {
          const newSet = new Set(prev);
          newSet.delete(bid.id);
          return newSet;
        });
      }
      
      showError(`${action.charAt(0).toUpperCase() + action.slice(1)} Failed`, `Failed to ${action} bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBidActions(prev => ({ ...prev, [bid.id]: false }));
    }
  };

  // Extract the original offer action logic into a separate function (defined first)
  const proceedWithOfferAction = async (offer: VenueOffer, action: string) => {
    const actionText = action === 'accept' ? 'accept' : action === 'decline' ? 'decline' : action;
    
    // Optimistic update for decline action to avoid flashing
    if (action === 'decline') {
      // Find and hide the synthetic tour request for this offer
      const syntheticRequestId = `venue-offer-${offer.id}`;
      setDeletedRequests(prev => new Set([...prev, syntheticRequestId]));
    } else if (action === 'accept') {
      // Optimistic update for accept action
      setBidStatusOverrides(prev => new Map(prev).set(offer.id, 'accepted'));
    }
    
    try {
      // 🎯 NEW UNIFIED SYSTEM FIX: Check if this is a ShowRequest (new system) or VenueOffer (old system)
      // ShowRequests from admin reset will have a different ID pattern and need different API endpoints
      let response;
      
      // Try the new ShowRequest API first (for admin-created offers)
      const showRequestResponse = await fetch(`/api/show-requests/${offer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: action === 'decline' ? 'decline' : action,
          status: action === 'decline' ? 'DECLINED' : action === 'accept' ? 'CONFIRMED' : action.toUpperCase()
        }),
      });

      if (showRequestResponse.ok) {
        // This was a ShowRequest from the new system
        response = showRequestResponse;
        console.log(`✅ Successfully updated ShowRequest ${offer.id} via new unified API`);
      } else if (showRequestResponse.status === 404) {
        // Not found as ShowRequest, try the old VenueOffer API
        console.log(`🔄 ShowRequest not found, trying VenueOffer API for ${offer.id}`);
        
        response = await fetch(`/api/venues/${offer.venueId}/offers/${offer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        });

        if (response.ok) {
          console.log(`✅ Successfully updated VenueOffer ${offer.id} via legacy API`);
        }
      } else {
        // Some other error with ShowRequest API
        response = showRequestResponse;
      }

      if (!response.ok) {
        const errorData = await response.json();
        
        // 🎯 NEW: Auto-refresh on 404 errors (stale data detection)
        if (response.status === 404) {
          console.warn('🔄 Stale data detected (404 error), automatically refreshing...');
          showInfo('Data Updated', 'The data has been refreshed to show the latest information.');
          await fetchData(); // Auto-refresh to get fresh data
          return; // Exit early since data was refreshed
        }
        
        throw new Error(errorData.error || `Failed to ${actionText} offer`);
      }

      // Clear optimistic override since backend is now in sync  
      // Don't clear for decline (uses different state) or undo-accept (needs to persist until backend syncs)
      if (action !== 'decline' && action !== 'undo-accept') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(offer.id);
          return newMap;
        });
      }
      
      if (action === 'decline') {
        showSuccess('Offer Declined', 'The venue offer has been removed from your itinerary.');
      } else if (action === 'accept') {
        showSuccess('Offer Accepted', 'The venue offer has been accepted and added to your confirmed shows!');
        // Refresh data to show the new confirmed show
        await fetchData();
      }
    } catch (error) {
      console.error(`Error ${actionText}ing offer:`, error);
      
      // Revert optimistic updates on error
      if (action === 'accept') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(offer.id);
          return newMap;
        });
      } else if (action === 'decline') {
        setDeletedRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(`venue-offer-${offer.id}`);
          return newSet;
        });
      }
      
      showError(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Failed`, `Failed to ${actionText} offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBidAction = async (bid: VenueBid, action: string, reason?: string) => {
    // Add conflict validation for accept action
    if (action === 'accept') {
      const { acceptedBid, acceptedOffer } = checkDateConflict(bid.proposedDate, bid.id);
      
      if (acceptedBid || acceptedOffer) {
        const conflictVenue = acceptedBid ? acceptedBid.venueName : acceptedOffer?.venueName;
        const conflictType = acceptedBid ? 'bid' : 'offer';
        
        confirm(
          'Date Conflict',
          `You've already accepted ${conflictType === 'bid' ? 'a bid' : 'an offer'} from ${conflictVenue} for this date. Only one booking can be accepted per date. Switch to ${bid.venueName} instead?`,
          async () => {
            // Show loading toast (brief, auto-dismiss)
            toast('info', 'Switching Bookings', `Switching to ${bid.venueName}...`, 2000);
            
            // Optimistic updates for seamless UX
            try {
              // Immediately update UI state
              if (acceptedBid) {
                setBidStatusOverrides(prev => new Map(prev).set(acceptedBid.id, 'pending'));
              }
              setBidStatusOverrides(prev => new Map(prev).set(bid.id, 'accepted'));
              
              // Perform backend updates
              if (acceptedBid) {
                await fetch(`/api/show-requests/${acceptedBid.showRequestId}/bids`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    bidId: acceptedBid.id,
                    action: 'undo-accept',
                    reason: `Reverted - switched to ${bid.venueName} for same date`
                  }),
                });
              }
              
              if (acceptedOffer) {
                await fetch(`/api/venues/${acceptedOffer.venueId}/offers/${acceptedOffer.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'decline',
                    reason: `Switched to ${bid.venueName} for same date`
                  }),
                });
              }
              
              // Accept the new bid
              await fetch(`/api/show-requests/${bid.showRequestId}/bids`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bidId: bid.id,
                  action: 'accept',
                  reason,
                  notes: holdNotes[bid.id] || ''
                }),
              });
              
              // Refresh data to sync backend state
              await fetchData();
              
              // Show success toast (longer, auto-dismiss)
              toast('success', 'Booking Updated', `Now booked with ${bid.venueName}!`, 4000);
            } catch (error) {
              // Revert optimistic updates on error
              setBidStatusOverrides(prev => {
                const newMap = new Map(prev);
                if (acceptedBid) newMap.delete(acceptedBid.id);
                newMap.delete(bid.id);
                return newMap;
              });
              showError('Switch Failed', 'Failed to switch bookings. Please try again.');
            }
          }
        );
        return; // Exit early to wait for user confirmation
      }
    }
    
    // No conflict or not an accept action, proceed with optimistic update
    return proceedWithBidActionOptimistic(bid, action, reason);
  };

  // Optimistic version of proceedWithBidAction
  const proceedWithBidActionOptimistic = async (bid: VenueBid, action: string, reason?: string) => {
    setBidActions(prev => ({ ...prev, [bid.id]: true }));
    
    // Immediate optimistic update
    if (action === 'accept') {
      setBidStatusOverrides(prev => new Map(prev).set(bid.id, 'accepted'));
    } else if (action === 'undo-accept') {
      setBidStatusOverrides(prev => new Map(prev).set(bid.id, 'pending'));
    } else if (action === 'hold') {
      setBidStatusOverrides(prev => new Map(prev).set(bid.id, 'hold'));
    } else if (action === 'decline') {
      setDeclinedBids(prev => new Set([...prev, bid.id]));
    }
    
    try {
      const response = await fetch(`/api/show-requests/${bid.showRequestId}/bids`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidId: bid.id,
          action,
          reason,
          notes: holdNotes[bid.id] || ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} bid`);
      }

      // Clear optimistic override since backend is now in sync  
      // Don't clear for decline (uses different state) or undo-accept (needs to persist until backend syncs)
      if (action !== 'decline' && action !== 'undo-accept') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(bid.id);
          return newMap;
        });
      }
      
      const actionMessages = {
        accept: 'Bid accepted! You can now coordinate with the venue to finalize details.',
        hold: 'Bid placed on hold. You have time to consider other options.',
        decline: 'Bid declined and removed from your itinerary.'
      };
      
      if (action === 'decline') {
        showSuccess('Bid Declined', 'The bid has been removed from your itinerary.');
      }
    } catch (error) {
      console.error(`Error ${action}ing bid:`, error);
      
      // Revert optimistic updates on error
      if (action === 'accept') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(bid.id);
          return newMap;
        });
      } else if (action === 'undo-accept') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(bid.id);
          return newMap;
        });
      } else if (action === 'hold') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(bid.id);
          return newMap;
        });
      } else if (action === 'decline') {
        setDeclinedBids(prev => {
          const newSet = new Set(prev);
          newSet.delete(bid.id);
          return newSet;
        });
      }
      
      showError(`${action.charAt(0).toUpperCase() + action.slice(1)} Failed`, `Failed to ${action} bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBidActions(prev => ({ ...prev, [bid.id]: false }));
    }
  };

  // Optimistic version of proceedWithOfferAction (moved up for proper declaration order)
  const proceedWithOfferActionOptimistic = async (offer: VenueOffer, action: string) => {
    const actionText = action === 'accept' ? 'accept' : action === 'decline' ? 'decline' : action;
    
    // Optimistic update for decline action to avoid flashing
    if (action === 'decline') {
      // Find and hide the synthetic tour request for this offer
      const syntheticRequestId = `venue-offer-${offer.id}`;
      setDeletedRequests(prev => new Set([...prev, syntheticRequestId]));
    } else if (action === 'accept') {
      // Optimistic update for accept action
      setBidStatusOverrides(prev => new Map(prev).set(offer.id, 'accepted'));
    }
    
    try {
      // 🎯 NEW UNIFIED SYSTEM FIX: Check if this is a ShowRequest (new system) or VenueOffer (old system)
      // ShowRequests from admin reset will have a different ID pattern and need different API endpoints
      let response;
      
      // Try the new ShowRequest API first (for admin-created offers)
      const showRequestResponse = await fetch(`/api/show-requests/${offer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: action === 'decline' ? 'decline' : action,
          status: action === 'decline' ? 'DECLINED' : action === 'accept' ? 'CONFIRMED' : action.toUpperCase()
        }),
      });

      if (showRequestResponse.ok) {
        // This was a ShowRequest from the new system
        response = showRequestResponse;
        console.log(`✅ Successfully updated ShowRequest ${offer.id} via new unified API`);
      } else if (showRequestResponse.status === 404) {
        // Not found as ShowRequest, try the old VenueOffer API
        console.log(`🔄 ShowRequest not found, trying VenueOffer API for ${offer.id}`);
        
        response = await fetch(`/api/venues/${offer.venueId}/offers/${offer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        });

        if (response.ok) {
          console.log(`✅ Successfully updated VenueOffer ${offer.id} via legacy API`);
        }
      } else {
        // Some other error with ShowRequest API
        response = showRequestResponse;
      }

      if (!response.ok) {
        const errorData = await response.json();
        
        // 🎯 NEW: Auto-refresh on 404 errors (stale data detection)
        if (response.status === 404) {
          console.warn('🔄 Stale data detected (404 error), automatically refreshing...');
          showInfo('Data Updated', 'The data has been refreshed to show the latest information.');
          await fetchData(); // Auto-refresh to get fresh data
          return; // Exit early since data was refreshed
        }
        
        throw new Error(errorData.error || `Failed to ${actionText} offer`);
      }

      // Clear optimistic override since backend is now in sync  
      // Don't clear for decline (uses different state) or undo-accept (needs to persist until backend syncs)
      if (action !== 'decline' && action !== 'undo-accept') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(offer.id);
          return newMap;
        });
      }
      
      if (action === 'decline') {
        showSuccess('Offer Declined', 'The venue offer has been removed from your itinerary.');
      } else if (action === 'accept') {
        showSuccess('Offer Accepted', 'The venue offer has been accepted and added to your confirmed shows!');
        // Refresh data to show the new confirmed show
        await fetchData();
      }
    } catch (error) {
      console.error(`Error ${actionText}ing offer:`, error);
      
      // Revert optimistic updates on error
      if (action === 'accept') {
        setBidStatusOverrides(prev => {
          const newMap = new Map(prev);
          newMap.delete(offer.id);
          return newMap;
        });
      } else if (action === 'decline') {
        setDeletedRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(`venue-offer-${offer.id}`);
          return newSet;
        });
      }
      
      showError(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Failed`, `Failed to ${actionText} offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleOfferAction = async (offer: VenueOffer, action: string) => {
    // Add conflict validation for accept action
    if (action === 'accept') {
      const { acceptedBid, acceptedOffer } = checkDateConflict(offer.proposedDate, undefined, offer.id);
      
      if (acceptedBid || acceptedOffer) {
        const conflictVenue = acceptedBid ? acceptedBid.venueName : acceptedOffer?.venueName;
        const conflictType = acceptedBid ? 'bid' : 'offer';
        
        confirm(
          'Date Conflict',
          `You've already accepted ${conflictType === 'bid' ? 'a bid' : 'an offer'} from ${conflictVenue} for this date. Only one booking can be accepted per date. Switch to ${offer.venueName} instead?`,
          async () => {
            // Show loading toast (brief, auto-dismiss)
            toast('info', 'Switching Bookings', `Switching to ${offer.venueName}...`, 2000);
            
            // Optimistic updates for seamless UX
            try {
              // Immediately update UI state
              if (acceptedBid) {
                setBidStatusOverrides(prev => new Map(prev).set(acceptedBid.id, 'pending'));
              }
              setBidStatusOverrides(prev => new Map(prev).set(offer.id, 'accepted'));
              
              // Perform backend updates
              if (acceptedBid) {
                await fetch(`/api/show-requests/${acceptedBid.showRequestId}/bids`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    bidId: acceptedBid.id,
                    action: 'undo-accept',
                    reason: `Reverted - switched to ${offer.venueName} for same date`
                  }),
                });
              }
              
              if (acceptedOffer) {
                await fetch(`/api/venues/${acceptedOffer.venueId}/offers/${acceptedOffer.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'decline',
                    reason: `Switched to ${offer.venueName} for same date`
                  }),
                });
              }
              
              // Accept the new offer
              await fetch(`/api/venues/${offer.venueId}/offers/${offer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'accept'
                }),
              });
              
              // Refresh data to sync backend state
              await fetchData();
              
              // Show success toast (longer, auto-dismiss)
              toast('success', 'Booking Updated', `Now booked with ${offer.venueName}!`, 4000);
            } catch (error) {
              // Revert optimistic updates on error
              setBidStatusOverrides(prev => {
                const newMap = new Map(prev);
                if (acceptedBid) newMap.delete(acceptedBid.id);
                newMap.delete(offer.id);
                return newMap;
              });
              showError('Switch Failed', 'Failed to switch bookings. Please try again.');
            }
          }
        );
        return; // Exit early to wait for user confirmation
      }
    }
    
    // No conflict or not an accept action, proceed with optimistic update
    return proceedWithOfferActionOptimistic(offer, action);
  };

  const getBidStatusBadge = (bid: VenueBid) => {
    const effectiveStatus = getEffectiveBidStatus(bid);
    switch (effectiveStatus) {
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
          text: effectiveStatus
        };
    }
  };

  const handleTemplateApply = (template: any) => {
    setAddDateForm(prev => ({
      ...prev,
      equipment: {
        needsPA: template.equipment?.needsPA ?? prev.equipment.needsPA,
        needsMics: template.equipment?.needsMics ?? prev.equipment.needsMics,
        needsDrums: template.equipment?.needsDrums ?? prev.equipment.needsDrums,
        needsAmps: template.equipment?.needsAmps ?? prev.equipment.needsAmps,
        acoustic: template.equipment?.acoustic ?? prev.equipment.acoustic
      },
      guaranteeRange: {
        min: template.guaranteeRange?.min ?? prev.guaranteeRange?.min ?? 0,
        max: template.guaranteeRange?.max ?? prev.guaranteeRange?.max ?? 0
      },
      acceptsDoorDeals: template.acceptsDoorDeals ?? prev.acceptsDoorDeals,
      merchandising: template.merchandising ?? prev.merchandising,
      ageRestriction: template.ageRestriction ?? prev.ageRestriction,
      travelMethod: template.travelMethod ?? prev.travelMethod,
      lodging: template.lodging ?? prev.lodging,
      technicalRequirements: template.technicalRequirements ?? prev.technicalRequirements,
      hospitalityRequirements: template.hospitalityRequirements ?? prev.hospitalityRequirements,
      priority: template.priority ?? prev.priority,
      notes: template.notes ? `${prev.notes ? prev.notes + '\n\n' : ''}Template: ${template.name}\n${template.notes}` : prev.notes
    }));
  };

  const handleDeleteShowRequest = async (requestId: string, requestName: string) => {
    confirm(
      'Delete Show Request',
      `Delete "${requestName}"? This will also delete all associated bids and cannot be undone.`,
      async () => {
        setDeleteLoading(requestId);
        
        // Optimistic update - immediately hide the request
        setDeletedRequests(prev => new Set([...prev, requestId]));
        
        try {
          const response = await fetch(`/api/show-requests/${requestId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete tour request');
          }

          // Don't call fetchData() to avoid flashing - the optimistic update already handles UI
          showSuccess('Tour Request Deleted', 'Tour request deleted successfully.');
        } catch (error) {
          console.error('Error deleting tour request:', error);
          
          // Revert optimistic update on error
          setDeletedRequests(prev => {
            const newSet = new Set(prev);
            newSet.delete(requestId);
            return newSet;
          });
          
          showError('Deletion Failed', `Failed to delete tour request: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setDeleteLoading(null);
        }
      }
    );
  };

  const handleShowDetailModal = (show: Show) => {
    setSelectedShowForDetail(show);
    setShowDetailModal(true);
  };

  const handleTourRequestDetailModal = (request: TourRequest) => {
    setSelectedTourRequest(request);
    setTourRequestDetailModal(true);
  };

  const handleShowDocumentModal = (show: Show) => {
    setSelectedDocumentShow(show);
    setSelectedDocumentBid(null);
    setSelectedDocumentTourRequest(null);
    setShowDocumentModal(true);
  };

  const handleBidDocumentModal = (bid: VenueBid) => {
    setSelectedDocumentBid(bid);
    setSelectedDocumentShow(null);
    setSelectedDocumentTourRequest(null);
    setShowDocumentModal(true);
  };

  const handleTourRequestDocumentModal = (request: TourRequest) => {
    setSelectedDocumentTourRequest(request);
    setSelectedDocumentShow(null);
    setSelectedDocumentBid(null);
    setShowDocumentModal(true);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6">
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

  if (fetchError) {
    return (
      <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6">
        <div className="text-red-600 text-center">
          <p>Error loading itinerary: {fetchError}</p>
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
    <div className="bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden">
      {/* Header */}
      {showTitle && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {title || (artistId ? 'Show Dates' : 'Booking Calendar')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {filteredShows.length} confirmed show{filteredShows.length !== 1 ? 's' : ''}
                {artistId && filteredTourRequests.length > 0 && (
                  <span> • {filteredTourRequests.length} active show request{filteredTourRequests.length !== 1 ? 's' : ''}</span>
                )}
              </p>
            </div>
            {editable && (
              <button
                onClick={fetchData}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                title="Refresh data to get the latest updates"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            )}
          </div>
        </div>
      )}

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
              <th className="px-2 py-1.5 w-[3%]"></th>
              <th className="px-4 py-1.5 w-[12%]">Date</th>
              <th className="px-4 py-1.5 w-[14%]">Location</th>
              <th className="px-4 py-1.5 w-[19%]">{artistId ? 'Venue' : venueId ? 'Artist' : 'Artist'}</th>
              <th className="px-4 py-1.5 w-[10%]">Status</th>
              <th className="px-4 py-1.5 w-[7%]">Capacity</th>
              <th className="px-4 py-1.5 w-[7%]">Age</th>
              <th className="px-4 py-1.5 w-[10%]">Offers</th>
              <th className="px-4 py-1.5 w-[8%]">details</th>
              <th className="px-4 py-1.5 w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Empty state */}
            {activeMonthEntries.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📅</span>
                  </div>
                  {monthGroups.length === 0 ? (
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
                    <>
                      <p className="mb-2">No shows this month</p>
                      <p className="text-sm">Check other months for upcoming shows</p>
                    </>
                  )}
                </td>
              </tr>
            )}
            
            {/* Render entries for active month */}
            {activeMonthEntries.map((entry) => {
              if (entry.type === 'show') {
                const show = entry.data as Show;
                return (
                  <tr 
                    key={`show-${show.id}`}
                    className="hover:bg-green-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => toggleShowExpansion(show.id)}
                  >
                    <td className="px-2 py-1.5 w-[3%]">
                      <div className="flex items-center justify-center text-gray-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d={expandedShows.has(show.id) ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                        </svg>
                      </div>
                    </td>
                    <td className="px-4 py-1.5 w-[12%]">
                      <ItineraryDate date={show.date} className="text-sm font-medium text-gray-900" />
                    </td>
                    <td className="px-4 py-1.5 w-[14%]">
                      <div className="text-sm text-gray-900 truncate">{show.city}, {show.state}</div>
                    </td>
                    <td className="px-4 py-1.5 w-[19%]">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {(() => {
                          if (artistId) {
                            // For artist pages, show venue as clickable link
                            if (show.venueId && show.venueId !== 'external-venue') {
                              return (
                                <a 
                                  href={`/venues/${show.venueId}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                  title="View venue page"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {show.venueName}
                                </a>
                              );
                            } else {
                              return show.venueName;
                            }
                          } else if (venueId) {
                            // For venue pages, show artist as clickable link
                            if (show.artistId && show.artistId !== 'external-artist') {
                              return (
                                <a 
                                  href={`/artists/${show.artistId}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                  title="View artist page"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {show.artistName}
                                </a>
                              );
                            } else {
                              return show.artistName;
                            }
                          } else {
                            // For public/general view, show artist name
                            if (show.artistId && show.artistId !== 'external-artist') {
                              return (
                                <a 
                                  href={`/artists/${show.artistId}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                  title="View artist page"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {show.artistName}
                                </a>
                              );
                            } else {
                              return show.artistName;
                            }
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-1.5 w-[10%]">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Confirmed
                      </span>
                    </td>
                    <td className="px-4 py-1.5 w-[7%]">
                      <div className="text-xs text-gray-600">{show.capacity}</div>
                    </td>
                    <td className="px-4 py-1.5 w-[7%]">
                      <div className="text-xs text-gray-600">{show.ageRestriction}</div>
                    </td>
                    <td className="px-4 py-1.5 w-[10%]">
                      <InlineOfferDisplay 
                        amount={show.guarantee}
                        doorDeal={show.doorDeal}
                        className="text-xs text-gray-600"
                      />
                    </td>
                    <td className="px-4 py-1.5 w-[8%]">
                      {/* Document icon for confirmed shows - only show if viewer is involved in this show */}
                      {((actualViewerType === 'artist' && artistId && show.artistId === artistId) ||
                        (actualViewerType === 'venue' && venueId && show.venueId === venueId)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowDocumentModal(show);
                          }}
                          className="inline-flex items-center justify-center w-5 h-5 text-green-600 hover:text-green-800 hover:bg-green-200 rounded transition-colors"
                          title="View detailed show information"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      )}
                      {/* Show empty space if viewer not involved in this show */}
                      {!((actualViewerType === 'artist' && artistId && show.artistId === artistId) ||
                        (actualViewerType === 'venue' && venueId && show.venueId === venueId)) && (
                        <div className="w-5 h-5"></div>
                      )}
                    </td>
                    <td className="px-4 py-1.5 w-[10%]">
                      <div className="flex items-center space-x-2">
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
                      </div>
                    </td>
                  </tr>
                );
              } else if (entry.type === 'tour-request') {
                const request = entry.data as TourRequest & { 
                  isVenueInitiated?: boolean; 
                  originalOfferId?: string; 
                  venueInitiatedBy?: string;
                };
                
                // Get bids for this request
                let requestBids: VenueBid[] = [];
                
                // 🎯 ADD TYPE EXTENSION for venue bid properties
                const requestWithVenueBid = request as TourRequest & { 
                  isVenueInitiated?: boolean; 
                  originalOfferId?: string; 
                  venueInitiatedBy?: string;
                  isVenueBid?: boolean;
                  originalBidId?: string;
                  originalShowRequestId?: string;
                  bidStatus?: string;
                  bidAmount?: number;
                };
                
                if (requestWithVenueBid.isVenueInitiated && requestWithVenueBid.originalOfferId) {
                  // For synthetic requests from venue offers, convert the venue offer to a bid format
                  const originalOffer = venueOffers.find(offer => offer.id === requestWithVenueBid.originalOfferId);
                  if (originalOffer) {
                    const bidDate = originalOffer.proposedDate.split('T')[0];
                    
                    const syntheticBid: VenueBid = {
                      id: `offer-bid-${originalOffer.id}`,
                      showRequestId: request.id,
                      venueId: originalOffer.venueId,
                      venueName: originalOffer.venueName || originalOffer.venue?.name || 'Unknown Venue',
                      proposedDate: bidDate,
                      guarantee: originalOffer.amount,
                      doorDeal: originalOffer.doorDeal ? {
                        split: originalOffer.doorDeal.split,
                        minimumGuarantee: originalOffer.doorDeal.minimumGuarantee
                      } : undefined,
                      ticketPrice: originalOffer.ticketPrice || {},
                      capacity: originalOffer.capacity || originalOffer.venue?.capacity || 0,
                      ageRestriction: originalOffer.ageRestriction || 'all-ages',
                      equipmentProvided: originalOffer.equipmentProvided || {
                        pa: false,
                        mics: false,
                        drums: false,
                        amps: false,
                        piano: false
                      },
                      loadIn: originalOffer.loadIn || '',
                      soundcheck: originalOffer.soundcheck || '',
                      doorsOpen: originalOffer.doorsOpen || '',
                      showTime: originalOffer.showTime || '',
                      curfew: originalOffer.curfew || '',
                      promotion: originalOffer.promotion || {
                        social: false,
                        flyerPrinting: false,
                        radioSpots: false,
                        pressCoverage: false
                      },
                      message: originalOffer.message || '',
                      status: originalOffer.status.toLowerCase() as 'pending' | 'hold' | 'accepted' | 'declined' | 'cancelled',
                      readByArtist: true,
                      createdAt: originalOffer.createdAt,
                      updatedAt: originalOffer.updatedAt,
                      expiresAt: originalOffer.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                      location: originalOffer.venue?.location ? 
                        `${originalOffer.venue.location.city}, ${originalOffer.venue.location.stateProvince}` : 
                        undefined,
                      billingPosition: originalOffer.billingPosition,
                      lineupPosition: originalOffer.lineupPosition,
                      setLength: originalOffer.setLength,
                      otherActs: originalOffer.otherActs,
                      billingNotes: originalOffer.billingNotes,
                      artistId: originalOffer.artist?.id,
                      artistName: originalOffer.artist?.name
                    };
                    
                    requestBids = [syntheticBid];
                  }
                } else if (requestWithVenueBid.isVenueBid && requestWithVenueBid.originalShowRequestId) {
                  // 🎯 UPDATED: For synthetic requests from venue bids, use originalShowRequestId to find ALL competing bids
                  // 🎯 COMPETITIVE INTELLIGENCE: Show ALL bids on the original artist request
                  const allBidsOnRequest = venueBids.filter(bid => 
                    bid.showRequestId === requestWithVenueBid.originalShowRequestId && 
                    !declinedBids.has(bid.id)
                  );
                  
                  requestBids = allBidsOnRequest;
                } else {
                  // For regular artist-initiated requests, use normal bid filtering
                  requestBids = venueBids.filter(bid => bid.showRequestId === request.id && !declinedBids.has(bid.id));
                }

                return (
                  <React.Fragment key={`request-${request.id}`}>
                    <tr 
                      className="bg-blue-50 cursor-pointer transition-colors duration-150 hover:bg-blue-100 hover:shadow-sm border-l-4 border-blue-400 hover:border-blue-500"
                      onClick={() => toggleRequestExpansion(request.id)}
                      title={`Click to ${expandedRequests.has(request.id) ? 'hide' : 'view'} bids for this show request`}
                    >
                      <td className="px-2 py-1.5 w-[3%]">
                        <div className="flex items-center justify-center text-gray-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d={expandedRequests.has(request.id) ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                          </svg>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 w-[12%]">
                        <ItineraryDate
                          startDate={request.startDate}
                          endDate={request.endDate}
                          isSingleDate={request.isSingleDate}
                          className="text-sm font-medium text-blue-900"
                        />
                      </td>
                      <td className="px-4 py-1.5 w-[14%]">
                        <div className="text-sm text-blue-900 truncate">{request.location}</div>
                      </td>
                      <td className="px-4 py-1.5 w-[19%]">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {(() => {
                            if (artistId) {
                              // For artist pages, show venue information
                              if (request.isVenueInitiated) {
                                // For venue-initiated offers, show the venue name as clickable link
                                const requestAsVenueRequest = request as TourRequest & { venueId?: string; venueName?: string };
                                if (requestAsVenueRequest.venueId && requestAsVenueRequest.venueId !== 'external-venue') {
                                  return (
                                    <a 
                                      href={`/venues/${requestAsVenueRequest.venueId}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                      title="View venue page"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {requestAsVenueRequest.venueName}
                                    </a>
                                  );
                                } else {
                                  return <span>{requestAsVenueRequest.venueName}</span>;
                                }
                              } else {
                                // For artist-initiated requests, show bid count or venue-specific info
                                // 🎯 NEW: Check if this is a venue-specific request first
                                const requestAsVenueSpecific = request as TourRequest & { 
                                  isVenueSpecific?: boolean; 
                                  venueSpecificId?: string; 
                                  venueSpecificName?: string; 
                                };
                                
                                if (requestAsVenueSpecific.isVenueSpecific && requestAsVenueSpecific.venueSpecificId) {
                                  // This is a venue-specific request - show the venue name as clickable link
                                  return (
                                    <a 
                                      href={`/venues/${requestAsVenueSpecific.venueSpecificId}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                      title="View venue page"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {requestAsVenueSpecific.venueSpecificName}
                                    </a>
                                  );
                                } else if (requestBids.length === 0) {
                                  // Regular artist request with no bids yet
                                  return <span className="text-gray-500 text-sm">No bids yet</span>;
                                } else {
                                  // Show venue information based on bid activity
                                  if (requestBids.length === 1) {
                                    // Show the single venue name as clickable link
                                    const singleBid = requestBids[0];
                                    if (singleBid.venueId && singleBid.venueId !== 'external-venue') {
                                      return (
                                        <a 
                                          href={`/venues/${singleBid.venueId}`}
                                          className="text-blue-600 hover:text-blue-800 hover:underline"
                                          title="View venue page"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {singleBid.venueName}
                                        </a>
                                      );
                                    } else {
                                      return <span>{singleBid.venueName}</span>;
                                    }
                                  } else {
                                    // Show count for multiple competing venues
                                    return (
                                      <span className="text-gray-600 text-sm">
                                        {requestBids.length} competing venues
                                      </span>
                                    );
                                  }
                                }
                              }
                            } else if (venueId) {
                              // For venue pages, show artist as clickable link
                              if (request.artistId && request.artistId !== 'external-artist') {
                                return (
                                  <a 
                                    href={`/artists/${request.artistId}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                    title="View artist page"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {request.artistName}
                                  </a>
                                );
                              } else {
                                return request.artistName;
                              }
                            } else {
                              // For public/general view, show artist name
                              if (request.artistId && request.artistId !== 'external-artist') {
                                return (
                                  <a 
                                    href={`/artists/${request.artistId}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                    title="View artist page"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {request.artistName}
                                  </a>
                                );
                              } else {
                                return request.artistName;
                              }
                            }
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-1.5 w-[10%]">
                        <div className="flex items-center space-x-1">
                          {(() => {
                            // If viewing as a venue, show venue's specific bid status
                            if (venueId && requestBids.length > 0) {
                              const venueBid = requestBids.find(bid => bid.venueId === venueId);
                              if (venueBid) {
                                const statusBadge = getBidStatusBadge(venueBid);
                                return (
                                  <span className={statusBadge.className}>
                                    {statusBadge.text}
                                  </span>
                                );
                              }
                            }
                            
                            // Default logic for artists and venues without bids
                            return (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {requestBids.length > 0 ? 'Bidding' : 'Requested'}
                              </span>
                            );
                          })()}

                        </div>
                      </td>
                      <td className="px-4 py-1.5 w-[7%]">
                      </td>
                      <td className="px-4 py-1.5 w-[7%]">
                      </td>
                      <td className="px-4 py-1.5 w-[10%]">
                        <div className="flex items-center space-x-2">
                          {/* Show bid count as "what's on offer" in terms of interest/competition */}
                          <div className="text-xs">
                            <span className={requestBids.length > 0 ? "text-blue-600 font-medium" : "text-gray-400"}>
                              {requestBids.length} bid{requestBids.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {/* 🎯 UX IMPROVEMENT: Removed Make Offer button - moved to Actions column for consistency */}
                        </div>
                      </td>
                      <td className="px-4 py-1.5 w-[8%]">
                        {/* Document icon for tour requests - show ONLY for venues with bids on this request */}
                        {(actualViewerType === 'venue' && requestBids.some(bid => bid.venueId === venueId)) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // For venues, pass their specific bid to the document modal
                              const venueBid = requestBids.find(bid => bid.venueId === venueId);
                              if (venueBid) {
                                handleBidDocumentModal(venueBid);
                              } else {
                                handleTourRequestDocumentModal(request);
                              }
                            }}
                            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded transition-colors"
                            title="View show document for your bid"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}
                        {/* Show empty space if viewer not involved in this request */}
                        {!(actualViewerType === 'venue' && requestBids.some(bid => bid.venueId === venueId)) && (
                          <div className="w-5 h-5"></div>
                        )}
                      </td>
                      <td className="px-4 py-1.5 w-[10%]">
                        <div className="flex items-center space-x-2">
                          {/* 🎯 UX IMPROVEMENT: Consistent offer action placement */}
                          {actualViewerType === 'venue' && 
                           canMakeOffers && 
                           shouldShowOfferButton(request) && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setOfferTargetArtist({
                                    id: request.artistId,
                                    name: request.artistName
                                  });
                                  setOfferTourRequest({
                                    id: request.id,
                                    title: request.title,
                                    artistName: request.artistName
                                  });
                                  // 🎯 UX FIX: Set the preSelectedDate directly from the request's startDate
                                  setOfferPreSelectedDate(request.startDate);
                                  
                                  // 🎯 UX FIX: Determine existing bid immediately - no async detection
                                  const existingBid = requestBids.find(bid => bid.venueId === venueId);
                                  // 🎯 BUG FIX: Map guarantee field to amount field for OfferFormCore compatibility
                                  const mappedExistingBid = existingBid ? {
                                    ...existingBid,
                                    amount: existingBid.guarantee // Map guarantee to amount for OfferFormCore
                                  } : null;
                                  setOfferExistingBid(mappedExistingBid);
                                  
                                  setShowUniversalOfferModal(true);
                                }}
                                className="inline-flex items-center justify-center border rounded-lg font-medium transition-colors duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 px-3 py-1 text-xs bg-white text-blue-600 hover:bg-blue-50 border-blue-600 focus:ring-blue-500 whitespace-nowrap"
                              >
                                {requestBids.find(bid => bid.venueId === venueId) ? "Edit Offer" : "Make Offer"}
                              </button>
                            </div>
                          )}

                          {/* 🎯 UX IMPROVEMENT: Keep delete button for all other cases */}
                          {editable && !(actualViewerType === 'venue' && !request.isVenueInitiated) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (actualViewerType === 'artist') {
                                  // Artist: decline offer or delete request
                                  if (request.isVenueInitiated && request.originalOfferId) {
                                    const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
                                    if (originalOffer) {
                                      handleOfferAction(originalOffer, 'decline');
                                    }
                                  } else {
                                    handleDeleteShowRequest(request.id, request.title);
                                  }
                                } else if (actualViewerType === 'venue') {
                                  // Venue: cancel offer, withdraw bid, or delete request
                                  if (request.originalOfferId) {
                                    // Cancel venue-initiated offer
                                    const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
                                    if (originalOffer) {
                                      handleOfferAction(originalOffer, 'decline');
                                    }
                                  } else if (requestWithVenueBid.isVenueBid && requestWithVenueBid.originalBidId) {
                                    // Withdraw venue bid
                                    const lostBagBid = venueBids.find(bid => 
                                      bid.showRequestId === requestWithVenueBid.originalShowRequestId && 
                                      bid.venueId === venueId
                                    );
                                    if (lostBagBid) {
                                      confirm(
                                        'Withdraw Bid',
                                        `Withdraw your bid for ${request.artistName}? This will remove this request from your timeline.`,
                                        async () => {
                                          try {
                                            setDeletedRequests(prev => new Set([...prev, request.id]));
                                            const response = await fetch(`/api/show-requests/${lostBagBid.showRequestId}/bids`, {
                                              method: 'DELETE',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ bidId: lostBagBid.id }),
                                            });
                                            if (!response.ok) throw new Error('Failed to withdraw bid');
                                            showSuccess('Bid Withdrawn', 'Your bid has been withdrawn and removed from your timeline.');
                                          } catch (error) {
                                            console.error('Error withdrawing bid:', error);
                                            setDeletedRequests(prev => {
                                              const newSet = new Set(prev);
                                              newSet.delete(request.id);
                                              return newSet;
                                            });
                                            showError('Withdrawal Failed', 'Failed to withdraw bid. Please try again.');
                                          }
                                        }
                                      );
                                    }
                                  } else {
                                    // Delete regular request
                                    handleDeleteShowRequest(request.id, request.title);
                                  }
                                }
                              }}
                              disabled={deleteLoading === request.id}
                              className="inline-flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              title={(() => {
                                if (actualViewerType === 'artist') {
                                  return request.isVenueInitiated ? "Decline venue offer" : "Delete tour request";
                                } else if (actualViewerType === 'venue') {
                                  if (request.originalOfferId) return "Cancel offer";
                                  if (requestWithVenueBid.isVenueBid) return "Withdraw bid";
                                  return "Delete request";
                                }
                                return "Delete";
                              })()}
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
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Bids Section */}
                    {expandedRequests.has(request.id) && (
                      <>
                        {requestBids.length > 0 && (
                          <tr>
                            <td colSpan={10} className="px-0 py-0">
                              <div className="bg-yellow-50 border-l-4 border-yellow-400">
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[1000px] table-fixed">
                                    <thead className="bg-yellow-100">
                                      <tr className="text-left text-xs font-medium text-yellow-700">
                                        <th className="px-2 py-1.5 w-[3%]"></th>
                                        <th className="px-4 py-1.5 w-[12%]">Date</th>
                                        <th className="px-4 py-1.5 w-[14%]">Location</th>
                                        <th className="px-4 py-1.5 w-[19%]">Venue</th>
                                        <th className="px-4 py-1.5 w-[10%]">Status</th>
                                        <th className="px-4 py-1.5 w-[7%]">Capacity</th>
                                        <th className="px-4 py-1.5 w-[7%]">Age</th>
                                        <th className="px-4 py-1.5 w-[10%]">Offers</th>
                                        <th className="px-4 py-1.5 w-[8%]">Details</th>
                                        <th className="px-4 py-1.5 w-[10%]">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-yellow-200">
                                      {requestBids
                                        .filter((bid: VenueBid) => {
                                          return !['expired', 'declined', 'rejected'].includes(bid.status) && !declinedBids.has(bid.id);
                                        })
                                        .map((bid: VenueBid) => (
                                        <tr key={`bid-${bid.id}`} className="bg-yellow-50 hover:bg-yellow-100 transition-colors duration-150">
                                          <td className="px-2 py-1.5 w-[3%]"></td>
                                          <td className="px-4 py-1.5 w-[12%]">
                                            <ItineraryDate
                                              date={bid.proposedDate}
                                              className="text-sm font-medium text-yellow-900"
                                            />
                                          </td>
                                          <td className="px-4 py-1.5 w-[14%]">
                                            <div className="text-sm text-yellow-900 truncate">
                                              {bid.location || '-'}
                                            </div>
                                          </td>
                                          <td className="px-4 py-1.5 w-[19%]">
                                            <div className="flex items-center space-x-2">
                                              <div className="text-sm font-medium text-yellow-900 truncate">
                                                {bid.venueId && bid.venueId !== 'external-venue' ? (
                                                  <a 
                                                    href={`/venues/${bid.venueId}`}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                    title="View venue page"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    {bid.venueName}
                                                  </a>
                                                ) : (
                                                  bid.venueName
                                                )}
                                              </div>
                                              {bid.message && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    alert(bid.message);
                                                  }}
                                                  className="inline-flex items-center justify-center w-5 h-5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
                                                  title={bid.message}
                                                >
                                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                  </svg>
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-4 py-1.5 w-[10%]">
                                            <span className={getBidStatusBadge(bid).className}>
                                              {getBidStatusBadge(bid).text}
                                            </span>
                                          </td>
                                          <td className="px-4 py-1.5 w-[7%]">
                                            <div className="text-xs text-gray-600">{bid.capacity}</div>
                                          </td>
                                          <td className="px-4 py-1.5 w-[7%]">
                                            <div className="text-xs text-gray-600">
                                              {bid.ageRestriction === 'ALL_AGES' ? 'all-ages' : 
                                               bid.ageRestriction === 'EIGHTEEN_PLUS' ? '18+' : 
                                               bid.ageRestriction === 'TWENTY_ONE_PLUS' ? '21+' : 
                                               bid.ageRestriction === '18_PLUS' ? '18+' : 
                                               bid.ageRestriction === '21_PLUS' ? '21+' : 
                                               bid.ageRestriction?.toLowerCase().replace('_', '-') || 'all-ages'}
                                            </div>
                                          </td>
                                          <td className="px-4 py-1.5 w-[10%]">
                                            <InlineOfferDisplay 
                                              amount={bid.guarantee}
                                              doorDeal={bid.doorDeal}
                                              className="text-xs text-gray-600"
                                            />
                                          </td>
                                          <td className="px-4 py-1.5 w-[8%]">
                                            {/* Document icon for individual bids - show ONLY for artists viewing their requests */}
                                            {(actualViewerType === 'artist' && artistId && request.artistId === artistId) && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleBidDocumentModal(bid);
                                                }}
                                                className="inline-flex items-center justify-center w-5 h-5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-200 rounded transition-colors"
                                                title="View detailed bid information"
                                              >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                              </button>
                                            )}
                                          </td>
                                          <td className="px-4 py-1.5 w-[10%]">
                                            <div className="flex items-center space-x-0.5 flex-wrap">
                                              {actualViewerType === 'artist' && (
                                                <>
                                                  {getEffectiveBidStatus(bid) === 'pending' && (
                                                    <>
                                                      <button
                                                        onClick={() => {
                                                          if (request.isVenueInitiated && request.originalOfferId) {
                                                            const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
                                                            if (originalOffer) {
                                                              handleOfferAction(originalOffer, 'accept');
                                                            }
                                                          } else {
                                                            handleBidAction(bid, 'accept');
                                                          }
                                                        }}
                                                        disabled={bidActions[bid.id]}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                        title="Accept this bid"
                                                      >
                                                        ✓
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          if (!request.isVenueInitiated) {
                                                            handleBidAction(bid, 'hold');
                                                          }
                                                        }}
                                                        disabled={bidActions[bid.id] || request.isVenueInitiated}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                                                        title={request.isVenueInitiated ? "Hold not available for offers" : "Place on hold"}
                                                        style={{ opacity: request.isVenueInitiated ? 0.3 : 1 }}
                                                      >
                                                        ⏸
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          if (request.isVenueInitiated && request.originalOfferId) {
                                                            const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
                                                            if (originalOffer) {
                                                              handleOfferAction(originalOffer, 'decline');
                                                            }
                                                          } else {
                                                            handleBidAction(bid, 'decline');
                                                          }
                                                        }}
                                                        disabled={bidActions[bid.id]}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                        title="Decline this bid"
                                                      >
                                                        ✕
                                                      </button>
                                                    </>
                                                  )}

                                                  {getEffectiveBidStatus(bid) === 'hold' && (
                                                    <>
                                                      <button
                                                        onClick={() => {
                                                          if (request.isVenueInitiated && request.originalOfferId) {
                                                            const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
                                                            if (originalOffer) {
                                                              handleOfferAction(originalOffer, 'accept');
                                                            }
                                                          } else {
                                                            handleBidAction(bid, 'accept');
                                                          }
                                                        }}
                                                        disabled={bidActions[bid.id]}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                        title="Accept this bid"
                                                      >
                                                        ✓
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          if (request.isVenueInitiated && request.originalOfferId) {
                                                            const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
                                                            if (originalOffer) {
                                                              handleOfferAction(originalOffer, 'decline');
                                                            }
                                                          } else {
                                                            handleBidAction(bid, 'decline');
                                                          }
                                                        }}
                                                        disabled={bidActions[bid.id]}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                        title="Decline this bid"
                                                      >
                                                        ✕
                                                      </button>
                                                    </>
                                                  )}

                                                  {getEffectiveBidStatus(bid) === 'accepted' && (
                                                    <>
                                                      <button
                                                        onClick={() => {
                                                          if (!request.isVenueInitiated) {
                                                            handleBidAction(bid, 'undo-accept');
                                                          }
                                                        }}
                                                        disabled={bidActions[bid.id] || request.isVenueInitiated}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-colors"
                                                        title={request.isVenueInitiated ? "Undo not available for offers" : "Undo acceptance - return to pending"}
                                                        style={{ opacity: request.isVenueInitiated ? 0.3 : 1 }}
                                                      >
                                                        ↶
                                                      </button>
                                                    </>
                                                  )}
                                                </>
                                              )}
                                              
                                              {/* Edit Offer button removed - now available in main actions column for better discoverability */}
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
            
            {/* Add Date Row */}
            {monthGroups.length === 0 && editable && (
              <tr>
                <td colSpan={10} className="px-6 py-3">
                  <button
                    onClick={() => {
                      if (artistId) {
                        setAddDateForm(prev => ({ ...prev, type: 'request' }));
                      } else if (venueId) {
                        setAddDateForm(prev => ({ ...prev, type: 'offer' }));
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
                setAddDateForm(prev => ({ ...prev, type: 'request' }));
              } else if (venueId) {
                setAddDateForm(prev => ({ ...prev, type: 'offer' }));
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

      {/* All the modals from original component */}
      
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

      {/* Show Detail Modal */}
      {showDetailModal && selectedShowForDetail && (
        <ShowDetailModal
          show={selectedShowForDetail}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedShowForDetail(null);
          }}
          viewerType={actualViewerType}
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
          viewerType={actualViewerType}
        />
      )}

      {/* Show Document Modal */}
      {showDocumentModal && (
        <ShowDocumentModal
          show={selectedDocumentShow || undefined}
          bid={selectedDocumentBid || undefined}
          tourRequest={selectedDocumentTourRequest || undefined}
          isOpen={showDocumentModal}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedDocumentShow(null);
            setSelectedDocumentBid(null);
            setSelectedDocumentTourRequest(null);
          }}
          viewerType={actualViewerType}
          onUpdate={(data) => {
            console.log('Document updated:', data);
            fetchData();
          }}
        />
      )}

      {/* Universal Make Offer Modal */}
      {showUniversalOfferModal && (
        <UniversalMakeOfferModal
          isOpen={showUniversalOfferModal}
          onClose={() => {
            setShowUniversalOfferModal(false);
            setOfferTargetArtist(null);
            setOfferTourRequest(null);
            setOfferPreSelectedDate(null);
            setOfferExistingBid(null);
          }}
          onSuccess={(result) => {
            console.log('Offer/dismissal result:', result);
            
            // Handle dismissal by removing from local state
            if (result.dismissed && result.requestId) {
              setDeletedRequests(prev => new Set([...prev, result.requestId]));
            }
            
            fetchData();
          }}
          preSelectedArtist={offerTargetArtist || undefined}
          preSelectedDate={offerPreSelectedDate || undefined}
          tourRequest={offerTourRequest || undefined}
          existingBid={offerExistingBid || undefined}
        />
      )}

      {/* Add Date Form Modal */}
      {showAddDateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          {addDateForm.type === 'offer' && venueId && venueName ? (
            // Use OfferFormCore for consistent offer experience
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <OfferFormCore
                venueId={venueId}
                venueName={venueName}
                onSubmit={async (formData: any) => {
                  try {
                    const legacyOffer = parsedOfferToLegacyFormat(formData.offerData);
                    const [year, month, day] = formData.proposedDate.split('-').map(Number);
                    const dateForTitle = new Date(year, month - 1, day);
                    
                    const requestBody: any = {
                      artistId: formData.artistId,
                      venueId: venueId,
                      title: `${formData.artistName} - ${dateForTitle.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${venueName}`,
                      requestedDate: formData.proposedDate,
                      initiatedBy: 'VENUE',
                      capacity: formData.capacity,
                      ageRestriction: formData.ageRestriction,
                      message: formData.message.trim() || `Hey! We'd love to have you play at ${venueName}. We think you'd be a great fit for our space and audience. Let us know if you're interested!`,
                    };

                    if (legacyOffer.amount !== null && legacyOffer.amount !== undefined) {
                      requestBody.amount = legacyOffer.amount;
                    }
                    if (legacyOffer.doorDeal !== null && legacyOffer.doorDeal !== undefined) {
                      requestBody.doorDeal = legacyOffer.doorDeal;
                    }
                    
                    const response = await fetch('/api/show-requests', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(requestBody),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result.error || 'Failed to create offer');
                    }
                    
                    setShowAddDateForm(false);
                    await fetchData();
                  } catch (error) {
                    console.error('Error creating venue offer:', error);
                    throw error;
                  }
                }}
                onCancel={() => setShowAddDateForm(false)}
                confirm={confirm}
                title="Make Offer to Artist"
                subtitle="Invite a specific artist to play at your venue on this date"
                submitButtonText="Send Offer"
              />
            </div>
          ) : (
            // Use UnifiedShowRequestForm for requests and confirmed shows
            <UnifiedShowRequestForm
              formType={addDateForm.type}
              artistId={artistId}
              artistName={artistName}
              venueId={venueId}
              venueName={venueName}
              onSubmit={async (formData: any) => {
                try {
                  if (addDateForm.type === 'confirmed') {
                    // Handle confirmed shows
                    let showTitle = formData.title.trim();
                    if (!showTitle) {
                      if (artistId && formData.venueName) {
                        showTitle = `${artistName} at ${formData.venueName}`;
                      } else if (venueId && formData.artistName) {
                        showTitle = `${formData.artistName} at ${venueName}`;
                      } else {
                        showTitle = `Show on ${new Date(formData.date).toLocaleDateString()}`;
                      }
                    }

                    const showData = {
                      date: formData.date,
                      title: showTitle,
                      notes: formData.description?.trim() || undefined,
                      status: 'confirmed',
                      createdBy: artistId ? 'artist' : 'venue',
                      guarantee: formData.guarantee ? parseInt(formData.guarantee) : undefined,
                      ageRestriction: formData.ageRestriction,
                      doorsOpen: formData.doorsOpen || undefined,
                      showTime: formData.showTime || undefined,
                    };

                    if (artistId) {
                      if (!formData.venueName?.trim()) {
                        throw new Error('Please enter a venue name.');
                      }
                      
                      Object.assign(showData, {
                        artistId: artistId,
                        artistName: artistName,
                        venueId: formData.venueId || 'external-venue',
                        venueName: formData.venueName.trim(),
                        city: formData.location.split(',')[0]?.trim() || formData.venueName.split(',')[0]?.trim() || 'Unknown',
                        state: formData.location.split(',')[1]?.trim() || formData.venueName.split(',')[1]?.trim() || 'Unknown'
                      });
                    } else if (venueId) {
                      if (!formData.artistName?.trim()) {
                        throw new Error('Please enter an artist name.');
                      }
                      
                      Object.assign(showData, {
                        artistId: formData.artistId || 'external-artist',
                        artistName: formData.artistName.trim(),
                        venueId: venueId,
                        venueName: venueName,
                        city: formData.location.split(',')[0]?.trim() || 'Unknown',
                        state: formData.location.split(',')[1]?.trim() || 'Unknown'
                      });
                    }

                    const response = await fetch('/api/shows', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(showData),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result.error || 'Failed to create show');
                    }
                  } else if (addDateForm.type === 'request') {
                    // Handle show requests
                    const title = formData.title.trim() || `${artistName} Show Request`;

                    const showRequestData: any = {
                      artistId: artistId,
                      title: title,
                      description: formData.description,
                      requestedDate: formData.requestDate,
                      initiatedBy: 'ARTIST',
                      targetLocations: [formData.location],
                      genres: []
                    };

                    const response = await fetch('/api/show-requests', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(showRequestData),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result.error || 'Failed to create show request');
                    }
                  }

                  setShowAddDateForm(false);
                  await fetchData();
                } catch (error) {
                  console.error('Error in form submission:', error);
                  throw error; // Re-throw so UnifiedShowRequestForm can handle it
                }
              }}
              onCancel={() => setShowAddDateForm(false)}
              loading={addDateLoading}
            />
          )}
        </div>
      )}

      {/* Render the Alert Modal */}
      {AlertModal}
    </div>
  );
} 
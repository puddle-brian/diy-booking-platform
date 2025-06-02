'use client';

import React, { useState, useEffect } from 'react';
import { Show, TourRequest } from '../../types';
import { TechnicalRequirement, HospitalityRequirement } from '../../types/templates';
import VenueBidForm from './VenueBidForm';
import ShowDetailModal from './ShowDetailModal';
import TourRequestDetailModal from './TourRequestDetailModal';
import TemplateSelector from './TemplateSelector';
import TemplateFormRenderer from './TemplateFormRenderer';
import LocationAutocomplete from './LocationAutocomplete';
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
  const { AlertModal, confirm, error: showError, success: showSuccess, info: showInfo } = useAlert();

  // Use editable prop to determine if user has permissions
  const actualViewerType = viewerType !== 'public' ? viewerType : 
    (editable && artistId) ? 'artist' : 
    (editable && venueId) ? 'venue' : 
    'public';

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

  // 🎯 REFACTORED: Timeline creation using utility functions
  const filteredShows = shows.filter(show => !deletedShows.has(show.id));
  const filteredTourRequests = tourRequests.filter(request => !deletedRequests.has(request.id));
  // Filter venue offers - exclude offers whose synthetic request IDs are in deletedRequests
  const filteredVenueOffers = venueOffers.filter(offer => {
    const syntheticRequestId = `venue-offer-${offer.id}`;
    return !deletedRequests.has(syntheticRequestId);
  });
  const timelineEntries = createTimelineEntries(filteredShows, filteredTourRequests, filteredVenueOffers, artistId);
  const monthGroups = groupEntriesByMonth(timelineEntries);

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
  const handleBidAction = async (bid: VenueBid, action: string, reason?: string) => {
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

  const handleOfferAction = async (offer: VenueOffer, action: string) => {
    const actionText = action === 'accept' ? 'accept' : action === 'decline' ? 'decline' : action;
    
    // Optimistic update for decline action to avoid flashing
    if (action === 'decline') {
      // Find and hide the synthetic tour request for this offer
      const syntheticRequestId = `venue-offer-${offer.id}`;
      setDeletedRequests(prev => new Set([...prev, syntheticRequestId]));
    }
    
    try {
      const response = await fetch(`/api/show-requests/${offer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionText} offer`);
      }

      // Only refetch data for non-decline actions
      if (action !== 'decline') {
        await fetchData();
      }
      
      if (action === 'decline') {
        showSuccess('Offer Declined', 'The venue offer has been removed from your itinerary.');
      }
    } catch (error) {
      console.error(`Error ${actionText}ing offer:`, error);
      
      // Revert optimistic update on error
      if (action === 'decline') {
        const syntheticRequestId = `venue-offer-${offer.id}`;
        setDeletedRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(syntheticRequestId);
          return newSet;
        });
      }
      
      showError(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Failed`, `Failed to ${actionText} offer. Please try again.`);
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
              <th className="px-4 py-1.5 w-[19%]">{venueId ? 'Artist' : artistId ? 'Venue' : 'Artist'}</th>
              <th className="px-4 py-1.5 w-[10%]">Status</th>
              <th className="px-4 py-1.5 w-[7%]">Capacity</th>
              <th className="px-4 py-1.5 w-[7%]">Age</th>
              <th className="px-4 py-1.5 w-[10%]">Offers</th>
              <th className="px-4 py-1.5 w-[8%]">Bids</th>
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
                        {artistId ? show.venueName : show.artistName}
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
                
                if (request.isVenueInitiated && request.originalOfferId) {
                  // For synthetic requests, convert the venue offer to a bid format
                  const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
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
                      billingNotes: originalOffer.billingNotes
                    };
                    
                    requestBids = [syntheticBid];
                  }
                } else {
                  // For regular requests, use normal bid filtering
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
                        <div className="text-sm font-medium text-blue-900 truncate">
                          {(() => {
                            if (venueId) {
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
                              const bidCount = requestBids.length;
                              
                              if (bidCount === 0) {
                                return (
                                  <span className="text-gray-600">
                                    Seeking venues
                                  </span>
                                );
                              } else if (bidCount === 1) {
                                return (
                                  <span className="text-blue-600 font-medium">
                                    1 venue interested
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-green-600 font-medium">
                                    {bidCount} venues interested
                                  </span>
                                );
                              }
                            }
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-1.5 w-[10%]">
                        <div className="flex items-center space-x-1">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Requested
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTourRequestDocumentModal(request);
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
                      <td className="px-4 py-1.5 w-[7%]">
                      </td>
                      <td className="px-4 py-1.5 w-[7%]">
                      </td>
                      <td className="px-4 py-1.5 w-[10%]">
                      </td>
                      <td className="px-4 py-1.5 w-[8%]">
                        <div className="text-xs">
                          <span className={requestBids.length > 0 ? "text-blue-600 font-medium" : "text-gray-400"}>
                            {requestBids.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 w-[10%]">
                        <div className="flex items-center space-x-2">
                          {actualViewerType === 'artist' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (request.isVenueInitiated && request.originalOfferId) {
                                  const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
                                  if (originalOffer) {
                                    handleOfferAction(originalOffer, 'decline');
                                  }
                                } else {
                                  handleDeleteShowRequest(request.id, request.title);
                                }
                              }}
                              disabled={deleteLoading === request.id}
                              className="inline-flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              title={request.isVenueInitiated ? "Decline venue offer" : "Delete tour request"}
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

                          {actualViewerType === 'venue' && request.isVenueInitiated && venueId === request.venueInitiatedBy && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (request.originalOfferId) {
                                  const originalOffer = venueOffers.find(offer => offer.id === request.originalOfferId);
                                  if (originalOffer) {
                                    handleOfferAction(originalOffer, 'cancel');
                                  }
                                }
                              }}
                              disabled={deleteLoading === request.id}
                              className="inline-flex items-center justify-center w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              title="Cancel offer"
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

                          {actualViewerType === 'venue' && (
                            <MakeOfferButton
                              targetArtist={{
                                id: request.artistId,
                                name: request.artistName
                              }}
                              preSelectedDate={request.startDate}
                              variant="outline"
                              size="xs"
                              onSuccess={() => fetchData()}
                            >
                              Make Offer
                            </MakeOfferButton>
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
                                        <th className="px-4 py-1.5 w-[8%]">Bids</th>
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
                                          </td>
                                          <td className="px-4 py-1.5 w-[10%]">
                                            <div className="flex items-center space-x-0.5 flex-wrap">
                                              {actualViewerType === 'artist' && (
                                                <>
                                                  {bid.status === 'pending' && (
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

                                                  {bid.status === 'hold' && (
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

                                                  {bid.status === 'accepted' && (
                                                    <>
                                                      <button
                                                        onClick={() => {
                                                          confirm(
                                                            'Undo Acceptance',
                                                            'Undo acceptance and return this bid to pending status? The venue will be notified.',
                                                            () => {
                                                              if (!request.isVenueInitiated) {
                                                                handleBidAction(bid, 'undo-accept');
                                                              }
                                                            }
                                                          );
                                                        }}
                                                        disabled={bidActions[bid.id] || request.isVenueInitiated}
                                                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-colors"
                                                        title={request.isVenueInitiated ? "Undo not available for offers" : "Undo acceptance - return to pending"}
                                                        style={{ opacity: request.isVenueInitiated ? 0.3 : 1 }}
                                                      >
                                                        ↶
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
          }}
          onSuccess={(offer) => {
            console.log('Offer created successfully:', offer);
            fetchData();
          }}
          preSelectedArtist={offerTargetArtist || undefined}
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
                title="Make Offer to Artist"
                subtitle="Invite a specific artist to play at your venue on this date"
                submitButtonText="Send Offer"
              />
            </div>
          ) : (
            // Basic add date form for requests and confirmed shows
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add Date
                  </h3>
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
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                
                if (addDateLoading) return;

                try {
                  setAddDateLoading(true);

                  if (addDateForm.type === 'confirmed') {
                    if (!addDateForm.date) {
                      alert('Please select a date for the show.');
                      return;
                    }

                    let showTitle = addDateForm.title.trim();
                    if (!showTitle) {
                      if (artistId && addDateForm.venueName) {
                        showTitle = `${artistName} at ${addDateForm.venueName}`;
                      } else if (venueId && addDateForm.artistName) {
                        showTitle = `${addDateForm.artistName} at ${venueName}`;
                      } else {
                        showTitle = `Show on ${new Date(addDateForm.date).toLocaleDateString()}`;
                      }
                    }

                    const showData = {
                      date: addDateForm.date,
                      title: showTitle,
                      notes: addDateForm.notes.trim() || undefined,
                      status: 'confirmed',
                      createdBy: artistId ? 'artist' : 'venue',
                      guarantee: addDateForm.guarantee ? parseInt(addDateForm.guarantee) : undefined,
                      ageRestriction: addDateForm.ageRestriction,
                      loadIn: addDateForm.loadIn || undefined,
                      soundcheck: addDateForm.soundcheck || undefined,
                      doorsOpen: addDateForm.doorsOpen || undefined,
                      showTime: addDateForm.showTime || undefined,
                      curfew: addDateForm.curfew || undefined,
                      acceptsDoorDeals: addDateForm.acceptsDoorDeals,
                      merchandising: addDateForm.merchandising,
                      travelMethod: addDateForm.travelMethod,
                      lodging: addDateForm.lodging,
                      technicalRequirements: addDateForm.technicalRequirements,
                      hospitalityRequirements: addDateForm.hospitalityRequirements,
                      equipment: addDateForm.equipment
                    };

                    if (artistId) {
                      if (!addDateForm.venueName.trim()) {
                        alert('Please enter a venue name.');
                        return;
                      }
                      
                      Object.assign(showData, {
                        artistId: artistId,
                        artistName: artistName,
                        venueId: addDateForm.venueId || 'external-venue',
                        venueName: addDateForm.venueName.trim(),
                        city: addDateForm.location.split(',')[0]?.trim() || addDateForm.venueName.split(',')[0]?.trim() || 'Unknown',
                        state: addDateForm.location.split(',')[1]?.trim() || addDateForm.venueName.split(',')[1]?.trim() || 'Unknown'
                      });
                    } else if (venueId) {
                      if (!addDateForm.artistName.trim()) {
                        alert('Please enter an artist name.');
                        return;
                      }
                      
                      Object.assign(showData, {
                        artistId: addDateForm.artistId || 'external-artist',
                        artistName: addDateForm.artistName.trim(),
                        venueId: venueId,
                        venueName: venueName,
                        city: addDateForm.location.split(',')[0]?.trim() || 'Unknown',
                        state: addDateForm.location.split(',')[1]?.trim() || 'Unknown'
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

                    setShowAddDateForm(false);
                    await fetchData();
                    return;
                  }

                  if (addDateForm.type === 'request') {
                    if (addDateForm.useSingleDate) {
                      if (!addDateForm.requestDate || !addDateForm.location) {
                        alert('Please fill in all required fields for the show request.');
                        return;
                      }
                    } else {
                      if (!addDateForm.startDate || !addDateForm.endDate || !addDateForm.location) {
                        alert('Please fill in all required fields for the show request.');
                        return;
                      }
                    }

                    const title = addDateForm.title.trim() || `${artistName} Show Request`;

                    const showRequestData: any = {
                      artistId: artistId,
                      title: title,
                      description: addDateForm.description,
                      requestedDate: addDateForm.useSingleDate ? addDateForm.requestDate : addDateForm.startDate,
                      initiatedBy: 'ARTIST',
                      targetLocations: [addDateForm.location],
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

                    setShowAddDateForm(false);
                    await fetchData();
                    return;
                  }
                  
                } catch (error) {
                  console.error('Error in form submission:', error);
                  alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                  setAddDateLoading(false);
                }
              }} className="px-6 py-4 space-y-6">
                {/* Type Selection */}
                {((artistId && actualViewerType === 'artist') || (venueId && actualViewerType === 'venue')) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      required
                      value={addDateForm.type}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, type: e.target.value as 'request' | 'confirmed' | 'offer' }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {artistId && (
                        <>
                          <option value="request">Request (looking for venues)</option>
                          <option value="confirmed">Confirmed (already booked)</option>
                        </>
                      )}
                      {venueId && (
                        <>
                          <option value="offer">Make Offer (invite specific artist)</option>
                          <option value="confirmed">Confirmed Show (already booked)</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {/* Date inputs based on type */}
                {addDateForm.type === 'request' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Show Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={addDateForm.requestDate}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, requestDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Show Date *
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
                )}

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

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={addDateForm.title}
                    onChange={(e) => setAddDateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Leave blank to auto-generate"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

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
                    {addDateLoading ? 'Adding...' : 
                     addDateForm.type === 'request' ? 'Create Show Request' :
                     addDateForm.type === 'offer' ? 'Send Offer' :
                     'Add to Calendar'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Render the Alert Modal */}
      {AlertModal}
    </div>
  );
} 
'use client';

import React, { useState, useEffect } from 'react';
import { Show, TourRequest, VenueBid } from '../../types';
import TemplateFormRenderer from './TemplateFormRenderer';
import TemplateSelector from './TemplateSelector';
import { InlineOfferDisplay } from './OfferDisplay';

interface ShowDocumentModalProps {
  show?: Show;
  bid?: VenueBid;
  tourRequest?: TourRequest;
  isOpen: boolean;
  onClose: () => void;
  viewerType: 'artist' | 'venue' | 'public';
  onUpdate?: (data: any) => void;
}

interface DocumentSection {
  id: string;
  title: string;
  owner: 'artist' | 'venue' | 'shared';
  status: 'draft' | 'proposed' | 'committed' | 'locked';
  data: any;
  canEdit: boolean;
}

export default function ShowDocumentModal({
  show,
  bid,
  tourRequest,
  isOpen,
  onClose,
  viewerType,
  onUpdate
}: ShowDocumentModalProps) {
  const [documentData, setDocumentData] = useState<any>({});
  const [sections, setSections] = useState<DocumentSection[]>([]);

  // Initialize document data from show, bid, or tour request
  useEffect(() => {
    console.log('🎯 ShowDocumentModal: Initializing with data:', { show, bid, tourRequest });
    
    if (show) {
      // Confirmed show - populate from show data
      setDocumentData({
        // Basic info
        title: `${show.artistName} at ${show.venueName}`,
        date: show.date,
        artistName: show.artistName,
        venueName: show.venueName,
        
        // Venue details
        location: `${show.city}, ${show.state}`,
        capacity: show.capacity,
        ageRestriction: show.ageRestriction,
        
        // Financial terms
        guarantee: show.guarantee,
        doorDeal: show.doorDeal,
        
        // Show timeline
        loadIn: show.loadIn,
        soundcheck: show.soundcheck,
        doorsOpen: show.doorsOpen,
        showTime: show.showTime,
        curfew: show.curfew,
        
        // Billing order
        billingOrder: show.billingOrder,
        
        // Technical requirements (Show interface doesn't have these, so use empty defaults)
        technicalRequirements: [],
        hospitalityRequirements: [],
        equipment: {},
        
        // Notes
        notes: show.notes
      });
      
      // For confirmed shows, use the same 3-module structure
      setSections([
        {
          id: 'venue-offer',
          title: 'Show Details & Terms',
          owner: 'shared',
          status: 'committed',
          data: { 
            // Basic show info
            venueName: show.venueName,
            location: `${show.city}, ${show.state}`,
            capacity: show.capacity,
            ageRestriction: show.ageRestriction,
            date: show.date,
            
            // Financial terms
            guarantee: show.guarantee,
            doorDeal: show.doorDeal,
            
            // Billing info
            billingOrder: show.billingOrder,
            
            // Notes
            notes: show.notes
          },
          canEdit: viewerType !== 'public'
        },
        {
          id: 'artist-requirements',
          title: 'Artist Requirements & Rider',
          owner: 'artist',
          status: 'draft', // Shows don't store artist requirements yet
          data: { 
            technicalRequirements: [], 
            hospitalityRequirements: [], 
            equipment: {}
          },
          canEdit: viewerType === 'artist'
        },
        {
          id: 'show-schedule',
          title: 'Show Day Schedule',
          owner: 'shared',
          status: show.showTime ? 'committed' : 'draft',
          data: { 
            loadIn: show.loadIn,
            soundcheck: show.soundcheck,
            doorsOpen: show.doorsOpen,
            showTime: show.showTime,
            curfew: show.curfew
          },
          canEdit: viewerType !== 'public'
        }
      ]);
    } else if (bid) {
      console.log('🎯 ShowDocumentModal: Processing bid data:', bid);
      
      // Venue bid - populate from bid data
      setDocumentData({
        title: `${bid.venueName} Bid`,
        date: bid.proposedDate,
        artistName: 'Artist', // Would need to fetch from tour request
        venueName: bid.venueName,
        
        // Venue details - bid doesn't have location property, so use fallback
        location: bid.venueName, // Use venue name as fallback for location
        capacity: bid.capacity,
        ageRestriction: bid.ageRestriction,
        
        // Financial terms
        guarantee: bid.guarantee,
        doorDeal: bid.doorDeal,
        ticketPrice: bid.ticketPrice,
        merchandiseSplit: bid.merchandiseSplit,
        
        // Show timeline
        loadIn: bid.loadIn,
        soundcheck: bid.soundcheck,
        doorsOpen: bid.doorsOpen,
        showTime: bid.showTime,
        curfew: bid.curfew,
        
        // Billing order
        billingPosition: bid.billingPosition,
        lineupPosition: bid.lineupPosition,
        setLength: bid.setLength,
        otherActs: bid.otherActs,
        billingNotes: bid.billingNotes,
        
        // Equipment provided by venue
        equipmentProvided: bid.equipmentProvided,
        
        // Promotion offered by venue
        promotion: bid.promotion,
        
        // Lodging offered by venue
        lodging: bid.lodging,
        
        // Additional terms and message
        additionalTerms: bid.additionalTerms,
        message: bid.message
      });
      
      console.log('🎯 ShowDocumentModal: Bid sections data:', {
        equipmentProvided: bid.equipmentProvided,
        promotion: bid.promotion,
        lodging: bid.lodging,
        message: bid.message
      });
      
      // For bids, venue sections are "proposed", artist sections are "draft"
      setSections([
        {
          id: 'venue-offer',
          title: 'Venue Offer & Terms',
          owner: 'venue',
          status: 'proposed',
          data: { 
            // Basic venue info
            venueName: bid.venueName,
            location: bid.venueName, // Use venue name as location fallback
            capacity: bid.capacity,
            ageRestriction: bid.ageRestriction,
            date: bid.proposedDate,
            
            // Financial terms
            guarantee: bid.guarantee,
            doorDeal: bid.doorDeal,
            ticketPrice: bid.ticketPrice,
            merchandiseSplit: bid.merchandiseSplit,
            
            // What venue provides
            equipmentProvided: bid.equipmentProvided,
            promotion: bid.promotion,
            lodging: bid.lodging,
            
            // Billing & performance details
            billingPosition: bid.billingPosition,
            lineupPosition: bid.lineupPosition,
            setLength: bid.setLength,
            otherActs: bid.otherActs,
            billingNotes: bid.billingNotes,
            
            // Additional terms
            message: bid.message,
            additionalTerms: bid.additionalTerms
          },
          canEdit: viewerType === 'venue'
        },
        {
          id: 'artist-requirements',
          title: 'Artist Requirements & Rider',
          owner: 'artist',
          status: 'draft', // Artist hasn't filled this out yet
          data: { 
            // Technical requirements (would come from artist templates)
            technicalRequirements: [], 
            hospitalityRequirements: [], 
            equipment: {},
            
            // Travel & logistics (would come from artist templates)
            travelMethod: undefined,
            lodging: undefined,
            merchandising: undefined,
            
            // Special requests
            artistNotes: undefined
          },
          canEdit: viewerType === 'artist'
        },
        {
          id: 'show-schedule',
          title: 'Show Day Schedule',
          owner: 'shared',
          status: bid.loadIn || bid.soundcheck || bid.showTime ? 'proposed' : 'draft',
          data: { 
            loadIn: bid.loadIn,
            soundcheck: bid.soundcheck,
            doorsOpen: bid.doorsOpen,
            showTime: bid.showTime,
            curfew: bid.curfew
          },
          canEdit: viewerType !== 'public'
        }
      ]);
    } else if (tourRequest) {
      console.log('🎯 ShowDocumentModal: Processing tour request data:', tourRequest);
      
      // Tour request - populate from tour request data
      setDocumentData({
        title: tourRequest.title,
        startDate: tourRequest.startDate,
        endDate: tourRequest.endDate,
        artistName: tourRequest.artistName,
        location: tourRequest.location,
        
        // Artist requirements from tour request
        equipment: tourRequest.equipment,
        guaranteeRange: tourRequest.guaranteeRange,
        acceptsDoorDeals: tourRequest.acceptsDoorDeals,
        merchandising: tourRequest.merchandising,
        ageRestriction: tourRequest.ageRestriction,
        travelMethod: tourRequest.travelMethod,
        lodging: tourRequest.lodging,
        priority: tourRequest.priority,
        
        // Audience expectations
        expectedDraw: tourRequest.expectedDraw,
        description: tourRequest.description
      });
      
      // For tour requests, artist sections are "proposed" (they've specified their needs), venue sections are "draft" (waiting for bids)
      setSections([
        {
          id: 'venue-offer',
          title: 'Venue Offer & Terms',
          owner: 'venue',
          status: 'draft', // Waiting for venue bids
          data: { 
            // Empty - venues will fill this when they bid
          },
          canEdit: viewerType === 'venue'
        },
        {
          id: 'artist-requirements',
          title: 'Artist Requirements & Rider',
          owner: 'artist',
          status: 'proposed', // Artist has specified their requirements
          data: { 
            // Equipment needs
            equipment: tourRequest.equipment,
            
            // Business requirements
            guaranteeRange: tourRequest.guaranteeRange,
            acceptsDoorDeals: tourRequest.acceptsDoorDeals,
            merchandising: tourRequest.merchandising,
            ageRestriction: tourRequest.ageRestriction,
            
            // Travel & logistics
            travelMethod: tourRequest.travelMethod,
            lodging: tourRequest.lodging,
            priority: tourRequest.priority,
            
            // Technical and hospitality requirements
            technicalRequirements: [],
            hospitalityRequirements: [],
            
            // Tour details
            expectedDraw: tourRequest.expectedDraw,
            description: tourRequest.description,
            tourStatus: tourRequest.tourStatus,
            flexibility: tourRequest.flexibility
          },
          canEdit: viewerType === 'artist'
        },
        {
          id: 'show-schedule',
          title: 'Show Day Schedule',
          owner: 'shared',
          status: 'draft', // Will be filled when show is confirmed
          data: { 
            // Empty - will be filled when venue bids or show is confirmed
          },
          canEdit: viewerType !== 'public'
        }
      ]);
    }
  }, [show, bid, tourRequest, viewerType]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          className: 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
          text: 'Draft',
          icon: '✏️'
        };
      case 'proposed':
        return {
          className: 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
          text: 'Proposed',
          icon: '⏳'
        };
      case 'committed':
        return {
          className: 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
          text: 'Committed',
          icon: '✓'
        };
      case 'locked':
        return {
          className: 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
          text: 'Locked',
          icon: '🔒'
        };
      default:
        return {
          className: 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
          text: status,
          icon: '❓'
        };
    }
  };

  const getSectionBorderClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'border-l-4 border-gray-300 bg-gray-50';
      case 'proposed':
        return 'border-l-4 border-yellow-400 bg-yellow-50';
      case 'committed':
        return 'border-l-4 border-green-400 bg-green-50';
      case 'locked':
        return 'border-l-4 border-blue-400 bg-blue-50 opacity-90';
      default:
        return 'border-l-4 border-gray-300 bg-white';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                📋 Show Document
              </h2>
              <h3 className="text-lg font-semibold text-gray-800">
                {documentData.title || `${documentData.artistName || 'Artist'} at ${documentData.venueName || 'Venue'}`}
              </h3>
              <p className="text-sm text-gray-600">
                {documentData.date && new Date(documentData.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {documentData.startDate && documentData.endDate && (
                  <>
                    {new Date(documentData.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {' - '}
                    {new Date(documentData.endDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {' • '}
                    {documentData.location}
                  </>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Document Sections */}
        <div className="px-6 py-4 space-y-6">
          {sections.map((section) => {
            const statusBadge = getStatusBadge(section.status);
            const borderClass = getSectionBorderClass(section.status);
            
            return (
              <div key={section.id} className={`rounded-lg p-4 ${borderClass}`}>
                {/* Section Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold text-gray-900">{section.title}</h4>
                    <span className={statusBadge.className}>
                      <span className="mr-1">{statusBadge.icon}</span>
                      {statusBadge.text}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({section.owner === 'shared' ? 'Collaborative' : `${section.owner} managed`})
                    </span>
                  </div>
                  
                  {section.canEdit && section.status !== 'locked' && (
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Edit
                    </button>
                  )}
                </div>

                {/* Section Content */}
                <div className="space-y-3">
                  {section.id === 'venue-offer' && (
                    <div className="space-y-4">
                      {/* Show empty state if no venue data (tour request waiting for bids) */}
                      {!section.data || Object.keys(section.data).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🏢</span>
                          </div>
                          <p className="font-medium mb-2">Waiting for Venue Offers</p>
                          <p className="text-sm">
                            {viewerType === 'venue' 
                              ? "Submit a bid to show your offer details here."
                              : "Venue bids and offers will appear here when submitted."
                            }
                          </p>
                          {viewerType === 'venue' && (
                            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                              Submit Bid
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Basic Venue Info */}
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">
                              {bid ? 'Venue & Show Details' : 'Show Information'}
                            </h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Date:</span>
                                <span className="ml-2 text-gray-900">{section.data.date && new Date(section.data.date).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Venue:</span>
                                <span className="ml-2 text-gray-900">{section.data.venueName}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  {bid ? 'Capacity' : 'Location'}:
                                </span>
                                <span className="ml-2 text-gray-900">
                                  {bid ? section.data.capacity : section.data.location}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  {bid ? 'Age Restriction' : 'Capacity'}:
                                </span>
                                <span className="ml-2 text-gray-900">
                                  {bid ? section.data.ageRestriction : section.data.capacity}
                                </span>
                              </div>
                              {!bid && (
                                <div>
                                  <span className="font-medium text-gray-700">Age Restriction:</span>
                                  <span className="ml-2 text-gray-900">{section.data.ageRestriction}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Financial Terms - Only show if there are any */}
                          {(section.data.guarantee || section.data.doorDeal || section.data.ticketPrice || section.data.merchandiseSplit) && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">Financial Terms</h5>
                              <div className="space-y-2">
                                <InlineOfferDisplay 
                                  amount={section.data.guarantee}
                                  doorDeal={section.data.doorDeal}
                                  className="text-sm"
                                />
                                
                                {section.data.ticketPrice && (section.data.ticketPrice.advance || section.data.ticketPrice.door) && (
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-700">Ticket Prices:</span>
                                    <div className="ml-4 mt-1 grid grid-cols-2 gap-2">
                                      {section.data.ticketPrice.advance && (
                                        <div className="text-gray-900">Advance: ${section.data.ticketPrice.advance}</div>
                                      )}
                                      {section.data.ticketPrice.door && (
                                        <div className="text-gray-900">Door: ${section.data.ticketPrice.door}</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {section.data.merchandiseSplit && (
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-700">Merchandise Split:</span>
                                    <span className="ml-2 text-gray-900">{section.data.merchandiseSplit} (Artist/Venue)</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* What Venue Provides - Only for bids */}
                          {bid && (section.data.equipmentProvided || section.data.promotion || section.data.lodging) && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">What We Provide</h5>
                              <div className="space-y-3 text-sm">
                                {section.data.equipmentProvided && Object.values(section.data.equipmentProvided).some(Boolean) && (
                                  <div>
                                    <span className="font-medium text-gray-700">Equipment:</span>
                                    <div className="ml-4 mt-1 grid grid-cols-2 gap-1">
                                      {section.data.equipmentProvided.pa && <div className="text-gray-900">• PA System</div>}
                                      {section.data.equipmentProvided.mics && <div className="text-gray-900">• Microphones</div>}
                                      {section.data.equipmentProvided.drums && <div className="text-gray-900">• Drum Kit</div>}
                                      {section.data.equipmentProvided.amps && <div className="text-gray-900">• Amplifiers</div>}
                                      {section.data.equipmentProvided.piano && <div className="text-gray-900">• Piano/Keyboard</div>}
                                    </div>
                                  </div>
                                )}
                                
                                {section.data.promotion && Object.values(section.data.promotion).some(Boolean) && (
                                  <div>
                                    <span className="font-medium text-gray-700">Promotion:</span>
                                    <div className="ml-4 mt-1 grid grid-cols-2 gap-1">
                                      {section.data.promotion.social && <div className="text-gray-900">• Social Media</div>}
                                      {section.data.promotion.flyerPrinting && <div className="text-gray-900">• Flyer Printing</div>}
                                      {section.data.promotion.radioSpots && <div className="text-gray-900">• Radio Spots</div>}
                                      {section.data.promotion.pressCoverage && <div className="text-gray-900">• Press Coverage</div>}
                                    </div>
                                  </div>
                                )}
                                
                                {section.data.lodging && section.data.lodging.offered && (
                                  <div>
                                    <span className="font-medium text-gray-700">Lodging:</span>
                                    <div className="ml-4 mt-1">
                                      <div className="text-gray-900 capitalize">{section.data.lodging.type?.replace('-', ' ')}</div>
                                      {section.data.lodging.details && (
                                        <div className="text-gray-600 text-xs mt-1">{section.data.lodging.details}</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Billing & Performance - Show for both bids and shows */}
                          {(section.data.billingPosition || section.data.setLength || section.data.otherActs || section.data.billingOrder) && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">Billing & Performance</h5>
                              <div className="space-y-2 text-sm">
                                {/* For bids */}
                                {section.data.billingPosition && (
                                  <div>
                                    <span className="font-medium text-gray-700">Billing Position:</span>
                                    <span className="ml-2 text-gray-900 capitalize">{section.data.billingPosition.replace('-', ' ')}</span>
                                  </div>
                                )}
                                {section.data.setLength && (
                                  <div>
                                    <span className="font-medium text-gray-700">Set Length:</span>
                                    <span className="ml-2 text-gray-900">{section.data.setLength} minutes</span>
                                  </div>
                                )}
                                {section.data.otherActs && (
                                  <div>
                                    <span className="font-medium text-gray-700">Other Acts:</span>
                                    <span className="ml-2 text-gray-900">{section.data.otherActs}</span>
                                  </div>
                                )}
                                {section.data.billingNotes && (
                                  <div>
                                    <span className="font-medium text-gray-700">Notes:</span>
                                    <span className="ml-2 text-gray-900">{section.data.billingNotes}</span>
                                  </div>
                                )}
                                
                                {/* For confirmed shows */}
                                {section.data.billingOrder && (
                                  <div>
                                    <span className="font-medium text-gray-700">Billing Position:</span>
                                    <span className="ml-2 text-gray-900 capitalize">{section.data.billingOrder.position?.replace('-', ' ')}</span>
                                    {section.data.billingOrder.setLength && (
                                      <span className="ml-2 text-gray-600">({section.data.billingOrder.setLength} min)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Message & Additional Terms - Only for bids */}
                          {bid && (section.data.message || section.data.additionalTerms) && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">Additional Information</h5>
                              <div className="space-y-2 text-sm">
                                {section.data.message && (
                                  <div>
                                    <span className="font-medium text-gray-700">Message:</span>
                                    <div className="ml-2 text-gray-900 bg-gray-50 p-2 rounded text-sm mt-1">{section.data.message}</div>
                                  </div>
                                )}
                                {section.data.additionalTerms && (
                                  <div>
                                    <span className="font-medium text-gray-700">Additional Terms:</span>
                                    <div className="ml-2 text-gray-900 bg-gray-50 p-2 rounded text-sm mt-1">{section.data.additionalTerms}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Notes - Only for confirmed shows */}
                          {!bid && section.data.notes && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">Notes</h5>
                              <div className="text-sm">
                                <div className="text-gray-900 bg-gray-50 p-2 rounded">{section.data.notes}</div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {section.id === 'artist-requirements' && (
                    <div className="space-y-4">
                      {/* Basic Venue Info */}
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">
                          {bid ? 'Venue & Show Details' : 'Show Information'}
                        </h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Date:</span>
                            <span className="ml-2 text-gray-900">{section.data.date && new Date(section.data.date).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Venue:</span>
                            <span className="ml-2 text-gray-900">{section.data.venueName}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              {bid ? 'Capacity' : 'Location'}:
                            </span>
                            <span className="ml-2 text-gray-900">
                              {bid ? section.data.capacity : section.data.location}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              {bid ? 'Age Restriction' : 'Capacity'}:
                            </span>
                            <span className="ml-2 text-gray-900">
                              {bid ? section.data.ageRestriction : section.data.capacity}
                            </span>
                          </div>
                          {!bid && (
                            <div>
                              <span className="font-medium text-gray-700">Age Restriction:</span>
                              <span className="ml-2 text-gray-900">{section.data.ageRestriction}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Financial Terms - Only show if there are any */}
                      {(section.data.guarantee || section.data.doorDeal || section.data.ticketPrice || section.data.merchandiseSplit) && (
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Financial Terms</h5>
                          <div className="space-y-2">
                            <InlineOfferDisplay 
                              amount={section.data.guarantee}
                              doorDeal={section.data.doorDeal}
                              className="text-sm"
                            />
                            
                            {section.data.ticketPrice && (section.data.ticketPrice.advance || section.data.ticketPrice.door) && (
                              <div className="text-sm">
                                <span className="font-medium text-gray-700">Ticket Prices:</span>
                                <div className="ml-4 mt-1 grid grid-cols-2 gap-2">
                                  {section.data.ticketPrice.advance && (
                                    <div className="text-gray-900">Advance: ${section.data.ticketPrice.advance}</div>
                                  )}
                                  {section.data.ticketPrice.door && (
                                    <div className="text-gray-900">Door: ${section.data.ticketPrice.door}</div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {section.data.merchandiseSplit && (
                              <div className="text-sm">
                                <span className="font-medium text-gray-700">Merchandise Split:</span>
                                <span className="ml-2 text-gray-900">{section.data.merchandiseSplit} (Artist/Venue)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* What Venue Provides - Only for bids */}
                      {bid && (section.data.equipmentProvided || section.data.promotion || section.data.lodging) && (
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">What We Provide</h5>
                          <div className="space-y-3 text-sm">
                            {section.data.equipmentProvided && Object.values(section.data.equipmentProvided).some(Boolean) && (
                              <div>
                                <span className="font-medium text-gray-700">Equipment:</span>
                                <div className="ml-4 mt-1 grid grid-cols-2 gap-1">
                                  {section.data.equipmentProvided.pa && <div className="text-gray-900">• PA System</div>}
                                  {section.data.equipmentProvided.mics && <div className="text-gray-900">• Microphones</div>}
                                  {section.data.equipmentProvided.drums && <div className="text-gray-900">• Drum Kit</div>}
                                  {section.data.equipmentProvided.amps && <div className="text-gray-900">• Amplifiers</div>}
                                  {section.data.equipmentProvided.piano && <div className="text-gray-900">• Piano/Keyboard</div>}
                                </div>
                              </div>
                            )}
                            
                            {section.data.promotion && Object.values(section.data.promotion).some(Boolean) && (
                              <div>
                                <span className="font-medium text-gray-700">Promotion:</span>
                                <div className="ml-4 mt-1 grid grid-cols-2 gap-1">
                                  {section.data.promotion.social && <div className="text-gray-900">• Social Media</div>}
                                  {section.data.promotion.flyerPrinting && <div className="text-gray-900">• Flyer Printing</div>}
                                  {section.data.promotion.radioSpots && <div className="text-gray-900">• Radio Spots</div>}
                                  {section.data.promotion.pressCoverage && <div className="text-gray-900">• Press Coverage</div>}
                                </div>
                              </div>
                            )}
                            
                            {section.data.lodging && section.data.lodging.offered && (
                              <div>
                                <span className="font-medium text-gray-700">Lodging:</span>
                                <div className="ml-4 mt-1">
                                  <div className="text-gray-900 capitalize">{section.data.lodging.type?.replace('-', ' ')}</div>
                                  {section.data.lodging.details && (
                                    <div className="text-gray-600 text-xs mt-1">{section.data.lodging.details}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Billing & Performance - Show for both bids and shows */}
                      {(section.data.billingPosition || section.data.setLength || section.data.otherActs || section.data.billingOrder) && (
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Billing & Performance</h5>
                          <div className="space-y-2 text-sm">
                            {/* For bids */}
                            {section.data.billingPosition && (
                              <div>
                                <span className="font-medium text-gray-700">Billing Position:</span>
                                <span className="ml-2 text-gray-900 capitalize">{section.data.billingPosition.replace('-', ' ')}</span>
                              </div>
                            )}
                            {section.data.setLength && (
                              <div>
                                <span className="font-medium text-gray-700">Set Length:</span>
                                <span className="ml-2 text-gray-900">{section.data.setLength} minutes</span>
                              </div>
                            )}
                            {section.data.otherActs && (
                              <div>
                                <span className="font-medium text-gray-700">Other Acts:</span>
                                <span className="ml-2 text-gray-900">{section.data.otherActs}</span>
                              </div>
                            )}
                            {section.data.billingNotes && (
                              <div>
                                <span className="font-medium text-gray-700">Notes:</span>
                                <span className="ml-2 text-gray-900">{section.data.billingNotes}</span>
                              </div>
                            )}
                            
                            {/* For confirmed shows */}
                            {section.data.billingOrder && (
                              <div>
                                <span className="font-medium text-gray-700">Billing Position:</span>
                                <span className="ml-2 text-gray-900 capitalize">{section.data.billingOrder.position?.replace('-', ' ')}</span>
                                {section.data.billingOrder.setLength && (
                                  <span className="ml-2 text-gray-600">({section.data.billingOrder.setLength} min)</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Message & Additional Terms - Only for bids */}
                      {bid && (section.data.message || section.data.additionalTerms) && (
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Additional Information</h5>
                          <div className="space-y-2 text-sm">
                            {section.data.message && (
                              <div>
                                <span className="font-medium text-gray-700">Message:</span>
                                <div className="ml-2 text-gray-900 bg-gray-50 p-2 rounded text-sm mt-1">{section.data.message}</div>
                              </div>
                            )}
                            {section.data.additionalTerms && (
                              <div>
                                <span className="font-medium text-gray-700">Additional Terms:</span>
                                <div className="ml-2 text-gray-900 bg-gray-50 p-2 rounded text-sm mt-1">{section.data.additionalTerms}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes - Only for confirmed shows */}
                      {!bid && section.data.notes && (
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Notes</h5>
                          <div className="text-sm">
                            <div className="text-gray-900 bg-gray-50 p-2 rounded">{section.data.notes}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {section.id === 'artist-requirements' && (
                    <div className="space-y-4">
                      {/* Show actual tour request data if available */}
                      {tourRequest && section.data && Object.keys(section.data).length > 0 ? (
                        <>
                          {/* Equipment Needs */}
                          {section.data.equipment && Object.values(section.data.equipment).some(Boolean) && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">Equipment Needs</h5>
                              <div className="ml-4 mt-1 grid grid-cols-2 gap-1 text-sm">
                                {section.data.equipment.needsPA && <div className="text-red-600">• PA System Required</div>}
                                {section.data.equipment.needsMics && <div className="text-red-600">• Microphones Required</div>}
                                {section.data.equipment.needsDrums && <div className="text-red-600">• Drum Kit Required</div>}
                                {section.data.equipment.needsAmps && <div className="text-red-600">• Amplifiers Required</div>}
                                {section.data.equipment.acoustic && <div className="text-green-600">• Acoustic Performance</div>}
                              </div>
                            </div>
                          )}

                          {/* Business Requirements */}
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Business Terms</h5>
                            <div className="space-y-2 text-sm">
                              {section.data.guaranteeRange && (section.data.guaranteeRange.min > 0 || section.data.guaranteeRange.max > 0) && (
                                <div>
                                  <span className="font-medium text-gray-700">Guarantee Range:</span>
                                  <span className="ml-2 text-gray-900">
                                    ${section.data.guaranteeRange.min} - ${section.data.guaranteeRange.max}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-700">Door Deals:</span>
                                <span className={`ml-2 ${section.data.acceptsDoorDeals ? 'text-green-600' : 'text-red-600'}`}>
                                  {section.data.acceptsDoorDeals ? 'Accepted' : 'Not accepted'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Merchandising:</span>
                                <span className={`ml-2 ${section.data.merchandising ? 'text-green-600' : 'text-red-600'}`}>
                                  {section.data.merchandising ? 'Required' : 'Not needed'}
                                </span>
                              </div>
                              {section.data.ageRestriction && (
                                <div>
                                  <span className="font-medium text-gray-700">Age Preference:</span>
                                  <span className="ml-2 text-gray-900 capitalize">{section.data.ageRestriction}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Travel & Logistics */}
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Travel & Logistics</h5>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Travel Method:</span>
                                <span className="ml-2 text-gray-900 capitalize">{section.data.travelMethod}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Lodging:</span>
                                <span className="ml-2 text-gray-900 capitalize">{section.data.lodging?.replace('-', ' ')}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Priority:</span>
                                <span className={`ml-2 font-medium ${
                                  section.data.priority === 'high' ? 'text-red-600' :
                                  section.data.priority === 'medium' ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {section.data.priority?.charAt(0).toUpperCase() + section.data.priority?.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Tour Information */}
                          {(section.data.expectedDraw || section.data.description || section.data.tourStatus) && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">Tour Information</h5>
                              <div className="space-y-2 text-sm">
                                {section.data.expectedDraw && (
                                  <div>
                                    <span className="font-medium text-gray-700">Expected Draw:</span>
                                    <span className="ml-2 text-gray-900">
                                      {section.data.expectedDraw.min}-{section.data.expectedDraw.max}
                                    </span>
                                    {section.data.expectedDraw.description && (
                                      <div className="ml-6 text-gray-600 text-xs mt-1">{section.data.expectedDraw.description}</div>
                                    )}
                                  </div>
                                )}
                                {section.data.tourStatus && (
                                  <div>
                                    <span className="font-medium text-gray-700">Tour Status:</span>
                                    <span className="ml-2 text-gray-900 capitalize">{section.data.tourStatus?.replace('-', ' ')}</span>
                                  </div>
                                )}
                                {section.data.flexibility && (
                                  <div>
                                    <span className="font-medium text-gray-700">Routing Flexibility:</span>
                                    <span className="ml-2 text-gray-900 capitalize">{section.data.flexibility?.replace('-', ' ')}</span>
                                  </div>
                                )}
                                {section.data.description && (
                                  <div>
                                    <span className="font-medium text-gray-700">Description:</span>
                                    <div className="ml-2 text-gray-900 bg-gray-50 p-2 rounded text-sm mt-1">{section.data.description}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        // Fallback for when no data is available
                        <div className="text-center py-8 text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🎸</span>
                          </div>
                          <p className="font-medium mb-2">Artist Requirements & Rider</p>
                          <p className="text-sm">
                            {viewerType === 'artist' 
                              ? "Add your technical requirements, hospitality needs, and other rider details here."
                              : "Artist will add their technical requirements and rider details here."
                            }
                          </p>
                          {viewerType === 'artist' && (
                            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                              Add Requirements
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {section.id === 'show-schedule' && (
                    <div className="space-y-4">
                      <h5 className="font-medium text-gray-800 mb-2">Show Day Timeline</h5>
                      <div className="space-y-3">
                        {[
                          { key: 'loadIn', label: 'Load-in', value: section.data.loadIn },
                          { key: 'soundcheck', label: 'Soundcheck', value: section.data.soundcheck },
                          { key: 'doorsOpen', label: 'Doors Open', value: section.data.doorsOpen },
                          { key: 'showTime', label: 'Show Time', value: section.data.showTime },
                          { key: 'curfew', label: 'Curfew', value: section.data.curfew }
                        ].map((item) => (
                          <div key={item.key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <span className="font-medium text-gray-700">{item.label}:</span>
                            <span className={`font-mono text-sm ${item.value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                              {item.value || 'Not specified'}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {!section.data.loadIn && !section.data.soundcheck && !section.data.doorsOpen && !section.data.showTime && !section.data.curfew && (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm italic">No schedule details specified yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons for Proposed Sections */}
                {section.status === 'proposed' && viewerType === 'artist' && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
                        ✓ Accept
                      </button>
                      <button className="px-3 py-1 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors">
                        ⏸ Hold
                      </button>
                      <button className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">
                        ✕ Decline
                      </button>
                      <button className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                        💬 Counter-Propose
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {sections.filter(s => s.status === 'committed').length} of {sections.length} sections committed
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Close
              </button>
              {viewerType !== 'public' && (
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
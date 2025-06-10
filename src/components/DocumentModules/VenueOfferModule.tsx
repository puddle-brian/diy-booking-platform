import React, { useState } from 'react';
import { ModuleDefinition, ModuleComponentProps } from './ModuleRegistry';
import { InlineOfferDisplay } from '../OfferDisplay';
import OfferFormCore from '../OfferFormCore';

/**
 * Venue Offer & Terms Module Component
 */
function VenueOfferComponent({
  data,
  isEditing,
  status,
  viewerType,
  canEdit,
  onDataChange,
  onSave,
  onCancel,
  onStartEdit,
  isSaving = false,
  errors = []
}: ModuleComponentProps) {
  
  // Show empty state if no venue data (tour request waiting for bids)
  if (!data || Object.keys(data).length === 0) {
    return (
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
    );
  }

  if (isEditing) {
    // Use the actual existing offer form component
    return (
      <OfferFormCore
        venueId={data.venueId || ''}
        venueName={data.venueName || 'Venue'}
        onSubmit={async (formData) => {
          // Transform form data to match our data structure
          onDataChange(formData);
          onSave();
        }}
        onCancel={onCancel}
        loading={isSaving}
        title="Edit Offer Terms"
        submitButtonText="Save Changes"
        preSelectedArtist={data.artistId ? {
          id: data.artistId,
          name: data.artistName || 'Artist'
        } : undefined}
        preSelectedDate={data.date}
        existingBid={data.guarantee ? {
          id: data.id || '',
          amount: data.guarantee,
          message: data.message || '',
          status: status,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        } : undefined}
      />
    );
  }

  // Regular view mode - focused on offer terms only
  return (
    <div className="space-y-4">
      {/* Financial Terms - Only show if there are any */}
      {(data.guarantee || data.doorDeal || data.ticketPrice || data.merchandiseSplit) && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Financial Terms</h5>
          <div className="space-y-2">
            <InlineOfferDisplay 
              amount={data.guarantee}
              doorDeal={data.doorDeal}
              className="text-sm"
            />
            
            {data.ticketPrice && (data.ticketPrice.advance || data.ticketPrice.door) && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Ticket Prices:</span>
                <div className="ml-4 mt-1 grid grid-cols-2 gap-2">
                  {data.ticketPrice.advance && (
                    <div className="text-gray-900">Advance: ${data.ticketPrice.advance}</div>
                  )}
                  {data.ticketPrice.door && (
                    <div className="text-gray-900">Door: ${data.ticketPrice.door}</div>
                  )}
                </div>
              </div>
            )}
            
            {data.merchandiseSplit && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Merchandise Split:</span>
                <span className="ml-2 text-gray-900">{data.merchandiseSplit} (Artist/Venue)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* What Venue Provides - Only for bids */}
      {data.equipmentProvided && Object.values(data.equipmentProvided).some(Boolean) && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">What We Provide</h5>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Equipment:</span>
              <div className="ml-4 mt-1 grid grid-cols-2 gap-1">
                {data.equipmentProvided.pa && <div className="text-gray-900">• PA System</div>}
                {data.equipmentProvided.mics && <div className="text-gray-900">• Microphones</div>}
                {data.equipmentProvided.drums && <div className="text-gray-900">• Drum Kit</div>}
                {data.equipmentProvided.amps && <div className="text-gray-900">• Amplifiers</div>}
                {data.equipmentProvided.piano && <div className="text-gray-900">• Piano/Keyboard</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Timing */}
      {(data.loadIn || data.doorsOpen || data.showTime) && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Show Schedule</h5>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {data.loadIn && (
              <div>
                <span className="font-medium text-gray-700">Load-in:</span>
                <span className="ml-2 text-gray-900">{data.loadIn}</span>
              </div>
            )}
            {data.doorsOpen && (
              <div>
                <span className="font-medium text-gray-700">Doors:</span>
                <span className="ml-2 text-gray-900">{data.doorsOpen}</span>
              </div>
            )}
            {data.showTime && (
              <div>
                <span className="font-medium text-gray-700">Show:</span>
                <span className="ml-2 text-gray-900">{data.showTime}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Billing & Performance */}
      {(data.billingPosition || data.setLength || data.otherActs) && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Billing & Performance</h5>
          <div className="space-y-2 text-sm">
            {data.billingPosition && (
              <div>
                <span className="font-medium text-gray-700">Billing Position:</span>
                <span className="ml-2 text-gray-900 capitalize">
                  {data.billingPosition.replace('-', ' ')}
                </span>
              </div>
            )}
            {data.setLength && (
              <div>
                <span className="font-medium text-gray-700">Set Length:</span>
                <span className="ml-2 text-gray-900">{data.setLength} minutes</span>
              </div>
            )}
            {data.otherActs && (
              <div>
                <span className="font-medium text-gray-700">Other Acts:</span>
                <span className="ml-2 text-gray-900">{data.otherActs}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message & Additional Terms */}
      {(data.message || data.additionalTerms) && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Additional Information</h5>
          <div className="space-y-2 text-sm">
            {data.message && (
              <div>
                <span className="font-medium text-gray-700">Message:</span>
                <div className="ml-2 text-gray-900 bg-gray-50 p-2 rounded text-sm mt-1">
                  {data.message}
                </div>
              </div>
            )}
            {data.additionalTerms && (
              <div>
                <span className="font-medium text-gray-700">Additional Terms:</span>
                <div className="ml-2 text-gray-900 bg-gray-50 p-2 rounded text-sm mt-1">
                  {data.additionalTerms}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes - Only for confirmed shows */}
      {data.notes && !data.message && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Notes</h5>
          <div className="text-sm">
            <div className="text-gray-900 bg-gray-50 p-2 rounded">{data.notes}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Venue Offer Module Definition
 */
export const venueOfferModule: ModuleDefinition = {
  id: 'venue-offer',
  title: 'Venue Offer & Terms',
  owner: 'venue',
  order: 2, // After messaging
  defaultStatus: 'draft',
  
  canEdit: (viewerType: string, status: string) => {
    return viewerType === 'venue' && status !== 'locked';
  },
  
  canView: (viewerType: string) => {
    return true; // Everyone can view venue offers
  },
  
  extractData: (context: any) => {
    if (context.show) {
      // Confirmed show data
      return {
        venueName: context.show.venueName,
        location: `${context.show.city}, ${context.show.state}`,
        capacity: context.show.capacity,
        ageRestriction: context.show.ageRestriction,
        date: context.show.date,
        guarantee: context.show.guarantee,
        doorDeal: context.show.doorDeal,
        billingOrder: context.show.billingOrder,
        notes: context.show.notes
      };
    }
    
    if (context.bid) {
      // Venue bid data
      return {
        venueId: context.bid.venueId,
        venueName: context.bid.venueName,
        artistId: context.bid.artistId,
        artistName: context.bid.artistName,
        location: context.bid.venueName, // Use venue name as location fallback
        capacity: context.bid.capacity,
        ageRestriction: context.bid.ageRestriction,
        date: context.bid.proposedDate,
        guarantee: context.bid.guarantee,
        doorDeal: context.bid.doorDeal,
        ticketPrice: context.bid.ticketPrice,
        merchandiseSplit: context.bid.merchandiseSplit,
        equipmentProvided: context.bid.equipmentProvided,
        promotion: context.bid.promotion,
        lodging: context.bid.lodging,
        billingPosition: context.bid.billingPosition,
        lineupPosition: context.bid.lineupPosition,
        setLength: context.bid.setLength,
        otherActs: context.bid.otherActs,
        billingNotes: context.bid.billingNotes,
        message: context.bid.message,
        additionalTerms: context.bid.additionalTerms,
        loadIn: context.bid.loadIn,
        doorsOpen: context.bid.doorsOpen,
        showTime: context.bid.showTime,
        id: context.bid.id,
        createdAt: context.bid.createdAt,
        updatedAt: context.bid.updatedAt
      };
    }
    
    // Tour request - empty data waiting for venue bids
    return {};
  },
  
  component: VenueOfferComponent
}; 
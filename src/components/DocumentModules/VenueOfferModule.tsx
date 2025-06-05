import React, { useState } from 'react';
import { ModuleDefinition, ModuleComponentProps } from './ModuleRegistry';
import { InlineOfferDisplay } from '../OfferDisplay';

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
    return (
      <div className="space-y-6">
        {/* Basic Info Section */}
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Basic Information</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue Name
              </label>
              <input
                type="text"
                value={data.venueName || ''}
                onChange={(e) => onDataChange({ ...data, venueName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={data.location || ''}
                onChange={(e) => onDataChange({ ...data, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <input
                type="number"
                value={data.capacity || ''}
                onChange={(e) => onDataChange({ ...data, capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age Restriction
              </label>
              <select
                value={data.ageRestriction || 'all-ages'}
                onChange={(e) => onDataChange({ ...data, ageRestriction: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all-ages">All Ages</option>
                <option value="18+">18+</option>
                <option value="21+">21+</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Terms Section */}
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Financial Terms</h5>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guarantee ($)
              </label>
              <input
                type="number"
                value={data.guarantee || ''}
                onChange={(e) => onDataChange({ ...data, guarantee: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for door deal only"
              />
            </div>
            
            {/* Door Deal Section */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!data.doorDeal}
                  onChange={(e) => onDataChange({ 
                    ...data, 
                    doorDeal: e.target.checked ? { split: '70/30', minimumGuarantee: 0 } : undefined 
                  })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Offer Door Deal</span>
              </label>
              
              {data.doorDeal && (
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Split (Artist/Venue)</label>
                    <select
                      value={data.doorDeal.split || '70/30'}
                      onChange={(e) => onDataChange({ 
                        ...data, 
                        doorDeal: { ...data.doorDeal, split: e.target.value } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="50/50">50/50</option>
                      <option value="60/40">60/40</option>
                      <option value="70/30">70/30</option>
                      <option value="80/20">80/20</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Minimum Guarantee</label>
                    <input
                      type="number"
                      value={data.doorDeal.minimumGuarantee || ''}
                      onChange={(e) => onDataChange({ 
                        ...data, 
                        doorDeal: { ...data.doorDeal, minimumGuarantee: parseInt(e.target.value) || 0 } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Equipment Provided Section */}
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Equipment We Provide</h5>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries({
              pa: 'PA System',
              mics: 'Microphones', 
              drums: 'Drum Kit',
              amps: 'Amplifiers',
              piano: 'Piano/Keyboard'
            }).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!(data.equipmentProvided && data.equipmentProvided[key])}
                  onChange={(e) => onDataChange({ 
                    ...data, 
                    equipmentProvided: { 
                      ...data.equipmentProvided, 
                      [key]: e.target.checked 
                    } 
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Billing & Performance Section */}
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Billing & Performance</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Position
              </label>
              <select
                value={data.billingPosition || ''}
                onChange={(e) => onDataChange({ ...data, billingPosition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not specified</option>
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
                value={data.setLength || ''}
                onChange={(e) => onDataChange({ ...data, setLength: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Acts on Bill
            </label>
            <input
              type="text"
              value={data.otherActs || ''}
              onChange={(e) => onDataChange({ ...data, otherActs: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List other bands performing"
            />
          </div>
        </div>

        {/* Message Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message to Artist
          </label>
          <textarea
            value={data.message || ''}
            onChange={(e) => onDataChange({ ...data, message: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional message or terms..."
          />
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex space-x-2 pt-4 border-t">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : '✓ Save Changes'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    );
  }

  // Regular view mode
  return (
    <div className="space-y-4">
      {/* Basic Venue Info */}
      <div>
        <h5 className="font-medium text-gray-800 mb-2">
          {data.message ? 'Venue & Show Details' : 'Show Information'}
        </h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Date:</span>
            <span className="ml-2 text-gray-900">
              {data.date && new Date(data.date).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Venue:</span>
            <span className="ml-2 text-gray-900">{data.venueName}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Location:</span>
            <span className="ml-2 text-gray-900">{data.location}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Capacity:</span>
            <span className="ml-2 text-gray-900">{data.capacity}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Age Restriction:</span>
            <span className="ml-2 text-gray-900">{data.ageRestriction}</span>
          </div>
        </div>
      </div>

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
      {data.equipmentProvided && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">What We Provide</h5>
          <div className="space-y-3 text-sm">
            {Object.values(data.equipmentProvided).some(Boolean) && (
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
            )}
          </div>
        </div>
      )}

      {/* Billing & Performance */}
      {(data.billingPosition || data.setLength || data.otherActs || data.billingOrder) && (
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
  order: 1,
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
        venueName: context.bid.venueName,
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
        additionalTerms: context.bid.additionalTerms
      };
    }
    
    // Tour request - empty data waiting for venue bids
    return {};
  },
  
  component: VenueOfferComponent
}; 
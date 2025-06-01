'use client';

import { useState } from 'react';
import { TourRequest, VenueBid } from '../../types';

interface VenueBidFormProps {
  tourRequest: TourRequest;
  venueId: string;
  venueName: string;
  onSuccess: (bid: VenueBid) => void;
  onCancel: () => void;
}

export default function VenueBidForm({ 
  tourRequest, 
  venueId, 
  venueName, 
  onSuccess, 
  onCancel 
}: VenueBidFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [bidForm, setBidForm] = useState({
    proposedDate: tourRequest.isSingleDate ? (tourRequest as any).requestDate : tourRequest.startDate,
    alternativeDates: [''],
    guarantee: '300',
    doorDeal: {
      split: '70/30',
      minimumGuarantee: '200'
    },
    ticketPrice: {
      advance: '15',
      door: '18'
    },
    merchandiseSplit: '90/10',
    capacity: '150',
    ageRestriction: 'all-ages',
    equipmentProvided: {
      pa: true,
      mics: true,
      drums: false,
      amps: false,
      piano: false
    },
    loadIn: '17:00',
    soundcheck: '18:00',
    doorsOpen: '19:00',
    showTime: '20:00',
    curfew: '23:00',
    promotion: {
      social: true,
      flyerPrinting: false,
      radioSpots: false,
      pressCoverage: false
    },
    lodging: {
      offered: false,
      type: 'floor-space' as 'floor-space' | 'couch' | 'private-room',
      details: ''
    },
    // Billing order fields
    billingPosition: 'headliner' as 'headliner' | 'co-headliner' | 'direct-support' | 'opener' | 'local-opener',
    lineupPosition: '1',
    setLength: '60',
    otherActs: '',
    billingNotes: '',
    message: 'Looking forward to hosting your show! We have a great sound system and enthusiastic local audience.',
    additionalTerms: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tour-requests/${tourRequest.id}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueId,
          venueName,
          proposedDate: bidForm.proposedDate,
          alternativeDates: bidForm.alternativeDates.filter(date => date.trim()),
          guarantee: bidForm.guarantee ? parseInt(bidForm.guarantee) : undefined,
          doorDeal: bidForm.doorDeal.split ? {
            split: bidForm.doorDeal.split,
            minimumGuarantee: bidForm.doorDeal.minimumGuarantee ? parseInt(bidForm.doorDeal.minimumGuarantee) : undefined
          } : undefined,
          ticketPrice: {
            advance: bidForm.ticketPrice.advance ? parseFloat(bidForm.ticketPrice.advance) : undefined,
            door: bidForm.ticketPrice.door ? parseFloat(bidForm.ticketPrice.door) : undefined
          },
          merchandiseSplit: bidForm.merchandiseSplit,
          capacity: parseInt(bidForm.capacity),
          ageRestriction: bidForm.ageRestriction,
          equipmentProvided: bidForm.equipmentProvided,
          loadIn: bidForm.loadIn,
          soundcheck: bidForm.soundcheck,
          doorsOpen: bidForm.doorsOpen,
          showTime: bidForm.showTime,
          curfew: bidForm.curfew,
          promotion: bidForm.promotion,
          lodging: bidForm.lodging.offered ? bidForm.lodging : undefined,
          // Billing order information
          billingPosition: bidForm.billingPosition,
          lineupPosition: bidForm.lineupPosition ? parseInt(bidForm.lineupPosition) : undefined,
          setLength: bidForm.setLength ? parseInt(bidForm.setLength) : undefined,
          otherActs: bidForm.otherActs,
          billingNotes: bidForm.billingNotes,
          message: bidForm.message,
          additionalTerms: bidForm.additionalTerms
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit bid');
      }

      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bid');
    } finally {
      setLoading(false);
    }
  };

  const addAlternativeDate = () => {
    setBidForm(prev => ({
      ...prev,
      alternativeDates: [...prev.alternativeDates, '']
    }));
  };

  const removeAlternativeDate = (index: number) => {
    setBidForm(prev => ({
      ...prev,
      alternativeDates: prev.alternativeDates.filter((_, i) => i !== index)
    }));
  };

  const updateAlternativeDate = (index: number, value: string) => {
    setBidForm(prev => ({
      ...prev,
      alternativeDates: prev.alternativeDates.map((date, i) => i === index ? value : date)
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Place Bid for: {tourRequest.title}
        </h3>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{tourRequest.artistName}</span> • 
          {tourRequest.isSingleDate && (tourRequest as any).requestDate
            ? new Date((tourRequest as any).requestDate).toLocaleDateString()
            : tourRequest.startDate && tourRequest.endDate
            ? `${new Date(tourRequest.startDate).toLocaleDateString()} - ${new Date(tourRequest.endDate).toLocaleDateString()}`
            : 'Date TBD'
          } • 
          {tourRequest.expectedDraw.min}-{tourRequest.expectedDraw.max} expected draw
        </div>
        {tourRequest.guaranteeRange && (
          <p className="text-sm text-gray-600 mb-4">
            Looking for ${tourRequest.guaranteeRange.min} minimum guarantee
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proposed Show Date *
          </label>
          <input
            type="date"
            required
            value={bidForm.proposedDate}
            onChange={(e) => setBidForm(prev => ({ ...prev, proposedDate: e.target.value }))}
            min={tourRequest.isSingleDate ? (tourRequest as any).requestDate : tourRequest.startDate}
            max={tourRequest.isSingleDate ? (tourRequest as any).requestDate : tourRequest.endDate}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {tourRequest.isSingleDate && (tourRequest as any).requestDate
              ? `Date for: ${new Date((tourRequest as any).requestDate).toLocaleDateString()}`
              : tourRequest.startDate && tourRequest.endDate
              ? `Must be between ${new Date(tourRequest.startDate).toLocaleDateString()} and ${new Date(tourRequest.endDate).toLocaleDateString()}`
              : 'Please enter a date'
            }
          </p>
        </div>

        {/* Alternative Dates */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Alternative Dates (Optional)
            </label>
            <button
              type="button"
              onClick={addAlternativeDate}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Date
            </button>
          </div>
          {bidForm.alternativeDates.map((date, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="date"
                value={date}
                onChange={(e) => updateAlternativeDate(index, e.target.value)}
                min={tourRequest.isSingleDate ? (tourRequest as any).requestDate : tourRequest.startDate}
                max={tourRequest.isSingleDate ? (tourRequest as any).requestDate : tourRequest.endDate}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeAlternativeDate(index)}
                className="text-red-600 hover:text-red-800 p-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Financial Terms */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guarantee (USD)
            </label>
            <input
              type="number"
              value={bidForm.guarantee}
              onChange={(e) => setBidForm(prev => ({ ...prev, guarantee: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Door Split
            </label>
            <select
              value={bidForm.doorDeal.split}
              onChange={(e) => setBidForm(prev => ({ 
                ...prev, 
                doorDeal: { ...prev.doorDeal, split: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No door deal</option>
              <option value="70/30">70/30 (Artist/Venue)</option>
              <option value="80/20">80/20 (Artist/Venue)</option>
              <option value="90/10">90/10 (Artist/Venue)</option>
              <option value="100/0">100% to artist</option>
            </select>
          </div>
        </div>

        {bidForm.doorDeal.split && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Guarantee for Door Deal
            </label>
            <input
              type="number"
              value={bidForm.doorDeal.minimumGuarantee}
              onChange={(e) => setBidForm(prev => ({ 
                ...prev, 
                doorDeal: { ...prev.doorDeal, minimumGuarantee: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 200"
            />
          </div>
        )}

        {/* Ticket Pricing */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Advance Ticket Price
            </label>
            <input
              type="number"
              step="0.01"
              value={bidForm.ticketPrice.advance}
              onChange={(e) => setBidForm(prev => ({ 
                ...prev, 
                ticketPrice: { ...prev.ticketPrice, advance: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Door Price
            </label>
            <input
              type="number"
              step="0.01"
              value={bidForm.ticketPrice.door}
              onChange={(e) => setBidForm(prev => ({ 
                ...prev, 
                ticketPrice: { ...prev.ticketPrice, door: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 18"
            />
          </div>
        </div>

        {/* Venue Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue Capacity *
            </label>
            <input
              type="number"
              required
              value={bidForm.capacity}
              onChange={(e) => setBidForm(prev => ({ ...prev, capacity: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 150"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age Restriction
            </label>
            <select
              value={bidForm.ageRestriction}
              onChange={(e) => setBidForm(prev => ({ ...prev, ageRestriction: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all-ages">All Ages</option>
              <option value="18+">18+</option>
              <option value="21+">21+</option>
            </select>
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Equipment Provided
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(bidForm.equipmentProvided).map(([key, provided]) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={provided}
                  onChange={(e) => setBidForm(prev => ({
                    ...prev,
                    equipmentProvided: {
                      ...prev.equipmentProvided,
                      [key]: e.target.checked
                    }
                  }))}
                  className="mr-2"
                />
                <span className="text-sm capitalize">
                  {key === 'pa' ? 'PA System' : key}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Show Timeline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Show Timeline
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Load In</label>
              <input
                type="time"
                value={bidForm.loadIn}
                onChange={(e) => setBidForm(prev => ({ ...prev, loadIn: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Soundcheck</label>
              <input
                type="time"
                value={bidForm.soundcheck}
                onChange={(e) => setBidForm(prev => ({ ...prev, soundcheck: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Doors Open</label>
              <input
                type="time"
                value={bidForm.doorsOpen}
                onChange={(e) => setBidForm(prev => ({ ...prev, doorsOpen: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Show Time</label>
              <input
                type="time"
                value={bidForm.showTime}
                onChange={(e) => setBidForm(prev => ({ ...prev, showTime: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Curfew</label>
              <input
                type="time"
                value={bidForm.curfew}
                onChange={(e) => setBidForm(prev => ({ ...prev, curfew: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Promotion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Promotion Support
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(bidForm.promotion).map(([key, included]) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={included}
                  onChange={(e) => setBidForm(prev => ({
                    ...prev,
                    promotion: {
                      ...prev.promotion,
                      [key]: e.target.checked
                    }
                  }))}
                  className="mr-2"
                />
                <span className="text-sm capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Lodging */}
        <div>
          <label className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={bidForm.lodging.offered}
              onChange={(e) => setBidForm(prev => ({
                ...prev,
                lodging: { ...prev.lodging, offered: e.target.checked }
              }))}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Offer Lodging</span>
          </label>
          
          {bidForm.lodging.offered && (
            <div className="ml-6 space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Type</label>
                <select
                  value={bidForm.lodging.type}
                  onChange={(e) => setBidForm(prev => ({
                    ...prev,
                    lodging: { 
                      ...prev.lodging, 
                      type: e.target.value as 'floor-space' | 'couch' | 'private-room'
                    }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="floor-space">Floor Space</option>
                  <option value="couch">Couch</option>
                  <option value="private-room">Private Room</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Details</label>
                <input
                  type="text"
                  value={bidForm.lodging.details}
                  onChange={(e) => setBidForm(prev => ({
                    ...prev,
                    lodging: { ...prev.lodging, details: e.target.value }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Pet-friendly house near venue"
                />
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message to Artist *
          </label>
          <textarea
            required
            rows={4}
            value={bidForm.message}
            onChange={(e) => setBidForm(prev => ({ ...prev, message: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell them about your venue, why you'd be a great fit, local draw expectations, etc."
          />
        </div>

        {/* Additional Terms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Terms (Optional)
          </label>
          <textarea
            rows={2}
            value={bidForm.additionalTerms}
            onChange={(e) => setBidForm(prev => ({ ...prev, additionalTerms: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special conditions, requirements, or additional notes"
          />
        </div>

        {/* Billing & Lineup Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Billing & Lineup Information
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Billing Position</label>
              <select
                value={bidForm.billingPosition}
                onChange={(e) => setBidForm(prev => ({ 
                  ...prev, 
                  billingPosition: e.target.value as 'headliner' | 'co-headliner' | 'direct-support' | 'opener' | 'local-opener'
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="headliner">Headliner</option>
                <option value="co-headliner">Co-Headliner</option>
                <option value="direct-support">Direct Support</option>
                <option value="opener">Opener</option>
                <option value="local-opener">Local Opener</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Set Length (minutes)</label>
              <input
                type="number"
                value={bidForm.setLength}
                onChange={(e) => setBidForm(prev => ({ ...prev, setLength: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 60"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">Other Acts on Bill (Optional)</label>
            <input
              type="text"
              value={bidForm.otherActs}
              onChange={(e) => setBidForm(prev => ({ ...prev, otherActs: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Local Band A, Local Band B"
            />
          </div>
          
          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">Billing Notes (Optional)</label>
            <textarea
              rows={2}
              value={bidForm.billingNotes}
              onChange={(e) => setBidForm(prev => ({ ...prev, billingNotes: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any specific notes about the lineup or billing arrangement"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting Bid...' : 'Submit Bid'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 
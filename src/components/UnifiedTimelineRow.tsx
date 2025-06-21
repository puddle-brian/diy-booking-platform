'use client';

import React from 'react';
import { TimelineItem } from '../hooks/useUnifiedTimelineData';
import { BidActionButtons } from './ActionButtons/BidActionButtons';
import { VenueBid, VenueOffer, BidStatus } from '../../types';

interface UnifiedTimelineRowProps {
  item: TimelineItem;
  isExpanded?: boolean;
  onToggleExpansion?: (id: string) => void;
  onBidAction?: (bid: VenueBid, action: string, reason?: string) => Promise<void>;
  onOfferAction?: (offer: VenueOffer, action: string) => Promise<void>;
  permissions: any; // Will be properly typed when ItineraryPermissions is available
}

export function UnifiedTimelineRow({
  item,
  isExpanded = false,
  onToggleExpansion,
  onBidAction,
  onOfferAction,
  permissions
}: UnifiedTimelineRowProps) {
  
  const handleToggleExpansion = () => {
    if (onToggleExpansion) {
      onToggleExpansion(item.id);
    }
  };

  const getStatusBadgeClass = (status: string, type: string): string => {
    const baseClass = 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full';
    
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'accepted':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'pending':
      case 'open':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'declined':
      case 'cancelled':
        return `${baseClass} bg-red-100 text-red-800`;
      case 'hold':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'show': return '🎵';
      case 'show-request': return '📅';
      case 'venue-bid': return '🏢';
      case 'venue-offer': return '💌';
      default: return '📋';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'show': return 'Confirmed Show';
      case 'show-request': return 'Show Request';
      case 'venue-bid': return 'Your Bid';
      case 'venue-offer': return 'Venue Offer';
      default: return 'Event';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const hasExpandableContent = (): boolean => {
    return !!(item.relatedBids?.length || item.relatedOffers?.length || item.type === 'show');
  };

  const renderActionButtons = () => {
    if (!item.canRespond && !item.canEdit) return null;

    switch (item.type) {
      case 'venue-bid':
        if (item.rawData && onBidAction) {
          return (
            <BidActionButtons
              bid={item.rawData as VenueBid}
              permissions={permissions}
              bidStatus={item.status as BidStatus}
              venueOffers={[]}
              onBidAction={onBidAction}
              onOfferAction={onOfferAction || (async () => {})}
            />
          );
        }
        break;
      case 'venue-offer':
        if (item.rawData && onOfferAction) {
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOfferAction(item.rawData as VenueOffer, 'accept')}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => onOfferAction(item.rawData as VenueOffer, 'decline')}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Decline
              </button>
            </div>
          );
        }
        break;
    }
    return null;
  };

  const renderExpandedContent = () => {
    if (!isExpanded) return null;

    return (
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        {item.type === 'show-request' && item.relatedBids && item.relatedBids.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Venue Responses ({item.relatedBids.length})
            </h4>
            <div className="space-y-3">
              {item.relatedBids.map((bid) => (
                <div key={bid.id} className="bg-white p-4 rounded border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{bid.venueName}</h5>
                      <p className="text-sm text-gray-600">{bid.message}</p>
                      <div className="mt-2 space-x-4 text-sm text-gray-500">
                        <span>💰 ${bid.guarantee || 'Door deal'}</span>
                        <span>👥 {bid.capacity} capacity</span>
                        <span>🕒 {bid.showTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={getStatusBadgeClass(bid.status, 'bid')}>
                        {bid.status}
                      </span>
                      {onBidAction && (
                        <BidActionButtons
                          bid={bid}
                          permissions={permissions}
                          bidStatus={bid.status as BidStatus}
                          venueOffers={[]}
                          onBidAction={onBidAction}
                          onOfferAction={onOfferAction || (async () => {})}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.type === 'show' && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Show Details</h4>
            <div className="bg-white p-4 rounded border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Venue:</span>
                  <span className="ml-2 text-gray-900">{item.venueName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <span className="ml-2 text-gray-900">{formatDate(item.date)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <span className="ml-2 text-gray-900">{item.location}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 ${getStatusBadgeClass(item.status, 'show')}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getTypeIcon(item.type)}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <span className={getStatusBadgeClass(item.status, item.type)}>
                    {item.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{formatDate(item.date)}</span>
                  <span className="mx-2">•</span>
                  <span>{item.location}</span>
                  <span className="mx-2">•</span>
                  <span>{getTypeLabel(item.type)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {renderActionButtons()}
            
            {hasExpandableContent() && (
              <button
                onClick={handleToggleExpansion}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg 
                  className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {renderExpandedContent()}
    </div>
  );
} 
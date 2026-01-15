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
    const baseClass = 'inline-flex px-2 py-0.5 text-xs font-mono';
    
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'accepted':
        return `${baseClass} border border-status-success text-status-success bg-status-success/10`;
      case 'pending':
      case 'open':
        return `${baseClass} border border-status-info text-status-info bg-status-info/10`;
      case 'declined':
      case 'cancelled':
        return `${baseClass} border border-status-error text-status-error bg-status-error/10`;
      case 'hold':
        return `${baseClass} border border-status-warning text-status-warning bg-status-warning/10`;
      default:
        return `${baseClass} border border-border-primary text-text-secondary`;
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
      <div className="px-6 py-4 bg-bg-tertiary border-t border-border-primary">
        {item.type === 'show-request' && item.relatedBids && item.relatedBids.length > 0 && (
          <div>
            <h4 className="font-mono text-text-primary mb-3">
              &gt; VENUE_RESPONSES [{item.relatedBids.length}]
            </h4>
            <div className="space-y-3">
              {item.relatedBids.map((bid) => (
                <div key={bid.id} className="bg-bg-secondary p-4 border border-border-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-mono text-text-primary">{bid.venueName}</h5>
                      <p className="text-sm text-text-secondary font-mono">{bid.message}</p>
                      <div className="mt-2 space-x-4 text-sm text-text-muted font-mono">
                        <span>💰 ${bid.guarantee || 'Door deal'}</span>
                        <span>👥 {bid.capacity} cap</span>
                        <span>🕒 {bid.showTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={getStatusBadgeClass(bid.status, 'bid')}>
                        {bid.status.toUpperCase()}
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
            <h4 className="font-mono text-text-primary mb-3">&gt; SHOW_DETAILS</h4>
            <div className="bg-bg-secondary p-4 border border-border-primary">
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div>
                  <span className="text-text-muted">VENUE:</span>
                  <span className="ml-2 text-text-primary">{item.venueName}</span>
                </div>
                <div>
                  <span className="text-text-muted">DATE:</span>
                  <span className="ml-2 text-text-primary">{formatDate(item.date)}</span>
                </div>
                <div>
                  <span className="text-text-muted">LOCATION:</span>
                  <span className="ml-2 text-text-primary">{item.location}</span>
                </div>
                <div>
                  <span className="text-text-muted">STATUS:</span>
                  <span className={`ml-2 ${getStatusBadgeClass(item.status, 'show')}`}>
                    {item.status.toUpperCase()}
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
    <div className="border border-border-primary bg-bg-secondary">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getTypeIcon(item.type)}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-mono text-text-primary">{item.title}</h3>
                  <span className={getStatusBadgeClass(item.status, item.type)}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-text-secondary font-mono">
                  <span>{formatDate(item.date)}</span>
                  <span className="mx-2 text-text-muted">•</span>
                  <span>{item.location}</span>
                  <span className="mx-2 text-text-muted">•</span>
                  <span className="text-text-muted">{getTypeLabel(item.type)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {renderActionButtons()}
            
            {hasExpandableContent() && (
              <button
                onClick={handleToggleExpansion}
                className="p-2 text-text-muted hover:text-text-primary transition-colors"
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
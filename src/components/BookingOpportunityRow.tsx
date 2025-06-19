import React, { useState, useCallback } from 'react';
import { BookingOpportunity } from '@/types/BookingOpportunity';
import { useCompetingOpportunities } from '@/hooks/useBookingOpportunities';
import { ItineraryDate } from './DateDisplay';
import { AlignedDate } from './TimelineItems/AlignedDate';
import { ExpansionIndicator } from './TimelineItems/ExpansionIndicator';
import { StatusBadge } from './StatusBadge';
import { DocumentActionButton, DeleteActionButton } from './ActionButtons';
import { UnifiedActionButton } from './ActionButtons/UnifiedActionButton';
import { 
  getTimelineRowStyling, 
  getTimelineTextStyling,
  timelineTypography 
} from '../utils/timelineRowStyling';
import { formatAgeRestriction } from '../utils/ageRestrictionUtils';

interface BookingOpportunityRowProps {
  opportunity: BookingOpportunity;
  perspective: 'ARTIST' | 'VENUE';
  permissions: any; // Will match existing permissions interface
  isExpanded: boolean;
  isDeleting?: boolean;
  
  // Context
  artistId?: string; // When viewing from artist page
  venueId?: string;  // When viewing from venue page
  
  // Event handlers
  onToggleExpansion: (opportunityId: string) => void;
  onAccept?: (opportunity: BookingOpportunity, reason?: string) => Promise<void>;
  onDecline?: (opportunity: BookingOpportunity, reason?: string) => Promise<void>;
  onCancel?: (opportunity: BookingOpportunity, reason?: string) => Promise<void>;
  onDelete?: (opportunityId: string, opportunityName: string) => Promise<void>;
  onShowDocument?: (opportunity: BookingOpportunity) => void;
  onMakeCounterOffer?: (opportunity: BookingOpportunity) => void;
  
  // For optimistic updates
  competingOpportunities?: BookingOpportunity[];
}

/**
 * BookingOpportunityRow - UNIFIED TIMELINE COMPONENT
 * 
 * This single component replaces:
 * - ShowTimelineItem (for confirmed shows)
 * - ShowRequestProcessor (for open requests)
 * 
 * SMART BEHAVIOR:
 * - CONFIRMED opportunities → Show lineup-style details on expansion
 * - PENDING/OPEN opportunities → Show competing offers on expansion
 * - Consistent styling and interaction regardless of source
 * 
 * FIXES Lightning Bolt Bug:
 * ✅ All booking opportunities route to same component
 * ✅ Consistent expansion behavior 
 * ✅ Same status display logic
 * ✅ Unified styling system
 */
export function BookingOpportunityRow({
  opportunity,
  perspective,
  permissions,
  isExpanded,
  isDeleting = false,
  artistId,
  venueId,
  onToggleExpansion,
  onAccept,
  onDecline,
  onCancel,
  onDelete,
  onShowDocument,
  onMakeCounterOffer,
  competingOpportunities: propCompetingOpportunities
}: BookingOpportunityRowProps) {
  
  // Get competing opportunities for this date (if not provided)
  const autoCompetingOpportunities = useCompetingOpportunities(
    opportunity.artistId,
    opportunity.proposedDate,
    opportunity.id
  );
  
  const competingOpportunities = propCompetingOpportunities || autoCompetingOpportunities;
  
  // Determine styling based on status
  const getStyleVariant = (): 'confirmed' | 'open' | 'hold' => {
    switch (opportunity.status) {
      case 'CONFIRMED':
        return 'confirmed';
      case 'PENDING':
      case 'OPEN':
        return 'open';
      case 'DECLINED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'open'; // Use open styling for inactive states
      default:
        return 'open';
    }
  };
  
  const styleVariant = getStyleVariant();
  const rowClassName = getTimelineRowStyling(styleVariant);
  const textColorClass = getTimelineTextStyling(styleVariant);
  
  // Generate smart title based on perspective
  const getDisplayTitle = () => {
    if (opportunity.title) {
      return opportunity.title;
    }
    
    // Fallback title generation
    if (perspective === 'ARTIST') {
      return `${opportunity.venue?.name || 'Venue'} Show`;
    } else {
      return `${opportunity.artist?.name || 'Artist'} Show`;
    }
  };
  
  // Get status badge
  const getStatusBadge = () => {
    const statusMap = {
      'OPEN': { type: 'pending' as const, text: 'Open' },
      'PENDING': { type: 'pending' as const, text: 'Pending' },
      'CONFIRMED': { type: 'confirmed' as const, text: 'Confirmed' },
      'DECLINED': { type: 'declined' as const, text: 'Declined' },
      'CANCELLED': { type: 'cancelled' as const, text: 'Cancelled' },
      'EXPIRED': { type: 'expired' as const, text: 'Expired' }
    };
    
    const badge = statusMap[opportunity.status] || statusMap['OPEN'];
    return <StatusBadge type={badge.type} text={badge.text} />;
  };
  
  // Format financial offer for display
  const getFinancialSummary = () => {
    const { financialOffer } = opportunity;
    if (!financialOffer) return null;
    
    const parts = [];
    if (financialOffer.guarantee) {
      parts.push(`$${financialOffer.guarantee} guarantee`);
    }
    if (financialOffer.doorDeal?.percentage) {
      parts.push(`${financialOffer.doorDeal.percentage}% door`);
    }
    if (financialOffer.ticketPrice?.door) {
      parts.push(`$${financialOffer.ticketPrice.door} tickets`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : null;
  };
  
  // Handle action buttons based on perspective and status
  const getActionButtons = () => {
    if (isDeleting) return null;
    
    const buttons = [];
    
    // Document button - always available
    if (onShowDocument) {
      buttons.push(
        <DocumentActionButton
          key="document"
          onClick={() => onShowDocument(opportunity)}
          title="View opportunity details"
        />
      );
    }
    
    // Status-specific actions
    if (opportunity.status === 'PENDING') {
      if (perspective === 'ARTIST' && onAccept && onDecline) {
        buttons.push(
          <UnifiedActionButton
            key="accept"
            variant="primary"
            size="sm"
            onClick={() => onAccept(opportunity)}
            className="text-green-600 hover:text-green-700"
          >
            Accept
          </UnifiedActionButton>
        );
        buttons.push(
          <UnifiedActionButton
            key="decline"
            variant="secondary"
            size="sm"
            onClick={() => onDecline(opportunity)}
            className="text-red-600 hover:text-red-700"
          >
            Decline
          </UnifiedActionButton>
        );
      }
      
      if (perspective === 'VENUE' && onMakeCounterOffer) {
        buttons.push(
          <UnifiedActionButton
            key="counter"
            variant="secondary"
            size="sm"
            onClick={() => onMakeCounterOffer(opportunity)}
          >
            Counter Offer
          </UnifiedActionButton>
        );
      }
    }
    
    if (opportunity.status === 'CONFIRMED' && onCancel) {
      buttons.push(
        <UnifiedActionButton
          key="cancel"
          variant="secondary"
          size="sm"
          onClick={() => onCancel(opportunity)}
          className="text-red-600 hover:text-red-700"
        >
          Cancel
        </UnifiedActionButton>
      );
    }
    
    // Delete button for appropriate permissions
    if (onDelete && permissions?.canDelete?.(opportunity)) {
      buttons.push(
        <DeleteActionButton
          key="delete"
          onClick={() => onDelete(opportunity.id, getDisplayTitle())}
          isLoading={isDeleting}
          title="Delete opportunity"
        />
      );
    }
    
    return buttons;
  };

  return (
    <>
      {/* Main Row */}
      <tr 
        className={rowClassName}
        onClick={() => onToggleExpansion(opportunity.id)}
      >
        {/* Expand/Collapse Button */}
        <td className="px-4 py-1 w-[3%]">
          <div className="flex items-center justify-center">
            <ExpansionIndicator isExpanded={isExpanded} />
          </div>
        </td>

        {/* Date */}
        <td className="px-4 py-1 w-[12%]">
          <AlignedDate 
            date={new Date(opportunity.proposedDate)} 
            className={timelineTypography.date} 
          />
        </td>

        {/* Location (only show if not on venue page) */}
        {!venueId && (
          <td className="px-4 py-1 w-[14%]">
            <div className="text-sm text-gray-600 truncate">
              {opportunity.locationInfo?.city && opportunity.locationInfo?.stateProvince ? (
                `${opportunity.locationInfo.city}, ${opportunity.locationInfo.stateProvince}`
              ) : (
                opportunity.venue?.name || 'Unknown Location'
              )}
            </div>
          </td>
        )}

        {/* Context-aware content */}
        <td className="px-4 py-1 w-[20%]">
          <div className="space-y-1">
            <div className={`font-medium ${textColorClass} truncate`}>
              {getDisplayTitle()}
            </div>
            
            {/* Show artist or venue based on perspective */}
            <div className="text-sm text-gray-600 truncate">
              {perspective === 'ARTIST' ? (
                opportunity.venue?.name || 'Unknown Venue'
              ) : (
                opportunity.artist?.name || 'Unknown Artist'
              )}
            </div>
            
            {/* Financial summary */}
            {getFinancialSummary() && (
              <div className="text-xs text-gray-500 truncate">
                {getFinancialSummary()}
              </div>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-1 w-[10%]">
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {competingOpportunities.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                +{competingOpportunities.length}
              </span>
            )}
          </div>
        </td>

        {/* Source (for debugging/migration) */}
        <td className="px-4 py-1 w-[8%]">
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            {opportunity.sourceType.replace('_', ' ')}
          </div>
        </td>

        {/* Capacity & Age */}
        <td className="px-4 py-1 w-[10%]">
          <div className="text-sm text-gray-600">
            <div>{opportunity.venueDetails?.capacity || '—'}</div>
            <div className="text-xs text-gray-500">
              {formatAgeRestriction(opportunity.venueDetails?.ageRestriction) || '—'}
            </div>
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-1 w-[12%]">
          <div className="flex items-center space-x-1">
            {getActionButtons()}
          </div>
        </td>
      </tr>

      {/* Expansion Content - Smart based on status */}
      {isExpanded && (
        <BookingOpportunityDetails
          opportunity={opportunity}
          perspective={perspective}
          competingOpportunities={competingOpportunities}
          permissions={permissions}
          venueId={venueId}
          onAction={async (action: string, reason?: string) => {
            switch (action) {
              case 'accept':
                if (onAccept) await onAccept(opportunity, reason);
                break;
              case 'decline':
                if (onDecline) await onDecline(opportunity, reason);
                break;
              case 'cancel':
                if (onCancel) await onCancel(opportunity, reason);
                break;
              case 'counter':
                if (onMakeCounterOffer) onMakeCounterOffer(opportunity);
                break;
            }
          }}
        />
      )}
    </>
  );
}

/**
 * BookingOpportunityDetails - Smart expansion component
 * 
 * CONFIRMED opportunities → Show lineup/show details
 * PENDING/OPEN opportunities → Show competing offers and comparison
 */
interface BookingOpportunityDetailsProps {
  opportunity: BookingOpportunity;
  perspective: 'ARTIST' | 'VENUE';
  competingOpportunities: BookingOpportunity[];
  permissions: any;
  venueId?: string;
  onAction: (action: string, reason?: string) => Promise<void>;
}

function BookingOpportunityDetails({
  opportunity,
  perspective,
  competingOpportunities,
  permissions,
  venueId,
  onAction
}: BookingOpportunityDetailsProps) {
  
  if (opportunity.status === 'CONFIRMED') {
    // For confirmed opportunities, show show details (like old ShowTimelineItem expansion)
    return (
      <tr>
        <td colSpan={venueId ? 8 : 9} className="px-0 py-0">
          <div className="bg-green-50 border-l-4 border-green-200">
            <div className="p-4">
              <h4 className="font-medium text-green-900 mb-3">Confirmed Show Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {/* Performance Details */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Performance</h5>
                  <div className="space-y-1 text-gray-600">
                    {opportunity.performanceDetails?.billingPosition && (
                      <div>Position: {opportunity.performanceDetails.billingPosition}</div>
                    )}
                    {opportunity.performanceDetails?.setLength && (
                      <div>Set Length: {opportunity.performanceDetails.setLength} min</div>
                    )}
                    {opportunity.performanceDetails?.otherActs && (
                      <div>Other Acts: {opportunity.performanceDetails.otherActs}</div>
                    )}
                  </div>
                </div>
                
                {/* Financial Terms */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Financial</h5>
                  <div className="space-y-1 text-gray-600">
                    {opportunity.financialOffer?.guarantee && (
                      <div>Guarantee: ${opportunity.financialOffer.guarantee}</div>
                    )}
                    {opportunity.financialOffer?.doorDeal?.percentage && (
                      <div>Door Split: {opportunity.financialOffer.doorDeal.percentage}%</div>
                    )}
                    {opportunity.financialOffer?.ticketPrice?.door && (
                      <div>Ticket Price: ${opportunity.financialOffer.ticketPrice.door}</div>
                    )}
                  </div>
                </div>
                
                {/* Schedule */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Schedule</h5>
                  <div className="space-y-1 text-gray-600">
                    {opportunity.venueDetails?.schedule?.loadIn && (
                      <div>Load In: {opportunity.venueDetails.schedule.loadIn}</div>
                    )}
                    {opportunity.venueDetails?.schedule?.soundcheck && (
                      <div>Soundcheck: {opportunity.venueDetails.schedule.soundcheck}</div>
                    )}
                    {opportunity.venueDetails?.schedule?.showTime && (
                      <div>Show Time: {opportunity.venueDetails.schedule.showTime}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  } else {
    // For pending/open opportunities, show competing offers (like old ShowRequestProcessor expansion)
    return (
      <tr>
        <td colSpan={venueId ? 8 : 9} className="px-0 py-0">
          <div className="bg-blue-50 border-l-4 border-blue-200">
            <div className="p-4">
              <h4 className="font-medium text-blue-900 mb-3">
                Booking Opportunity Details
                {competingOpportunities.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-blue-700">
                    ({competingOpportunities.length + 1} total offers for this date)
                  </span>
                )}
              </h4>
              
              {/* Current Opportunity Details */}
              <div className="mb-4 p-3 bg-white rounded border">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900">
                    {opportunity.venue?.name || 'Current Offer'}
                  </h5>
                  <StatusBadge 
                    type={opportunity.status === 'PENDING' ? 'pending' : 'open'} 
                    text={opportunity.status} 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Financial:</strong>
                    <div>
                      {opportunity.financialOffer?.guarantee && `$${opportunity.financialOffer.guarantee} guarantee`}
                      {opportunity.financialOffer?.doorDeal?.percentage && ` • ${opportunity.financialOffer.doorDeal.percentage}% door`}
                    </div>
                  </div>
                  <div>
                    <strong>Venue:</strong>
                    <div>{opportunity.venueDetails?.capacity} cap • {formatAgeRestriction(opportunity.venueDetails?.ageRestriction)}</div>
                  </div>
                  <div>
                    <strong>Position:</strong>
                    <div>{opportunity.performanceDetails?.billingPosition || 'TBD'}</div>
                  </div>
                </div>
                
                {opportunity.message && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <strong>Message:</strong> {opportunity.message}
                  </div>
                )}
              </div>
              
              {/* Competing Opportunities */}
              {competingOpportunities.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Competing Offers</h5>
                  <div className="space-y-2">
                    {competingOpportunities.map((competing) => (
                      <div key={competing.id} className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{competing.venue?.name}</span>
                          <StatusBadge 
                            type={competing.status === 'PENDING' ? 'pending' : 'open'} 
                            text={competing.status} 
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          {competing.financialOffer?.guarantee && `$${competing.financialOffer.guarantee} guarantee`}
                          {competing.financialOffer?.doorDeal?.percentage && ` • ${competing.financialOffer.doorDeal.percentage}% door`}
                          {competing.venueDetails?.capacity && ` • ${competing.venueDetails.capacity} cap`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              {perspective === 'ARTIST' && opportunity.status === 'PENDING' && (
                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <UnifiedActionButton
                    variant="primary"
                    size="md"
                    onClick={() => onAction('accept')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Accept This Offer
                  </UnifiedActionButton>
                  <UnifiedActionButton
                    variant="secondary"
                    size="md"
                    onClick={() => onAction('decline')}
                    className="text-red-600 hover:text-red-700"
                  >
                    Decline
                  </UnifiedActionButton>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  }
} 
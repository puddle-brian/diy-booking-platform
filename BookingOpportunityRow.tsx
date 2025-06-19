import React, { useState } from 'react';
import { BookingOpportunity } from '../types/BookingOpportunity';
import { UnifiedActionButton } from './ActionButtons/UnifiedActionButton';
import { StatusBadge } from './StatusBadge';
import { ExpansionContainer } from './ExpansionContainer';
import { BookingOpportunityDetails } from './BookingOpportunityDetails';

interface BookingOpportunityRowProps {
  opportunity: BookingOpportunity;
  perspective: 'ARTIST' | 'VENUE';
  permissions: any;
  isExpanded: boolean;
  onToggleExpansion: (id: string) => void;
  onAccept?: (opportunity: BookingOpportunity) => Promise<void>;
  onDecline?: (opportunity: BookingOpportunity, reason?: string) => Promise<void>;
  onCancel?: (opportunity: BookingOpportunity) => Promise<void>;
  onDelete?: (opportunity: BookingOpportunity) => Promise<void>;
  onHold?: (opportunity: BookingOpportunity) => Promise<void>;
  competingOpportunities?: BookingOpportunity[];
  className?: string;
}

/**
 * BookingOpportunityRow - THE UNIFIED COMPONENT
 * 
 * This single component replaces:
 * - ShowRequestProcessor (for open requests)
 * - ShowTimelineItem (for confirmed shows)
 * - All the synthetic conversion logic
 * 
 * ELIMINATES the Lightning Bolt bug by treating ALL booking 
 * opportunities identically regardless of source.
 */
export function BookingOpportunityRow({
  opportunity,
  perspective,
  permissions,
  isExpanded,
  onToggleExpansion,
  onAccept,
  onDecline,
  onCancel,
  onDelete,
  onHold,
  competingOpportunities = [],
  className = ''
}: BookingOpportunityRowProps) {
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UNIFIED STYLING - Same styling logic for all opportunities
  const getRowStyling = () => {
    switch (opportunity.status) {
      case 'CONFIRMED':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'PENDING':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      case 'DECLINED':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'EXPIRED':
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
      case 'CANCELLED':
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
      default: // OPEN
        return 'bg-white border-gray-200 hover:bg-gray-50';
    }
  };
  
  const getTextStyling = () => {
    switch (opportunity.status) {
      case 'CONFIRMED':
        return 'text-green-900';
      case 'PENDING':
        return 'text-yellow-900';
      case 'DECLINED':
        return 'text-red-900';
      case 'EXPIRED':
      case 'CANCELLED':
        return 'text-gray-600';
      default: // OPEN
        return 'text-gray-900';
    }
  };
  
  // UNIFIED ACTIONS - Same action logic for all opportunities
  const handleAction = async (action: string, reason?: string) => {
    setIsProcessing(true);
    try {
      switch (action) {
        case 'accept':
          await onAccept?.(opportunity);
          break;
        case 'decline':
          await onDecline?.(opportunity, reason);
          break;
        case 'cancel':
          await onCancel?.(opportunity);
          break;
        case 'delete':
          await onDelete?.(opportunity);
          break;
        case 'hold':
          await onHold?.(opportunity);
          break;
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // UNIFIED DISPLAY LOGIC
  const displayInfo = {
    title: opportunity.title,
    subtitle: getSubtitle(),
    date: opportunity.proposedDate,
    location: `${opportunity.locationInfo.city}, ${opportunity.locationInfo.stateProvince || opportunity.locationInfo.country}`,
    venue: opportunity.locationInfo.venue.name,
    financial: getFinancialSummary(),
    billing: opportunity.performanceDetails?.billingPosition || 'TBD',
    status: opportunity.status
  };
  
  function getSubtitle() {
    if (perspective === 'ARTIST') {
      return `${opportunity.locationInfo.venue.name} • ${opportunity.locationInfo.city}`;
    } else {
      // Venue perspective - show artist name
      return `with ${opportunity.artist?.name || 'Unknown Artist'}`;
    }
  }
  
  function getFinancialSummary() {
    const parts = [];
    if (opportunity.financialOffer?.guarantee) {
      parts.push(`$${opportunity.financialOffer.guarantee}`);
    }
    if (opportunity.financialOffer?.doorDeal) {
      parts.push(opportunity.financialOffer.doorDeal.split);
    }
    return parts.join(' + ') || 'TBD';
  }
  
  // ACTION BUTTONS - Same logic for all opportunities
  const getActionButtons = () => {
    const canTakeAction = permissions.canTakeAction(opportunity, perspective);
    if (!canTakeAction) return null;
    
    switch (opportunity.status) {
      case 'OPEN':
      case 'PENDING':
        return (
          <>
            <UnifiedActionButton
              variant="primary"
              size="sm"
              onClick={() => handleAction('accept')}
              disabled={isProcessing}
            >
              Accept
            </UnifiedActionButton>
            <UnifiedActionButton
              variant="secondary"
              size="sm"
              onClick={() => handleAction('decline')}
              disabled={isProcessing}
            >
              Decline
            </UnifiedActionButton>
            {permissions.canHold && (
              <UnifiedActionButton
                variant="warning" 
                size="sm"
                onClick={() => handleAction('hold')}
                disabled={isProcessing}
              >
                Hold
              </UnifiedActionButton>
            )}
          </>
        );
        
      case 'CONFIRMED':
        return permissions.canCancel ? (
          <UnifiedActionButton
            variant="danger"
            size="sm"
            onClick={() => handleAction('cancel')}
            disabled={isProcessing}
          >
            Cancel
          </UnifiedActionButton>
        ) : null;
        
      default:
        return permissions.canDelete ? (
          <UnifiedActionButton
            variant="ghost"
            size="sm"
            onClick={() => handleAction('delete')}
            disabled={isProcessing}
          >
            Delete
          </UnifiedActionButton>
        ) : null;
    }
  };
  
  return (
    <>
      {/* UNIFIED ROW - Same structure for all opportunities */}
      <tr className={`border-b transition-colors duration-150 ${getRowStyling()} ${className}`}>
        
        {/* Date Column */}
        <td className="px-3 py-3 text-sm">
          <div className={`font-medium ${getTextStyling()}`}>
            {new Date(opportunity.proposedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(opportunity.proposedDate).toLocaleDateString('en-US', {
              year: 'numeric'
            })}
          </div>
        </td>
        
        {/* Title/Venue Column */}
        <td className="px-3 py-3">
          <div className={`font-medium ${getTextStyling()}`}>
            {displayInfo.title}
          </div>
          <div className="text-sm text-gray-600">
            {displayInfo.subtitle}
          </div>
        </td>
        
        {/* Financial Column */}
        <td className="px-3 py-3 text-sm">
          <div className={`font-medium ${getTextStyling()}`}>
            {displayInfo.financial}
          </div>
          {opportunity.performanceDetails?.setLength && (
            <div className="text-xs text-gray-500">
              {opportunity.performanceDetails.setLength}min set
            </div>
          )}
        </td>
        
        {/* Billing Column */}
        <td className="px-3 py-3 text-sm">
          <span className={`capitalize ${getTextStyling()}`}>
            {displayInfo.billing.toLowerCase().replace('_', ' ')}
          </span>
        </td>
        
        {/* Status Column */}
        <td className="px-3 py-3">
          <StatusBadge 
            status={opportunity.status} 
            variant={opportunity.status.toLowerCase()} 
          />
        </td>
        
        {/* Actions Column */}
        <td className="px-3 py-3">
          <div className="flex space-x-2 justify-end">
            {getActionButtons()}
            
            {/* Expand Button */}
            <UnifiedActionButton
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpansion(opportunity.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </UnifiedActionButton>
          </div>
        </td>
      </tr>
      
      {/* UNIFIED EXPANSION - Same expansion for all opportunities */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-0 py-0">
            <ExpansionContainer variant={opportunity.status.toLowerCase()}>
              <BookingOpportunityDetails
                opportunity={opportunity}
                perspective={perspective}
                competingOpportunities={competingOpportunities}
                permissions={permissions}
                onAction={handleAction}
              />
            </ExpansionContainer>
          </td>
        </tr>
      )}
    </>
  );
} 
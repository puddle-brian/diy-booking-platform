import React, { useState } from 'react';
import { ModuleDefinition, ModuleComponentProps } from './ModuleRegistry';

/**
 * 🎵 LINEUP MODULE - Displays native lineup data from show.lineup array
 * 
 * This module shows the complete lineup for multi-artist shows including:
 * - All artists with their billing positions
 * - Set lengths and performance order
 * - Individual guarantees (if viewer has permission)
 * - Artist links and contact info
 * 
 * This replaces the old workaround system that parsed lineup from notes.
 */

interface LineupItem {
  artistId: string;
  artistName: string;
  billingPosition: 'HEADLINER' | 'CO_HEADLINER' | 'SUPPORT' | 'OPENER' | 'LOCAL_SUPPORT';
  performanceOrder: number;
  setLength?: number;
  guarantee?: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
}

function LineupComponent({
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
  
  // Show empty state if no lineup data
  if (!data || !data.lineup || data.lineup.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎵</span>
        </div>
        <p className="font-medium mb-2">No Lineup Information</p>
        <p className="text-sm">
          {viewerType === 'venue' 
            ? "Add artists to the lineup to see them here."
            : "Lineup details will appear here when available."
          }
        </p>
      </div>
    );
  }

  const lineup = data.lineup || [];
  const sortedLineup = [...lineup].sort((a, b) => a.performanceOrder - b.performanceOrder);

  const getBillingPositionBadge = (billingPosition: string, status: string) => {
    const abbreviations: Record<string, string> = {
      'HEADLINER': 'HL',
      'CO_HEADLINER': 'CH', 
      'SUPPORT': 'SP',
      'OPENER': 'OP',
      'LOCAL_SUPPORT': 'LS'
    };

    const abbr = abbreviations[billingPosition] || billingPosition.slice(0, 2);

    let colorClass = '';
    switch (status.toLowerCase()) {
      case 'confirmed':
        colorClass = 'bg-green-100 text-green-800 border-green-300';
        break;
      case 'pending':
        colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
        break;
      case 'cancelled':
        colorClass = 'bg-red-100 text-red-800 border-red-300';
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800 border-gray-300';
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
        {abbr}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⏳ Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ✗ Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const canSeeFinancials = viewerType !== 'public';

  if (isEditing) {
    // For now, editing is not implemented - lineup management would be complex
    // Future: Could add drag-and-drop reordering, add/remove artists, etc.
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <p className="font-medium mb-2">Lineup Editing Not Available</p>
        <p className="text-sm mb-4">
          Lineup management is handled through the main booking system.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Regular view mode - show the complete lineup
  return (
    <div className="space-y-4">
      {/* Lineup Overview */}
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-gray-800">
          Show Lineup ({lineup.length} {lineup.length === 1 ? 'Artist' : 'Artists'})
        </h5>
        <div className="text-sm text-gray-600">
          Performance Order
        </div>
      </div>

      {/* Lineup Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              <th className="px-4 py-3 w-[5%]">#</th>
              <th className="px-4 py-3 w-[30%]">Artist</th>
              <th className="px-4 py-3 w-[15%]">Position</th>
              <th className="px-4 py-3 w-[12%]">Status</th>
              <th className="px-4 py-3 w-[12%]">Set Length</th>
              {canSeeFinancials && (
                <th className="px-4 py-3 w-[15%]">Guarantee</th>
              )}
              <th className="px-4 py-3 w-[11%]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLineup.map((lineupItem, index) => (
              <tr key={`${lineupItem.artistId}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {lineupItem.performanceOrder}
                </td>
                
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {lineupItem.artistId && lineupItem.artistId !== 'external-artist' ? (
                      <a 
                        href={`/artists/${lineupItem.artistId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        title="View artist page"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {lineupItem.artistName}
                      </a>
                    ) : (
                      <span>{lineupItem.artistName}</span>
                    )}
                  </div>
                  {lineupItem.billingPosition === 'HEADLINER' && (
                    <div className="text-xs text-gray-500 mt-1">Main Act</div>
                  )}
                </td>
                
                <td className="px-4 py-3">
                  {getBillingPositionBadge(lineupItem.billingPosition, lineupItem.status)}
                </td>
                
                <td className="px-4 py-3">
                  {getStatusBadge(lineupItem.status)}
                </td>
                
                <td className="px-4 py-3 text-sm text-gray-900">
                  {lineupItem.setLength ? `${lineupItem.setLength} min` : '-'}
                </td>
                
                {canSeeFinancials && (
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {lineupItem.guarantee ? `$${lineupItem.guarantee}` : '-'}
                  </td>
                )}
                
                <td className="px-4 py-3 text-sm">
                  {lineupItem.artistId && lineupItem.artistId !== 'external-artist' && (
                    <a 
                      href={`/artists/${lineupItem.artistId}`}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Profile
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lineup Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Total Artists:</span>
            <span className="ml-2 text-gray-900">{lineup.length}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Confirmed:</span>
            <span className="ml-2 text-gray-900">
              {lineup.filter((item: LineupItem) => item.status === 'CONFIRMED').length}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total Set Time:</span>
            <span className="ml-2 text-gray-900">
              {lineup.reduce((total: number, item: LineupItem) => total + (item.setLength || 0), 0)} min
            </span>
          </div>
          {canSeeFinancials && (
            <div>
              <span className="font-medium text-gray-700">Total Guarantees:</span>
              <span className="ml-2 text-gray-900">
                ${lineup.reduce((total: number, item: LineupItem) => total + (item.guarantee || 0), 0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Show title generation info */}
      {lineup.length > 1 && (
        <div className="text-xs text-gray-500 mt-2">
          💡 This multi-artist lineup will display as "{data.showTitle || 'Smart Show Title'}" in timelines
        </div>
      )}
    </div>
  );
}

/**
 * Lineup Module Definition
 */
export const lineupModule: ModuleDefinition = {
  id: 'lineup',
  title: 'Show Lineup',
  owner: 'shared', // Both artist and venue can view, venue typically manages
  order: 1, // Show first - this is the most important info
  defaultStatus: 'committed', // Lineup is usually confirmed when show is created
  
  canEdit: (viewerType: string, status: string) => {
    // For now, editing is not implemented - lineup management is complex
    // Future: Could allow venue managers to edit lineup
    return false;
  },
  
  canView: (viewerType: string) => {
    return true; // Everyone can view lineup information
  },
  
  extractData: (context: any) => {
    if (context.show && context.show.lineup) {
      // Extract native lineup data from the new architecture
      return {
        lineup: context.show.lineup,
        showTitle: context.show.title,
        showId: context.show.id,
        venueId: context.show.venueId,
        venueName: context.show.venueName,
        date: context.show.date
      };
    }
    
    if (context.bid) {
      // For bids, we might have limited lineup info
      // This could include the main artist plus any mentioned support acts
      const lineup = [];
      
      // Add the main artist from the bid
      if (context.bid.artistId && context.bid.artistName) {
        lineup.push({
          artistId: context.bid.artistId,
          artistName: context.bid.artistName,
          billingPosition: context.bid.billingPosition || 'HEADLINER',
          performanceOrder: 1,
          setLength: context.bid.setLength,
          guarantee: context.bid.guarantee,
          status: 'CONFIRMED'
        });
      }
      
      // Parse other acts if mentioned in bid
      if (context.bid.otherActs) {
        // Simple parsing - in the future this could be more sophisticated
        const otherActsText = context.bid.otherActs;
        if (otherActsText.toLowerCase().includes('support') || 
            otherActsText.toLowerCase().includes('opener')) {
          lineup.push({
            artistId: 'external-artist',
            artistName: otherActsText,
            billingPosition: 'SUPPORT',
            performanceOrder: 2,
            setLength: null,
            guarantee: null,
            status: 'PENDING'
          });
        }
      }
      
      return {
        lineup,
        showTitle: `${context.bid.artistName} at ${context.bid.venueName}`,
        showId: null,
        venueId: context.bid.venueId,
        venueName: context.bid.venueName,
        date: context.bid.proposedDate
      };
    }
    
    if (context.tourRequest) {
      // Tour requests don't have lineup yet - show single artist
      if (context.tourRequest.artistId && context.tourRequest.artistName) {
        return {
          lineup: [{
            artistId: context.tourRequest.artistId,
            artistName: context.tourRequest.artistName,
            billingPosition: 'HEADLINER',
            performanceOrder: 1,
            setLength: null,
            guarantee: null,
            status: 'PENDING'
          }],
          showTitle: context.tourRequest.title,
          showId: null,
          venueId: null,
          venueName: context.tourRequest.location,
          date: context.tourRequest.startDate
        };
      }
    }
    
    // No lineup data available
    return { lineup: [] };
  },
  
  component: LineupComponent
}; 
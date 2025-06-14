import React, { useState, useEffect } from 'react';
import { Show, VenueBid, LineupPosition } from '../../../types';
import { ItineraryPermissions } from '../../hooks/useItineraryPermissions';
import { ItineraryDate } from '../DateDisplay';
import { DeleteActionButton, DocumentActionButton } from '../ActionButtons';
import { LineupInvitationModal } from '../modals/LineupInvitationModal';
import { BidActionButtons } from '../ActionButtons/BidActionButtons';

interface LineupBid extends VenueBid {
  isLineupSlot: true;
  parentShowId: string;
  lineupRole: LineupPosition;
  billingOrder: number;
  invitedByUserId: string;
  tourRequest?: {
    artist: {
      id: string;
      name: string;
    };
  };
  bidder?: {
    id: string;
    username: string;
  };
}

interface ShowTimelineItemProps {
  show: Show;
  permissions: ItineraryPermissions;
  isExpanded: boolean;
  isDeleting: boolean;
  artistId?: string; // Page context: if present, we're on an artist page
  venueId?: string;  // Page context: if present, we're on a venue page
  onToggleExpansion: (showId: string) => void;
  onDeleteShow: (showId: string, showName: string) => void;
  onShowDocument: (show: Show) => void;
  onShowDetail: (show: Show) => void;
}

export function ShowTimelineItem({
  show,
  permissions,
  isExpanded,
  isDeleting,
  artistId,
  venueId,
  onToggleExpansion,
  onDeleteShow,
  onShowDocument,
  onShowDetail
}: ShowTimelineItemProps) {
  const [lineupBids, setLineupBids] = useState<LineupBid[]>([]);
  const [loadingLineup, setLoadingLineup] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);

  // Fetch lineup bids when expanded
  useEffect(() => {
    if (isExpanded && !loadingLineup) {
      fetchLineupBids();
    }
  }, [isExpanded, show.id]);

  const fetchLineupBids = async () => {
    setLoadingLineup(true);
    try {
      // Query bids where isLineupSlot=true and parentShowId=show.id
      console.log(`🎵 Fetching lineup bids for show ${show.id}`);
      const response = await fetch(`/api/bids?parentShowId=${show.id}&isLineupSlot=true`);
      if (response.ok) {
        const bids = await response.json();
        console.log(`🎵 Received ${bids.length} lineup bids:`, bids);
        console.log(`🎵 DEBUG - First bid data:`, bids[0]);
        console.log(`🎵 DEBUG - First bid guarantee:`, bids[0]?.guarantee);
        console.log(`🎵 DEBUG - First bid amount:`, bids[0]?.amount);
        setLineupBids(bids.sort((a: LineupBid, b: LineupBid) => a.billingOrder - b.billingOrder));
      } else {
        console.error('Failed to fetch lineup bids:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch lineup bids:', error);
    } finally {
      setLoadingLineup(false);
    }
  };

  // Generate automatic show title based on lineup
  const generateShowTitle = (show: Show) => {
    const headlinerName = show.artistName || 'Unknown Artist';
    
    // Count support acts from lineup bids
    const supportCount = lineupBids.filter(bid => bid.lineupRole !== 'HEADLINER').length;
    
    if (supportCount === 0) {
      return headlinerName;
    } else {
      return `${headlinerName} +${supportCount}`;
    }
  };

  const showTitle = generateShowTitle(show);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: LineupPosition) => {
    switch (role) {
      case 'HEADLINER': return 'Headliner';
      case 'DIRECT_SUPPORT': return 'Direct Support';
      case 'OPENER': return 'Opener';
      case 'LOCAL_OPENER': return 'Local Opener';
      default: return role;
    }
  };

  const getRowColor = (role: LineupPosition) => {
    switch (role) {
      case 'HEADLINER': return 'bg-green-50 hover:bg-green-100';
      case 'DIRECT_SUPPORT': return 'bg-blue-50 hover:bg-blue-100';
      case 'OPENER': return 'bg-yellow-50 hover:bg-yellow-100';
      case 'LOCAL_OPENER': return 'bg-purple-50 hover:bg-purple-100';
      default: return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  const handleInvitationSent = () => {
    // Refresh lineup bids after sending invitation
    fetchLineupBids();
  };

  const handleLineupResponse = async (bidId: string, action: 'accept' | 'decline', reason?: string) => {
    try {
      const response = await fetch(`/api/lineup-invitations/${bidId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reason
        }),
      });

      if (response.ok) {
        // Refresh lineup bids to show updated status
        fetchLineupBids();
      } else {
        const error = await response.json();
        alert(`Failed to ${action} invitation: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} lineup invitation:`, error);
      alert(`Failed to ${action} invitation. Please try again.`);
    }
  };

  // 🎯 NEW: Unified lineup bid action handler that works with BidActionButtons
  const handleLineupBidAction = async (bid: any, action: string, reason?: string) => {
    // Convert action to lineup invitation format
    const lineupAction = action === 'accept' ? 'accept' : 
                        action === 'decline' ? 'decline' : 
                        action; // Pass through other actions as-is
    
    await handleLineupResponse(bid.id, lineupAction as 'accept' | 'decline', reason);
  };

  return (
    <>
      <tr 
        className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
        onClick={() => onToggleExpansion(show.id)}
      >
        <td className="px-4 py-3 w-[3%]">
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </td>

        <td className="px-4 py-3 w-[12%]">
          <ItineraryDate
            date={show.date}
            className="text-sm font-medium text-gray-900"
          />
        </td>

        <td className="px-4 py-3 w-[14%]">
          <div className="text-sm text-gray-900 truncate">
            {show.city && show.state ? `${show.city}, ${show.state}` : '-'}
          </div>
        </td>

        <td className="px-4 py-3 w-[19%]">
          <div className="text-sm font-medium text-gray-900 truncate">
            {(() => {
              // Determine what to show based on PAGE CONTEXT, not viewer type
              const showVenueInfo = artistId; // If we're on an artist page, show venue info
              const showArtistInfo = venueId;  // If we're on a venue page, show artist info
              
              if (showVenueInfo) {
                // Show venue information (we're on an artist page)
                if (show.venueId && show.venueId !== 'external-venue') {
                  return (
                    <a 
                      href={`/venues/${show.venueId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      title="View venue page"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {show.venueName || 'TBA'}
                    </a>
                  );
                } else {
                  return show.venueName || 'TBA';
                }
              } else if (showArtistInfo) {
                // Show artist information (we're on a venue page) - use show title
                if (show.artistId && show.artistId !== 'external-artist') {
                  return (
                    <a 
                      href={`/artists/${show.artistId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      title="View artist page"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {showTitle}
                    </a>
                  );
                } else {
                  return showTitle;
                }
              } else {
                // Fallback: general pages, use viewer type logic
                if (permissions.actualViewerType === 'venue') {
                  return showTitle;
                } else {
                  return show.venueName || 'TBA';
                }
              }
            })()}
          </div>
        </td>

        <td className="px-4 py-3 w-[10%]">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Confirmed
          </span>
        </td>

        <td className="px-4 py-3 w-[7%]">
          <div className="text-xs text-gray-600">{show.capacity || '-'}</div>
        </td>

        <td className="px-4 py-3 w-[7%]">
          <div className="text-xs text-gray-600 whitespace-nowrap">
            {show.ageRestriction?.toLowerCase().replace('_', '-') || 'all-ages'}
          </div>
        </td>

        <td className="px-4 py-3 w-[10%]">
          <div className="text-xs text-gray-600">
            {permissions.canSeeFinancialDetails(show) ? (show.guarantee ? `$${show.guarantee}` : '-') : '-'}
          </div>
        </td>

        <td className="px-4 py-3 w-[8%]">
          <div className="flex items-center space-x-1">
            {permissions.canViewShowDocument(show) && (
              <DocumentActionButton
                type="show"
                show={show}
                permissions={permissions}
                onShowDocument={() => onShowDocument(show)}
              />
            )}
          </div>
        </td>

        <td className="px-4 py-3 w-[10%]">
          {permissions.canEditShow(show) && (
            <DeleteActionButton
              show={show}
              permissions={permissions}
              venueOffers={[]}
              venueBids={[]}
              isLoading={isDeleting}
              onDeleteShow={onDeleteShow}
            />
          )}
        </td>
      </tr>

      {/* Lineup child rows */}
      {isExpanded && (
        <>
          {loadingLineup ? (
            <tr className="bg-gray-50">
              <td colSpan={10} className="px-4 py-3 text-center text-sm text-gray-500">
                Loading lineup...
              </td>
            </tr>
          ) : (
            <>
              {/* Headliner row (always shown) */}
              <tr className={getRowColor('HEADLINER')}>
                <td className="px-2 py-1.5 w-[3%]">
                  <div className="flex items-center justify-center text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                </td>

                <td className="px-4 py-1.5 w-[12%]">
                  <ItineraryDate
                    date={show.date}
                    className="text-sm font-medium text-green-900"
                  />
                </td>

                <td className="px-4 py-1.5 w-[14%]">
                  <div className="text-sm text-green-900 truncate">
                    {show.city && show.state ? `${show.city}, ${show.state}` : '-'}
                  </div>
                </td>

                <td className="px-4 py-1.5 w-[19%]">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {show.artistName || 'Unknown Artist'}
                    <span className="text-xs text-gray-500 ml-2">• Headliner</span>
                  </div>
                </td>

                <td className="px-4 py-1.5 w-[10%]">
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Confirmed
                  </span>
                </td>

                <td className="px-4 py-1.5 w-[7%]">
                  <div className="text-xs text-gray-600">{show.capacity || '-'}</div>
                </td>

                <td className="px-4 py-1.5 w-[7%]">
                  <div className="text-xs text-gray-600 whitespace-nowrap">
                    {show.ageRestriction?.toLowerCase().replace('_', '-') || 'all-ages'}
                  </div>
                </td>

                <td className="px-4 py-1.5 w-[10%]">
                  <div className="text-xs text-gray-600">
                    {permissions.canSeeFinancialDetails(show) ? (show.guarantee ? `$${show.guarantee}` : 'Fee TBD') : '-'}
                  </div>
                </td>

                <td className="px-4 py-1.5 w-[8%]">
                  <div className="flex items-center space-x-1">
                    {permissions.canViewShowDocument(show) && (
                      <DocumentActionButton
                        type="show"
                        show={show}
                        permissions={permissions}
                        onShowDocument={() => onShowDocument(show)}
                      />
                    )}
                  </div>
                </td>

                <td className="px-4 py-1.5 w-[10%]">
                  <div className="flex items-center space-x-1">
                    {/* Future: Edit headliner button */}
                  </div>
                </td>
              </tr>

              {/* Support act rows from lineup bids */}
              {lineupBids.map((bid) => (
                <tr key={bid.id} className={getRowColor(bid.lineupRole)}>
                  <td className="px-2 py-1.5 w-[3%]">
                    <div className="flex items-center justify-center text-gray-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </td>

                  <td className="px-4 py-1.5 w-[12%]">
                    <ItineraryDate
                      date={show.date}
                      className="text-sm font-medium text-gray-900"
                    />
                  </td>

                  <td className="px-4 py-1.5 w-[14%]">
                    <div className="text-sm text-gray-900 truncate">
                      {show.city && show.state ? `${show.city}, ${show.state}` : '-'}
                    </div>
                  </td>

                  <td className="px-4 py-1.5 w-[19%]">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {bid.tourRequest?.artist?.name || 'Unknown Artist'}
                      <span className="text-xs text-gray-500 ml-2">• {getRoleLabel(bid.lineupRole)}</span>
                    </div>
                  </td>

                  <td className="px-4 py-1.5 w-[10%]">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(bid.status)}`}>
                      {bid.status === 'accepted' ? 'Confirmed' : bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </span>
                  </td>

                  <td className="px-4 py-1.5 w-[7%]">
                    <div className="text-xs text-gray-600">{bid.setLength ? `${bid.setLength}m` : '-'}</div>
                  </td>

                  <td className="px-4 py-1.5 w-[7%]">
                    <div className="text-xs text-gray-600 whitespace-nowrap">
                      {show.ageRestriction?.toLowerCase().replace('_', '-') || 'all-ages'}
                    </div>
                  </td>

                  <td className="px-4 py-1.5 w-[10%]">
                    <div className="text-xs text-gray-600">
                      {(() => {
                        // For lineup bids, check if artist can see their own bid details
                        // Create a minimal request object for permission checking
                        const mockRequest = bid.tourRequest ? {
                          id: bid.showRequestId,
                          artistId: bid.tourRequest.artist.id,
                        } as any : undefined;
                        const canSeeFinancial = permissions.canSeeFinancialDetails(show, bid, mockRequest);
                        const hasGuarantee = bid.guarantee;
                        console.log(`🎵 GUARANTEE DEBUG - canSeeFinancial: ${canSeeFinancial}, hasGuarantee: ${hasGuarantee}, guarantee: ${bid.guarantee}`);
                        return canSeeFinancial ? (hasGuarantee ? `$${bid.guarantee}` : 'TBD') : '-';
                      })()}
                    </div>
                  </td>

                  <td className="px-4 py-1.5 w-[8%]">
                    <div className="flex items-center space-x-1">
                      {/* Document button for lineup slot - treat as show document since it's a confirmed show */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowDocument(show);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-300 rounded-lg transition-colors duration-150"
                        title="View show document"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-1.5 w-[10%]">
                    <div className="flex items-center space-x-1">
                      {/* 🎯 FIX: Use standard BidActionButtons instead of custom LineupActionButtons */}
                      <BidActionButtons
                        bid={bid}
                        request={bid.tourRequest ? {
                          id: bid.showRequestId,
                          title: `${bid.lineupRole} for ${show.venueName}`,
                          artistId: bid.tourRequest.artist.id,
                          artistName: bid.tourRequest.artist.name,
                          isVenueInitiated: false,
                          createdById: bid.invitedByUserId,
                          requestDate: show.date,
                          targetLocations: [],
                          genres: [],
                          description: '',
                          status: 'ACTIVE',
                          isLegacyRange: false,
                          createdAt: bid.createdAt,
                          updatedAt: bid.updatedAt
                        } as any : undefined}
                        permissions={permissions}
                        bidStatus={bid.status.toLowerCase() as any}
                        isLoading={false}
                        venueOffers={[]}
                        onBidAction={handleLineupBidAction}
                        onOfferAction={async () => {}} // Not needed for lineup bids
                        currentArtistId={artistId}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {/* Add Support Act Button Row - styled to match child rows */}
              {permissions.canEditShow(show) && (
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                  <td colSpan={10} className="px-4 py-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInvitationModal(true);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-4 rounded border-2 border-dashed border-green-400 transition-colors duration-150 flex items-center justify-center space-x-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Support Act</span>
                    </button>
                  </td>
                </tr>
              )}
            </>
          )}
        </>
      )}

      {/* Lineup Invitation Modal */}
      <LineupInvitationModal
        isOpen={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        showId={show.id}
        showDate={show.date}
        venueName={show.venueName || 'TBA'}
        onInvitationSent={handleInvitationSent}
      />
    </>
  );
} 
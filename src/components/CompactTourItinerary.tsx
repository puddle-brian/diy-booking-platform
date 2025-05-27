'use client';

import React, { useState, useEffect } from 'react';

interface Show {
  id: string;
  artistId: string;
  artistName: string;
  venueId: string;
  venueName: string;
  date: string;
  city: string;
  state: string;
  capacity: number;
  ageRestriction: string;
  guarantee?: number;
  doorDeal?: any;
  showTime?: string;
  status: string;
  loadIn?: string;
  soundcheck?: string;
  doorsOpen?: string;
  curfew?: string;
}

interface TourRequest {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  expectedDraw: { min: number; max: number };
  guaranteeRange?: { min: number; max: number };
  flexibility: string;
  status: string;
  bids?: VenueBid[];
}

interface VenueBid {
  id: string;
  proposedDate: string;
  venueName: string;
  guarantee?: number;
  doorDeal?: any;
  message: string;
  status: string;
  capacity: number;
  ageRestriction: string;
  loadIn?: string;
  soundcheck?: string;
  doorsOpen?: string;
  showTime?: string;
  curfew?: string;
  artistName?: string;
  location?: string;
  tourRequestId?: string;
}

interface CompactTourItineraryProps {
  artistId?: string;
  artistName?: string;
  venueId?: string;
  venueName?: string;
  title?: string;
  editable?: boolean;
  viewerType?: 'artist' | 'venue' | 'public';
}

interface MonthData {
  month: string;
  year: number;
  shows: Show[];
  tourRequests: TourRequest[];
  venueBids: VenueBid[];
  count: number;
}

export default function CompactTourItinerary({
  artistId,
  artistName,
  venueId,
  venueName,
  title,
  editable = false,
  viewerType = 'public'
}: CompactTourItineraryProps) {
  const [shows, setShows] = useState<Show[]>([]);
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [venueBids, setVenueBids] = useState<VenueBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Generate next 12 months starting from current month
  const generateMonthTabs = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      months.push({
        key: monthKey,
        name: monthName,
        month: date.toLocaleDateString('en-US', { month: 'long' }),
        year: date.getFullYear()
      });
    }
    
    return months;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch shows
      let showsData: Show[] = [];
      if (artistId) {
        const showsResponse = await fetch(`/api/shows?artistId=${artistId}`);
        if (showsResponse.ok) {
          showsData = await showsResponse.json();
        }
      } else if (venueId) {
        const showsResponse = await fetch(`/api/shows?venueId=${venueId}`);
        if (showsResponse.ok) {
          showsData = await showsResponse.json();
        }
      }

      // Fetch tour requests (for artists)
      let tourRequestsData: TourRequest[] = [];
      if (artistId) {
        const requestsResponse = await fetch(`/api/tour-requests?artistId=${artistId}`);
        if (requestsResponse.ok) {
          const requestsDataRaw = await requestsResponse.json();
          
          // Fetch bids for each request
          const requestsWithBids = await Promise.all(
            (Array.isArray(requestsDataRaw) ? requestsDataRaw : []).map(async (request: TourRequest) => {
              try {
                const bidsResponse = await fetch(`/api/tour-requests/${request.id}/bids`);
                if (bidsResponse.ok) {
                  const bidsData = await bidsResponse.json();
                  return { ...request, bids: Array.isArray(bidsData) ? bidsData : [] };
                } else {
                  return { ...request, bids: [] };
                }
              } catch (error) {
                console.error(`Error fetching bids for ${request.id}:`, error);
                return { ...request, bids: [] };
              }
            })
          );
          
          tourRequestsData = requestsWithBids;
        }
      }

      // Fetch venue bids (for venues)
      let venueBidsData: VenueBid[] = [];
      if (venueId) {
        // This would need to be implemented in the API
        // const bidsResponse = await fetch(`/api/venues/${venueId}/bids`);
        // if (bidsResponse.ok) {
        //   venueBidsData = await bidsResponse.json();
        // }
      }

      setShows(showsData);
      setTourRequests(tourRequestsData);
      setVenueBids(venueBidsData);

      // Organize data by months
      organizeDataByMonths(showsData, tourRequestsData, venueBidsData);
      
    } catch (error) {
      console.error('Error fetching tour data:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeDataByMonths = (shows: Show[], requests: TourRequest[], bids: VenueBid[]) => {
    const monthTabs = generateMonthTabs();
    const monthsMap = new Map<string, MonthData>();

    // Initialize months
    monthTabs.forEach(tab => {
      monthsMap.set(tab.key, {
        month: tab.month,
        year: tab.year,
        shows: [],
        tourRequests: [],
        venueBids: [],
        count: 0
      });
    });

    // Categorize shows by month
    shows.forEach(show => {
      const showDate = new Date(show.date);
      const monthKey = `${showDate.getFullYear()}-${String(showDate.getMonth() + 1).padStart(2, '0')}`;
      const monthData = monthsMap.get(monthKey);
      if (monthData) {
        monthData.shows.push(show);
        monthData.count++;
      }
    });

    // Categorize tour requests by month (using start date)
    requests.forEach(request => {
      const requestDate = new Date(request.startDate);
      const monthKey = `${requestDate.getFullYear()}-${String(requestDate.getMonth() + 1).padStart(2, '0')}`;
      const monthData = monthsMap.get(monthKey);
      if (monthData) {
        monthData.tourRequests.push(request);
        monthData.count++;
      }
    });

    // Categorize venue bids by month
    bids.forEach(bid => {
      const bidDate = new Date(bid.proposedDate);
      const monthKey = `${bidDate.getFullYear()}-${String(bidDate.getMonth() + 1).padStart(2, '0')}`;
      const monthData = monthsMap.get(monthKey);
      if (monthData) {
        monthData.venueBids.push(bid);
        monthData.count++;
      }
    });

    const monthsArray = Array.from(monthsMap.values());
    setMonthsData(monthsArray);

    // Set active tab to first month with content, or current month
    const firstMonthWithContent = monthTabs.find(tab => 
      monthsMap.get(tab.key)?.count && monthsMap.get(tab.key)!.count > 0
    );
    setActiveTab(firstMonthWithContent?.key || monthTabs[0].key);
  };

  useEffect(() => {
    fetchData();
  }, [artistId, venueId]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getBidStatusBadge = (bid: VenueBid) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      hold: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[bid.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {bid.status}
      </span>
    );
  };

  const activeMonthData = monthsData.find(month => 
    `${month.year}-${String(new Date(`${month.month} 1, ${month.year}`).getMonth() + 1).padStart(2, '0')}` === activeTab
  );

  const monthTabs = generateMonthTabs();
  const totalCount = shows.length + tourRequests.length + venueBids.length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading tour dates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              {title || (artistId ? 'Tour Dates' : 'Booking Calendar')}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {totalCount} total item{totalCount !== 1 ? 's' : ''} • 
              {shows.length} confirmed show{shows.length !== 1 ? 's' : ''}
              {artistId && tourRequests.length > 0 && (
                <span> • {tourRequests.length} active request{tourRequests.length !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Organized by month</span>
            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Month Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto">
          {monthTabs.map(tab => {
            const monthData = monthsData.find(m => 
              `${m.year}-${String(new Date(`${m.month} 1, ${m.year}`).getMonth() + 1).padStart(2, '0')}` === tab.key
            );
            const count = monthData?.count || 0;
            const isActive = activeTab === tab.key;
            
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{tab.name}</span>
                  {count > 0 && (
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {!activeMonthData || activeMonthData.count === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-gray-500 mb-2">No events in {activeMonthData?.month} {activeMonthData?.year}</p>
            <p className="text-sm text-gray-400">Check other months or add new dates</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Confirmed Shows */}
            {activeMonthData.shows.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Confirmed Shows ({activeMonthData.shows.length})
                </h4>
                <div className="space-y-3">
                  {activeMonthData.shows.map(show => (
                    <div key={show.id} className="border border-green-200 rounded-lg overflow-hidden">
                      <div 
                        className="bg-green-50 p-4 cursor-pointer hover:bg-green-100 transition-colors"
                        onClick={() => toggleExpanded(`show-${show.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="text-sm font-medium text-green-900">
                                {new Date(show.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-sm text-green-700">
                                {show.city}, {show.state}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {artistId ? show.venueName : show.artistName}
                            </div>
                            <div className="text-xs text-gray-600 flex items-center space-x-3">
                              <span>{show.capacity} capacity</span>
                              <span>{show.ageRestriction}</span>
                              {show.showTime && <span>Show: {show.showTime}</span>}
                            </div>
                          </div>
                          <div className="text-right flex items-center space-x-3">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Confirmed
                            </span>
                            {show.guarantee && (
                              <div className="text-xs text-green-700">
                                ${show.guarantee}
                              </div>
                            )}
                            <svg 
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                expandedItems.has(`show-${show.id}`) ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {expandedItems.has(`show-${show.id}`) && (
                        <div className="bg-white border-t border-green-200 p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {show.loadIn && (
                              <div>
                                <span className="font-medium text-gray-700">Load In:</span>
                                <div className="text-gray-600">{show.loadIn}</div>
                              </div>
                            )}
                            {show.soundcheck && (
                              <div>
                                <span className="font-medium text-gray-700">Soundcheck:</span>
                                <div className="text-gray-600">{show.soundcheck}</div>
                              </div>
                            )}
                            {show.doorsOpen && (
                              <div>
                                <span className="font-medium text-gray-700">Doors:</span>
                                <div className="text-gray-600">{show.doorsOpen}</div>
                              </div>
                            )}
                            {show.curfew && (
                              <div>
                                <span className="font-medium text-gray-700">Curfew:</span>
                                <div className="text-gray-600">{show.curfew}</div>
                              </div>
                            )}
                          </div>
                          {show.doorDeal && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="font-medium text-gray-700">Door Deal:</span>
                              <div className="text-gray-600 text-sm mt-1">
                                {typeof show.doorDeal === 'object' ? JSON.stringify(show.doorDeal) : show.doorDeal}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tour Requests */}
            {activeMonthData.tourRequests.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Show Requests ({activeMonthData.tourRequests.length})
                </h4>
                <div className="space-y-3">
                  {activeMonthData.tourRequests.map(request => (
                    <div key={request.id} className="border border-blue-200 rounded-lg overflow-hidden">
                      <div 
                        className="bg-blue-50 p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => toggleExpanded(`request-${request.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="text-sm font-medium text-blue-900">
                                {new Date(request.startDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                                {' - '}
                                {new Date(request.endDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-sm text-blue-700">
                                {request.location}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {request.title}
                            </div>
                            <div className="text-xs text-gray-600 flex items-center space-x-3">
                              <span>{request.expectedDraw.min}-{request.expectedDraw.max} draw</span>
                              <span>{request.flexibility.replace('-', ' ')}</span>
                              {request.bids && request.bids.length > 0 && (
                                <span className="text-blue-600 font-medium">{request.bids.length} bid{request.bids.length !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex items-center space-x-3">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Looking for venues
                            </span>
                            {request.guaranteeRange && (
                              <div className="text-xs text-blue-700">
                                ${request.guaranteeRange.min}-{request.guaranteeRange.max}
                              </div>
                            )}
                            <svg 
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                expandedItems.has(`request-${request.id}`) ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Details - Show Bids */}
                      {expandedItems.has(`request-${request.id}`) && (
                        <div className="bg-white border-t border-blue-200">
                          {request.bids && request.bids.length > 0 ? (
                            <div className="p-4">
                              <h5 className="font-medium text-gray-900 mb-3">Venue Bids ({request.bids.length})</h5>
                              <div className="space-y-3">
                                {request.bids.map(bid => (
                                  <div key={bid.id} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <div className="font-medium text-gray-900">{bid.venueName}</div>
                                        <div className="text-sm text-gray-600">
                                          {new Date(bid.proposedDate).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        {getBidStatusBadge(bid)}
                                        {bid.guarantee && (
                                          <div className="text-sm text-gray-600 mt-1">${bid.guarantee}</div>
                                        )}
                                      </div>
                                    </div>
                                    {bid.message && (
                                      <div className="text-sm text-gray-700 bg-white rounded p-2 mt-2">
                                        {bid.message}
                                      </div>
                                    )}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-gray-600">
                                      <div>Capacity: {bid.capacity}</div>
                                      <div>Age: {bid.ageRestriction}</div>
                                      {bid.showTime && <div>Show: {bid.showTime}</div>}
                                      {bid.loadIn && <div>Load: {bid.loadIn}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              No bids yet for this request
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Venue Bids */}
            {activeMonthData.venueBids.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Your Bids ({activeMonthData.venueBids.length})
                </h4>
                <div className="space-y-3">
                  {activeMonthData.venueBids.map(bid => (
                    <div key={bid.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="text-sm font-medium text-yellow-900">
                              {new Date(bid.proposedDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {bid.artistName || 'Unknown Artist'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {bid.guarantee ? `$${bid.guarantee} guarantee` : 'Door deal only'}
                          </div>
                        </div>
                        <div className="text-right">
                          {getBidStatusBadge(bid)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Date Button */}
        {editable && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button 
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Date</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
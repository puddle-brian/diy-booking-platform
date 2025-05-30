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

  // Add Date functionality state
  const [showAddDateForm, setShowAddDateForm] = useState(false);
  const [addDateFormLoading, setAddDateFormLoading] = useState(false);
  const [dataKey, setDataKey] = useState(0); // Force re-render key
  const [addDateForm, setAddDateForm] = useState({
    type: 'request' as 'request' | 'confirmed',
    date: '',
    startDate: '',
    endDate: '',
    location: '',
    artistId: '',
    artistName: '',
    venueId: '',
    venueName: '',
    title: '',
    description: '',
    guarantee: '',
    capacity: '',
    ageRestriction: 'all-ages',
    loadIn: '',
    soundcheck: '',
    doorsOpen: '',
    showTime: '',
    curfew: '',
    notes: ''
  });

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
      console.log('🔄 CompactTourItinerary: Starting data fetch', { artistId, venueId });
      
      // Fetch shows
      let showsData: Show[] = [];
      if (artistId) {
        console.log('🔄 CompactTourItinerary: Fetching shows for artist', artistId);
        const showsResponse = await fetch(`/api/shows?artistId=${artistId}`);
        if (showsResponse.ok) {
          showsData = await showsResponse.json();
          console.log('📅 CompactTourItinerary: Fetched shows', { count: showsData.length, shows: showsData });
        } else {
          console.error('🚨 CompactTourItinerary: Failed to fetch shows', showsResponse.status);
        }
      } else if (venueId) {
        console.log('🔄 CompactTourItinerary: Fetching shows for venue', venueId);
        const showsResponse = await fetch(`/api/shows?venueId=${venueId}`);
        if (showsResponse.ok) {
          showsData = await showsResponse.json();
          console.log('📅 CompactTourItinerary: Fetched shows', { count: showsData.length, shows: showsData });
        } else {
          console.error('🚨 CompactTourItinerary: Failed to fetch shows', showsResponse.status);
        }
      }

      // Fetch tour requests (for artists)
      let tourRequestsData: TourRequest[] = [];
      if (artistId) {
        console.log('🔄 CompactTourItinerary: Fetching tour requests for artist', artistId);
        const requestsResponse = await fetch(`/api/tour-requests?artistId=${artistId}`);
        if (requestsResponse.ok) {
          const requestsDataRaw = await requestsResponse.json();
          console.log('🗺️ CompactTourItinerary: Raw tour requests response', requestsDataRaw);
          
          // Handle the API response format: { requests: [...], total: ... }
          const requestsArray = requestsDataRaw.requests || requestsDataRaw || [];
          console.log('🗺️ CompactTourItinerary: Extracted requests array', { count: requestsArray.length, requests: requestsArray });
          
          // Fetch bids for each request
          const requestsWithBids = await Promise.all(
            (Array.isArray(requestsArray) ? requestsArray : []).map(async (request: TourRequest) => {
              try {
                console.log('🔄 CompactTourItinerary: Fetching bids for request', request.id);
                const bidsResponse = await fetch(`/api/tour-requests/${request.id}/bids`);
                if (bidsResponse.ok) {
                  const bidsData = await bidsResponse.json();
                  console.log('🗺️ CompactTourItinerary: Fetched bids for request', request.id, { count: bidsData.length });
                  return { ...request, bids: Array.isArray(bidsData) ? bidsData : [] };
                } else {
                  console.error('🚨 CompactTourItinerary: Failed to fetch bids for request', request.id, bidsResponse.status);
                  return { ...request, bids: [] };
                }
              } catch (error) {
                console.error(`🚨 CompactTourItinerary: Error fetching bids for ${request.id}:`, error);
                return { ...request, bids: [] };
              }
            })
          );
          
          tourRequestsData = requestsWithBids;
          console.log('🗺️ CompactTourItinerary: Final tour requests with bids', { count: tourRequestsData.length, requests: tourRequestsData });
        } else {
          console.error('🚨 CompactTourItinerary: Failed to fetch tour requests', requestsResponse.status);
        }
      }

      // Fetch venue bids (for venues)
      let venueBidsData: VenueBid[] = [];
      if (venueId) {
        console.log('🔄 CompactTourItinerary: Venue bids not implemented yet for venue', venueId);
        // This would need to be implemented in the API
        // const bidsResponse = await fetch(`/api/venues/${venueId}/bids`);
        // if (bidsResponse.ok) {
        //   venueBidsData = await bidsResponse.json();
        // }
      }

      console.log('📊 CompactTourItinerary: Setting state with new data', {
        shows: showsData.length,
        tourRequests: tourRequestsData.length,
        venueBids: venueBidsData.length
      });

      setShows(showsData);
      setTourRequests(tourRequestsData);
      setVenueBids(venueBidsData);

      // Organize data by months
      console.log('🔄 CompactTourItinerary: Organizing data by months...');
      organizeDataByMonths(showsData, tourRequestsData, venueBidsData);
      console.log('✅ CompactTourItinerary: Data organization completed');
      
    } catch (error) {
      console.error('🚨 CompactTourItinerary: Error fetching tour data:', error);
    } finally {
      setLoading(false);
      console.log('🔄 CompactTourItinerary: Data fetch completed, loading set to false');
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

  const getBidStatusBadge = (bid: VenueBid) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      hold: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    const statusLabels = {
      pending: 'Pending',
      hold: 'Hold',
      accepted: 'Accepted',
      declined: 'Declined',
      cancelled: 'Cancelled'
    };

    return (
      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[bid.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[bid.status as keyof typeof statusLabels] || bid.status}
      </span>
    );
  };

  const handleAddDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎯 CompactTourItinerary: Form submission started', {
      type: addDateForm.type,
      artistId,
      artistName,
      venueId,
      venueName,
      formData: addDateForm
    });
    
    if (addDateFormLoading) {
      console.log('🚨 CompactTourItinerary: Form submission already in progress');
      return;
    }
    
    try {
      setAddDateFormLoading(true);
      console.log('🎯 CompactTourItinerary: Loading state set to true');

      if (addDateForm.type === 'request') {
        // Create a tour request
        if (!artistId || !artistName) {
          console.error('🚨 CompactTourItinerary: Missing artist information', { artistId, artistName });
          alert('Missing artist information. Please try again.');
          return;
        }

        console.log('🎯 CompactTourItinerary: Creating tour request...');
        const requestBody = {
          title: addDateForm.title || `${addDateForm.location} - ${new Date(addDateForm.startDate).toLocaleDateString()}`,
          description: addDateForm.description || `Looking for a show in ${addDateForm.location}`,
          startDate: addDateForm.startDate,
          endDate: addDateForm.endDate,
          location: addDateForm.location,
          radius: 50,
          flexibility: 'exact-cities',
          genres: [],
          expectedDraw: { min: 0, max: 0, description: '' },
          tourStatus: 'exploring-interest',
          ageRestriction: addDateForm.ageRestriction,
          equipment: { needsPA: false, needsMics: false, needsDrums: false, needsAmps: false, acoustic: false },
          guaranteeRange: { min: 0, max: 0 },
          acceptsDoorDeals: true,
          merchandising: true,
          travelMethod: 'van',
          lodging: 'flexible',
          priority: 'medium',
          artistId,
          artistName,
        };
        
        console.log('🎯 CompactTourItinerary: Request body prepared', requestBody);

        const response = await fetch('/api/tour-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('🎯 CompactTourItinerary: API response received', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('🚨 CompactTourItinerary: Tour request creation failed', errorData);
          throw new Error(errorData.error || 'Failed to create tour request');
        }

        const createdRequest = await response.json();
        console.log('✅ CompactTourItinerary: Tour request created successfully', createdRequest);
        
      } else {
        // Create a confirmed show
        console.log('🎯 CompactTourItinerary: Creating confirmed show...');
        const requestBody = {
          title: addDateForm.title,
          date: addDateForm.date,
          artistId: addDateForm.artistId || artistId,
          artistName: addDateForm.artistName || artistName,
          venueId: addDateForm.venueId || venueId,
          venueName: addDateForm.venueName || venueName,
          guarantee: addDateForm.guarantee ? parseFloat(addDateForm.guarantee) : undefined,
          capacity: addDateForm.capacity ? parseInt(addDateForm.capacity) : undefined,
          ageRestriction: addDateForm.ageRestriction,
          loadIn: addDateForm.loadIn,
          soundcheck: addDateForm.soundcheck,
          doorsOpen: addDateForm.doorsOpen,
          showTime: addDateForm.showTime,
          curfew: addDateForm.curfew,
          notes: addDateForm.notes,
          status: 'confirmed'
        };
        
        console.log('🎯 CompactTourItinerary: Show request body prepared', requestBody);

        const response = await fetch('/api/shows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('🎯 CompactTourItinerary: Shows API response received', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('🚨 CompactTourItinerary: Show creation failed', errorData);
          throw new Error(errorData.error || 'Failed to create show');
        }

        const createdShow = await response.json();
        console.log('✅ CompactTourItinerary: Show created successfully', createdShow);
      }

      console.log('🎯 CompactTourItinerary: Closing form and resetting state...');
      
      // Reset form and close modal
      setShowAddDateForm(false);
      setAddDateForm({
        type: 'request',
        date: '',
        startDate: '',
        endDate: '',
        location: '',
        artistId: '',
        artistName: '',
        venueId: '',
        venueName: '',
        title: '',
        description: '',
        guarantee: '',
        capacity: '',
        ageRestriction: 'all-ages',
        loadIn: '',
        soundcheck: '',
        doorsOpen: '',
        showTime: '',
        curfew: '',
        notes: ''
      });

      // Force refresh data with a small delay to ensure the API has processed the new data
      console.log('🔄 CompactTourItinerary: Starting data refresh...');
      setTimeout(async () => {
        console.log('🔄 CompactTourItinerary: Executing fetchData...');
        await fetchData();
        setDataKey(prev => prev + 1); // Force re-render
        console.log('✅ CompactTourItinerary: Data refresh completed, dataKey incremented');
      }, 500); // 500ms delay to ensure the database has been updated

    } catch (error) {
      console.error('🚨 CompactTourItinerary: Error adding date:', error);
      alert(`Failed to add date: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('🎯 CompactTourItinerary: Setting loading state to false');
      setAddDateFormLoading(false);
    }
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
          <p className="mt-2 text-gray-500">Loading show dates...</p>
        </div>
      </div>
    );
  }

  return (
    <div key={dataKey} className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              {title || (artistId ? 'Show Dates' : 'Booking Calendar')}
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
                
                {/* Compact Table Header */}
                <div className="bg-gray-50 border border-gray-200 rounded-t-lg px-4 py-2 text-xs font-medium text-gray-600 grid grid-cols-12 gap-2">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-3">Venue/Artist</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1">Capacity</div>
                  <div className="col-span-1">Age</div>
                  <div className="col-span-1">Guarantee</div>
                  <div className="col-span-1"></div>
                </div>
                
                <div className="border-l border-r border-b border-gray-200 rounded-b-lg overflow-hidden">
                  {activeMonthData.shows.map(show => (
                    <div key={show.id} className="border-b border-gray-100 last:border-b-0">
                      <div 
                        className="bg-white hover:bg-green-50 cursor-pointer transition-colors px-4 py-2 grid grid-cols-12 gap-2 items-center text-sm"
                        onClick={() => toggleExpanded(`show-${show.id}`)}
                      >
                        {/* Date */}
                        <div className="col-span-2 font-medium text-gray-900">
                          {new Date(show.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        
                        {/* Venue/Artist Name */}
                        <div className="col-span-3 font-medium text-gray-900 truncate">
                          {artistId ? show.venueName : show.artistName}
                        </div>
                        
                        {/* Location */}
                        <div className="col-span-2 text-gray-600 truncate">
                          {show.city}, {show.state}
                        </div>
                        
                        {/* Status */}
                        <div className="col-span-1">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Confirmed
                          </span>
                        </div>
                        
                        {/* Capacity */}
                        <div className="col-span-1 text-gray-600 text-xs">
                          {show.capacity}
                        </div>
                        
                        {/* Age */}
                        <div className="col-span-1 text-gray-600 text-xs">
                          {show.ageRestriction}
                        </div>
                        
                        {/* Guarantee */}
                        <div className="col-span-1 text-gray-600 text-xs">
                          {show.guarantee ? `$${show.guarantee}` : '-'}
                        </div>
                        
                        {/* Expand Arrow */}
                        <div className="col-span-1 flex justify-end">
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
                      
                      {/* Expanded Details */}
                      {expandedItems.has(`show-${show.id}`) && (
                        <div className="bg-gray-50 border-t border-gray-200 p-4">
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
                            {show.showTime && (
                              <div>
                                <span className="font-medium text-gray-700">Show Time:</span>
                                <div className="text-gray-600">{show.showTime}</div>
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
                
                {/* Compact Table Header */}
                <div className="bg-gray-50 border border-gray-200 rounded-t-lg px-4 py-2 text-xs font-medium text-gray-600 grid grid-cols-12 gap-2">
                  <div className="col-span-2">Date Range</div>
                  <div className="col-span-3">Title</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1">Draw</div>
                  <div className="col-span-1">Bids</div>
                  <div className="col-span-1">Range</div>
                  <div className="col-span-1"></div>
                </div>
                
                <div className="border-l border-r border-b border-gray-200 rounded-b-lg overflow-hidden">
                  {activeMonthData.tourRequests.map(request => (
                    <div key={request.id} className="border-b border-gray-100 last:border-b-0">
                      <div 
                        className="bg-white hover:bg-blue-50 cursor-pointer transition-colors px-4 py-2 grid grid-cols-12 gap-2 items-center text-sm"
                        onClick={() => toggleExpanded(`request-${request.id}`)}
                      >
                        {/* Date Range */}
                        <div className="col-span-2 font-medium text-gray-900">
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
                        
                        {/* Title */}
                        <div className="col-span-3 font-medium text-gray-900 truncate">
                          {request.title}
                        </div>
                        
                        {/* Location */}
                        <div className="col-span-2 text-gray-600 truncate">
                          {request.location}
                        </div>
                        
                        {/* Status */}
                        <div className="col-span-1">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Requested
                          </span>
                        </div>
                        
                        {/* Draw */}
                        <div className="col-span-1 text-gray-600 text-xs">
                          {request.expectedDraw.min}-{request.expectedDraw.max}
                        </div>
                        
                        {/* Bids */}
                        <div className="col-span-1 text-xs">
                          {request.bids && request.bids.length > 0 ? (
                            <span className="text-blue-600 font-medium">{request.bids.length}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </div>
                        
                        {/* Guarantee Range */}
                        <div className="col-span-1 text-gray-600 text-xs">
                          {request.guaranteeRange ? `$${request.guaranteeRange.min}-${request.guaranteeRange.max}` : '-'}
                        </div>
                        
                        {/* Expand Arrow */}
                        <div className="col-span-1 flex justify-end">
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
                      
                      {/* Expanded Details - Show Bids */}
                      {expandedItems.has(`request-${request.id}`) && (
                        <div className="bg-gray-50 border-t border-gray-200">
                          {request.bids && request.bids.length > 0 ? (
                            <div className="p-4">
                              <h5 className="font-medium text-gray-900 mb-3">Venue Bids ({request.bids.length})</h5>
                              <div className="space-y-3">
                                {request.bids.map(bid => (
                                  <div key={bid.id} className="bg-white rounded-lg p-3 border border-gray-200">
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
                                      <div className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">
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
                
                {/* Compact Table Header */}
                <div className="bg-gray-50 border border-gray-200 rounded-t-lg px-4 py-2 text-xs font-medium text-gray-600 grid grid-cols-12 gap-2">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-3">Artist</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1">Capacity</div>
                  <div className="col-span-1">Age</div>
                  <div className="col-span-1">Guarantee</div>
                  <div className="col-span-1"></div>
                </div>
                
                <div className="border-l border-r border-b border-gray-200 rounded-b-lg overflow-hidden">
                  {activeMonthData.venueBids.map(bid => (
                    <div key={bid.id} className="border-b border-gray-100 last:border-b-0">
                      <div 
                        className="bg-white hover:bg-yellow-50 cursor-pointer transition-colors px-4 py-2 grid grid-cols-12 gap-2 items-center text-sm"
                        onClick={() => toggleExpanded(`bid-${bid.id}`)}
                      >
                        {/* Date */}
                        <div className="col-span-2 font-medium text-gray-900">
                          {new Date(bid.proposedDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        
                        {/* Artist Name */}
                        <div className="col-span-3 font-medium text-gray-900 truncate">
                          {bid.artistName || 'Unknown Artist'}
                        </div>
                        
                        {/* Location */}
                        <div className="col-span-2 text-gray-600 truncate">
                          {bid.location || '-'}
                        </div>
                        
                        {/* Status */}
                        <div className="col-span-1">
                          {getBidStatusBadge(bid)}
                        </div>
                        
                        {/* Capacity */}
                        <div className="col-span-1 text-gray-600 text-xs">
                          {bid.capacity}
                        </div>
                        
                        {/* Age */}
                        <div className="col-span-1 text-gray-600 text-xs">
                          {bid.ageRestriction}
                        </div>
                        
                        {/* Guarantee */}
                        <div className="col-span-1 text-gray-600 text-xs">
                          {bid.guarantee ? `$${bid.guarantee}` : 'Door'}
                        </div>
                        
                        {/* Expand Arrow */}
                        <div className="col-span-1 flex justify-end">
                          <svg 
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedItems.has(`bid-${bid.id}`) ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {expandedItems.has(`bid-${bid.id}`) && (
                        <div className="bg-gray-50 border-t border-gray-200 p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {bid.loadIn && (
                              <div>
                                <span className="font-medium text-gray-700">Load In:</span>
                                <div className="text-gray-600">{bid.loadIn}</div>
                              </div>
                            )}
                            {bid.soundcheck && (
                              <div>
                                <span className="font-medium text-gray-700">Soundcheck:</span>
                                <div className="text-gray-600">{bid.soundcheck}</div>
                              </div>
                            )}
                            {bid.doorsOpen && (
                              <div>
                                <span className="font-medium text-gray-700">Doors:</span>
                                <div className="text-gray-600">{bid.doorsOpen}</div>
                              </div>
                            )}
                            {bid.showTime && (
                              <div>
                                <span className="font-medium text-gray-700">Show Time:</span>
                                <div className="text-gray-600">{bid.showTime}</div>
                              </div>
                            )}
                            {bid.curfew && (
                              <div>
                                <span className="font-medium text-gray-700">Curfew:</span>
                                <div className="text-gray-600">{bid.curfew}</div>
                              </div>
                            )}
                          </div>
                          {bid.message && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="font-medium text-gray-700">Message:</span>
                              <div className="text-gray-600 text-sm mt-1">{bid.message}</div>
                            </div>
                          )}
                        </div>
                      )}
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
              onClick={() => {
                // Initialize form with default values
                setAddDateForm(prev => ({
                  ...prev,
                  type: 'request',
                  artistId: artistId || '',
                  artistName: artistName || '',
                  venueId: venueId || '',
                  venueName: venueName || ''
                }));
                setShowAddDateForm(true);
              }}
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

      {/* Add Date Form Modal */}
      {showAddDateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {addDateForm.type === 'request' ? 'Create Tour Request' : 'Add Confirmed Show'}
              </h3>
            </div>
            
            <form onSubmit={handleAddDateSubmit} className="px-6 py-4 space-y-6">
              {/* Type Selection - Only for Artists */}
              {artistId && viewerType === 'artist' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    required
                    value={addDateForm.type}
                    onChange={(e) => setAddDateForm(prev => ({ ...prev, type: e.target.value as 'request' | 'confirmed' }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="request">Request (looking for venues)</option>
                    <option value="confirmed">Confirmed (already booked)</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    {addDateForm.type === 'request' 
                      ? 'Create a tour request to find venues for this date'
                      : 'Add a confirmed show that was booked outside the platform'
                    }
                  </p>
                </div>
              )}

              {/* Date Fields */}
              {addDateForm.type === 'request' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={addDateForm.startDate}
                        onChange={(e) => setAddDateForm(prev => ({ ...prev, startDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={addDateForm.endDate}
                        onChange={(e) => setAddDateForm(prev => ({ ...prev, endDate: e.target.value }))}
                        min={addDateForm.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Show Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={addDateForm.date}
                    onChange={(e) => setAddDateForm(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={addDateForm.location}
                  onChange={(e) => setAddDateForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Seattle, WA"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Title and Description for Requests */}
              {addDateForm.type === 'request' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={addDateForm.title}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Seattle Show - June 2025"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={addDateForm.description}
                      onChange={(e) => setAddDateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell venues about what you're looking for..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Age Restriction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Restriction
                </label>
                <select
                  value={addDateForm.ageRestriction}
                  onChange={(e) => setAddDateForm(prev => ({ ...prev, ageRestriction: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all-ages">All Ages</option>
                  <option value="18+">18+</option>
                  <option value="21+">21+</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={addDateFormLoading}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                    addDateFormLoading 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {addDateFormLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>
                    {addDateFormLoading 
                      ? 'Creating...' 
                      : (addDateForm.type === 'request' ? 'Create Request' : 'Add Show')
                    }
                  </span>
                </button>
                <button
                  type="button"
                  disabled={addDateFormLoading}
                  onClick={() => setShowAddDateForm(false)}
                  className={`px-6 py-3 border border-gray-300 rounded-lg transition-colors ${
                    addDateFormLoading 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
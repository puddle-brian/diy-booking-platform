import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { TourRequest } from '../../../../types';

const tourRequestsFilePath = path.join(process.cwd(), 'data', 'tour-requests.json');

function readTourRequests(): TourRequest[] {
  try {
    if (!fs.existsSync(tourRequestsFilePath)) {
      return [];
    }
    const data = fs.readFileSync(tourRequestsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tour requests file:', error);
    return [];
  }
}

function writeTourRequests(requests: TourRequest[]): void {
  try {
    const dir = path.dirname(tourRequestsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(tourRequestsFilePath, JSON.stringify(requests, null, 2));
  } catch (error) {
    console.error('Error writing tour requests file:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const region = searchParams.get('region');
    const genre = searchParams.get('genre');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const forVenues = searchParams.get('forVenues') === 'true';
    
    let requests = readTourRequests();
    
    console.log(`🗺️ API: Fetching tour requests. Total: ${requests.length}`);
    console.log(`🗺️ API: Filters - artistId: ${artistId}, activeOnly: ${activeOnly}, forVenues: ${forVenues}`);
    
    // Filter by artistId (for artist's own requests)
    if (artistId) {
      requests = requests.filter(request => request.artistId === artistId);
      console.log(`🗺️ API: After artistId filter: ${requests.length} requests`);
    }
    
    // Filter by status
    if (status) {
      requests = requests.filter(request => request.status === status);
      console.log(`🗺️ API: After status filter: ${requests.length} requests`);
    }
    
    // Filter by city/region (for venues browsing) - updated for atomic location structure
    if (city) {
      requests = requests.filter(request => 
        request.location && request.location.toLowerCase().includes(city.toLowerCase())
      );
      console.log(`🗺️ API: After city filter: ${requests.length} requests`);
    }
    
    if (region) {
      requests = requests.filter(request =>
        request.location && request.location.toLowerCase().includes(region.toLowerCase())
      );
      console.log(`🗺️ API: After region filter: ${requests.length} requests`);
    }
    
    // Filter by genre
    if (genre) {
      requests = requests.filter(request =>
        request.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()))
      );
      console.log(`🗺️ API: After genre filter: ${requests.length} requests`);
    }
    
    // Only active requests (default for venue browsing)
    if (activeOnly) {
      const now = new Date();
      requests = requests.filter(request => 
        request.status === 'active' && 
        new Date(request.expiresAt) > now &&
        new Date(request.startDate) > now
      );
      console.log(`🗺️ API: After activeOnly filter: ${requests.length} requests`);
    }
    
    // Sort by priority and date
    requests.sort((a, b) => {
      // Priority order: high, medium, low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    console.log(`🗺️ API: Final result: ${requests.length} tour requests`);
    
    // For venues, transform the data to match VenueBidding component expectations
    if (forVenues) {
      const venueRequests = requests.map(request => ({
        id: request.id,
        artistId: request.artistId,
        artistName: request.artistName,
        city: request.location.split(',')[0]?.trim() || '',
        state: request.location.split(',')[1]?.trim() || '',
        country: 'USA', // Default for now
        requestedDate: request.startDate,
        genre: request.genres,
        expectedDraw: request.expectedDraw.description || `${request.expectedDraw.min}-${request.expectedDraw.max}`,
        guarantee: request.guaranteeRange?.min || 0,
        doorSplit: 70, // Default door split percentage
        description: request.description,
        requirements: [
          ...(request.equipment.needsPA ? ['PA System'] : []),
          ...(request.equipment.needsMics ? ['Microphones'] : []),
          ...(request.equipment.needsDrums ? ['Drum Kit'] : []),
          ...(request.equipment.needsAmps ? ['Amplifiers'] : []),
          ...(request.ageRestriction !== 'flexible' ? [`${request.ageRestriction} venue`] : []),
        ],
        status: request.status,
        createdAt: request.createdAt,
        deadline: request.expiresAt,
      }));
      
      return NextResponse.json(venueRequests);
    }
    
    // Return in the format the frontend expects
    return NextResponse.json({
      requests: requests,
      total: requests.length
    });
  } catch (error) {
    console.error('Error in GET /api/tour-requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['artistId', 'artistName', 'title', 'startDate', 'endDate'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate date range
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const now = new Date();
    
    if (startDate <= now) {
      return NextResponse.json(
        { error: 'Start date must be in the future' },
        { status: 400 }
      );
    }
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const requests = readTourRequests();
    
    // Generate new ID
    const newId = Date.now().toString();
    
    // Calculate expiration (30 days from creation or tour start date, whichever is sooner)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiresAt = startDate < thirtyDaysFromNow ? startDate : thirtyDaysFromNow;
    
    // Create new tour request
    const newRequest: TourRequest = {
      id: newId,
      artistId: body.artistId,
      artistName: body.artistName,
      title: body.title,
      description: body.description || '',
      startDate: body.startDate,
      endDate: body.endDate,
      location: body.location || '',
      radius: body.radius || 50,
      flexibility: body.flexibility || 'route-flexible',
      genres: body.genres || [],
      expectedDraw: {
        min: body.expectedDraw?.min || 0,
        max: body.expectedDraw?.max || 0,
        description: body.expectedDraw?.description || ''
      },
      tourStatus: body.tourStatus || 'exploring-interest',
      ageRestriction: body.ageRestriction || 'flexible',
      equipment: {
        needsPA: body.equipment?.needsPA || false,
        needsMics: body.equipment?.needsMics || false,
        needsDrums: body.equipment?.needsDrums || false,
        needsAmps: body.equipment?.needsAmps || false,
        acoustic: body.equipment?.acoustic || false,
      },
      guaranteeRange: body.guaranteeRange,
      acceptsDoorDeals: body.acceptsDoorDeals || true,
      merchandising: body.merchandising || true,
      travelMethod: body.travelMethod || 'van',
      lodging: body.lodging || 'flexible',
      status: 'active',
      priority: body.priority || 'medium',
      responses: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    requests.push(newRequest);
    writeTourRequests(requests);

    console.log(`🎯 New tour request: ${newRequest.artistName} - ${newRequest.title}`);

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tour-requests:', error);
    return NextResponse.json(
      { error: 'Failed to create tour request' },
      { status: 500 }
    );
  }
} 
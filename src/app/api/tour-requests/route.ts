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
    
    let requests = readTourRequests();
    
    // Filter by artistId (for artist's own requests)
    if (artistId) {
      requests = requests.filter(request => request.artistId === artistId);
    }
    
    // Filter by status
    if (status) {
      requests = requests.filter(request => request.status === status);
    }
    
    // Filter by city/region (for venues browsing)
    if (city) {
      requests = requests.filter(request => 
        request.cities.some(c => c.toLowerCase().includes(city.toLowerCase())) ||
        request.regions.some(r => r.toLowerCase().includes(city.toLowerCase()))
      );
    }
    
    if (region) {
      requests = requests.filter(request =>
        request.regions.some(r => r.toLowerCase().includes(region.toLowerCase()))
      );
    }
    
    // Filter by genre
    if (genre) {
      requests = requests.filter(request =>
        request.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()))
      );
    }
    
    // Only active requests (default for venue browsing)
    if (activeOnly) {
      const now = new Date();
      requests = requests.filter(request => 
        request.status === 'active' && 
        new Date(request.expiresAt) > now &&
        new Date(request.startDate) > now
      );
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
    
    return NextResponse.json(requests);
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
      cities: body.cities || [],
      regions: body.regions || [],
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
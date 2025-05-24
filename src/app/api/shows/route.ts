import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Show } from '../../../../types';

const showsFilePath = path.join(process.cwd(), 'data', 'shows.json');

function readShows(): Show[] {
  try {
    if (!fs.existsSync(showsFilePath)) {
      return [];
    }
    const data = fs.readFileSync(showsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading shows file:', error);
    return [];
  }
}

function writeShows(shows: Show[]): void {
  try {
    const dir = path.dirname(showsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(showsFilePath, JSON.stringify(shows, null, 2));
  } catch (error) {
    console.error('Error writing shows file:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const venueId = searchParams.get('venueId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    let shows = readShows();
    
    // Filter by artistId
    if (artistId) {
      shows = shows.filter(show => show.artistId === artistId);
    }
    
    // Filter by venueId
    if (venueId) {
      shows = shows.filter(show => show.venueId === venueId);
    }
    
    // Filter by status
    if (status) {
      shows = shows.filter(show => show.status === status);
    }
    
    // Filter by date range
    if (dateFrom) {
      shows = shows.filter(show => new Date(show.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      shows = shows.filter(show => new Date(show.date) <= new Date(dateTo));
    }
    
    // Sort by date
    shows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return NextResponse.json(shows);
  } catch (error) {
    console.error('Error in GET /api/shows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['artistId', 'venueId', 'date', 'city', 'state', 'venueName', 'artistName'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const shows = readShows();
    
    // Check for date conflicts
    const conflictingShow = shows.find(show => 
      (show.artistId === body.artistId || show.venueId === body.venueId) && 
      show.date === body.date &&
      show.status !== 'cancelled'
    );
    
    if (conflictingShow) {
      return NextResponse.json(
        { error: 'Date conflict: Artist or venue already has a show on this date' },
        { status: 409 }
      );
    }
    
    // Generate new ID
    const newId = Date.now().toString();
    
    // Create new show
    const newShow: Show = {
      id: newId,
      artistId: body.artistId,
      venueId: body.venueId,
      date: body.date,
      city: body.city,
      state: body.state,
      venueName: body.venueName,
      artistName: body.artistName,
      status: body.status || 'confirmed',
      holdPosition: body.holdPosition,
      guarantee: body.guarantee,
      doorDeal: body.doorDeal,
      ticketPrice: body.ticketPrice,
      capacity: body.capacity || 0,
      ageRestriction: body.ageRestriction || 'all-ages',
      loadIn: body.loadIn,
      soundcheck: body.soundcheck,
      doorsOpen: body.doorsOpen,
      showTime: body.showTime,
      curfew: body.curfew,
      expectedDraw: body.expectedDraw,
      walkoutPotential: body.walkoutPotential || 'medium',
      notes: body.notes || '',
      promotion: body.promotion,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: body.createdBy || 'system',
    };

    shows.push(newShow);
    writeShows(shows);

    console.log(`🎤 New show created: ${newShow.artistName} at ${newShow.venueName} on ${newShow.date}`);

    return NextResponse.json(newShow, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/shows:', error);
    return NextResponse.json(
      { error: 'Failed to create show' },
      { status: 500 }
    );
  }
} 
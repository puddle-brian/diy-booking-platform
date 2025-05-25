import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Show, TourRequest } from '../../../../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SHOWS_FILE = path.join(DATA_DIR, 'shows.json');
const TOUR_REQUESTS_FILE = path.join(DATA_DIR, 'tour-requests.json');

function readShows(): Show[] {
  try {
    if (fs.existsSync(SHOWS_FILE)) {
      const data = fs.readFileSync(SHOWS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading shows:', error);
    return [];
  }
}

function writeShows(shows: Show[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SHOWS_FILE, JSON.stringify(shows, null, 2));
  } catch (error) {
    console.error('Error writing shows:', error);
    throw error;
  }
}

function readTourRequests(): TourRequest[] {
  try {
    if (fs.existsSync(TOUR_REQUESTS_FILE)) {
      const data = fs.readFileSync(TOUR_REQUESTS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading tour requests:', error);
    return [];
  }
}

function writeTourRequests(requests: TourRequest[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TOUR_REQUESTS_FILE, JSON.stringify(requests, null, 2));
  } catch (error) {
    console.error('Error writing tour requests:', error);
    throw error;
  }
}

// Conflict resolution: Update show requests when a show is confirmed
async function resolveShowRequestConflicts(confirmedShow: Show): Promise<void> {
  try {
    const tourRequests = readTourRequests();
    const showDate = new Date(confirmedShow.date);
    let updatedRequests = [...tourRequests];
    let conflictsResolved = 0;

    console.log(`🎯 Resolving conflicts for show: ${confirmedShow.artistName} on ${confirmedShow.date}`);

    for (let i = 0; i < updatedRequests.length; i++) {
      const request = updatedRequests[i];
      
      // Only check requests for the same artist that are currently active
      if (request.artistId !== confirmedShow.artistId || request.status !== 'active') {
        continue;
      }

      const requestStart = new Date(request.startDate);
      const requestEnd = new Date(request.endDate);

      // Check if the confirmed show date falls within this request's date range
      if (showDate >= requestStart && showDate <= requestEnd) {
        console.log(`⚡ Found conflicting request: ${request.title} (${request.startDate} - ${request.endDate})`);

        if (requestStart.getTime() === requestEnd.getTime() && requestStart.getTime() === showDate.getTime()) {
          // Single-day request that's now fulfilled
          updatedRequests[i] = { 
            ...request, 
            status: 'fulfilled' as const,
            updatedAt: new Date().toISOString()
          };
          console.log(`✅ Request fulfilled: ${request.title}`);
          conflictsResolved++;

        } else if (showDate.getTime() === requestStart.getTime()) {
          // Show is on start date - move start date forward by 1 day
          const newStart = new Date(showDate);
          newStart.setDate(newStart.getDate() + 1);
          
          if (newStart <= requestEnd) {
            updatedRequests[i] = {
              ...request,
              startDate: newStart.toISOString().split('T')[0],
              updatedAt: new Date().toISOString()
            };
            console.log(`📅 Moved request start date: ${request.title} now starts ${newStart.toISOString().split('T')[0]}`);
            conflictsResolved++;
          } else {
            // No valid date range left
            updatedRequests[i] = { 
              ...request, 
              status: 'fulfilled' as const,
              updatedAt: new Date().toISOString()
            };
            console.log(`✅ Request fulfilled (no valid dates left): ${request.title}`);
            conflictsResolved++;
          }

        } else if (showDate.getTime() === requestEnd.getTime()) {
          // Show is on end date - move end date backward by 1 day
          const newEnd = new Date(showDate);
          newEnd.setDate(newEnd.getDate() - 1);
          
          updatedRequests[i] = {
            ...request,
            endDate: newEnd.toISOString().split('T')[0],
            updatedAt: new Date().toISOString()
          };
          console.log(`📅 Moved request end date: ${request.title} now ends ${newEnd.toISOString().split('T')[0]}`);
          conflictsResolved++;

        } else {
          // Show date is in the middle - for simplicity, mark as fulfilled
          // In a more complex system, we might split into two requests
          updatedRequests[i] = { 
            ...request, 
            status: 'fulfilled' as const,
            updatedAt: new Date().toISOString()
          };
          console.log(`✅ Request fulfilled (show in middle of date range): ${request.title}`);
          conflictsResolved++;
        }
      }
    }

    if (conflictsResolved > 0) {
      writeTourRequests(updatedRequests);
      console.log(`🎉 Resolved ${conflictsResolved} show request conflict(s)`);
    } else {
      console.log(`✨ No conflicts found for ${confirmedShow.artistName} on ${confirmedShow.date}`);
    }

  } catch (error) {
    console.error('Error resolving show request conflicts:', error);
    // Don't throw - we don't want to block show confirmation if conflict resolution fails
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

    // 🎯 CONFLICT RESOLUTION: Automatically resolve any conflicting show requests
    if (newShow.status === 'confirmed') {
      await resolveShowRequestConflicts(newShow);
    }

    console.log(`🎵 New show confirmed: ${newShow.artistName} at ${newShow.venueName} on ${newShow.date}`);

    return NextResponse.json(newShow, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/shows:', error);
    return NextResponse.json(
      { error: 'Failed to create show' },
      { status: 500 }
    );
  }
} 
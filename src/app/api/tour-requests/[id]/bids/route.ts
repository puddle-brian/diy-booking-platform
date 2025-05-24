import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { VenueBid, TourRequest } from '../../../../../../types';

const bidsFilePath = path.join(process.cwd(), 'data', 'venue-bids.json');
const tourRequestsFilePath = path.join(process.cwd(), 'data', 'tour-requests.json');

function readBids(): VenueBid[] {
  try {
    if (!fs.existsSync(bidsFilePath)) {
      return [];
    }
    const data = fs.readFileSync(bidsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading bids file:', error);
    return [];
  }
}

function writeBids(bids: VenueBid[]): void {
  try {
    const dir = path.dirname(bidsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(bidsFilePath, JSON.stringify(bids, null, 2));
  } catch (error) {
    console.error('Error writing bids file:', error);
    throw error;
  }
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const bids = readBids();
    const tourRequestBids = bids.filter(bid => bid.tourRequestId === resolvedParams.id);
    
    // Sort by creation date (newest first)
    tourRequestBids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json(tourRequestBids);
  } catch (error) {
    console.error('Error in GET /api/tour-requests/[id]/bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const tourRequestId = resolvedParams.id;
    
    // Validate required fields
    const requiredFields = ['venueId', 'venueName', 'proposedDate', 'capacity', 'message'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if tour request exists and is active
    const tourRequests = readTourRequests();
    const tourRequest = tourRequests.find(req => req.id === tourRequestId);
    
    if (!tourRequest) {
      return NextResponse.json(
        { error: 'Tour request not found' },
        { status: 404 }
      );
    }
    
    if (tourRequest.status !== 'active') {
      return NextResponse.json(
        { error: 'Tour request is no longer active' },
        { status: 400 }
      );
    }

    // Check if venue already has a pending bid for this request
    const bids = readBids();
    const existingBid = bids.find(bid => 
      bid.tourRequestId === tourRequestId && 
      bid.venueId === body.venueId && 
      bid.status === 'pending'
    );
    
    if (existingBid) {
      return NextResponse.json(
        { error: 'You already have a pending bid for this tour request' },
        { status: 400 }
      );
    }

    // Validate proposed date is within tour date range
    const proposedDate = new Date(body.proposedDate);
    const tourStart = new Date(tourRequest.startDate);
    const tourEnd = new Date(tourRequest.endDate);
    
    if (proposedDate < tourStart || proposedDate > tourEnd) {
      return NextResponse.json(
        { error: 'Proposed date must be within the tour date range' },
        { status: 400 }
      );
    }

    // Generate new ID
    const newId = Date.now().toString();
    
    // Calculate expiration (7 days from creation)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create new bid
    const newBid: VenueBid = {
      id: newId,
      tourRequestId: tourRequestId,
      venueId: body.venueId,
      venueName: body.venueName,
      proposedDate: body.proposedDate,
      alternativeDates: body.alternativeDates || [],
      guarantee: body.guarantee,
      doorDeal: body.doorDeal,
      ticketPrice: {
        advance: body.ticketPrice?.advance,
        door: body.ticketPrice?.door,
      },
      merchandiseSplit: body.merchandiseSplit || '90/10',
      capacity: body.capacity,
      ageRestriction: body.ageRestriction || 'all-ages',
      equipmentProvided: {
        pa: body.equipmentProvided?.pa || false,
        mics: body.equipmentProvided?.mics || false,
        drums: body.equipmentProvided?.drums || false,
        amps: body.equipmentProvided?.amps || false,
        piano: body.equipmentProvided?.piano || false,
      },
      loadIn: body.loadIn || '',
      soundcheck: body.soundcheck || '',
      doorsOpen: body.doorsOpen || '',
      showTime: body.showTime || '',
      curfew: body.curfew || '',
      promotion: {
        social: body.promotion?.social || false,
        flyerPrinting: body.promotion?.flyerPrinting || false,
        radioSpots: body.promotion?.radioSpots || false,
        pressCoverage: body.promotion?.pressCoverage || false,
      },
      lodging: body.lodging,
      message: body.message,
      additionalTerms: body.additionalTerms || '',
      status: 'pending',
      readByArtist: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    bids.push(newBid);
    writeBids(bids);
    
    // Update tour request response count
    const tourRequestIndex = tourRequests.findIndex(req => req.id === tourRequestId);
    if (tourRequestIndex !== -1) {
      tourRequests[tourRequestIndex].responses += 1;
      tourRequests[tourRequestIndex].updatedAt = new Date().toISOString();
      writeTourRequests(tourRequests);
    }

    console.log(`🏟️ New bid: ${newBid.venueName} → ${tourRequest.artistName} (${tourRequest.title})`);

    return NextResponse.json(newBid, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tour-requests/[id]/bids:', error);
    return NextResponse.json(
      { error: 'Failed to create bid' },
      { status: 500 }
    );
  }
} 
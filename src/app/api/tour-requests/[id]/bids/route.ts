import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { VenueBid, TourRequest } from '../../../../../../types';

const BIDS_FILE = path.join(process.cwd(), 'data', 'bids.json');
const tourRequestsFilePath = path.join(process.cwd(), 'data', 'tour-requests.json');

function readBids() {
  try {
    if (!fs.existsSync(BIDS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(BIDS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading bids:', error);
    return [];
  }
}

function writeBids(bids: any[]) {
  try {
    const dir = path.dirname(BIDS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BIDS_FILE, JSON.stringify(bids, null, 2));
  } catch (error) {
    console.error('Error writing bids:', error);
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
    const { id } = await params;
    const bids = readBids();
    
    // Filter bids by tour request ID
    const tourRequestBids = bids.filter((bid: any) => bid.tourRequestId === id);
    
    return NextResponse.json(tourRequestBids);
  } catch (error) {
    console.error('Error fetching tour request bids:', error);
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tourRequestId } = await params;
    const body = await request.json();
    
    console.log('🎯 Received bid data:', JSON.stringify(body, null, 2));
    
    // Validate required fields - updated to match form structure
    const requiredFields = ['venueId', 'venueName', 'proposedDate', 'capacity', 'message'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const bids = readBids();
    
    // Check if venue has already bid on this tour request
    const existingBid = bids.find((bid: any) => 
      bid.tourRequestId === tourRequestId && bid.venueId === body.venueId
    );
    
    if (existingBid) {
      return NextResponse.json(
        { error: 'You have already submitted a bid for this tour request' },
        { status: 400 }
      );
    }
    
    // Generate new bid ID
    const newBidId = `bid-${Date.now()}`;
    
    // Create new bid with proper structure
    const newBid = {
      id: newBidId,
      tourRequestId,
      venueId: body.venueId,
      venueName: body.venueName,
      proposedDate: body.proposedDate,
      alternativeDates: body.alternativeDates || [],
      guarantee: body.guarantee || undefined,
      doorDeal: body.doorDeal || undefined,
      ticketPrice: body.ticketPrice || {},
      merchandiseSplit: body.merchandiseSplit || '90/10',
      capacity: parseInt(body.capacity),
      ageRestriction: body.ageRestriction || 'all-ages',
      equipmentProvided: body.equipmentProvided || {},
      loadIn: body.loadIn || '',
      soundcheck: body.soundcheck || '',
      doorsOpen: body.doorsOpen || '',
      showTime: body.showTime || '',
      curfew: body.curfew || '',
      promotion: body.promotion || {},
      lodging: body.lodging || undefined,
      message: body.message,
      additionalTerms: body.additionalTerms || '',
      status: 'pending',
      readByArtist: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    bids.push(newBid);
    writeBids(bids);

    console.log(`🎯 New bid submitted: ${body.venueName} → Tour Request ${tourRequestId}`);
    console.log(`🎯 Bid details: $${body.guarantee} guarantee, ${body.doorDeal?.split || 'no door deal'}`);

    return NextResponse.json(newBid, { status: 201 });
  } catch (error) {
    console.error('Error creating bid:', error);
    return NextResponse.json(
      { error: 'Failed to submit bid' },
      { status: 500 }
    );
  }
} 
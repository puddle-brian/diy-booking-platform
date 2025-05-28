import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { BidStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch bids from database with venue information
    const bids = await prisma.bid.findMany({
      where: {
        tourRequestId: id
      },
      include: {
        venue: {
          include: {
            location: true
          }
        },
        bidder: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match the expected VenueBid interface
    const transformedBids = bids.map(bid => ({
      id: bid.id,
      tourRequestId: bid.tourRequestId,
      venueId: bid.venueId,
      venueName: bid.venue.name,
      proposedDate: bid.proposedDate?.toISOString() || '',
      guarantee: bid.amount || undefined,
      doorDeal: undefined, // Not in current schema
      ticketPrice: {}, // Not in current schema
      capacity: bid.venue.capacity || 150,
      ageRestriction: bid.venue.ageRestriction || 'ALL_AGES',
      equipmentProvided: bid.venue.equipment || {},
      loadIn: '6:00 PM', // Default values since not in schema
      soundcheck: '7:00 PM',
      doorsOpen: '8:00 PM',
      showTime: '9:00 PM',
      curfew: '11:30 PM',
      promotion: {},
      message: bid.message || '',
      status: bid.status === 'PENDING' ? 'pending' :
              bid.status === 'HOLD' ? 'hold' :
              bid.status === 'ACCEPTED' ? 'accepted' :
              bid.status === 'REJECTED' ? 'declined' :
              bid.status === 'WITHDRAWN' ? 'cancelled' :
              bid.status === 'CANCELLED' ? 'cancelled' :
              'pending', // fallback
      readByArtist: true, // Default to true
      createdAt: bid.createdAt.toISOString(),
      updatedAt: bid.updatedAt.toISOString(),
      expiresAt: new Date(bid.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      
      // 🎯 HOLD MANAGEMENT FIELDS
      holdPosition: bid.holdPosition || undefined,
      heldAt: bid.heldAt?.toISOString() || undefined,
      heldUntil: bid.heldUntil?.toISOString() || undefined,
      
      // 🎯 ACCEPTANCE/DECLINE TRACKING
      acceptedAt: bid.acceptedAt?.toISOString() || undefined,
      declinedAt: bid.declinedAt?.toISOString() || undefined,
      declinedReason: bid.declinedReason || undefined,
      
      // 🎯 CANCELLATION TRACKING
      cancelledAt: bid.cancelledAt?.toISOString() || undefined,
      cancelledReason: bid.cancelledReason || undefined,
      
      // 🎯 BILLING ORDER FIELDS
      billingPosition: bid.billingPosition || 'headliner', // Default since not in schema yet
      lineupPosition: bid.lineupPosition || undefined,
      setLength: bid.setLength || 45, // Default 45 minutes
      otherActs: bid.otherActs || 'Local opener TBD',
      billingNotes: bid.billingNotes || ''
    }));
    
    return NextResponse.json(transformedBids);
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
    
    // Validate required fields
    const requiredFields = ['venueId', 'venueName', 'proposedDate', 'message'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if venue has already bid on this tour request
    const existingBid = await prisma.bid.findFirst({
      where: {
        tourRequestId: tourRequestId,
        venueId: body.venueId
      }
    });
    
    if (existingBid) {
      return NextResponse.json(
        { error: 'You have already submitted a bid for this tour request' },
        { status: 400 }
      );
    }

    // Get system user for bidderId (required field)
    let systemUser = await prisma.user.findFirst({
      where: { username: 'system' }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          username: 'system',
          email: 'system@diyshows.com',
          verified: true
        }
      });
    }
    
    // Create new bid in database
    const newBid = await prisma.bid.create({
      data: {
        tourRequestId,
        venueId: body.venueId,
        bidderId: systemUser.id, // Required field
        proposedDate: new Date(body.proposedDate),
        amount: body.guarantee ? parseFloat(body.guarantee) : null,
        message: body.message,
        status: BidStatus.PENDING
      },
      include: {
        venue: {
          include: {
            location: true
          }
        }
      }
    });

    // Transform response to match expected format
    const transformedBid = {
      id: newBid.id,
      tourRequestId: newBid.tourRequestId,
      venueId: newBid.venueId,
      venueName: newBid.venue.name,
      proposedDate: newBid.proposedDate?.toISOString() || '',
      guarantee: newBid.amount || undefined,
      doorDeal: body.doorDeal || undefined,
      ticketPrice: body.ticketPrice || {},
      merchandiseSplit: body.merchandiseSplit || '90/10',
      capacity: body.capacity ? parseInt(body.capacity) : newBid.venue.capacity || 150,
      ageRestriction: body.ageRestriction || newBid.venue.ageRestriction || 'ALL_AGES',
      equipmentProvided: body.equipmentProvided || {},
      loadIn: body.loadIn || '6:00 PM',
      soundcheck: body.soundcheck || '7:00 PM',
      doorsOpen: body.doorsOpen || '8:00 PM',
      showTime: body.showTime || '9:00 PM',
      curfew: body.curfew || '11:30 PM',
      promotion: body.promotion || {},
      lodging: body.lodging || undefined,
      billingPosition: body.billingPosition || 'headliner',
      lineupPosition: body.lineupPosition || undefined,
      setLength: body.setLength || 45,
      otherActs: body.otherActs || 'Local opener TBD',
      billingNotes: body.billingNotes || '',
      message: newBid.message,
      additionalTerms: body.additionalTerms || '',
      status: 'pending',
      readByArtist: false,
      createdAt: newBid.createdAt.toISOString(),
      updatedAt: newBid.updatedAt.toISOString(),
      expiresAt: new Date(newBid.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    console.log(`🎯 New bid submitted: ${body.venueName} → Tour Request ${tourRequestId}`);
    console.log(`🎯 Bid details: $${body.guarantee} guarantee`);

    return NextResponse.json(transformedBid, { status: 201 });
  } catch (error) {
    console.error('Error creating bid:', error);
    return NextResponse.json(
      { error: 'Failed to submit bid' },
      { status: 500 }
    );
  }
} 
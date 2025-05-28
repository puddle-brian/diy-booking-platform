import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch bids from database for this venue
    const bids = await prisma.bid.findMany({
      where: {
        venueId: id
      },
      include: {
        tourRequest: {
          include: {
            artist: {
              include: {
                location: true
              }
            }
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

    // Transform to match expected format
    const transformedBids = bids.map(bid => ({
      id: bid.id,
      tourRequestId: bid.tourRequestId,
      venueId: bid.venueId,
      venueName: '', // Will be filled by venue data
      proposedDate: bid.proposedDate?.toISOString() || '',
      guarantee: bid.amount || undefined,
      doorDeal: undefined,
      ticketPrice: {},
      capacity: 150, // Default
      ageRestriction: 'ALL_AGES',
      equipmentProvided: {},
      loadIn: '6:00 PM',
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
      readByArtist: true,
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
      billingPosition: bid.billingPosition || 'headliner',
      lineupPosition: bid.lineupPosition || undefined,
      setLength: bid.setLength || 45,
      otherActs: bid.otherActs || 'Local opener TBD',
      billingNotes: bid.billingNotes || '',
      
      // Tour request info for venue view
      tourRequestTitle: bid.tourRequest.title,
      artistName: bid.tourRequest.artist.name,
      artistLocation: bid.tourRequest.artist.location ? 
        `${bid.tourRequest.artist.location.city}, ${bid.tourRequest.artist.location.stateProvince}` : 
        'Unknown'
    }));
    
    return NextResponse.json(transformedBids);
  } catch (error) {
    console.error('Error fetching venue bids:', error);
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
  }
} 
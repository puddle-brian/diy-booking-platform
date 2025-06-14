import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentShowId = searchParams.get('parentShowId');
    const isLineupSlot = searchParams.get('isLineupSlot');

    // If querying for lineup bids
    if (parentShowId && isLineupSlot === 'true') {
      console.log(`🎵 API: Fetching lineup bids for show ${parentShowId}`);
      
      const bids = await prisma.bid.findMany({
        where: {
          parentShowId: parentShowId,
          isLineupSlot: true
        },
        include: {
          tourRequest: {
            include: {
              artist: true
            }
          },
          bidder: true,
          invitedBy: true
        },
        orderBy: {
          billingOrder: 'asc'
        }
      });

      console.log(`🎵 API: Found ${bids.length} lineup bids`);
      
      // Transform to match expected format
      const transformedBids = bids.map(bid => ({
        id: bid.id,
        showRequestId: bid.tourRequestId,
        venueId: bid.venueId,
        venueName: '', // Will be filled from venue data if needed
        proposedDate: bid.proposedDate?.toISOString() || '',
        guarantee: bid.amount,
        setLength: bid.setLength,
        status: bid.status.toLowerCase(),
        message: bid.message || '',
        createdAt: bid.createdAt.toISOString(),
        updatedAt: bid.updatedAt.toISOString(),
        // Lineup-specific fields
        isLineupSlot: true,
        parentShowId: bid.parentShowId,
        lineupRole: bid.lineupRole,
        billingOrder: bid.billingOrder,
        invitedByUserId: bid.invitedByUserId,
        tourRequest: {
          artist: {
            id: bid.tourRequest.artist.id,
            name: bid.tourRequest.artist.name
          }
        },
        bidder: {
          id: bid.bidder.id,
          username: bid.bidder.username
        }
      }));

      return NextResponse.json(transformedBids);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error in GET /api/bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
} 
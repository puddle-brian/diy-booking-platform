import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Find all active holds with their associated bids
    const activeHolds = await prisma.holdRequest.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        showRequest: {
          include: {
            artist: {
              select: { name: true, id: true }
            }
          }
        },
        requestedBy: {
          select: { username: true, id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // For each hold, get the held and frozen bids
    const scenarios = await Promise.all(
      activeHolds.map(async (hold) => {
        if (!hold.showRequestId) return null;

        // Get held bid (holdState = 'HELD')
        const heldBid = await prisma.bid.findFirst({
          where: {
            tourRequestId: hold.showRequestId,
            holdState: 'HELD'
          },
          include: {
            venue: { select: { name: true, id: true } }
          }
        });

        // Get frozen bids (holdState = 'FROZEN')
        const frozenBids = await prisma.bid.findMany({
          where: {
            tourRequestId: hold.showRequestId,
            holdState: 'FROZEN'
          },
          include: {
            venue: { select: { name: true, id: true } }
          }
        });

        if (!heldBid) return null;

        return {
          id: hold.id,
          name: `${hold.showRequest?.artist?.name || 'Unknown'} Hold`,
          description: `Active hold on ${heldBid.venue?.name} with ${frozenBids.length} frozen competing bids`,
          artistId: hold.showRequest?.artist?.id || '',
          artistName: hold.showRequest?.artist?.name || 'Unknown',
          tourRequestId: hold.showRequestId,
          tourRequestTitle: hold.showRequest?.title || 'Unknown Tour',
          heldVenue: {
            id: heldBid.venue?.id || '',
            name: heldBid.venue?.name || 'Unknown',
            bidId: heldBid.id
          },
          frozenVenues: frozenBids.map(bid => ({
            id: bid.venue?.id || '',
            name: bid.venue?.name || 'Unknown',
            bidId: bid.id
          })),
          holdDuration: hold.duration,
          holdReason: hold.reason,
          isActive: true,
          createdAt: hold.createdAt.toISOString()
        };
      })
    );

    // Filter out null results
    const validScenarios = scenarios.filter(scenario => scenario !== null);

    return NextResponse.json(validScenarios);
  } catch (error) {
    console.error('Error fetching hold scenarios:', error);
    return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 
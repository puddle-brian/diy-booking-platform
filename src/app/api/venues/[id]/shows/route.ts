import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: venueId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
    }

    // Query for confirmed shows on this date with lineup
    const shows = await (prisma.show as any).findMany({
      where: {
        venueId: venueId,
        date: {
          gte: new Date(date + 'T00:00:00.000Z'),
          lt: new Date(date + 'T23:59:59.999Z')
        },
        status: 'CONFIRMED'
      },
      include: {
        lineup: {
          include: {
            artist: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            performanceOrder: 'asc'
          }
        }
      }
    });

    // Also check for accepted venue offers on this date
    const acceptedOffers = await prisma.showRequest.findMany({
      where: {
        venueId: venueId,
        requestedDate: {
          gte: new Date(date + 'T00:00:00.000Z'),
          lt: new Date(date + 'T23:59:59.999Z')
        },
        status: 'CONFIRMED',
        initiatedBy: 'VENUE'
      },
      include: {
        artist: {
          select: {
            name: true
          }
        }
      }
    });

    // Combine and format the response
    const allShows = [
      // Transform shows with lineup to maintain backwards compatibility
      ...shows.flatMap((show: any) => 
        show.lineup.map((lineupEntry: any) => ({
          id: show.id,
          billingPosition: lineupEntry.billingPosition,
          artistName: lineupEntry.artist?.name,
          type: 'show'
        }))
      ),
      ...acceptedOffers.map(offer => ({
        id: offer.id,
        billingPosition: offer.billingPosition,
        artistName: offer.artist?.name,
        type: 'offer'
      }))
    ];

    return NextResponse.json(allShows);
  } catch (error) {
    console.error('Error fetching venue shows:', error);
    return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 
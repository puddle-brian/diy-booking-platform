import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: venueId } = params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
    }

    // Query for confirmed shows on this date
    const shows = await prisma.show.findMany({
      where: {
        venueId: venueId,
        date: {
          gte: new Date(date + 'T00:00:00.000Z'),
          lt: new Date(date + 'T23:59:59.999Z')
        },
        status: 'CONFIRMED'
      },
      include: {
        artist: {
          select: {
            name: true
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
      ...shows.map(show => ({
        id: show.id,
        billingPosition: (show.billingOrder as any)?.position,
        artistName: show.artist?.name,
        type: 'show'
      })),
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
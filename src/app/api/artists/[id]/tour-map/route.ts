import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

/**
 * GET /api/artists/[id]/tour-map
 * 
 * Returns tour dates with coordinates for mapping.
 * Only includes dates where the venue has valid coordinates.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: artistId } = await params;

    // Get all date entries for this artist that have confirmed/hold/pending status
    const dateEntries = await prisma.dateEntry.findMany({
      where: {
        artistId,
        status: {
          in: ['CONFIRMED', 'HOLD', 'HOLD_REQUESTED', 'PENDING', 'INQUIRY'],
        },
      },
      include: {
        venue: {
          include: {
            location: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Filter to only dates with valid coordinates and map to response format
    const mappableDates = dateEntries
      .filter(
        (entry) =>
          entry.venue?.location?.latitude != null &&
          entry.venue?.location?.longitude != null
      )
      .map((entry) => ({
        id: entry.id,
        date: entry.date.toISOString().split('T')[0], // Just the date part
        venueName: entry.venue.name,
        city: entry.venue.location.city,
        state: entry.venue.location.stateProvince || '',
        status: entry.status.toLowerCase(),
        latitude: entry.venue.location.latitude!,
        longitude: entry.venue.location.longitude!,
      }));

    // Sort by date
    mappableDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      dates: mappableDates,
      count: mappableDates.length,
      missingCoordinates: dateEntries.length - mappableDates.length,
    });
  } catch (error) {
    console.error('Error fetching tour map data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour map data' },
      { status: 500 }
    );
  }
}



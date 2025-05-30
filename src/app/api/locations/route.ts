import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

interface LocationData {
  id: string;
  city: string;
  stateProvince: string | null;
  country: string;
  _count: {
    venues: number;
    artists: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Get unique locations from the database
    const locations = await prisma.location.findMany({
      where: {
        OR: [
          {
            city: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            stateProvince: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        city: true,
        stateProvince: true,
        country: true,
        _count: {
          select: {
            venues: true,
            artists: true
          }
        }
      },
      take: limit,
      orderBy: [
        {
          venues: {
            _count: 'desc'
          }
        },
        {
          artists: {
            _count: 'desc'
          }
        },
        {
          city: 'asc'
        }
      ]
    });

    // Format locations for autocomplete
    const formattedLocations = locations.map((location: LocationData) => {
      const displayName = location.stateProvince 
        ? `${location.city}, ${location.stateProvince}`
        : location.city;
      
      const venueCount = location._count.venues;
      const artistCount = location._count.artists;
      const totalCount = venueCount + artistCount;

      return {
        id: location.id,
        displayName,
        city: location.city,
        state: location.stateProvince,
        country: location.country,
        venueCount,
        artistCount,
        totalCount,
        description: totalCount > 0 
          ? `${venueCount} venues, ${artistCount} artists`
          : 'New location'
      };
    });

    return NextResponse.json(formattedLocations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
} 
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
      // For international locations, include country in display name
      let displayName = '';
      if (location.country === 'USA') {
        // US format: "Portland, OR"
        displayName = location.stateProvince 
          ? `${location.city}, ${location.stateProvince}`
          : location.city;
      } else {
        // International format: "London, UK" or "Toronto, ON, Canada"
        if (location.stateProvince) {
          displayName = `${location.city}, ${location.stateProvince}, ${location.country}`;
        } else {
          displayName = `${location.city}, ${location.country}`;
        }
      }
      
      const venueCount = location._count.venues;
      const artistCount = location._count.artists;
      const totalCount = venueCount + artistCount;

      // Enhanced description for international locations
      let description = '';
      if (totalCount > 0) {
        const countryLabel = location.country === 'USA' ? '' : ` in ${location.country}`;
        description = `${venueCount} venues, ${artistCount} artists${countryLabel}`;
      } else {
        description = location.country === 'USA' ? 'New location' : `New location in ${location.country}`;
      }

      return {
        id: location.id,
        displayName,
        city: location.city,
        state: location.stateProvince,
        country: location.country,
        venueCount,
        artistCount,
        totalCount,
        description
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
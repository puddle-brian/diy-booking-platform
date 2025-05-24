import { NextRequest, NextResponse } from 'next/server';
import { getVenues, createVenue } from '../../../../lib/venues';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      city: searchParams.get('city') || undefined,
      genre: searchParams.get('genre') || undefined,
      venueType: searchParams.get('venueType') || undefined,
      ageRestriction: searchParams.get('ageRestriction') || undefined,
    };

    const venues = await getVenues(filters);
    return NextResponse.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const venueData = await request.json();
    const venue = await createVenue(venueData);
    return NextResponse.json(venue);
  } catch (error) {
    console.error('Error creating venue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create venue' },
      { status: 400 }
    );
  }
} 
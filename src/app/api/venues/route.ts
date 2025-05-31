import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const genre = searchParams.get('genre');
    const venueType = searchParams.get('venueType');
    const capacity = searchParams.get('capacity');
    const ageRestriction = searchParams.get('ageRestriction');
    
    console.log(`🏢 API: Fetching venues from database`);
    
    // Build where clause for filtering
    const where: any = {};
    
    if (city || state) {
      where.location = {};
      if (city) {
        where.location.city = {
          contains: city,
          mode: 'insensitive'
        };
      }
      if (state) {
        where.location.stateProvince = {
          equals: state,
          mode: 'insensitive'
        };
      }
    }
    
    if (venueType) {
      where.venueType = venueType.toUpperCase().replace('-', '_');
    }
    
    if (capacity) {
      const capacityNum = parseInt(capacity);
      where.capacity = {
        gte: capacityNum
      };
    }
    
    if (ageRestriction) {
      where.ageRestriction = ageRestriction.toUpperCase().replace('-', '_').replace('+', '_PLUS');
    }
    
    // Note: Venues don't have genres in our schema - genres are for artists
    // If genre filtering is needed, it would be through associated shows/artists
    
    // Fetch ALL venues with location data (no pagination)
    const venues = await prisma.venue.findMany({
      where,
      include: {
        location: true
      },
      orderBy: [
        { verified: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    console.log(`🏢 API: Found ${venues.length} venues in database`);
    
    // Transform data to match frontend expectations
    const transformedVenues = venues.map((venue: any) => ({
      id: venue.id,
      name: venue.name,
      city: venue.location.city,
      state: venue.location.stateProvince,
      country: venue.location.country,
      streetAddress: venue.streetAddress,
      addressLine2: venue.addressLine2,
      postalCode: venue.postalCode,
      neighborhood: venue.neighborhood,
      venueType: venue.venueType.toLowerCase().replace('_', '-'),
      genres: [], // Venues don't have genres in schema, but frontend expects this field
      artistTypesWelcome: venue.artistTypesWelcome || [], // Artist types this venue welcomes
      capacity: venue.capacity,
      ageRestriction: venue.ageRestriction?.toLowerCase().replace('_', '-').replace('-plus', '+'),
      equipment: venue.equipment || {},
      features: venue.features || [],
      pricing: venue.pricing || {},
      contact: {
        email: venue.contactEmail,
        phone: venue.contactPhone,
        website: venue.website,
        social: (venue.socialHandles as any)?.social
      },
      description: venue.description,
      images: venue.images || [],
      verified: venue.verified,
      rating: 0, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Count from reviews
      totalRatings: 0, // TODO: Count from reviews
      showsThisYear: 0, // TODO: Count from shows
      hasAccount: false, // TODO: Check if venue has user account
      unavailableDates: [], // Add this field for compatibility
      createdAt: venue.createdAt,
      updatedAt: venue.updatedAt
    }));
    
    console.log(`🏢 API: Returning ${transformedVenues.length} venues`);
    
    // Return simple array (not paginated object)
    return NextResponse.json(transformedVenues);
  } catch (error) {
    console.error('Error in GET /api/venues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const venueData = await request.json();
    
    // Create or find location
    let location = await prisma.location.findFirst({
      where: {
        city: venueData.city,
        stateProvince: venueData.state,
        country: venueData.country
      }
    });
    
    if (!location) {
      location = await prisma.location.create({
        data: {
          city: venueData.city,
          stateProvince: venueData.state,
          country: venueData.country
        }
      });
    }
    
    // Create venue
    const venue = await prisma.venue.create({
      data: {
        name: venueData.name,
        locationId: location.id,
        streetAddress: venueData.streetAddress,
        addressLine2: venueData.addressLine2,
        postalCode: venueData.postalCode,
        neighborhood: venueData.neighborhood,
        venueType: venueData.venueType.toUpperCase().replace('-', '_'),
        capacity: venueData.capacity,
        ageRestriction: venueData.ageRestriction?.toUpperCase().replace('-', '_').replace('+', '_PLUS'),
        artistTypesWelcome: venueData.artistTypesWelcome || [],
        contactEmail: venueData.contact?.email,
        contactPhone: venueData.contact?.phone,
        website: venueData.contact?.website,
        socialHandles: venueData.contact?.social ? { social: venueData.contact.social } : undefined,
        equipment: venueData.equipment,
        features: venueData.features || [],
        pricing: venueData.pricing,
        description: venueData.description,
        images: venueData.images || [],
        verified: true // Make new venues verified by default so they appear immediately
      },
      include: {
        location: true
      }
    });
    
    // Transform response to match frontend expectations
    const transformedVenue = {
      id: venue.id,
      name: venue.name,
      city: venue.location.city,
      state: venue.location.stateProvince,
      country: venue.location.country,
      streetAddress: venue.streetAddress,
      addressLine2: venue.addressLine2,
      postalCode: venue.postalCode,
      neighborhood: venue.neighborhood,
      venueType: venue.venueType.toLowerCase().replace('_', '-'),
      genres: [], // Venues don't have genres in schema, but frontend expects this field
      artistTypesWelcome: venue.artistTypesWelcome || [], // Artist types this venue welcomes
      capacity: venue.capacity,
      ageRestriction: venue.ageRestriction?.toLowerCase().replace('_', '-').replace('-plus', '+'),
      equipment: venue.equipment || {},
      features: venue.features || [],
      pricing: venue.pricing || {},
      contact: {
        email: venue.contactEmail,
        phone: venue.contactPhone,
        website: venue.website,
        social: (venue.socialHandles as any)?.social
      },
      description: venue.description,
      images: venue.images || [],
      verified: venue.verified,
      rating: 0,
      reviewCount: 0,
      totalRatings: 0,
      showsThisYear: 0,
      hasAccount: false,
      unavailableDates: [], // Add this field for compatibility
      createdAt: venue.createdAt,
      updatedAt: venue.updatedAt
    };
    
    return NextResponse.json(transformedVenue);
  } catch (error) {
    console.error('Error creating venue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create venue' },
      { status: 400 }
    );
  }
} 
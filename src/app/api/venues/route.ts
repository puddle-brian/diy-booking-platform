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
    
    // Fetch venues with location data
    let venues = await prisma.venue.findMany({
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
    
              // Apply genre filter (since genres are stored as JSON)
     if (genre) {
       venues = venues.filter(venue => {
         const venueData = venue as any;
         if (!venueData.genres) return false;
         const genres = Array.isArray(venueData.genres) ? venueData.genres as string[] : [];
         return genres.some((g: string) => g.toLowerCase().includes(genre.toLowerCase()));
       });
       console.log(`🏢 API: After genre filter: ${venues.length} venues`);
     }
     
     // Transform data to match frontend expectations
     const transformedVenues = venues.map(venue => {
       const venueData = venue as any;
       return {
         id: venue.id,
         name: venue.name,
         city: venue.location.city,
         state: venue.location.stateProvince,
         country: venue.location.country,
         venueType: venue.venueType.toLowerCase().replace('_', '-'),
         genres: Array.isArray(venueData.genres) ? venueData.genres as string[] : [],
         capacity: venue.capacity,
         ageRestriction: venue.ageRestriction?.toLowerCase().replace('_', '-').replace('-plus', '+'),
         equipment: venue.equipment || {},
         features: Array.isArray(venueData.features) ? venueData.features as string[] : [],
         pricing: venue.pricing || {},
         contact: {
           email: venue.contactEmail,
           phone: venue.contactPhone,
           website: venue.website,
           social: venueData.socialHandles?.social
         },
         description: venue.description,
         images: Array.isArray(venueData.images) ? venueData.images as string[] : [],
         verified: venue.verified,
         rating: 0, // TODO: Calculate from reviews
         reviewCount: 0, // TODO: Count from reviews
         showsThisYear: 0, // TODO: Count from shows
         hasAccount: false, // TODO: Check if venue has user account
         createdAt: venue.createdAt,
         updatedAt: venue.updatedAt
       };
     });
    
    console.log(`🏢 API: Returning ${transformedVenues.length} venues`);
    
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
        venueType: venueData.venueType.toUpperCase().replace('-', '_'),
        capacity: venueData.capacity,
        ageRestriction: venueData.ageRestriction?.toUpperCase().replace('-', '_').replace('+', '_PLUS'),
        contactEmail: venueData.contact?.email,
        contactPhone: venueData.contact?.phone,
        website: venueData.contact?.website,
        socialHandles: venueData.contact?.social ? { social: venueData.contact.social } : undefined,
        equipment: venueData.equipment,
        features: venueData.features,
        pricing: venueData.pricing,
        description: venueData.description,
        images: venueData.images
      },
      include: {
        location: true
      }
    });
    
         // Transform response to match frontend expectations
     const createdVenueData = venue as any;
     const transformedVenue = {
       id: venue.id,
       name: venue.name,
       city: venue.location.city,
       state: venue.location.stateProvince,
       country: venue.location.country,
       venueType: venue.venueType.toLowerCase().replace('_', '-'),
       genres: Array.isArray(createdVenueData.genres) ? createdVenueData.genres : [],
       capacity: venue.capacity,
       ageRestriction: venue.ageRestriction?.toLowerCase().replace('_', '-').replace('-plus', '+'),
       equipment: venue.equipment || {},
       features: Array.isArray(createdVenueData.features) ? createdVenueData.features : [],
       pricing: venue.pricing || {},
       contact: {
         email: venue.contactEmail,
         phone: venue.contactPhone,
         website: venue.website,
         social: createdVenueData.socialHandles?.social
       },
       description: venue.description,
       images: Array.isArray(createdVenueData.images) ? createdVenueData.images : [],
       verified: venue.verified,
       rating: 0,
       reviewCount: 0,
       showsThisYear: 0,
       hasAccount: false,
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
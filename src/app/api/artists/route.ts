import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { Artist } from '../../../../types/index';
import { TemplateType } from '@prisma/client';

// Artists API now uses database instead of JSON files

// Helper function to create a default template for new artists
async function createDefaultTemplate(artistId: string) {
  try {
    const defaultTemplate = {
      artistId,
      name: 'My Standard Setup',
      type: TemplateType.COMPLETE,
      isDefault: true,
      description: 'Default template with common touring requirements. Edit this to match your needs!',
      equipment: {
        needsPA: true,
        needsMics: true,
        needsDrums: false,
        needsAmps: true,
        acoustic: false,
      },
      guaranteeRange: {
        min: 200,
        max: 500
      },
      acceptsDoorDeals: true,
      merchandising: true,
      travelMethod: 'van',
      lodging: 'flexible',
      ageRestriction: 'all-ages',
      tourStatus: 'exploring-interest',
      notes: 'This is your default template! Edit it in your artist dashboard to match your specific needs. You can create additional templates for different types of shows (acoustic, full band, festival, etc.)'
    };

    const template = await prisma.artistTemplate.create({
      data: defaultTemplate
    });

    console.log(`🎨 Created default template for new artist ${artistId}`);
    return template;
  } catch (error) {
    console.error(`Failed to create default template for artist ${artistId}:`, error);
    // Don't throw - template creation failure shouldn't block artist creation
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Remove the auth requirement to make this a public endpoint
    console.log('🎵 API: Fetching artists from database');

    // Fetch ALL artists with location data (no pagination)
    const artists = await prisma.artist.findMany({
      include: {
        location: true
      },
      orderBy: [
        { verified: 'desc' },
        { name: 'asc' }
      ]
    });

    console.log(`🎵 API: Found ${artists.length} artists in database`);

    // Transform to match frontend expectations
    const transformedArtists = artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      city: artist.location?.city || '',
      state: artist.location?.stateProvince || '',
      country: artist.location?.country || 'USA',
      location: {
        city: artist.location?.city || '',
        state: artist.location?.stateProvince || '',
        country: artist.location?.country || 'USA',
        latitude: 0, // TODO: Add to location schema if needed
        longitude: 0, // TODO: Add to location schema if needed
      },
      artistType: artist.artistType?.toLowerCase() || 'band',
      genres: artist.genres || [],
      members: artist.members,
      yearFormed: artist.yearFormed,
      tourStatus: artist.tourStatus?.toLowerCase() || 'active',
      equipment: artist.equipmentNeeds || {},
      contact: {
        email: artist.contactEmail,
        phone: '',
        social: (artist.socialLinks as any)?.social,
        website: artist.website,
        booking: artist.contactEmail,
      },
      images: artist.images || ['/api/placeholder/band'],
      description: artist.description || '',
      expectedDraw: '', // TODO: Add to schema if needed
      rating: 0, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Count from reviews
      totalRatings: 0, // TODO: Count from reviews
      verified: artist.verified,
      claimed: false, // TODO: Check if artist has user account
      lastUpdated: artist.updatedAt.toISOString(),
      tourDates: [], // TODO: Get from tour requests
      bookedDates: [], // TODO: Get from shows
      homeBase: false, // TODO: Determine from tour radius
      showsThisYear: 0, // TODO: Count from shows
      tourRadius: 'regional', // TODO: Add to schema if needed
      hasAccount: false, // TODO: Check if artist has user account
      createdAt: artist.createdAt,
      updatedAt: artist.updatedAt,
    }));
    
    console.log(`🎵 API: Returning ${transformedArtists.length} artists`);
    
    // Return simple array (not paginated object)
    return NextResponse.json(transformedArtists);
  } catch (error) {
    console.error('Error in GET /api/artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🎵 API: Creating artist with data:', JSON.stringify(body, null, 2));
    
    // Validate required fields - update to match what frontend actually sends
    const requiredFields = ['name', 'city', 'state', 'country', 'artistType', 'contactEmail'];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`❌ Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.contactEmail)) {
      console.error(`❌ Invalid email format: ${body.contactEmail}`);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Handle yearFormed - convert "earlier" to a reasonable default
    let yearFormed = body.yearFormed;
    if (yearFormed !== undefined && yearFormed !== null) {
      if (typeof yearFormed === 'string') {
        if (yearFormed === 'earlier') {
          yearFormed = 2000; // Default for "earlier than X" selections
        } else {
          const parsed = parseInt(yearFormed);
          yearFormed = isNaN(parsed) ? null : parsed;
        }
      } else if (typeof yearFormed === 'number') {
        yearFormed = yearFormed;
      } else {
        yearFormed = null;
      }
    } else {
      // yearFormed is undefined/null - this is valid for artist types like DJs
      yearFormed = null;
    }

    // Handle members - ensure it's a valid number
    let members = body.members;
    if (members !== undefined && members !== null) {
      if (typeof members === 'string') {
        if (members.includes('+')) {
          // Handle "7+" case
          members = parseInt(members.replace('+', ''));
        } else {
          members = parseInt(members);
        }
      }
      if (isNaN(members) || members < 1) {
        members = null; // Set to null if invalid
      }
    } else {
      // members is undefined/null - this is valid for artist types like DJs, solo artists
      members = null;
    }

    console.log('🎵 API: Processed yearFormed:', yearFormed, 'members:', members);

    // Create or find location
    let location = await prisma.location.findFirst({
      where: {
        city: body.city,
        stateProvince: body.state,
        country: body.country || 'USA'
      }
    });
    
    if (!location) {
      console.log('🌍 Creating new location:', body.city, body.state, body.country);
      location = await prisma.location.create({
        data: {
          city: body.city,
          stateProvince: body.state,
          country: body.country || 'USA'
        }
      });
    }

    // Prepare artist data
    const artistData = {
      name: body.name,
      locationId: location.id,
      artistType: body.artistType?.toUpperCase() || 'BAND',
      genres: Array.isArray(body.genres) ? body.genres : [],
      members: members,
      yearFormed: yearFormed,
      tourStatus: body.tourStatus?.toUpperCase() || 'ACTIVE',
      equipmentNeeds: body.equipmentNeeds || {},
      contactEmail: body.contactEmail,
      website: body.website || undefined,
      socialLinks: body.socialLinks || undefined,
      description: body.description || '',
      images: Array.isArray(body.images) ? body.images : ['/api/placeholder/band'],
      verified: true // Make new artists verified by default so they appear immediately
    };

    console.log('🎵 API: Creating artist with processed data:', JSON.stringify(artistData, null, 2));

    // Create artist
    const artist = await prisma.artist.create({
      data: artistData,
      include: {
        location: true
      }
    });

    console.log('✅ Artist created successfully:', artist.id);

    // Transform response to match frontend expectations
    const transformedArtist = {
      id: artist.id,
      name: artist.name,
      city: artist.location.city,
      state: artist.location.stateProvince,
      country: artist.location.country,
      artistType: artist.artistType?.toLowerCase() || 'band',
      genres: artist.genres || [],
      members: artist.members,
      yearFormed: artist.yearFormed,
      tourStatus: artist.tourStatus?.toLowerCase() || 'active',
      equipment: artist.equipmentNeeds || {},
      contact: {
        email: artist.contactEmail,
        phone: '',
        social: (artist.socialLinks as any)?.social,
        website: artist.website,
        booking: artist.contactEmail,
      },
      images: artist.images || ['/api/placeholder/band'],
      description: artist.description || '',
      expectedDraw: '',
      rating: 0,
      reviewCount: 0,
      totalRatings: 0,
      verified: artist.verified,
      claimed: false,
      lastUpdated: artist.updatedAt.toISOString(),
      tourDates: [],
      bookedDates: [],
      homeBase: false,
      showsThisYear: 0,
      tourRadius: 'regional',
      hasAccount: false,
      createdAt: artist.createdAt,
      updatedAt: artist.updatedAt,
    };

    // Create default template for new artist
    await createDefaultTemplate(artist.id);

    return NextResponse.json(transformedArtist, { status: 201 });
  } catch (error) {
    console.error('❌ Error in POST /api/artists:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'An artist with this name and location already exists' },
          { status: 409 }
        );
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid location data provided' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create artist. Please check your data and try again.' },
      { status: 500 }
    );
  }
} 
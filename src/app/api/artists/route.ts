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
    console.log(`🎵 API: Fetching artists from database`);
    
    // Fetch ALL artists with location data (no pagination)
    const artists = await prisma.artist.findMany({
      include: {
        location: true
      },
      orderBy: [
        { verified: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    console.log(`🎵 API: Found ${artists.length} artists in database`);
    
    // Transform data to match frontend expectations
    const transformedArtists = artists.map((artist: any) => ({
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
      equipment: artist.equipmentNeeds || {
        needsPA: false,
        needsMics: false,
        needsDrums: false,
        needsAmps: false,
        acoustic: false,
      },
      contact: {
        email: artist.contactEmail,
        phone: '',
        social: (artist.socialHandles as any)?.social,
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
    
    // Validate required fields
    const requiredFields = ['name', 'city', 'state', 'country', 'artistType', 'contact'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.contact.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create or find location
    let location = await prisma.location.findFirst({
      where: {
        city: body.city,
        stateProvince: body.state,
        country: body.country || 'USA'
      }
    });
    
    if (!location) {
      location = await prisma.location.create({
        data: {
          city: body.city,
          stateProvince: body.state,
          country: body.country || 'USA'
        }
      });
    }

    // Create artist
    const artist = await prisma.artist.create({
      data: {
        name: body.name,
        locationId: location.id,
        artistType: body.artistType?.toUpperCase() || 'BAND',
        genres: body.genres || [],
        members: body.members || 1,
        yearFormed: body.yearFormed || new Date().getFullYear(),
        tourStatus: body.tourStatus?.toUpperCase() || 'ACTIVE',
        equipmentNeeds: body.equipment || {},
        contactEmail: body.contact.email,
        website: body.contact.website,
        socialHandles: body.contact.social ? { social: body.contact.social } : undefined,
        description: body.description || '',
        images: body.images || ['/api/placeholder/band']
      },
      include: {
        location: true
      }
    });

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
        social: (artist.socialHandles as any)?.social,
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
    console.error('Error in POST /api/artists:', error);
    return NextResponse.json(
      { error: 'Failed to create artist' },
      { status: 500 }
    );
  }
} 
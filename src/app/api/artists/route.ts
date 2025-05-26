import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Artist } from '../../../../types/index';

const artistsFilePath = path.join(process.cwd(), 'data', 'artists.json');

function readArtists(): Artist[] {
  try {
    if (!fs.existsSync(artistsFilePath)) {
      return [];
    }
    const data = fs.readFileSync(artistsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading artists file:', error);
    return [];
  }
}

function writeArtists(artists: Artist[]): void {
  try {
    const dir = path.dirname(artistsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(artistsFilePath, JSON.stringify(artists, null, 2));
  } catch (error) {
    console.error('Error writing artists file:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const artists = readArtists();
    return NextResponse.json(artists);
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

    const artists = readArtists();
    
    // Generate new ID
    const newId = Date.now().toString();
    
    // Create new artist with defaults
    const newArtist: Artist = {
      id: newId,
      name: body.name,
      city: body.city,
      state: body.state,
      country: body.country || 'USA',
      artistType: body.artistType || 'band',
      genres: body.genres || [],
      members: body.members || 1,
      yearFormed: body.yearFormed || new Date().getFullYear(),
      tourStatus: body.tourStatus || 'active',
      equipment: {
        needsPA: body.equipment?.needsPA || false,
        needsMics: body.equipment?.needsMics || false,
        needsDrums: body.equipment?.needsDrums || false,
        needsAmps: body.equipment?.needsAmps || false,
        acoustic: body.equipment?.acoustic || false,
      },
      contact: {
        email: body.contact.email,
        phone: body.contact.phone || '',
        social: body.contact.social || '',
        website: body.contact.website || '',
        booking: body.contact.booking || body.contact.email,
      },
      images: body.images || ['https://via.placeholder.com/400x400/6b7280/ffffff?text=' + encodeURIComponent(body.name)],
      description: body.description || '',
      expectedDraw: body.expectedDraw || '',
      rating: 0,
      reviewCount: 0,
      verified: false,
      claimed: false,
      lastUpdated: new Date().toISOString(),
      tourDates: [],
      bookedDates: [],
      homeBase: body.tourRadius === 'local',
      showsThisYear: 0,
      tourRadius: body.tourRadius || 'regional',
      hasAccount: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    artists.push(newArtist);
    writeArtists(artists);

    return NextResponse.json(newArtist, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/artists:', error);
    return NextResponse.json(
      { error: 'Failed to create artist' },
      { status: 500 }
    );
  }
} 
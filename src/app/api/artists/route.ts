import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Artist } from '../../../../types/index';

const artistsFilePath = path.join(process.cwd(), 'data', 'artists.json');

// Default sample artists for fallback
const defaultArtists: Artist[] = [
  {
    id: '1748101913848',
    name: 'Lightning Bolt',
    city: 'Providence',
    state: 'RI',
    country: 'USA',
    artistType: 'band',
    genres: ['noise', 'experimental', 'punk'],
    members: 2,
    yearFormed: 1994,
    tourStatus: 'active',
    equipment: {
      needsPA: true,
      needsMics: true,
      needsDrums: false,
      needsAmps: true,
      acoustic: false,
    },
    contact: {
      email: 'booking@lightningbolt.com',
      phone: '401-555-0199',
      social: '@lightningbolt',
      website: 'www.lightningbolt.com',
      booking: 'booking@lightningbolt.com',
    },
    images: ['/api/placeholder/band'],
    description: 'Experimental noise duo from Providence. Known for intense live performances.',
    expectedDraw: '200-500 people',
    rating: 4.8,
    reviewCount: 45,
    verified: true,
    claimed: true,
    lastUpdated: new Date().toISOString(),
    tourDates: [],
    bookedDates: [],
    homeBase: false,
    showsThisYear: 25,
    tourRadius: 'national',
    hasAccount: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Acoustic Folk Duo',
    city: 'Portland',
    state: 'OR',
    country: 'USA',
    artistType: 'duo',
    genres: ['folk', 'acoustic', 'indie'],
    members: 2,
    yearFormed: 2020,
    tourStatus: 'active',
    equipment: {
      needsPA: true,
      needsMics: true,
      needsDrums: false,
      needsAmps: false,
      acoustic: true,
    },
    contact: {
      email: 'bookings@folkduo.com',
      phone: '503-555-0123',
      social: '@folkduo',
      website: 'www.folkduo.com',
      booking: 'bookings@folkduo.com',
    },
    images: ['/api/placeholder/duo'],
    description: 'Intimate acoustic performances with beautiful harmonies.',
    expectedDraw: '50-100 people',
    rating: 4.5,
    reviewCount: 28,
    verified: true,
    claimed: false,
    lastUpdated: new Date().toISOString(),
    tourDates: [],
    bookedDates: [],
    homeBase: true,
    showsThisYear: 15,
    tourRadius: 'regional',
    hasAccount: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    name: 'The Indie Rockers',
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    artistType: 'band',
    genres: ['indie', 'rock', 'alternative'],
    members: 4,
    yearFormed: 2018,
    tourStatus: 'active',
    equipment: {
      needsPA: true,
      needsMics: true,
      needsDrums: true,
      needsAmps: true,
      acoustic: false,
    },
    contact: {
      email: 'contact@indierockers.com',
      phone: '206-555-0156',
      social: '@indierockers',
      website: 'www.indierockers.com',
      booking: 'booking@indierockers.com',
    },
    images: ['/api/placeholder/band'],
    description: 'Four-piece indie rock band with catchy melodies and energetic live shows.',
    expectedDraw: '100-300 people',
    rating: 4.3,
    reviewCount: 32,
    verified: true,
    claimed: true,
    lastUpdated: new Date().toISOString(),
    tourDates: [],
    bookedDates: [],
    homeBase: false,
    showsThisYear: 20,
    tourRadius: 'national',
    hasAccount: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '4',
    name: 'Solo Singer-Songwriter',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    artistType: 'solo',
    genres: ['folk', 'country', 'acoustic'],
    members: 1,
    yearFormed: 2019,
    tourStatus: 'active',
    equipment: {
      needsPA: true,
      needsMics: true,
      needsDrums: false,
      needsAmps: false,
      acoustic: true,
    },
    contact: {
      email: 'bookings@singersongwriter.com',
      phone: '512-555-0178',
      social: '@singersongwriter',
      website: 'www.singersongwriter.com',
      booking: 'bookings@singersongwriter.com',
    },
    images: ['/api/placeholder/solo'],
    description: 'Heartfelt songs with guitar and vocals. Perfect for intimate venues.',
    expectedDraw: '30-80 people',
    rating: 4.6,
    reviewCount: 19,
    verified: true,
    claimed: false,
    lastUpdated: new Date().toISOString(),
    tourDates: [],
    bookedDates: [],
    homeBase: true,
    showsThisYear: 12,
    tourRadius: 'regional',
    hasAccount: false,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '5',
    name: 'Electronic Experimental',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    artistType: 'solo',
    genres: ['electronic', 'experimental', 'ambient'],
    members: 1,
    yearFormed: 2021,
    tourStatus: 'selective',
    equipment: {
      needsPA: true,
      needsMics: false,
      needsDrums: false,
      needsAmps: false,
      acoustic: false,
    },
    contact: {
      email: 'contact@electronicexp.com',
      phone: '718-555-0134',
      social: '@electronicexp',
      website: 'www.electronicexp.com',
      booking: 'booking@electronicexp.com',
    },
    images: ['/api/placeholder/electronic'],
    description: 'Ambient electronic soundscapes and experimental compositions.',
    expectedDraw: '40-120 people',
    rating: 4.4,
    reviewCount: 16,
    verified: true,
    claimed: true,
    lastUpdated: new Date().toISOString(),
    tourDates: [],
    bookedDates: [],
    homeBase: false,
    showsThisYear: 8,
    tourRadius: 'national',
    hasAccount: true,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
];

function readArtists(): Artist[] {
  try {
    if (!fs.existsSync(artistsFilePath)) {
      console.log('Artists file not found, using default artists');
      return defaultArtists;
    }
    const data = fs.readFileSync(artistsFilePath, 'utf8');
    const artists = JSON.parse(data);
    return artists.length > 0 ? artists : defaultArtists;
  } catch (error) {
    console.warn('Error reading artists file, using defaults:', error);
    return defaultArtists;
  }
}

function writeArtists(artists: Artist[]): void {
  try {
    // In production, we can't write files, so just log the attempt
    if (process.env.NODE_ENV === 'production') {
      console.warn('Cannot write artists file in production environment');
      return;
    }
    
    const dir = path.dirname(artistsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(artistsFilePath, JSON.stringify(artists, null, 2));
  } catch (error) {
    console.error('Error writing artists file:', error);
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
}

export async function GET() {
  try {
    const artists = readArtists();
    return NextResponse.json(artists);
  } catch (error) {
    console.error('Error in GET /api/artists:', error);
    // Return default artists as fallback
    return NextResponse.json(defaultArtists);
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
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../../../../lib/prisma';
import { checkUsageLimit, recordUsage, UsageCheckResult } from '../../../../services/UsageService';

// Initialize the client (uses ANTHROPIC_API_KEY env var automatically)
const anthropic = new Anthropic();

// Map user-friendly values to database enums
const VENUE_TYPE_MAP: Record<string, string> = {
  'house-show': 'HOUSE_SHOW',
  'house show': 'HOUSE_SHOW',
  'basement': 'BASEMENT',
  'diy-space': 'WAREHOUSE', // Map DIY space to warehouse
  'diy space': 'WAREHOUSE',
  'bar': 'BAR',
  'club': 'CLUB',
  'record-store': 'RECORD_STORE',
  'record store': 'RECORD_STORE',
  'vfw-hall': 'VFW_HALL',
  'vfw': 'VFW_HALL',
  'community-center': 'COMMUNITY_CENTER',
  'community center': 'COMMUNITY_CENTER',
  'gallery': 'OTHER', // No gallery enum, use OTHER
  'coffee-shop': 'COFFEE_SHOP',
  'coffee shop': 'COFFEE_SHOP',
  'brewery': 'BAR',
  'warehouse': 'WAREHOUSE',
  'church': 'OTHER',
  'theater': 'OTHER',
  'outdoor': 'PARK',
  'park': 'PARK',
  'amphitheater': 'AMPHITHEATER',
  'other': 'OTHER',
};

const ARTIST_TYPE_MAP: Record<string, string> = {
  'band': 'BAND',
  'solo': 'SOLO',
  'duo': 'BAND', // No duo, use band
  'collective': 'COLLECTIVE',
  'dj': 'DJ',
  'rapper': 'SOLO',
  'comedian': 'SOLO',
  'poet': 'SOLO',
  'singer-songwriter': 'SOLO',
  'experimental': 'OTHER',
  'other': 'OTHER',
};

const AGE_RESTRICTION_MAP: Record<string, string> = {
  'all-ages': 'ALL_AGES',
  'all ages': 'ALL_AGES',
  '18+': 'EIGHTEEN_PLUS',
  '21+': 'TWENTY_ONE_PLUS',
};

const TOUR_STATUS_MAP: Record<string, string> = {
  'active': 'ACTIVE',
  'inactive': 'INACTIVE',
  'hiatus': 'HIATUS',
  'seeking-shows': 'ACTIVE',
  'not-touring': 'INACTIVE',
};

const BILLING_POSITION_MAP: Record<string, string> = {
  'headliner': 'HEADLINER',
  'co-headliner': 'CO_HEADLINER',
  'support': 'SUPPORT',
  'opener': 'OPENER',
  'local': 'LOCAL_SUPPORT',
  'local support': 'LOCAL_SUPPORT',
  'local-support': 'LOCAL_SUPPORT',
};

// V02: Simple date status map
const DATE_STATUS_MAP: Record<string, string> = {
  'inquiry': 'INQUIRY',
  'pending': 'PENDING',
  'hold_requested': 'HOLD_REQUESTED',
  'hold': 'HOLD',
  'confirmed': 'CONFIRMED',
  'declined': 'DECLINED',
  'cancelled': 'CANCELLED',
};

// Helper: Find or create a location
async function findOrCreateLocation(city: string, state: string, country: string = 'USA') {
  // Try to find existing location
  let location = await prisma.location.findFirst({
    where: {
      city: { equals: city, mode: 'insensitive' },
      stateProvince: state ? { equals: state, mode: 'insensitive' } : null,
      country: { equals: country, mode: 'insensitive' },
    }
  });

  // Create if not found
  if (!location) {
    location = await prisma.location.create({
      data: {
        city,
        stateProvince: state || null,
        country,
      }
    });
  }

  return location;
}

// Define the tools the agent can use
const tools: Anthropic.Tool[] = [
  {
    name: 'search_venues',
    description: 'Search for venues in the database by location, type, or name. Use this to help users find venues or check if a venue already exists.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query - can be city name, venue name, or state'
        },
        venueType: {
          type: 'string',
          description: 'Filter by venue type (e.g., house-show, basement, bar, warehouse)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 5)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_artists',
    description: 'Search for artists in the database by location, genre, or name. Use this to help users find artists or check if an artist already exists.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query - can be city name, artist name, or genre'
        },
        artistType: {
          type: 'string',
          description: 'Filter by artist type (band, solo, collective, dj)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 5)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'create_venue',
    description: 'Create a new venue listing in the database. Gather all required information from the user before calling this.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Name of the venue'
        },
        city: {
          type: 'string',
          description: 'City where the venue is located'
        },
        state: {
          type: 'string',
          description: 'State/province (use 2-letter code for US states, e.g., RI, CA, NY)'
        },
        country: {
          type: 'string',
          description: 'Country (default: USA)'
        },
        venueType: {
          type: 'string',
          description: 'Type of venue: house-show, basement, bar, club, warehouse, coffee-shop, record-store, vfw-hall, community-center, park, amphitheater, or other'
        },
        capacity: {
          type: 'number',
          description: 'Venue capacity (number of people)'
        },
        ageRestriction: {
          type: 'string',
          description: 'Age policy: all-ages, 18+, or 21+'
        },
        contactName: {
          type: 'string',
          description: 'Name of booking contact'
        },
        contactEmail: {
          type: 'string',
          description: 'Email for booking inquiries'
        },
        description: {
          type: 'string',
          description: 'Description of the venue, vibe, what makes it special'
        },
        streetAddress: {
          type: 'string',
          description: 'Street address (optional)'
        },
        neighborhood: {
          type: 'string',
          description: 'Neighborhood name (optional)'
        },
        website: {
          type: 'string',
          description: 'Website URL (optional)'
        },
        equipment: {
          type: 'object',
          description: 'Available equipment (e.g., {pa: true, drums: false, backline: true})'
        },
        genres: {
          type: 'array',
          items: { type: 'string' },
          description: 'Genres/styles the venue typically books'
        },
        imageUrl: {
          type: 'string',
          description: 'URL to a photo of the venue (optional). Can be from Instagram, website, etc.'
        }
      },
      required: ['name', 'city', 'state', 'venueType', 'contactEmail']
    }
  },
  {
    name: 'create_artist',
    description: 'Create a new artist listing in the database. Gather all required information from the user before calling this.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Artist or band name'
        },
        city: {
          type: 'string',
          description: 'City where the artist is based'
        },
        state: {
          type: 'string',
          description: 'State/province (use 2-letter code for US states)'
        },
        country: {
          type: 'string',
          description: 'Country (default: USA)'
        },
        artistType: {
          type: 'string',
          description: 'Type of artist: band, solo, collective, dj, or other'
        },
        genres: {
          type: 'array',
          items: { type: 'string' },
          description: 'Genres/styles (e.g., ["punk", "hardcore", "noise"])'
        },
        contactEmail: {
          type: 'string',
          description: 'Booking email'
        },
        description: {
          type: 'string',
          description: 'Bio/description of the artist'
        },
        members: {
          type: 'number',
          description: 'Number of members (for bands)'
        },
        yearFormed: {
          type: 'number',
          description: 'Year the artist/band formed'
        },
        status: {
          type: 'string',
          description: 'Current touring status: active, hiatus, or inactive'
        },
        website: {
          type: 'string',
          description: 'Website URL (optional)'
        },
        imageUrl: {
          type: 'string',
          description: 'URL to a photo of the artist/band (optional). Can be from Instagram, Bandcamp, website, etc.'
        }
      },
      required: ['name', 'city', 'state', 'artistType', 'contactEmail']
    }
  },
  // ======= V02 SIMPLE DATE TOOLS =======
  {
    name: 'get_dates',
    description: 'Get all dates for an artist or venue. Simple list of bookings with status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        artistId: {
          type: 'string',
          description: 'Artist ID to get dates for'
        },
        venueId: {
          type: 'string',
          description: 'Venue ID to get dates for'
        },
        status: {
          type: 'string',
          description: 'Filter by status: inquiry, pending, hold, confirmed, declined, cancelled (comma-separated OK)'
        }
      },
      required: []
    }
  },
  {
    name: 'add_date',
    description: 'Add a new date entry - book an artist at a venue on a specific date. Use this to create new bookings.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format'
        },
        artistId: {
          type: 'string',
          description: 'Artist ID (use search_artists to find)'
        },
        venueId: {
          type: 'string',
          description: 'Venue ID (use search_venues to find)'
        },
        artistName: {
          type: 'string',
          description: 'Artist name (will search if artistId not provided)'
        },
        venueName: {
          type: 'string',
          description: 'Venue name (will search if venueId not provided)'
        },
        status: {
          type: 'string',
          description: 'Status: inquiry (default), pending, confirmed'
        },
        guarantee: {
          type: 'number',
          description: 'Guarantee amount in dollars'
        },
        door: {
          type: 'string',
          description: 'Door deal terms (e.g., "70/30 after $200")'
        },
        billing: {
          type: 'string',
          description: 'Billing position: headliner, support, opener, local'
        },
        setLength: {
          type: 'number',
          description: 'Set length in minutes'
        },
        notes: {
          type: 'string',
          description: 'Any notes about this booking'
        }
      },
      required: ['date']
    }
  },
  {
    name: 'update_date',
    description: 'Update an existing date entry. Change status, deal, details, or add notes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        dateId: {
          type: 'string',
          description: 'The date entry ID to update'
        },
        status: {
          type: 'string',
          description: 'New status: inquiry, pending, hold, confirmed, declined, cancelled'
        },
        billing: {
          type: 'string',
          description: 'Billing position: headliner, support, opener, local'
        },
        setLength: {
          type: 'number',
          description: 'Set length in minutes'
        },
        deal: {
          type: 'object',
          description: 'Financial deal. Types: GUARANTEE ({type:"GUARANTEE",amount:500}), DOOR ({type:"DOOR",percent:100,expenses:200}), SPLIT ({type:"SPLIT",artistPercent:70,venuePercent:30}), GUARANTEE_VS_PERCENT ({type:"GUARANTEE_VS_PERCENT",guarantee:400,percent:80}), GUARANTEE_PLUS_SPLIT ({type:"GUARANTEE_PLUS_SPLIT",guarantee:300,artistPercent:70,threshold:500})'
        },
        details: {
          type: 'object',
          description: 'Show logistics: {loadIn,soundcheck,doors,setTime,curfew,ageRestriction,ticketPrice:{advance,door},hospitality,greenRoom,parking,lodging,guestList,merch,backline:{drums,bass_amp},promotion}'
        },
        notes: {
          type: 'string',
          description: 'Notes to ADD (will be appended with timestamp)'
        },
        holdUntil: {
          type: 'string',
          description: 'Hold expiry date (YYYY-MM-DD) - sets status to HOLD'
        },
        holdReason: {
          type: 'string',
          description: 'Reason for the hold'
        }
      },
      required: ['dateId']
    }
  },
  {
    name: 'delete_date',
    description: 'Remove a date entry completely.',
    input_schema: {
      type: 'object' as const,
      properties: {
        dateId: {
          type: 'string',
          description: 'The date entry ID to delete'
        }
      },
      required: ['dateId']
    }
  },
  {
    name: 'submit_feedback',
    description: 'Submit feedback about the platform when you encounter friction, limitations, or opportunities for improvement. Use this to help the platform continuously improve. This creates a feedback loop that helps the site evolve.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          description: 'Feedback type: bug, feature, ux, content, or other',
          enum: ['bug', 'feature', 'ux', 'content', 'other']
        },
        priority: {
          type: 'string',
          description: 'Priority level: low, medium, high, or critical',
          enum: ['low', 'medium', 'high', 'critical']
        },
        title: {
          type: 'string',
          description: 'Brief title summarizing the feedback'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the issue, limitation, or improvement opportunity'
        }
      },
      required: ['type', 'priority', 'title', 'description']
    }
  }
];

// Tool execution functions
async function searchVenues(params: { query: string; venueType?: string; limit?: number }) {
  const { query, venueType, limit = 5 } = params;
  
  // Map venue type if provided
  const mappedVenueType = venueType ? VENUE_TYPE_MAP[venueType.toLowerCase()] : undefined;
  
  const venues = await prisma.venue.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { location: { city: { contains: query, mode: 'insensitive' } } },
        { location: { stateProvince: { contains: query, mode: 'insensitive' } } },
      ],
      ...(mappedVenueType && { venueType: mappedVenueType as any })
    },
    take: limit,
    include: {
      location: true
    }
  });
  
  return venues.map(v => ({
    id: v.id,
    name: v.name,
    city: v.location.city,
    state: v.location.stateProvince,
    venueType: v.venueType,
    capacity: v.capacity,
    ageRestriction: v.ageRestriction,
    profileUrl: `/venues/${v.id}`
  }));
}

async function searchArtists(params: { query: string; artistType?: string; limit?: number }) {
  const { query, artistType, limit = 5 } = params;
  
  // Map artist type if provided
  const mappedArtistType = artistType ? ARTIST_TYPE_MAP[artistType.toLowerCase()] : undefined;
  
  const artists = await prisma.artist.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { location: { city: { contains: query, mode: 'insensitive' } } },
        { location: { stateProvince: { contains: query, mode: 'insensitive' } } },
        { genres: { hasSome: [query.toLowerCase()] } },
      ],
      ...(mappedArtistType && { artistType: mappedArtistType as any })
    },
    take: limit,
    include: {
      location: true
    }
  });
  
  return artists.map(a => ({
    id: a.id,
    name: a.name,
    city: a.location.city,
    state: a.location.stateProvince,
    artistType: a.artistType,
    genres: a.genres,
    profileUrl: `/artists/${a.id}`
  }));
}

async function createVenue(params: {
  name: string;
  city: string;
  state: string;
  country?: string;
  venueType: string;
  capacity?: number;
  ageRestriction?: string;
  contactName?: string;
  contactEmail: string;
  description?: string;
  streetAddress?: string;
  neighborhood?: string;
  website?: string;
  equipment?: Record<string, boolean>;
  genres?: string[];
  imageUrl?: string;
}) {
  // Find or create location
  const location = await findOrCreateLocation(
    params.city, 
    params.state, 
    params.country || 'USA'
  );

  // Map enum values
  const venueType = VENUE_TYPE_MAP[params.venueType.toLowerCase()] || 'OTHER';
  const ageRestriction = params.ageRestriction 
    ? AGE_RESTRICTION_MAP[params.ageRestriction.toLowerCase()] || 'ALL_AGES'
    : 'ALL_AGES';

  const venue = await prisma.venue.create({
    data: {
      name: params.name,
      locationId: location.id,
      venueType: venueType as any,
      capacity: params.capacity,
      ageRestriction: ageRestriction as any,
      contactEmail: params.contactEmail,
      description: params.description,
      streetAddress: params.streetAddress,
      neighborhood: params.neighborhood,
      website: params.website,
      equipment: params.equipment || {},
      features: [],
      images: params.imageUrl ? [params.imageUrl] : [],
      artistTypesWelcome: [],
    },
    include: {
      location: true
    }
  });
  
  return { 
    success: true, 
    venue: { 
      id: venue.id, 
      name: venue.name,
      city: venue.location.city,
      state: venue.location.stateProvince,
      profileUrl: `/venues/${venue.id}`
    } 
  };
}

async function createArtist(params: {
  name: string;
  city: string;
  state: string;
  country?: string;
  artistType: string;
  genres?: string[];
  contactEmail: string;
  description?: string;
  members?: number;
  yearFormed?: number;
  status?: string;
  website?: string;
  imageUrl?: string;
}) {
  // Find or create location
  const location = await findOrCreateLocation(
    params.city, 
    params.state, 
    params.country || 'USA'
  );

  // Map enum values
  const artistType = ARTIST_TYPE_MAP[params.artistType.toLowerCase()] || 'OTHER';
  const tourStatus = params.status 
    ? TOUR_STATUS_MAP[params.status.toLowerCase()] || 'ACTIVE'
    : 'ACTIVE';

  const artist = await prisma.artist.create({
    data: {
      name: params.name,
      locationId: location.id,
      artistType: artistType as any,
      genres: params.genres || [],
      contactEmail: params.contactEmail,
      description: params.description,
      members: params.members,
      yearFormed: params.yearFormed,
      tourStatus: tourStatus as any,
      website: params.website,
      images: params.imageUrl ? [params.imageUrl] : [],
    },
    include: {
      location: true
    }
  });
  
  return { 
    success: true, 
    artist: { 
      id: artist.id, 
      name: artist.name,
      city: artist.location.city,
      state: artist.location.stateProvince,
      profileUrl: `/artists/${artist.id}`
    } 
  };
}

// ======= V02 SIMPLE DATE TOOL FUNCTIONS =======

async function getDates(params: { 
  artistId?: string; 
  venueId?: string; 
  status?: string;
}) {
  const { artistId, venueId, status } = params;
  
  if (!artistId && !venueId) {
    return { error: 'Must specify either artistId or venueId' };
  }

  const where: any = {};
  if (artistId) where.artistId = artistId;
  if (venueId) where.venueId = venueId;
  if (status) {
    const statusList = status.split(',').map(s => s.trim().toUpperCase());
    where.status = { in: statusList };
  }

  const entries = await prisma.dateEntry.findMany({
    where,
    include: {
      artist: { select: { id: true, name: true } },
      venue: { 
        select: { 
          id: true, 
          name: true,
          location: { select: { city: true, stateProvince: true } }
        }
      },
    },
    orderBy: { date: 'asc' },
  });

  return {
    dates: entries.map(e => ({
      id: e.id,
      date: e.date.toISOString().split('T')[0],
      artistId: e.artistId,
      artistName: e.artist.name,
      venueId: e.venueId,
      venueName: e.venue.name,
      city: e.venue.location?.city,
      state: e.venue.location?.stateProvince,
      status: e.status.toLowerCase(),
      guarantee: e.guarantee,
      door: e.door,
      billing: e.billing,
      setLength: e.setLength,
      holdUntil: e.holdUntil?.toISOString().split('T')[0],
      holdReason: e.holdReason,
      notes: e.notes,
    })),
    count: entries.length,
    perspective: artistId ? 'artist' : 'venue',
  };
}

async function addDate(params: {
  date: string;
  artistId?: string;
  venueId?: string;
  artistName?: string;
  venueName?: string;
  status?: string;
  guarantee?: number;
  door?: string;
  billing?: string;
  setLength?: number;
  notes?: string;
}) {
  let { artistId, venueId, artistName, venueName, date, status, guarantee, door, billing, setLength, notes } = params;

  // Find artist by name if ID not provided
  if (!artistId && artistName) {
    const artist = await prisma.artist.findFirst({
      where: { name: { contains: artistName, mode: 'insensitive' } },
      select: { id: true, name: true }
    });
    if (!artist) {
      return { error: `Artist "${artistName}" not found. Try searching first.` };
    }
    artistId = artist.id;
    artistName = artist.name;
  }

  // Find venue by name if ID not provided
  if (!venueId && venueName) {
    const venue = await prisma.venue.findFirst({
      where: { name: { contains: venueName, mode: 'insensitive' } },
      select: { id: true, name: true }
    });
    if (!venue) {
      return { error: `Venue "${venueName}" not found. Try searching first.` };
    }
    venueId = venue.id;
    venueName = venue.name;
  }

  if (!artistId || !venueId) {
    return { error: 'Need both artist and venue. Specify by ID or name.' };
  }

  // Map status
  const mappedStatus = status 
    ? DATE_STATUS_MAP[status.toLowerCase()] || 'INQUIRY'
    : 'INQUIRY';

  try {
    const entry = await prisma.dateEntry.create({
      data: {
        date: new Date(date),
        artistId,
        venueId,
        status: mappedStatus as any,
        guarantee: guarantee || null,
        door: door || null,
        billing: billing || null,
        setLength: setLength || null,
        notes: notes || null,
      },
      include: {
        artist: { select: { name: true } },
        venue: { select: { name: true } },
      }
    });

    return {
      success: true,
      message: `Added: ${entry.artist.name} @ ${entry.venue.name} on ${date} (${mappedStatus.toLowerCase()})`,
      date: {
        id: entry.id,
        date: entry.date.toISOString().split('T')[0],
        artistName: entry.artist.name,
        venueName: entry.venue.name,
        status: entry.status.toLowerCase(),
        guarantee: entry.guarantee,
      }
    };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Entry already exists for this artist/venue/date' };
    }
    throw error;
  }
}

async function updateDate(params: {
  dateId: string;
  status?: string;
  billing?: string;
  setLength?: number;
  deal?: any;
  details?: any;
  notes?: string;
  holdUntil?: string;
  holdReason?: string;
}) {
  const { dateId, status, billing, setLength, deal, details, notes, holdUntil, holdReason } = params;

  const existing = await prisma.dateEntry.findUnique({
    where: { id: dateId },
    include: {
      artist: { select: { name: true } },
      venue: { select: { name: true } },
    }
  });

  if (!existing) {
    return { error: `Date entry not found: ${dateId}` };
  }

  // Build update data
  const data: any = {};
  const changes: string[] = [];
  
  if (status) {
    data.status = DATE_STATUS_MAP[status.toLowerCase()] || status.toUpperCase();
    changes.push(`status → ${status}`);
  }
  if (billing !== undefined) {
    data.billing = billing;
    changes.push(`billing → ${billing}`);
  }
  if (setLength !== undefined) {
    data.setLength = setLength;
    changes.push(`set length → ${setLength}min`);
  }
  
  // Handle structured deal
  if (deal !== undefined) {
    data.deal = deal;
    // Also update legacy fields for backwards compat
    if (deal.type === 'GUARANTEE') {
      data.guarantee = deal.amount;
      data.door = null;
    }
    changes.push(`deal → ${deal.type}`);
  }
  
  // Handle details (merge with existing)
  if (details !== undefined) {
    const existingDetails = (existing as any).details || {};
    data.details = { ...existingDetails, ...details };
    changes.push(`details updated`);
  }
  
  // Handle notes - append with timestamp
  if (notes !== undefined) {
    const timestamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const existingNotes = existing.notes || '';
    const newNote = `[${timestamp}] ${notes}`;
    data.notes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;
    changes.push(`note added`);
  }
  
  // Handle hold
  if (holdUntil) {
    data.holdUntil = new Date(holdUntil);
    data.status = 'HOLD';
    if (holdReason) data.holdReason = holdReason;
    changes.push(`on hold until ${holdUntil}`);
  }

  const updated = await prisma.dateEntry.update({
    where: { id: dateId },
    data,
    include: {
      artist: { select: { name: true } },
      venue: { select: { name: true } },
    }
  });

  return {
    success: true,
    message: `Updated ${updated.artist.name} @ ${updated.venue.name}: ${changes.join(', ')}`,
    date: {
      id: updated.id,
      date: updated.date.toISOString().split('T')[0],
      artistName: updated.artist.name,
      venueName: updated.venue.name,
      status: updated.status.toLowerCase(),
    }
  };
}

async function deleteDate(params: { dateId: string }) {
  const { dateId } = params;

  const existing = await prisma.dateEntry.findUnique({
    where: { id: dateId },
    include: {
      artist: { select: { name: true } },
      venue: { select: { name: true } },
    }
  });

  if (!existing) {
    return { error: `Date entry not found: ${dateId}` };
  }

  await prisma.dateEntry.delete({ where: { id: dateId } });

  return {
    success: true,
    message: `Removed: ${existing.artist.name} @ ${existing.venue.name} on ${existing.date.toISOString().split('T')[0]}`
  };
}

async function submitFeedback(params: {
  type: string;
  priority: string;
  title: string;
  description: string;
}, userId?: string) {
  const { type, priority, title, description } = params;

  try {
    const feedback = await prisma.feedback.create({
      data: {
        type: type.toUpperCase() as any,
        priority: priority.toUpperCase() as any,
        title,
        description,
        context: JSON.stringify({
          source: 'agent',
          userId: userId || null,
          timestamp: new Date().toISOString(),
        }),
        status: 'NEW',
        createdAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Feedback submitted successfully (ID: ${feedback.id})`,
      feedbackId: feedback.id
    };
  } catch (error) {
    console.error('Feedback submission error:', error);
    return {
      error: 'Failed to submit feedback',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Execute a tool call
async function executeTool(name: string, input: Record<string, unknown>, userId?: string): Promise<string> {
  try {
    switch (name) {
      case 'search_venues':
        const venues = await searchVenues(input as { query: string; venueType?: string; limit?: number });
        if (venues.length === 0) {
          return JSON.stringify({ message: 'No venues found matching that search.' });
        }
        return JSON.stringify({ venues, count: venues.length });
        
      case 'search_artists':
        const artists = await searchArtists(input as { query: string; artistType?: string; limit?: number });
        if (artists.length === 0) {
          return JSON.stringify({ message: 'No artists found matching that search.' });
        }
        return JSON.stringify({ artists, count: artists.length });
        
      case 'create_venue':
        const venueResult = await createVenue(input as Parameters<typeof createVenue>[0]);
        return JSON.stringify(venueResult);
        
      case 'create_artist':
        const artistResult = await createArtist(input as Parameters<typeof createArtist>[0]);
        return JSON.stringify(artistResult);
      
      // V02 Simple date tools
      case 'get_dates':
        const datesResult = await getDates(input as Parameters<typeof getDates>[0]);
        return JSON.stringify(datesResult);
        
      case 'add_date':
        const addDateResult = await addDate(input as Parameters<typeof addDate>[0]);
        return JSON.stringify(addDateResult);
        
      case 'update_date':
        const updateDateResult = await updateDate(input as Parameters<typeof updateDate>[0]);
        return JSON.stringify(updateDateResult);
        
      case 'delete_date':
        const deleteDateResult = await deleteDate(input as Parameters<typeof deleteDate>[0]);
        return JSON.stringify(deleteDateResult);
        
      case 'submit_feedback':
        const feedbackResult = await submitFeedback(
          input as Parameters<typeof submitFeedback>[0],
          userId
        );
        return JSON.stringify(feedbackResult);
        
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error);
    return JSON.stringify({ error: `Failed to execute ${name}: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
}

// V02 System prompt - persistent assistant with memory
const SYSTEM_PROMPT = `You are a personal booking assistant for DIY Shows, created by Brian Gibson from Lightning Bolt. This platform is inspired by the "Book Your Own Fucking Life" zine from the 90s, which empowered smaller-scale acts to book their own tours.

## Your Mission
Your purpose is to facilitate real human connection, celebration, and unique live events. In a world where technology often isolates us, you're here to reduce friction and help people come together. Every booking you help create is a step toward building community, supporting artists, and bringing people joy through shared experiences. This aligns with helping humanity flourish by strengthening local communities and enabling creative expression.

You have an ongoing relationship with each artist/venue - your conversation history is saved and you remember past discussions.

## Continuous Improvement & Feedback
If you encounter friction, limitations, or situations where better tools or features would help you serve users more effectively, you can submit feedback directly using the submit_feedback tool. This creates a feedback loop that helps the platform continuously improve. You can also encourage users to submit feedback when they encounter issues. When you notice gaps or opportunities for enhancement, use submit_feedback to document them so the site can evolve.

## Your Memory
- This is a PERSISTENT conversation - you remember previous chats
- Learn from what users tell you (preferences, contacts, typical deals)
- Reference past conversations when relevant ("last time you mentioned...")
- Build up knowledge about this artist/venue over time

## Your Tools

### Find Stuff:
- **search_venues** - Find venues by city, name, or state
- **search_artists** - Find artists by name, city, or genre

### Add Listings:
- **create_venue** - Add a new venue
- **create_artist** - Add a new artist

### Manage Dates:
- **get_dates** - View someone's calendar
- **add_date** - Book an artist at a venue for a date
- **update_date** - Change status, deal, details, or notes
- **delete_date** - Remove a date

### Platform Improvement:
- **submit_feedback** - Submit feedback about friction, limitations, or improvement opportunities you encounter

## Status Workflow

**For Artists receiving offers:**
- pending → accept / decline / request hold
- hold_requested → (waiting for venue)
- hold → accept / decline / release
- confirmed → cancel

**For Venues making offers:**
- inquiry → make offer / pass
- pending → (waiting for artist)
- hold_requested → approve hold / deny hold
- hold → (waiting for artist)
- confirmed → cancel

## Deal Types
- GUARANTEE: Flat fee ("$500")
- DOOR: Percentage after expenses ("100% after $200")
- SPLIT: Percentage split ("70/30")
- GUARANTEE_VS_PERCENT: Greater of ("$400 vs 80%")
- GUARANTEE_PLUS_SPLIT: Guarantee plus split ("$300 + 70% after $500")

## Show Details (Rider)
Can track: loadIn, soundcheck, doors, setTime, curfew, ticketPrice, hospitality, greenRoom, parking, lodging, guestList, merch, backline, promotion

## Notes
Use update_date with notes to add timestamped entries - great for tracking negotiations, contacts, preferences.

## Quick Tips
- Be brief but personal
- Execute immediately when clear
- Reference past conversations
- Track preferences over time
- DIY shows: $200-800 or door deals typical

## Tone
Like a trusted friend who handles your booking. Personal, efficient, remembers everything.`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { message, conversationHistory = [], context = {}, userId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // ========== USAGE LIMIT CHECK ==========
    // If userId is provided, check rate limits
    let usageCheck: UsageCheckResult | null = null;
    if (userId) {
      usageCheck = await checkUsageLimit(userId);
      
      if (!usageCheck.allowed) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            rateLimited: true,
            usage: {
              remaining: usageCheck.remaining,
              limit: usageCheck.limit,
              tier: usageCheck.tier,
              upgradeMessage: usageCheck.upgradeMessage,
            }
          },
          { status: 429 }
        );
      }
    }
    // ========================================

    // Build context prefix for the system prompt
    let contextPrefix = '';
    if (context.entityType && context.entityId) {
      contextPrefix = `\n\n## Current Context\nYou are helping manage dates for a ${context.entityType}: "${context.entityName}" (ID: ${context.entityId}). Use this ID in tool calls as ${context.entityType}Id.`;
      
      // If editing a specific date entry
      if (context.dateEntryId) {
        contextPrefix += `\n\nCurrently editing a specific date entry:\n- Date Entry ID: ${context.dateEntryId}\n- Date: ${context.dateEntryDate}\n- Artist: ${context.dateEntryArtist}\n- Venue: ${context.dateEntryVenue}\n\nUse update_date with dateId="${context.dateEntryId}" for any updates to this booking.`;
      }
    }

    // Build messages array with history
    let messages: Anthropic.MessageParam[] = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Track tools used and total tokens
    const toolsUsed: string[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Agentic loop - keep going until we get a final response
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + contextPrefix,
      tools: tools,
      messages: messages
    });

    // Track tokens from first response
    totalInputTokens += response.usage?.input_tokens || 0;
    totalOutputTokens += response.usage?.output_tokens || 0;

    // Handle tool use in a loop
    while (response.stop_reason === 'tool_use') {
      // Find all tool use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Track which tools were used
      toolUseBlocks.forEach(block => {
        if (!toolsUsed.includes(block.name)) {
          toolsUsed.push(block.name);
        }
      });

      // Execute all tools and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>, userId);
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: result
          };
        })
      );

      // Add assistant's response and tool results to messages
      messages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults }
      ];

      // Continue the conversation
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT + contextPrefix,
        tools: tools,
        messages: messages
      });

      // Track tokens from tool loop iterations
      totalInputTokens += response.usage?.input_tokens || 0;
      totalOutputTokens += response.usage?.output_tokens || 0;
    }

    // Extract final text response
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    const assistantMessage = textBlocks.map(b => b.text).join('\n');

    // ========== RECORD USAGE ==========
    const responseTimeMs = Date.now() - startTime;
    
    if (userId) {
      // Record usage asynchronously (don't block response)
      recordUsage({
        userId,
        type: 'AGENT_CHAT',
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        entityType: context.entityType,
        entityId: context.entityId,
        toolsUsed,
        responseTimeMs,
      }).catch(err => console.error('Failed to record usage:', err));
    }
    // ==================================

    // Build simplified conversation history for the client
    // (We don't send tool calls/results to keep it clean)
    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    ];

    // Include usage info in response for UI feedback
    const responsePayload: any = {
      message: assistantMessage,
      conversationHistory: newHistory
    };

    // Add usage stats if we have them
    if (usageCheck) {
      responsePayload.usage = {
        remaining: usageCheck.remaining !== undefined 
          ? (usageCheck.remaining === Infinity ? null : usageCheck.remaining - 1)
          : null,
        limit: usageCheck.limit === Infinity ? null : usageCheck.limit,
        tier: usageCheck.tier,
        tokens: {
          input: totalInputTokens,
          output: totalOutputTokens,
          total: totalInputTokens + totalOutputTokens,
        },
      };
    }

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

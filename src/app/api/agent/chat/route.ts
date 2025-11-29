import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../../../../lib/prisma';

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

// Execute a tool call
async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
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
        
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error);
    return JSON.stringify({ error: `Failed to execute ${name}: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
}

// System prompt that defines the agent's role and capabilities
const SYSTEM_PROMPT = `You are a helpful booking agent for DIY Shows, a platform connecting independent musicians with DIY venues. Think of yourself as a friendly tour manager who knows the DIY scene well.

## Your Capabilities

You have tools to:
1. **Search venues** - Find venues by location, type, or name
2. **Search artists** - Find artists by location, genre, or name  
3. **Create venues** - Add new venue listings to the database
4. **Create artists** - Add new artist listings to the database

## Guidelines

### When helping users ADD a venue or artist:
1. Have a natural conversation to gather the required info
2. Required for venues: name, city, state (2-letter code like RI, CA), venue type, contact email
3. Required for artists: name, city, state, artist type, contact email
4. Ask follow-up questions about optional but helpful details (capacity, genres, description)
5. Ask if they have a photo URL they'd like to use (from Instagram, their website, Bandcamp, etc.). If not, mention they can add photos later from their profile page.
6. Before creating, summarize what you'll create and confirm with the user
7. After creating, share the profile URL so they can view/edit their listing

### Venue Types:
house-show, basement, bar, club, warehouse, coffee-shop, record-store, vfw-hall, community-center, park, amphitheater, other

### Artist Types:
band, solo, collective, dj, other

### Common Genres:
punk, hardcore, indie, noise, experimental, folk, metal, emo, shoegaze, post-punk, garage, psych, electronic, hip-hop, jazz, country, bluegrass, ambient

### Age Restrictions:
all-ages, 18+, 21+

### Tone:
- Friendly and conversational, not corporate
- Knowledgeable about DIY touring and underground music
- Concise but warm
- Use the user's language and vibe

### Important:
- Always confirm before creating anything
- If a venue/artist might already exist, search first to check
- Use 2-letter state codes (RI, CA, NY, TX, etc.)
- Provide helpful context about what info is optional vs required`;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

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

    // Build messages array with history
    let messages: Anthropic.MessageParam[] = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Agentic loop - keep going until we get a final response
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: tools,
      messages: messages
    });

    // Handle tool use in a loop
    while (response.stop_reason === 'tool_use') {
      // Find all tool use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Execute all tools and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>);
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
        system: SYSTEM_PROMPT,
        tools: tools,
        messages: messages
      });
    }

    // Extract final text response
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    const assistantMessage = textBlocks.map(b => b.text).join('\n');

    // Build simplified conversation history for the client
    // (We don't send tool calls/results to keep it clean)
    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    ];

    return NextResponse.json({
      message: assistantMessage,
      conversationHistory: newHistory
    });

  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

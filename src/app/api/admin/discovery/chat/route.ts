import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../../../../../lib/prisma';

// Initialize the Anthropic client
const anthropic = new Anthropic();

// Discovery Agent Tools
const tools: Anthropic.Tool[] = [
  {
    name: 'web_search',
    description: `Search the web for DIY venues, artists, or music scenes. Use this to discover new entries for the database. 
    
Tips for effective searches:
- Include location: "DIY venues Portland Oregon"
- Include genre/scene: "punk house shows Chicago"  
- Include specific terms: "all ages venue", "basement shows", "warehouse concerts"
- Search for lists: "best DIY venues in [city]"
- Search music blogs: "DIY scene [city] 2024"`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find venues or artists'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'scrape_url',
    description: `Fetch and read content from a specific URL. Use this when the user provides a link to a venue list, blog post, spreadsheet, database, or any page with venue/artist information.

Great for:
- Venue list pages or directories
- Blog posts about local scenes
- Exported spreadsheets (Google Sheets published to web)
- Wiki pages with venue info
- Scene reports or guides

The tool returns the text content of the page. You should then parse it to extract venue/artist information and stage what you find.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch and read'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'stage_venue',
    description: `Stage a discovered venue for admin review. Extract as much information as possible to build the most comprehensive DIY venue database.

The goal is to create THE definitive database of DIY venues - every field you can fill helps artists find the right venues.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        // === BASIC INFO ===
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
          description: 'State/province (use 2-letter code for US states)'
        },
        country: {
          type: 'string',
          description: 'Country (default: USA)'
        },
        neighborhood: {
          type: 'string',
          description: 'Neighborhood or area within the city (e.g., "Williamsburg", "East Side")'
        },
        venueType: {
          type: 'string',
          description: 'Type: house-show, basement, bar, club, warehouse, coffee-shop, record-store, vfw-hall, community-center, art-gallery, church, brewery, other'
        },
        
        // === CAPACITY & ACCESS ===
        capacity: {
          type: 'number',
          description: 'Estimated capacity (number of people)'
        },
        ageRestriction: {
          type: 'string',
          description: 'Age policy: all-ages, 18+, 21+'
        },
        
        // === GENRES & BOOKING ===
        genres: {
          type: 'array',
          items: { type: 'string' },
          description: 'Genres they book (e.g., ["punk", "hardcore", "noise", "indie", "metal", "folk", "experimental", "hip-hop", "electronic"]). Be specific!'
        },
        bookingPreferences: {
          type: 'string',
          description: 'What they look for in acts: touring bands, local openers, specific styles, DIY ethics, etc.'
        },
        typicalBill: {
          type: 'string',
          description: 'How shows are typically structured: "3-4 local bands", "touring headliner + 2 locals", etc.'
        },
        
        // === EQUIPMENT & LOGISTICS ===
        equipmentProvided: {
          type: 'object',
          description: 'Equipment available: { pa: true/false, drums: true/false, backline: true/false, mics: true/false, monitors: true/false }'
        },
        loadInInfo: {
          type: 'string',
          description: 'Load-in details: street level, stairs, parking situation, etc.'
        },
        
        // === FINANCIAL ===
        typicalDeal: {
          type: 'string',
          description: 'Typical deal structure: "door deal 80/20", "$200-400 guarantee", "pass the hat", etc.'
        },
        
        // === CONTACT & SOCIAL ===
        contactEmail: {
          type: 'string',
          description: 'Booking email'
        },
        contactPhone: {
          type: 'string',
          description: 'Phone number if available'
        },
        website: {
          type: 'string',
          description: 'Website URL'
        },
        socialLinks: {
          type: 'object',
          description: 'Social media: { instagram: "url", facebook: "url", twitter: "url" }'
        },
        
        // === SCENE CONTEXT ===
        description: {
          type: 'string',
          description: 'Description of the venue - vibe, history, what makes it special'
        },
        sceneNotes: {
          type: 'string',
          description: 'Context about the local scene, who runs it, notable shows hosted, community connections'
        },
        yearsActive: {
          type: 'string',
          description: 'How long they\'ve been hosting shows (e.g., "since 2015", "10+ years")'
        },
        
        // === STATUS ===
        isActive: {
          type: 'boolean',
          description: 'Is the venue currently booking shows? (false if closed, hiatus, or uncertain)'
        },
        lastKnownShow: {
          type: 'string',
          description: 'Date or approximate time of last known show (e.g., "March 2024", "recently active")'
        },
        
        // === META ===
        sourceUrl: {
          type: 'string',
          description: 'URL where this information was found'
        },
        confidence: {
          type: 'number',
          description: 'Confidence score 0-100. Higher if more fields filled, verified sources, recent info.'
        },
        notes: {
          type: 'string',
          description: 'Your notes: data quality, what\'s missing, verification needs, etc.'
        }
      },
      required: ['name', 'city', 'state']
    }
  },
  {
    name: 'stage_artist',
    description: `Stage a discovered artist/band for admin review. Extract as much information as possible to build the most comprehensive DIY artist database.

The goal is to create THE definitive database of DIY/touring artists - every field helps venues find the right acts.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        // === BASIC INFO ===
        name: {
          type: 'string',
          description: 'Name of the artist/band'
        },
        city: {
          type: 'string',
          description: 'Home base city'
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
          description: 'Type: band, solo, duo, collective, dj, rapper, singer-songwriter, other'
        },
        
        // === MUSIC & STYLE ===
        genres: {
          type: 'array',
          items: { type: 'string' },
          description: 'Primary genres (e.g., ["punk", "hardcore"]). Use common genre tags.'
        },
        subgenres: {
          type: 'array',
          items: { type: 'string' },
          description: 'More specific styles (e.g., ["powerviolence", "d-beat", "crust", "post-punk", "shoegaze"])'
        },
        forFansOf: {
          type: 'array',
          items: { type: 'string' },
          description: 'Similar artists for reference (e.g., ["Black Flag", "Fugazi", "Melvins"])'
        },
        
        // === BAND DETAILS ===
        members: {
          type: 'number',
          description: 'Number of members'
        },
        yearFormed: {
          type: 'number',
          description: 'Year the band/project started'
        },
        
        // === TOURING & BOOKING ===
        tourStatus: {
          type: 'string',
          description: 'Current status: actively-touring, regional-only, local-only, hiatus, seeking-shows, inactive'
        },
        tourHistory: {
          type: 'string',
          description: 'Brief touring history: "3 US tours", "plays locally", "toured Europe 2023", etc.'
        },
        typicalDraw: {
          type: 'string',
          description: 'Expected crowd size in their home market: "50-100", "20-30", "150+", etc.'
        },
        typicalGuarantee: {
          type: 'string',
          description: 'What they typically get/ask for: "$200-400", "gas money", "door deal", etc.'
        },
        
        // === EQUIPMENT & LOGISTICS ===
        equipmentNeeds: {
          type: 'object',
          description: 'What they need provided: { drums: true/false, amps: true/false, pa: true/false, backline: "full/partial/none" }'
        },
        travelMethod: {
          type: 'string',
          description: 'How they travel: van, car, flying, etc.'
        },
        
        // === CONTACT & SOCIAL ===
        contactEmail: {
          type: 'string',
          description: 'Booking email'
        },
        contactPhone: {
          type: 'string',
          description: 'Phone if available'
        },
        website: {
          type: 'string',
          description: 'Official website'
        },
        bandcampUrl: {
          type: 'string',
          description: 'Bandcamp page URL'
        },
        socialLinks: {
          type: 'object',
          description: 'Social media: { instagram: "url", facebook: "url", twitter: "url", spotify: "url" }'
        },
        
        // === RELEASES ===
        discography: {
          type: 'string',
          description: 'Notable releases: "2 LPs, 3 EPs", "debut album 2023", etc.'
        },
        label: {
          type: 'string',
          description: 'Record label if any (or "self-released", "DIY")'
        },
        
        // === CONTEXT ===
        description: {
          type: 'string',
          description: 'Description of their sound, style, and what makes them notable'
        },
        sceneConnections: {
          type: 'string',
          description: 'Scene context: what community they\'re part of, notable collaborations, etc.'
        },
        
        // === STATUS ===
        isActive: {
          type: 'boolean',
          description: 'Is the artist currently active? (false if broken up, hiatus, uncertain)'
        },
        lastKnownActivity: {
          type: 'string',
          description: 'Last known show or release: "played 3/2024", "released EP 2023"'
        },
        
        // === META ===
        sourceUrl: {
          type: 'string',
          description: 'URL where this information was found'
        },
        confidence: {
          type: 'number',
          description: 'Confidence score 0-100. Higher if more fields filled, verified sources, recent info.'
        },
        notes: {
          type: 'string',
          description: 'Your notes: data quality, what\'s missing, verification needs, etc.'
        }
      },
      required: ['name', 'city', 'state']
    }
  },
  {
    name: 'check_existing',
    description: 'Check if a venue or artist already exists in the database or staging queue before staging a new entry.',
    input_schema: {
      type: 'object' as const,
      properties: {
        entityType: {
          type: 'string',
          enum: ['venue', 'artist'],
          description: 'Type of entity to check'
        },
        name: {
          type: 'string',
          description: 'Name to search for'
        },
        city: {
          type: 'string',
          description: 'City to narrow search (optional)'
        }
      },
      required: ['entityType', 'name']
    }
  },
  {
    name: 'get_staging_summary',
    description: 'Get a summary of what has been staged in this session and overall pending count.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: []
    }
  }
];

// Track Tavily usage for the session
let lastTavilyUsage: { creditsUsed?: number; creditsRemaining?: number } | null = null;

// Scrape a URL and extract text content
async function scrapeUrl(url: string): Promise<string> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return JSON.stringify({ error: 'Invalid URL protocol. Use http:// or https://' });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DIYShowsBot/1.0; +https://diyshows.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      return JSON.stringify({ 
        error: `Failed to fetch URL: ${response.status} ${response.statusText}` 
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    // Handle different content types
    if (contentType.includes('application/json')) {
      // JSON data - return formatted
      try {
        const json = JSON.parse(text);
        return `JSON data from ${url}:\n\n${JSON.stringify(json, null, 2)}`;
      } catch {
        return text;
      }
    }

    if (contentType.includes('text/csv') || url.endsWith('.csv')) {
      // CSV data - return as-is, it's already readable
      return `CSV data from ${url}:\n\n${text}`;
    }

    if (contentType.includes('text/html')) {
      // HTML - strip tags and extract text
      const cleanText = stripHtml(text);
      
      // Truncate if too long (keep it under ~8000 chars for context window)
      const maxLength = 8000;
      if (cleanText.length > maxLength) {
        return `Content from ${url} (truncated to ${maxLength} chars):\n\n${cleanText.substring(0, maxLength)}...\n\n[Content truncated - page was ${cleanText.length} characters]`;
      }
      
      return `Content from ${url}:\n\n${cleanText}`;
    }

    // Plain text or other
    const maxLength = 8000;
    if (text.length > maxLength) {
      return `Content from ${url} (truncated):\n\n${text.substring(0, maxLength)}...`;
    }
    
    return `Content from ${url}:\n\n${text}`;

  } catch (error) {
    console.error('Scrape error:', error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return JSON.stringify({ error: 'Request timed out after 15 seconds' });
      }
      return JSON.stringify({ error: `Failed to scrape URL: ${error.message}` });
    }
    return JSON.stringify({ error: 'Failed to scrape URL' });
  }
}

// Simple HTML to text converter
function stripHtml(html: string): string {
  // Remove script and style elements entirely
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  
  // Replace common block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br|hr)[^>]*>/gi, '\n');
  text = text.replace(/<(br|hr)[^>]*\/?>/gi, '\n');
  
  // Replace list items with bullet points
  text = text.replace(/<li[^>]*>/gi, '• ');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&ndash;/g, '–');
  
  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single
  text = text.replace(/\n\s*\n/g, '\n\n'); // Multiple newlines to double
  text = text.trim();
  
  return text;
}

// Get Tavily usage/credits info
async function getTavilyCredits(): Promise<{ creditsUsed?: number; creditsRemaining?: number; error?: string }> {
  if (lastTavilyUsage) {
    return lastTavilyUsage;
  }
  return { error: 'No search performed yet' };
}

// Web search using a search API
async function webSearch(query: string): Promise<string> {
  // Use Tavily, Serper, or similar search API
  // For now, we'll use a simple approach with the web_search capability
  
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  const serperApiKey = process.env.SERPER_API_KEY;
  
  if (tavilyApiKey) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: query,
          search_depth: 'basic', // Use basic to conserve credits (advanced uses more)
          include_answer: true,
          max_results: 10
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Track usage info if provided
        if (data.api_credits_used !== undefined || data.credits_used !== undefined) {
          lastTavilyUsage = {
            creditsUsed: data.api_credits_used || data.credits_used || 1
          };
        } else {
          // Basic search uses 1 credit, advanced uses 2
          lastTavilyUsage = { creditsUsed: 1 };
        }
        
        // Format results for the AI
        let formatted = `Search results for: "${query}"\n\n`;
        
        if (data.answer) {
          formatted += `Summary: ${data.answer}\n\n`;
        }
        
        if (data.results && data.results.length > 0) {
          formatted += `Found ${data.results.length} results:\n\n`;
          data.results.forEach((result: { title: string; url: string; content: string }, i: number) => {
            formatted += `[${i + 1}] ${result.title}\n`;
            formatted += `    URL: ${result.url}\n`;
            formatted += `    ${result.content}\n\n`;
          });
        }
        
        formatted += `\n[Search used ~1 API credit]`;
        
        return formatted;
      }
    } catch (error) {
      console.error('Tavily search error:', error);
    }
  }
  
  if (serperApiKey) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          num: 10
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        let formatted = `Search results for: "${query}"\n\n`;
        
        if (data.organic && data.organic.length > 0) {
          formatted += `Found ${data.organic.length} results:\n\n`;
          data.organic.forEach((result: { title: string; link: string; snippet: string }, i: number) => {
            formatted += `[${i + 1}] ${result.title}\n`;
            formatted += `    URL: ${result.link}\n`;
            formatted += `    ${result.snippet}\n\n`;
          });
        }
        
        return formatted;
      }
    } catch (error) {
      console.error('Serper search error:', error);
    }
  }
  
  // Fallback message if no search API is configured
  return `[Web search not configured]

To enable web search, add one of these API keys to your .env file:
- TAVILY_API_KEY (recommended, get one at tavily.com)
- SERPER_API_KEY (get one at serper.dev)

For now, you can manually provide information about venues/artists you want to stage, and I'll help format and add them to the review queue.

Example: "Stage a venue called The Depot in Portland, OR - it's a warehouse space that holds about 200 people"`;
}

// Stage a venue - comprehensive data collection for THE ultimate DIY venue database
async function stageVenue(params: {
  // Basic
  name: string;
  city: string;
  state: string;
  country?: string;
  neighborhood?: string;
  venueType?: string;
  // Capacity & Access
  capacity?: number;
  ageRestriction?: string;
  // Genres & Booking
  genres?: string[];
  bookingPreferences?: string;
  typicalBill?: string;
  // Equipment & Logistics
  equipmentProvided?: object;
  loadInInfo?: string;
  // Financial
  typicalDeal?: string;
  // Contact & Social
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  socialLinks?: object;
  // Scene Context
  description?: string;
  sceneNotes?: string;
  yearsActive?: string;
  // Status
  isActive?: boolean;
  lastKnownShow?: string;
  // Meta
  sourceUrl?: string;
  confidence?: number;
  notes?: string;
  searchQuery?: string;
}): Promise<string> {
  try {
    // Check for existing venue
    const existingVenue = await prisma.venue.findFirst({
      where: {
        name: { equals: params.name, mode: 'insensitive' },
        location: {
          city: { equals: params.city, mode: 'insensitive' }
        }
      }
    });

    if (existingVenue) {
      return JSON.stringify({
        success: false,
        reason: 'duplicate',
        message: `A venue named "${params.name}" already exists in ${params.city}`,
        existingId: existingVenue.id
      });
    }

    // Check for existing staged entry
    const existingStaged = await prisma.stagedEntity.findFirst({
      where: {
        entityType: 'VENUE',
        status: { in: ['PENDING', 'NEEDS_INFO'] },
        data: {
          path: ['name'],
          string_contains: params.name
        }
      }
    });

    if (existingStaged) {
      return JSON.stringify({
        success: false,
        reason: 'already_staged',
        message: `"${params.name}" is already in the staging queue`,
        stagedId: existingStaged.id
      });
    }

    // Build comprehensive data object - every field helps make this THE database
    const venueData: Record<string, unknown> = {
      // Basic
      name: params.name,
      city: params.city,
      state: params.state,
      country: params.country || 'USA',
      neighborhood: params.neighborhood,
      venueType: params.venueType || 'other',
      // Capacity & Access
      capacity: params.capacity,
      ageRestriction: params.ageRestriction,
      // Genres & Booking
      genres: params.genres || [],
      bookingPreferences: params.bookingPreferences,
      typicalBill: params.typicalBill,
      // Equipment & Logistics
      equipmentProvided: params.equipmentProvided,
      loadInInfo: params.loadInInfo,
      // Financial
      typicalDeal: params.typicalDeal,
      // Contact & Social
      contactEmail: params.contactEmail,
      contactPhone: params.contactPhone,
      website: params.website,
      socialLinks: params.socialLinks,
      // Scene Context
      description: params.description,
      sceneNotes: params.sceneNotes,
      yearsActive: params.yearsActive,
      // Status
      isActive: params.isActive !== false, // Default to true
      lastKnownShow: params.lastKnownShow,
    };

    // Remove undefined values for cleaner storage
    Object.keys(venueData).forEach(key => {
      if (venueData[key] === undefined) delete venueData[key];
    });

    // Create staged entry
    const staged = await prisma.stagedEntity.create({
      data: {
        entityType: 'VENUE',
        data: venueData,
        sourceUrl: params.sourceUrl,
        sourceType: params.sourceUrl ? 'web_search' : 'manual',
        searchQuery: params.searchQuery,
        confidence: params.confidence || 50,
        aiNotes: params.notes,
        status: 'PENDING'
      }
    });

    // Count how many fields were filled for feedback
    const filledFields = Object.keys(venueData).filter(k => 
      venueData[k] !== undefined && 
      venueData[k] !== null && 
      venueData[k] !== '' &&
      !(Array.isArray(venueData[k]) && (venueData[k] as unknown[]).length === 0)
    ).length;

    return JSON.stringify({
      success: true,
      message: `Staged "${params.name}" for review`,
      stagedId: staged.id,
      confidence: params.confidence || 50,
      fieldsCollected: filledFields,
      dataCompleteness: `${filledFields}/20 fields filled`
    });
  } catch (error) {
    console.error('Error staging venue:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Stage an artist - comprehensive data collection for THE ultimate DIY artist database
async function stageArtist(params: {
  // Basic
  name: string;
  city: string;
  state: string;
  country?: string;
  artistType?: string;
  // Music & Style
  genres?: string[];
  subgenres?: string[];
  forFansOf?: string[];
  // Band Details
  members?: number;
  yearFormed?: number;
  // Touring & Booking
  tourStatus?: string;
  tourHistory?: string;
  typicalDraw?: string;
  typicalGuarantee?: string;
  // Equipment & Logistics
  equipmentNeeds?: object;
  travelMethod?: string;
  // Contact & Social
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  bandcampUrl?: string;
  socialLinks?: object;
  // Releases
  discography?: string;
  label?: string;
  // Context
  description?: string;
  sceneConnections?: string;
  // Status
  isActive?: boolean;
  lastKnownActivity?: string;
  // Meta
  sourceUrl?: string;
  confidence?: number;
  notes?: string;
  searchQuery?: string;
}): Promise<string> {
  try {
    // Check for existing artist
    const existingArtist = await prisma.artist.findFirst({
      where: {
        name: { equals: params.name, mode: 'insensitive' }
      }
    });

    if (existingArtist) {
      return JSON.stringify({
        success: false,
        reason: 'duplicate',
        message: `An artist named "${params.name}" already exists in the database`,
        existingId: existingArtist.id
      });
    }

    // Check for existing staged entry
    const existingStaged = await prisma.stagedEntity.findFirst({
      where: {
        entityType: 'ARTIST',
        status: { in: ['PENDING', 'NEEDS_INFO'] },
        data: {
          path: ['name'],
          string_contains: params.name
        }
      }
    });

    if (existingStaged) {
      return JSON.stringify({
        success: false,
        reason: 'already_staged',
        message: `"${params.name}" is already in the staging queue`,
        stagedId: existingStaged.id
      });
    }

    // Build comprehensive data object - every field helps make this THE database
    const artistData: Record<string, unknown> = {
      // Basic
      name: params.name,
      city: params.city,
      state: params.state,
      country: params.country || 'USA',
      artistType: params.artistType || 'band',
      // Music & Style
      genres: params.genres || [],
      subgenres: params.subgenres || [],
      forFansOf: params.forFansOf || [],
      // Band Details
      members: params.members,
      yearFormed: params.yearFormed,
      // Touring & Booking
      tourStatus: params.tourStatus,
      tourHistory: params.tourHistory,
      typicalDraw: params.typicalDraw,
      typicalGuarantee: params.typicalGuarantee,
      // Equipment & Logistics
      equipmentNeeds: params.equipmentNeeds,
      travelMethod: params.travelMethod,
      // Contact & Social
      contactEmail: params.contactEmail,
      contactPhone: params.contactPhone,
      website: params.website,
      bandcampUrl: params.bandcampUrl,
      socialLinks: params.socialLinks,
      // Releases
      discography: params.discography,
      label: params.label,
      // Context
      description: params.description,
      sceneConnections: params.sceneConnections,
      // Status
      isActive: params.isActive !== false, // Default to true
      lastKnownActivity: params.lastKnownActivity,
    };

    // Remove undefined values for cleaner storage
    Object.keys(artistData).forEach(key => {
      if (artistData[key] === undefined) delete artistData[key];
    });

    // Create staged entry
    const staged = await prisma.stagedEntity.create({
      data: {
        entityType: 'ARTIST',
        data: artistData,
        sourceUrl: params.sourceUrl,
        sourceType: params.sourceUrl ? 'web_search' : 'manual',
        searchQuery: params.searchQuery,
        confidence: params.confidence || 50,
        aiNotes: params.notes,
        status: 'PENDING'
      }
    });

    // Count how many fields were filled for feedback
    const filledFields = Object.keys(artistData).filter(k => 
      artistData[k] !== undefined && 
      artistData[k] !== null && 
      artistData[k] !== '' &&
      !(Array.isArray(artistData[k]) && (artistData[k] as unknown[]).length === 0)
    ).length;

    return JSON.stringify({
      success: true,
      message: `Staged "${params.name}" for review`,
      stagedId: staged.id,
      confidence: params.confidence || 50,
      fieldsCollected: filledFields,
      dataCompleteness: `${filledFields}/22 fields filled`
    });
  } catch (error) {
    console.error('Error staging artist:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Check if entity exists
async function checkExisting(params: {
  entityType: 'venue' | 'artist';
  name: string;
  city?: string;
}): Promise<string> {
  try {
    if (params.entityType === 'venue') {
      const venues = await prisma.venue.findMany({
        where: {
          name: { contains: params.name, mode: 'insensitive' },
          ...(params.city && {
            location: { city: { contains: params.city, mode: 'insensitive' } }
          })
        },
        include: { location: true },
        take: 5
      });

      const staged = await prisma.stagedEntity.findMany({
        where: {
          entityType: 'VENUE',
          status: { in: ['PENDING', 'NEEDS_INFO'] },
          data: {
            path: ['name'],
            string_contains: params.name
          }
        },
        take: 5
      });

      return JSON.stringify({
        existingVenues: venues.map(v => ({
          id: v.id,
          name: v.name,
          city: v.location?.city,
          state: v.location?.stateProvince
        })),
        stagedVenues: staged.map(s => ({
          id: s.id,
          name: (s.data as { name?: string })?.name,
          status: s.status
        })),
        summary: venues.length > 0 
          ? `Found ${venues.length} existing venue(s) matching "${params.name}"`
          : staged.length > 0
          ? `No existing venues, but ${staged.length} staged entry(ies) found`
          : `No existing venues or staged entries found for "${params.name}"`
      });
    } else {
      const artists = await prisma.artist.findMany({
        where: {
          name: { contains: params.name, mode: 'insensitive' }
        },
        include: { location: true },
        take: 5
      });

      const staged = await prisma.stagedEntity.findMany({
        where: {
          entityType: 'ARTIST',
          status: { in: ['PENDING', 'NEEDS_INFO'] },
          data: {
            path: ['name'],
            string_contains: params.name
          }
        },
        take: 5
      });

      return JSON.stringify({
        existingArtists: artists.map(a => ({
          id: a.id,
          name: a.name,
          city: a.location?.city,
          state: a.location?.stateProvince
        })),
        stagedArtists: staged.map(s => ({
          id: s.id,
          name: (s.data as { name?: string })?.name,
          status: s.status
        })),
        summary: artists.length > 0 
          ? `Found ${artists.length} existing artist(s) matching "${params.name}"`
          : staged.length > 0
          ? `No existing artists, but ${staged.length} staged entry(ies) found`
          : `No existing artists or staged entries found for "${params.name}"`
      });
    }
  } catch (error) {
    console.error('Error checking existing:', error);
    return JSON.stringify({ error: 'Failed to check existing entries' });
  }
}

// Get staging summary
async function getStagingSummary(): Promise<string> {
  try {
    const counts = await prisma.stagedEntity.groupBy({
      by: ['status', 'entityType'],
      _count: { status: true }
    });

    const pending = counts
      .filter(c => c.status === 'PENDING')
      .reduce((sum, c) => sum + c._count.status, 0);

    const recentlyStaged = await prisma.stagedEntity.findMany({
      where: {
        status: 'PENDING',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return JSON.stringify({
      pendingCount: pending,
      recentlyStaged: recentlyStaged.map(s => ({
        type: s.entityType,
        name: (s.data as { name?: string })?.name,
        confidence: s.confidence,
        createdAt: s.createdAt
      })),
      breakdown: counts.map(c => ({
        status: c.status,
        type: c.entityType,
        count: c._count.status
      }))
    });
  } catch (error) {
    console.error('Error getting staging summary:', error);
    return JSON.stringify({ error: 'Failed to get staging summary' });
  }
}

// Execute tool
async function executeTool(name: string, input: Record<string, unknown>, searchQuery?: string): Promise<string> {
  switch (name) {
    case 'web_search':
      return webSearch(input.query as string);
    
    case 'scrape_url':
      return scrapeUrl(input.url as string);
    
    case 'stage_venue':
      return stageVenue({ ...input, searchQuery } as Parameters<typeof stageVenue>[0]);
    
    case 'stage_artist':
      return stageArtist({ ...input, searchQuery } as Parameters<typeof stageArtist>[0]);
    
    case 'check_existing':
      return checkExisting(input as Parameters<typeof checkExisting>[0]);
    
    case 'get_staging_summary':
      return getStagingSummary();
    
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// System prompt for the Discovery Agent
const SYSTEM_PROMPT = `You are a Database Discovery Agent for DIY Shows - we're building THE most comprehensive, searchable database of DIY venues and touring artists in existence.

## 🎯 THE MISSION
Our competitive advantage is being THE definitive database where:
- Artists can search for EXACTLY the right venues by genre, capacity, age policy, equipment, deal structure
- Venues can find EXACTLY the right artists by genre, draw, tour status, equipment needs
- Every entry is rich with searchable, useful details - not just a name and city

## Your Tools
- **web_search** - Search the web for venues, artists, scenes
- **scrape_url** - Fetch and read content from URLs (venue lists, blogs, spreadsheets)
- **check_existing** - Check if something already exists before staging
- **stage_venue** - Add a discovered venue to review queue (20+ fields available!)
- **stage_artist** - Add a discovered artist to review queue (22+ fields available!)
- **get_staging_summary** - See what's been staged

## 📊 COMPREHENSIVE DATA COLLECTION

### For VENUES - Extract ALL of these when possible:

**Basic Info:**
- Name, city, state, country, neighborhood
- Venue type (house-show, basement, bar, warehouse, coffee-shop, record-store, vfw-hall, community-center, art-gallery, brewery)

**Booking Details:**
- Genres they book (be SPECIFIC: not just "punk" but "hardcore, crust, powerviolence")
- Booking preferences (what they look for in bands)
- Typical bill structure (3-4 local bands? touring headliner + openers?)
- Age restriction (all-ages, 18+, 21+)
- Capacity (estimate if not stated)

**Logistics:**
- Equipment provided (PA, drums, backline, mics, monitors)
- Load-in info (stairs, street level, parking)
- Typical deal (door deal 80/20, $200-400 guarantee, pass the hat)

**Contact:**
- Email (CRITICAL), phone, website
- Social links (Instagram, Facebook)

**Scene Context:**
- Description (vibe, history, what makes it special)
- Scene notes (who runs it, community connections)
- Years active, last known show date
- Is it currently active?

### For ARTISTS - Extract ALL of these when possible:

**Basic Info:**
- Name, city, state, country
- Artist type (band, solo, duo, collective, dj, rapper, singer-songwriter)
- Number of members, year formed

**Music & Style (BE SPECIFIC!):**
- Genres (primary genres like punk, metal, indie)
- Subgenres (specific styles: powerviolence, d-beat, shoegaze, post-punk)
- For fans of (similar artists for reference - helps booking!)

**Touring & Booking:**
- Tour status (actively-touring, regional-only, local-only, hiatus)
- Tour history ("3 US tours", "toured Europe 2023")
- Typical draw (crowd size in home market)
- Typical guarantee (what they ask/get)

**Logistics:**
- Equipment needs (what they need provided: drums, amps, backline)
- Travel method (van, car, flying)

**Contact:**
- Booking email (CRITICAL), phone
- Website, Bandcamp URL
- Social links (Instagram, Spotify)

**Releases & Context:**
- Discography ("2 LPs, 3 EPs", "debut album 2023")
- Label (or "self-released", "DIY")
- Scene connections (community, collaborations)

## Confidence Scoring (based on data completeness)
- **90-100**: Comprehensive data - genres, contact info, booking details, scene context
- **75-89**: Good data - has contact info AND genres/style details
- **60-74**: Decent - has contact info OR good scene/style details
- **40-59**: Basic - name, location, type only
- **Below 40**: Minimal - needs significant research

## Search Strategies

### Deep Venue Research:
1. Initial: "[city] DIY venue" or "[city] house shows" 
2. Genre-specific: "[city] punk basement shows", "[city] noise venue"
3. Contact hunting: "[venue name] booking email", visit their website contact page
4. Instagram bio check: booking emails often listed there
5. Show flyers: often have venue contact info
6. Scene blogs/reports: often have detailed venue descriptions

### Deep Artist Research:
1. Bandcamp: "[city] [genre] bandcamp" - gold mine for local scenes
2. "[artist name] booking" to find their contact
3. Check their Bandcamp/website bio for touring status, FFO
4. Look at who they've played with for scene connections
5. Label pages often list roster with descriptions

### For URLs/Lists:
1. User provides a URL → scrape_url to read it
2. Parse ALL entries with available details
3. Check each for duplicates
4. Stage with all extracted data

## Response Format

"🔍 Searched for [query] - processing results...

✅ STAGED (X venues/artists):

**1. The Depot** - warehouse venue, Portland OR
   📊 Data completeness: 15/20 fields (high)
   🎵 Genres: punk, hardcore, noise, experimental
   👥 Capacity: 200, all-ages
   🎸 Equipment: Full PA, house kit available
   💰 Deals: Door split 80/20 or $200-400 guarantee
   📧 Contact: booking@thedepot.com | thedepot.com
   📝 Notes: Active since 2015, great for touring bands
   
**2. [Artist Name]** - hardcore band, Seattle WA
   📊 Data completeness: 18/22 fields (very high)
   🎵 Style: powerviolence, thrash | FFO: Infest, Siege, Spazz
   🎤 Members: 4, formed 2019
   🚐 Tour status: Actively touring (2 US tours)
   👥 Draw: 50-80 in Seattle
   📧 Contact: booking@band.com | bandcamp.com/band
   📝 Notes: Looking for shows, bring own gear

❌ SKIPPED:
- [Name] - already in database
- [Name] - commercial venue, not DIY-focused

📊 SUMMARY: 
- Staged: X venues, X artists
- Average data completeness: X%
- High-quality entries (75%+): X
- Needs more research: X
- Tip: [Specific suggestion for finding missing data]"

## Key Principles
1. **Depth over breadth** - A few comprehensive entries > many sparse ones
2. **Genres are SEARCHABLE** - Be specific! "powerviolence" not just "punk"
3. **FFO/Similar artists** - This helps so much for booking matches
4. **Tour status matters** - Venues need to know who's touring
5. **Equipment info** - Critical for booking logistics
6. **Deal structures** - Helps set expectations
7. **Contact is king** - But don't skip an entry just because email is missing

Be thorough, be specific, and help us build THE database that makes DIY touring possible!`;


// Main POST handler
export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Track the current search query for attribution
    let currentSearchQuery = message;

    // Build messages
    let messages: Anthropic.MessageParam[] = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call Claude
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: tools,
      messages: messages
    });

    // Handle tool use in a loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Execute tools
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          // Track search queries for attribution
          if (toolUse.name === 'web_search') {
            currentSearchQuery = (toolUse.input as { query: string }).query;
          }
          
          const result = await executeTool(
            toolUse.name, 
            toolUse.input as Record<string, unknown>,
            currentSearchQuery
          );
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: result
          };
        })
      );

      // Continue conversation
      messages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults }
      ];

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: tools,
        messages: messages
      });
    }

    // Extract text response
    const textContent = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    // Build updated conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: textContent?.text || '' }
    ];

    return NextResponse.json({
      response: textContent?.text || 'No response generated',
      conversationHistory: updatedHistory
    });

  } catch (error) {
    console.error('Discovery agent error:', error);
    return NextResponse.json(
      { error: 'Discovery agent failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

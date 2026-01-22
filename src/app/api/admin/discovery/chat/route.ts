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
    description: 'Stage a discovered venue for admin review. Call this after finding venue information via web search.',
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
          description: 'State/province (use 2-letter code for US states)'
        },
        country: {
          type: 'string',
          description: 'Country (default: USA)'
        },
        venueType: {
          type: 'string',
          description: 'Type: house-show, basement, bar, club, warehouse, coffee-shop, record-store, vfw-hall, community-center, other'
        },
        capacity: {
          type: 'number',
          description: 'Estimated capacity'
        },
        description: {
          type: 'string',
          description: 'Description of the venue'
        },
        website: {
          type: 'string',
          description: 'Website URL if found'
        },
        contactEmail: {
          type: 'string',
          description: 'Contact email if found'
        },
        sourceUrl: {
          type: 'string',
          description: 'URL where this information was found'
        },
        confidence: {
          type: 'number',
          description: 'Confidence score 0-100 based on data quality/completeness'
        },
        notes: {
          type: 'string',
          description: 'Your notes about this discovery (data quality, missing info, etc.)'
        }
      },
      required: ['name', 'city', 'state']
    }
  },
  {
    name: 'stage_artist',
    description: 'Stage a discovered artist/band for admin review. Call this after finding artist information via web search.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Name of the artist/band'
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
          description: 'Type: band, solo, collective, dj, other'
        },
        genres: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of genres'
        },
        description: {
          type: 'string',
          description: 'Description of the artist'
        },
        website: {
          type: 'string',
          description: 'Website or Bandcamp URL if found'
        },
        contactEmail: {
          type: 'string',
          description: 'Booking email if found'
        },
        sourceUrl: {
          type: 'string',
          description: 'URL where this information was found'
        },
        confidence: {
          type: 'number',
          description: 'Confidence score 0-100 based on data quality/completeness'
        },
        notes: {
          type: 'string',
          description: 'Your notes about this discovery'
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

// Stage a venue
async function stageVenue(params: {
  name: string;
  city: string;
  state: string;
  country?: string;
  venueType?: string;
  capacity?: number;
  description?: string;
  website?: string;
  contactEmail?: string;
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

    // Create staged entry
    const staged = await prisma.stagedEntity.create({
      data: {
        entityType: 'VENUE',
        data: {
          name: params.name,
          city: params.city,
          state: params.state,
          country: params.country || 'USA',
          venueType: params.venueType || 'other',
          capacity: params.capacity,
          description: params.description,
          website: params.website,
          contactEmail: params.contactEmail
        },
        sourceUrl: params.sourceUrl,
        sourceType: params.sourceUrl ? 'web_search' : 'manual',
        searchQuery: params.searchQuery,
        confidence: params.confidence || 50,
        aiNotes: params.notes,
        status: 'PENDING'
      }
    });

    return JSON.stringify({
      success: true,
      message: `Staged "${params.name}" for review`,
      stagedId: staged.id,
      confidence: params.confidence || 50
    });
  } catch (error) {
    console.error('Error staging venue:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Stage an artist
async function stageArtist(params: {
  name: string;
  city: string;
  state: string;
  country?: string;
  artistType?: string;
  genres?: string[];
  description?: string;
  website?: string;
  contactEmail?: string;
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

    // Create staged entry
    const staged = await prisma.stagedEntity.create({
      data: {
        entityType: 'ARTIST',
        data: {
          name: params.name,
          city: params.city,
          state: params.state,
          country: params.country || 'USA',
          artistType: params.artistType || 'band',
          genres: params.genres || [],
          description: params.description,
          website: params.website,
          contactEmail: params.contactEmail
        },
        sourceUrl: params.sourceUrl,
        sourceType: params.sourceUrl ? 'web_search' : 'manual',
        searchQuery: params.searchQuery,
        confidence: params.confidence || 50,
        aiNotes: params.notes,
        status: 'PENDING'
      }
    });

    return JSON.stringify({
      success: true,
      message: `Staged "${params.name}" for review`,
      stagedId: staged.id,
      confidence: params.confidence || 50
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
const SYSTEM_PROMPT = `You are a Database Discovery Agent for DIY Shows, a platform connecting DIY venues and touring artists.

## Your Mission
Help build the database by discovering DIY venues and artists via web search, then staging them for admin review.

## Your Tools
- **web_search** - Search the web for venues, artists, scenes
- **scrape_url** - Fetch and read content from a specific URL (venue lists, blogs, spreadsheets)
- **check_existing** - Check if something already exists before staging
- **stage_venue** - Add a discovered venue to the review queue
- **stage_artist** - Add a discovered artist to the review queue  
- **get_staging_summary** - See what's been staged

## Workflow

### For general discovery:
1. User asks to find venues/artists in a location or genre
2. Use web_search to find information
3. Use check_existing to avoid duplicates
4. Use stage_venue or stage_artist to add to review queue
5. Report what you found and staged

### When user provides a URL:
1. User shares a link to a venue list, spreadsheet, or database
2. Use scrape_url to fetch and read the page content
3. Parse the content to identify venues/artists with their details
4. Use check_existing for each one to avoid duplicates
5. Use stage_venue or stage_artist for each entry
6. Report what you extracted and staged

## Data Quality Guidelines
- **High confidence (80-100)**: Has name, location, type, AND contact info (email, website, or phone)
- **Medium confidence (50-79)**: Has name and location, missing contact info
- **Low confidence (0-49)**: Minimal data, needs significant verification

## Priority Fields to Find

### For Venues (in order of importance):
1. **Name** - Required
2. **City, State** - Required  
3. **Contact email** - Very important for booking
4. **Website or social media** - Important for verification
5. **Phone number** - Helpful if available
6. **Street address** - Helpful but often private for house shows
7. **Venue type** - House show, bar, warehouse, etc.
8. **Capacity** - Helpful for booking decisions
9. **Description** - Vibe, what genres they book, etc.

### For Artists:
1. **Name** - Required
2. **City, State** - Required (home base)
3. **Booking email** - Very important
4. **Website/Bandcamp** - Important
5. **Genres** - Important for matching
6. **Artist type** - Band, solo, DJ, etc.

## Search Strategies

### Finding Contact Info:
- Search "[venue name] booking contact"
- Search "[venue name] email"  
- Look for "book a show" or "contact" pages on venue websites
- Check Instagram/Facebook bios for booking emails
- Look at show flyers which often have venue contact

### Finding Venues:
- "[city] DIY venue" or "[city] house shows"
- "[city] all ages venue"
- "[city] punk venue booking"
- Look at local music blogs and scene reports
- Check event listings on Resident Advisor, Songkick

### Finding Artists:
- Bandcamp: "[city] punk bandcamp" or browse by location
- "[city] local bands booking"
- Check venue calendars for who's playing

## Important
- Always check_existing before staging to avoid duplicates
- Include source URLs - helps verify data later
- Be honest about confidence - lower score if missing contact info
- In aiNotes, LIST what info is missing (e.g., "Missing: email, phone")
- If you only find a name and city, stage with low confidence and note what's needed

## Response Style
- Be transparent about your search process
- List each venue/artist you found with key details
- Show what contact info you DID and DIDN'T find
- Explain confidence scores based on data completeness
- Give a clear summary at the end

Example response format:
"I searched for DIY venues in Portland and found 8 results. Here's what I staged:

✅ STAGED:
1. **The Depot** (warehouse, 200 cap) - 85% confidence
   📧 booking@thedepot.com | 🌐 thedepot.com
   Missing: phone, street address

2. **House of Sound** (house show) - 55% confidence
   🌐 instagram.com/houseofsound
   Missing: email, phone, address - found on local blog, needs more research

❌ SKIPPED:
- "Portland Music Venue" - already exists in database
- "Random Bar" - not DIY-focused, commercial venue

📊 Summary: Staged 2 venues. 1 has good contact info, 1 needs more research."

If contact info is hard to find, say so! Example:
"Note: DIY venues often don't publish contact info publicly. You may need to reach out via Instagram DM or find them through scene connections."

Be efficient and thorough. The admin will review everything before it goes live.`;

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

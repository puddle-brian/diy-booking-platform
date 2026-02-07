import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

// Use Haiku for cheap extraction (much cheaper than Sonnet/Opus)
const HAIKU_MODEL = 'claude-3-haiku-20240307';

// Cost estimates in cents per 1000 tokens
const HAIKU_INPUT_COST = 0.025; // $0.25 per million = 0.025 cents per 1000
const HAIKU_OUTPUT_COST = 0.125; // $1.25 per million
const TAVILY_SEARCH_COST = 0.1; // ~$0.001 per search = 0.1 cents

// Budget defaults
const DEFAULT_DAILY_SEARCH_LIMIT = 50;
const DEFAULT_DAILY_COST_LIMIT = 100; // $1
const DEFAULT_MONTHLY_SEARCH_LIMIT = 1000;
const DEFAULT_MONTHLY_COST_LIMIT = 2000; // $20

// =============================================================================
// EXTRACTION PROMPTS - Different strategies for different job types
// =============================================================================

// Phase 1: Find SOURCES (blogs, calendars, forums) - extract URLs to dig into later
const SOURCE_EXTRACTION_PROMPT = `You're finding DIY music scene SOURCES - blogs, show calendars, forums, zines.

From these search results, extract:
1. URLs to show calendars or event listings
2. URLs to local music blogs or scene reports  
3. URLs to forums/reddit threads about local venues
4. URLs to venue or promoter websites
5. Any venue names mentioned (we'll verify later)

Return JSON array:
[
  {
    "type": "source",
    "url": "https://...",
    "sourceType": "calendar|blog|forum|venue-site|promoter|social",
    "description": "What this source contains",
    "venuesMentioned": ["Venue Name 1", "Venue Name 2"]
  },
  {
    "type": "venue",
    "name": "...",
    "city": "...",
    "state": "XX",
    "venueType": "house-show|basement|bar|warehouse|community-center|vfw|art-gallery|record-store|other",
    "genres": ["punk", "hardcore"],
    "description": "...",
    "website": "...",
    "confidence": 0-100
  }
]

IMPORTANT: 
- We want UNDERGROUND venues, not mainstream clubs
- House shows, basements, DIY spaces, all-ages venues are GOLD
- Lower confidence if venue seems mainstream/commercial
- Include URLs even if you're not sure - we'll scrape them later
Return [] if nothing found.`;

// Phase 2: Deep extraction from sources - get all the details
const DEEP_EXTRACTION_PROMPT = `Extract DIY venues and artists from this content. We want UNDERGROUND, under-the-radar spots.

PRIORITIZE:
- House shows, basement venues, DIY spaces
- All-ages venues, community centers
- Record stores, coffee shops, art galleries that host shows
- VFW halls, American Legion, Elks lodges
- Warehouses, practice spaces

LOWER PRIORITY (but still include):
- Bars that book DIY/punk (mark as "bar" type)
- Small clubs focused on underground music

SKIP:
- Major commercial venues (Live Nation, etc.)
- Large capacity mainstream clubs
- Venues that only book cover bands/tribute acts

For each VENUE:
{
  "type": "venue",
  "name": "...",
  "city": "...",
  "state": "XX",
  "venueType": "house-show|basement|warehouse|vfw|community-center|record-store|art-gallery|coffee-shop|bar|other",
  "genres": ["punk", "hardcore", "noise", "experimental", "metal", "emo", "indie"],
  "ageRestriction": "all-ages|18+|21+",
  "capacity": 50,
  "description": "What makes this spot special, vibe, who runs it",
  "bookingInfo": "How to book, who to contact",
  "contactEmail": "...",
  "website": "...",
  "socialLinks": {"instagram": "...", "facebook": "..."},
  "confidence": 0-100,
  "notes": "Any other useful info"
}

For each ARTIST:
{
  "type": "artist", 
  "name": "...",
  "city": "...",
  "state": "XX",
  "artistType": "band|solo|duo|dj|collective",
  "genres": ["punk"],
  "subgenres": ["powerviolence", "crust"],
  "forFansOf": ["Black Flag", "Discharge"],
  "description": "...",
  "bandcampUrl": "...",
  "website": "...",
  "contactEmail": "...",
  "confidence": 0-100
}

Be SPECIFIC with genres and subgenres. 
Confidence: 80+ if you have contact info, 60-79 if just name/location/type, below 60 if uncertain.
Return [] if nothing relevant found.`;

// Legacy prompt for basic searches
const BASIC_EXTRACTION_PROMPT = `Extract DIY venues and artists from this search data. Focus on UNDERGROUND spots - house shows, basements, all-ages venues, DIY spaces. Skip mainstream commercial venues.

Return JSON array of:
{
  "type": "venue" or "artist",
  "name": "...",
  "city": "...",
  "state": "XX",
  "venueType": "house-show|basement|bar|warehouse|community-center|other",
  "genres": ["punk", "hardcore", ...],
  "description": "...",
  "contactEmail": "...",
  "website": "...",
  "confidence": 0-100
}

Return [] if nothing found.`;

// Check if we're within budget
async function checkBudget(): Promise<{ canProceed: boolean; reason?: string }> {
  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  const [dailyBudget, monthlyBudget] = await Promise.all([
    prisma.discoveryBudget.findUnique({
      where: { period_periodType: { period: today, periodType: 'daily' } }
    }),
    prisma.discoveryBudget.findUnique({
      where: { period_periodType: { period: month, periodType: 'monthly' } }
    })
  ]);

  const daily = dailyBudget || { 
    searchesUsed: 0, 
    costCents: 0, 
    searchLimit: DEFAULT_DAILY_SEARCH_LIMIT,
    costLimitCents: DEFAULT_DAILY_COST_LIMIT
  };
  
  const monthly = monthlyBudget || { 
    searchesUsed: 0, 
    costCents: 0,
    searchLimit: DEFAULT_MONTHLY_SEARCH_LIMIT,
    costLimitCents: DEFAULT_MONTHLY_COST_LIMIT
  };

  if (daily.searchesUsed >= daily.searchLimit) {
    return { canProceed: false, reason: 'Daily search limit reached' };
  }
  if (daily.costCents >= daily.costLimitCents) {
    return { canProceed: false, reason: 'Daily cost limit reached' };
  }
  if (monthly.searchesUsed >= monthly.searchLimit) {
    return { canProceed: false, reason: 'Monthly search limit reached' };
  }
  if (monthly.costCents >= monthly.costLimitCents) {
    return { canProceed: false, reason: 'Monthly cost limit reached' };
  }

  return { canProceed: true };
}

// Record budget usage
async function recordUsage(searchesUsed: number, tokensUsed: number, costCents: number, venuesFound: number, artistsFound: number) {
  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  await Promise.all([
    prisma.discoveryBudget.upsert({
      where: { period_periodType: { period: today, periodType: 'daily' } },
      update: {
        searchesUsed: { increment: searchesUsed },
        tokensUsed: { increment: tokensUsed },
        costCents: { increment: costCents },
        venuesStaged: { increment: venuesFound },
        artistsStaged: { increment: artistsFound }
      },
      create: {
        period: today,
        periodType: 'daily',
        searchesUsed,
        tokensUsed,
        costCents,
        venuesStaged: venuesFound,
        artistsStaged: artistsFound,
        searchLimit: DEFAULT_DAILY_SEARCH_LIMIT,
        costLimitCents: DEFAULT_DAILY_COST_LIMIT
      }
    }),
    prisma.discoveryBudget.upsert({
      where: { period_periodType: { period: month, periodType: 'monthly' } },
      update: {
        searchesUsed: { increment: searchesUsed },
        tokensUsed: { increment: tokensUsed },
        costCents: { increment: costCents },
        venuesStaged: { increment: venuesFound },
        artistsStaged: { increment: artistsFound }
      },
      create: {
        period: month,
        periodType: 'monthly',
        searchesUsed,
        tokensUsed,
        costCents,
        venuesStaged: venuesFound,
        artistsStaged: artistsFound,
        searchLimit: DEFAULT_MONTHLY_SEARCH_LIMIT,
        costLimitCents: DEFAULT_MONTHLY_COST_LIMIT
      }
    })
  ]);
}

// Search with Tavily
async function tavilySearch(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY not configured');

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic', // 1 credit instead of 2
      max_results: 10
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status}`);
  }

  const data = await response.json();
  
  // Format results compactly
  let results = '';
  if (data.answer) {
    results += `Summary: ${data.answer}\n\n`;
  }
  if (data.results) {
    results += data.results.map((r: any) => 
      `${r.title}\n${r.url}\n${r.content}`
    ).join('\n\n');
  }
  
  return results;
}

// Extract entities using Haiku
async function extractEntities(
  searchResults: string, 
  context: string, 
  jobType: string
): Promise<any[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const anthropic = new Anthropic({ apiKey });

  // Choose prompt based on job type
  let prompt: string;
  switch (jobType) {
    case 'FIND_SOURCES':
      prompt = SOURCE_EXTRACTION_PROMPT;
      break;
    case 'DIG_SOURCES':
    case 'URL_SCRAPE':
      prompt = DEEP_EXTRACTION_PROMPT;
      break;
    default:
      prompt = BASIC_EXTRACTION_PROMPT;
  }

  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Context: ${context}\n\nSearch results:\n${searchResults}\n\n${prompt}`
    }]
  });

  const content = response.content[0];
  if (content.type !== 'text') return [];

  // Parse JSON from response
  try {
    // Try to extract JSON array from response
    const text = content.text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    console.error('Failed to parse extraction response:', content.text);
    return [];
  }
}

// Stage extracted entities (venues, artists, and sources)
async function stageEntities(
  entities: any[], 
  sourceQuery: string,
  defaultCity?: string,
  defaultState?: string
): Promise<{ venues: number; artists: number; sources: number }> {
  let venues = 0;
  let artists = 0;
  let sources = 0;

  for (const entity of entities) {
    // Handle SOURCE type - queue URLs for later scraping
    if (entity.type === 'source' && entity.url) {
      // Create a URL_SCRAPE job for this source
      const existingJob = await prisma.discoveryJob.findFirst({
        where: {
          jobType: 'URL_SCRAPE',
          parameters: {
            path: ['url'],
            equals: entity.url
          }
        }
      });

      if (!existingJob) {
        await prisma.discoveryJob.create({
          data: {
            jobType: 'URL_SCRAPE',
            parameters: {
              url: entity.url,
              city: defaultCity,
              state: defaultState,
              sourceType: entity.sourceType,
              description: entity.description
            },
            priority: 80, // High priority for source scraping
          }
        });
        sources++;
      }

      // Also stage any venues mentioned in the source
      if (entity.venuesMentioned && Array.isArray(entity.venuesMentioned)) {
        for (const venueName of entity.venuesMentioned) {
          if (typeof venueName === 'string' && venueName.length > 2) {
            // Create a low-confidence staged entry for mentioned venues
            const exists = await prisma.stagedEntity.findFirst({
              where: {
                entityType: 'VENUE',
                data: { path: ['name'], string_contains: venueName }
              }
            });
            
            if (!exists && defaultCity && defaultState) {
              await prisma.stagedEntity.create({
                data: {
                  entityType: 'VENUE',
                  data: {
                    name: venueName,
                    city: defaultCity,
                    state: defaultState,
                    needsVerification: true
                  },
                  sourceType: 'automated',
                  sourceUrl: entity.url,
                  searchQuery: sourceQuery,
                  confidence: 30, // Low confidence - just a mention
                  aiNotes: `Mentioned in source: ${entity.url}. Needs verification.`,
                  status: 'NEEDS_INFO'
                }
              });
              venues++;
            }
          }
        }
      }
      continue;
    }

    // Handle VENUE and ARTIST types
    if (!entity.name) continue;
    
    // Use default city/state if not provided
    const city = entity.city || defaultCity;
    const state = entity.state || defaultState;
    
    if (!city || !state) continue;

    const entityType = entity.type === 'venue' ? 'VENUE' : 'ARTIST';

    // Check for existing staged
    const existing = await prisma.stagedEntity.findFirst({
      where: {
        entityType,
        status: { in: ['PENDING', 'APPROVED', 'NEEDS_INFO'] },
        data: {
          path: ['name'],
          string_contains: entity.name
        }
      }
    });

    if (existing) continue;

    // Also check live database
    if (entityType === 'VENUE') {
      const existingVenue = await prisma.venue.findFirst({
        where: {
          name: { equals: entity.name, mode: 'insensitive' },
          location: { city: { equals: city, mode: 'insensitive' } }
        }
      });
      if (existingVenue) continue;
    } else {
      const existingArtist = await prisma.artist.findFirst({
        where: { name: { equals: entity.name, mode: 'insensitive' } }
      });
      if (existingArtist) continue;
    }

    // Clean up the data object
    const { type, confidence, ...rawData } = entity;
    const data = {
      ...rawData,
      city,
      state
    };

    // Determine confidence based on data completeness
    let finalConfidence = confidence || 50;
    if (data.contactEmail || data.website) finalConfidence = Math.max(finalConfidence, 70);
    if (data.contactEmail && data.website) finalConfidence = Math.max(finalConfidence, 80);
    if (data.genres && data.genres.length > 0) finalConfidence += 5;
    if (data.description && data.description.length > 50) finalConfidence += 5;
    finalConfidence = Math.min(finalConfidence, 95);

    // Build AI notes
    const missingFields = [];
    if (!data.contactEmail) missingFields.push('email');
    if (!data.website) missingFields.push('website');
    if (!data.genres || data.genres.length === 0) missingFields.push('genres');
    
    const aiNotes = `Automated discovery. Confidence: ${finalConfidence}%.${
      missingFields.length > 0 ? ` Missing: ${missingFields.join(', ')}` : ' Complete data!'
    }`;

    await prisma.stagedEntity.create({
      data: {
        entityType,
        data,
        sourceType: 'automated',
        searchQuery: sourceQuery,
        confidence: finalConfidence,
        aiNotes,
        status: finalConfidence >= 60 ? 'PENDING' : 'NEEDS_INFO'
      }
    });

    if (entityType === 'VENUE') venues++;
    else artists++;
  }

  return { venues, artists, sources };
}

// Run a single discovery job
async function runJob(job: any): Promise<{ searchesUsed: number; tokensUsed: number; costCents: number; venuesFound: number; artistsFound: number; sourcesFound: number }> {
  const params = job.parameters as { 
    city: string; 
    state: string; 
    genre?: string;
    region?: string;
    searchQuery?: string;
    url?: string;
  };
  
  // Build search query based on job type
  let query: string;
  let context: string;
  
  switch (job.jobType) {
    case 'FIND_SOURCES':
      // Use custom query if provided, otherwise build one
      query = params.searchQuery || `${params.city} ${params.state} DIY punk house shows venue calendar`;
      context = `Finding DIY scene sources (blogs, calendars, forums) in ${params.city}, ${params.state}`;
      break;
    case 'DIG_SOURCES':
      query = params.searchQuery || `${params.city} ${params.genre || 'punk'} basement house show venue booking`;
      context = `Digging for underground venues in ${params.city}, ${params.state}${params.genre ? ` (${params.genre})` : ''}`;
      break;
    case 'CITY_VENUES':
      query = params.searchQuery || `${params.city} ${params.state} DIY venue house shows basement all ages punk`;
      context = `DIY venues in ${params.city}, ${params.state}`;
      break;
    case 'CITY_ARTISTS':
      query = params.searchQuery || `${params.city} ${params.state} local bands punk hardcore bandcamp booking`;
      context = `Local bands/artists in ${params.city}, ${params.state}`;
      break;
    case 'GENRE_CITY':
      query = params.searchQuery || `${params.city} ${params.genre} venue shows house basement all ages`;
      context = `${params.genre} venues/artists in ${params.city}, ${params.state}`;
      break;
    case 'URL_SCRAPE':
      // For URL scrape, we fetch the URL directly instead of searching
      if (!params.url) throw new Error('URL required for URL_SCRAPE job');
      query = params.url;
      context = `Extracting venues from ${params.url}`;
      break;
    default:
      throw new Error(`Unknown job type: ${job.jobType}`);
  }

  // Search (or scrape for URL jobs)
  let searchResults: string;
  let searchesUsed = 0;
  
  if (job.jobType === 'URL_SCRAPE') {
    // Direct fetch for URL scraping
    searchResults = await scrapeUrl(params.url!);
    searchesUsed = 0; // No Tavily credit used
  } else {
    searchResults = await tavilySearch(query);
    searchesUsed = 1;
  }
  
  // Estimate prompt size for token calculation
  const promptLength = job.jobType === 'FIND_SOURCES' 
    ? SOURCE_EXTRACTION_PROMPT.length 
    : DEEP_EXTRACTION_PROMPT.length;
  
  // Estimate search result tokens (roughly 4 chars per token)
  const inputTokens = Math.ceil((searchResults.length + promptLength) / 4);
  
  // Extract entities with job-type-specific prompt
  const entities = await extractEntities(searchResults, context, job.jobType);
  
  // Estimate output tokens
  const outputTokens = Math.ceil(JSON.stringify(entities).length / 4);
  const tokensUsed = inputTokens + outputTokens;
  
  // Calculate cost in cents
  const costCents = Math.ceil(
    (searchesUsed * TAVILY_SEARCH_COST) + 
    (inputTokens / 1000) * HAIKU_INPUT_COST + 
    (outputTokens / 1000) * HAIKU_OUTPUT_COST
  );

  // Stage entities (and count sources)
  const { venues: venuesFound, artists: artistsFound, sources: sourcesFound } = await stageEntities(entities, query, params.city, params.state);

  // Record progress
  const searchKey = `${params.city.toLowerCase()}-${params.state.toLowerCase()}-${job.jobType.toLowerCase()}${params.genre ? `-${params.genre}` : ''}`;

  await prisma.discoveryProgress.upsert({
    where: { searchKey },
    update: {
      lastSearched: new Date(),
      searchCount: { increment: 1 },
      venuesFound: { increment: venuesFound },
      artistsFound: { increment: artistsFound }
    },
    create: {
      searchKey,
      city: params.city,
      state: params.state,
      genre: params.genre || null,
      lastSearched: new Date(),
      searchCount: 1,
      venuesFound,
      artistsFound
    }
  });

  return { searchesUsed, tokensUsed, costCents, venuesFound, artistsFound, sourcesFound };
}

// Scrape a URL directly (for URL_SCRAPE jobs)
async function scrapeUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DIYShowsBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return `Error fetching ${url}: ${response.status}`;
    }

    const text = await response.text();
    
    // Basic HTML stripping
    let cleaned = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate if too long
    if (cleaned.length > 8000) {
      cleaned = cleaned.substring(0, 8000) + '... [truncated]';
    }

    return `Content from ${url}:\n\n${cleaned}`;
  } catch (error) {
    return `Error scraping ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Main cron handler
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel cron sends this)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow in development or with valid secret
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Check budget
  const budgetCheck = await checkBudget();
  if (!budgetCheck.canProceed) {
    return NextResponse.json({ 
      success: false, 
      reason: budgetCheck.reason,
      message: 'Budget limit reached, skipping discovery' 
    });
  }

  // Get next pending job
  const job = await prisma.discoveryJob.findFirst({
    where: {
      status: 'PENDING',
      OR: [
        { scheduledFor: null },
        { scheduledFor: { lte: new Date() } }
      ]
    },
    orderBy: [
      { priority: 'desc' },
      { scheduledFor: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  if (!job) {
    return NextResponse.json({ 
      success: true, 
      message: 'No pending jobs in queue' 
    });
  }

  // Mark as running
  await prisma.discoveryJob.update({
    where: { id: job.id },
    data: { status: 'RUNNING', startedAt: new Date() }
  });

  try {
    // Run the job
    const result = await runJob(job);

    // Update job as completed
    await prisma.discoveryJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        searchesUsed: result.searchesUsed,
        tokensUsed: result.tokensUsed,
        estimatedCost: result.costCents,
        venuesFound: result.venuesFound,
        artistsFound: result.artistsFound
      }
    });

    // Record budget usage
    await recordUsage(
      result.searchesUsed,
      result.tokensUsed,
      result.costCents,
      result.venuesFound,
      result.artistsFound
    );

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        jobType: job.jobType,
        parameters: job.parameters
      },
      result: {
        venuesFound: result.venuesFound,
        artistsFound: result.artistsFound,
        sourcesQueued: result.sourcesFound,
        estimatedCost: `$${(result.costCents / 100).toFixed(3)}`
      }
    });

  } catch (error) {
    // Mark job as failed
    await prisma.discoveryJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId: job.id
    }, { status: 500 });
  }
}

// POST - Manual trigger with optional parameters
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { maxJobs = 1 } = body;

  const results = [];
  
  for (let i = 0; i < maxJobs; i++) {
    // Check budget before each job
    const budgetCheck = await checkBudget();
    if (!budgetCheck.canProceed) {
      results.push({ skipped: true, reason: budgetCheck.reason });
      break;
    }

    // Simulate the GET request
    const response = await GET(request);
    const result = await response.json();
    results.push(result);

    if (!result.success || result.message === 'No pending jobs in queue') {
      break;
    }
  }

  return NextResponse.json({
    success: true,
    jobsRun: results.filter(r => r.success && r.job).length,
    results
  });
}

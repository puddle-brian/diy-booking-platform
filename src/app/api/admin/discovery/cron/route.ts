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

// Extraction prompt - optimized for token efficiency
const EXTRACTION_PROMPT = `Extract DIY venues and artists from this search data. Return JSON only.

For each VENUE found, include all available fields:
{
  "type": "venue",
  "name": "...",
  "city": "...",
  "state": "XX",
  "venueType": "house-show|basement|bar|warehouse|community-center|other",
  "genres": ["punk", "hardcore", ...],
  "capacity": 100,
  "ageRestriction": "all-ages|18+|21+",
  "description": "...",
  "contactEmail": "...",
  "website": "...",
  "confidence": 0-100
}

For each ARTIST found:
{
  "type": "artist",
  "name": "...",
  "city": "...",
  "state": "XX",
  "artistType": "band|solo|dj|other",
  "genres": ["punk", ...],
  "subgenres": ["powerviolence", ...],
  "description": "...",
  "contactEmail": "...",
  "website": "...",
  "bandcampUrl": "...",
  "confidence": 0-100
}

Be SPECIFIC with genres. Higher confidence = more data found.
Return array of objects: [{"type":"venue",...}, {"type":"artist",...}]
If nothing found, return [].`;

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
async function extractEntities(searchResults: string, context: string): Promise<any[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Context: Searching for ${context}\n\nSearch results:\n${searchResults}\n\n${EXTRACTION_PROMPT}`
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

// Stage extracted entities
async function stageEntities(entities: any[], sourceQuery: string): Promise<{ venues: number; artists: number }> {
  let venues = 0;
  let artists = 0;

  for (const entity of entities) {
    if (!entity.name || !entity.city || !entity.state) continue;

    const entityType = entity.type === 'venue' ? 'VENUE' : 'ARTIST';

    // Check for existing
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
          location: { city: { equals: entity.city, mode: 'insensitive' } }
        }
      });
      if (existingVenue) continue;
    } else {
      const existingArtist = await prisma.artist.findFirst({
        where: { name: { equals: entity.name, mode: 'insensitive' } }
      });
      if (existingArtist) continue;
    }

    // Stage it
    const { type, confidence, ...data } = entity;
    await prisma.stagedEntity.create({
      data: {
        entityType,
        data,
        sourceType: 'automated',
        searchQuery: sourceQuery,
        confidence: confidence || 50,
        aiNotes: `Discovered via automated search. Confidence: ${confidence || 50}%`,
        status: 'PENDING'
      }
    });

    if (entityType === 'VENUE') venues++;
    else artists++;
  }

  return { venues, artists };
}

// Run a single discovery job
async function runJob(job: any): Promise<{ searchesUsed: number; tokensUsed: number; costCents: number; venuesFound: number; artistsFound: number }> {
  const params = job.parameters as { city: string; state: string; genre?: string };
  
  // Build search query based on job type
  let query: string;
  let context: string;
  
  switch (job.jobType) {
    case 'CITY_VENUES':
      query = `DIY venues house shows all ages ${params.city} ${params.state}`;
      context = `DIY venues in ${params.city}, ${params.state}`;
      break;
    case 'CITY_ARTISTS':
      query = `local bands artists booking ${params.city} ${params.state} bandcamp`;
      context = `local bands/artists in ${params.city}, ${params.state}`;
      break;
    case 'GENRE_CITY':
      query = `${params.genre} venue shows booking ${params.city} ${params.state}`;
      context = `${params.genre} venues/artists in ${params.city}, ${params.state}`;
      break;
    default:
      throw new Error(`Unknown job type: ${job.jobType}`);
  }

  // Search
  const searchResults = await tavilySearch(query);
  const searchesUsed = 1;
  
  // Estimate search result tokens (roughly 4 chars per token)
  const inputTokens = Math.ceil((searchResults.length + EXTRACTION_PROMPT.length) / 4);
  
  // Extract entities
  const entities = await extractEntities(searchResults, context);
  
  // Estimate output tokens
  const outputTokens = Math.ceil(JSON.stringify(entities).length / 4);
  const tokensUsed = inputTokens + outputTokens;
  
  // Calculate cost in cents
  const costCents = Math.ceil(
    TAVILY_SEARCH_COST + 
    (inputTokens / 1000) * HAIKU_INPUT_COST + 
    (outputTokens / 1000) * HAIKU_OUTPUT_COST
  );

  // Stage entities
  const { venues: venuesFound, artists: artistsFound } = await stageEntities(entities, query);

  // Record progress
  const searchKey = params.genre 
    ? `${params.city.toLowerCase()}-${params.state.toLowerCase()}-${params.genre}`
    : `${params.city.toLowerCase()}-${params.state.toLowerCase()}-${job.jobType === 'CITY_VENUES' ? 'venues' : 'artists'}`;

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

  return { searchesUsed, tokensUsed, costCents, venuesFound, artistsFound };
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

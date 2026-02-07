import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GEOGRAPHIC STRATEGY: Radiate outward from Providence, saturate regions
// =============================================================================

// Regions ordered by priority (starting from home base: Providence/New England)
const REGIONS: { name: string; cities: { city: string; state: string }[] }[] = [
  {
    name: 'New England',
    cities: [
      { city: 'Providence', state: 'RI' },  // HOME BASE
      { city: 'Boston', state: 'MA' },
      { city: 'Cambridge', state: 'MA' },
      { city: 'Somerville', state: 'MA' },
      { city: 'Allston', state: 'MA' },
      { city: 'Worcester', state: 'MA' },
      { city: 'New Haven', state: 'CT' },
      { city: 'Hartford', state: 'CT' },
      { city: 'Portland', state: 'ME' },
      { city: 'Burlington', state: 'VT' },
      { city: 'Northampton', state: 'MA' },
      { city: 'Amherst', state: 'MA' },
    ]
  },
  {
    name: 'Northeast Corridor',
    cities: [
      { city: 'Brooklyn', state: 'NY' },
      { city: 'Queens', state: 'NY' },
      { city: 'Manhattan', state: 'NY' },
      { city: 'Jersey City', state: 'NJ' },
      { city: 'New Brunswick', state: 'NJ' },
      { city: 'Philadelphia', state: 'PA' },
      { city: 'Baltimore', state: 'MD' },
      { city: 'Washington', state: 'DC' },
      { city: 'Richmond', state: 'VA' },
    ]
  },
  {
    name: 'Mid-Atlantic & Rust Belt',
    cities: [
      { city: 'Pittsburgh', state: 'PA' },
      { city: 'Cleveland', state: 'OH' },
      { city: 'Columbus', state: 'OH' },
      { city: 'Detroit', state: 'MI' },
      { city: 'Ann Arbor', state: 'MI' },
      { city: 'Buffalo', state: 'NY' },
      { city: 'Rochester', state: 'NY' },
      { city: 'Syracuse', state: 'NY' },
    ]
  },
  {
    name: 'Midwest',
    cities: [
      { city: 'Chicago', state: 'IL' },
      { city: 'Minneapolis', state: 'MN' },
      { city: 'St Paul', state: 'MN' },
      { city: 'Milwaukee', state: 'WI' },
      { city: 'Madison', state: 'WI' },
      { city: 'Indianapolis', state: 'IN' },
      { city: 'Louisville', state: 'KY' },
      { city: 'St Louis', state: 'MO' },
      { city: 'Kansas City', state: 'MO' },
    ]
  },
  {
    name: 'Southeast',
    cities: [
      { city: 'Atlanta', state: 'GA' },
      { city: 'Athens', state: 'GA' },
      { city: 'Nashville', state: 'TN' },
      { city: 'Memphis', state: 'TN' },
      { city: 'Asheville', state: 'NC' },
      { city: 'Chapel Hill', state: 'NC' },
      { city: 'Raleigh', state: 'NC' },
      { city: 'Charleston', state: 'SC' },
      { city: 'New Orleans', state: 'LA' },
      { city: 'Birmingham', state: 'AL' },
    ]
  },
  {
    name: 'Florida',
    cities: [
      { city: 'Tampa', state: 'FL' },
      { city: 'Gainesville', state: 'FL' },
      { city: 'Orlando', state: 'FL' },
      { city: 'Miami', state: 'FL' },
      { city: 'Jacksonville', state: 'FL' },
    ]
  },
  {
    name: 'Texas & Southwest',
    cities: [
      { city: 'Austin', state: 'TX' },
      { city: 'Houston', state: 'TX' },
      { city: 'Dallas', state: 'TX' },
      { city: 'San Antonio', state: 'TX' },
      { city: 'El Paso', state: 'TX' },
      { city: 'Albuquerque', state: 'NM' },
      { city: 'Santa Fe', state: 'NM' },
      { city: 'Phoenix', state: 'AZ' },
      { city: 'Tucson', state: 'AZ' },
    ]
  },
  {
    name: 'Mountain West',
    cities: [
      { city: 'Denver', state: 'CO' },
      { city: 'Boulder', state: 'CO' },
      { city: 'Salt Lake City', state: 'UT' },
      { city: 'Boise', state: 'ID' },
      { city: 'Missoula', state: 'MT' },
    ]
  },
  {
    name: 'Pacific Northwest',
    cities: [
      { city: 'Seattle', state: 'WA' },
      { city: 'Olympia', state: 'WA' },
      { city: 'Tacoma', state: 'WA' },
      { city: 'Portland', state: 'OR' },
      { city: 'Eugene', state: 'OR' },
    ]
  },
  {
    name: 'California',
    cities: [
      { city: 'Oakland', state: 'CA' },
      { city: 'San Francisco', state: 'CA' },
      { city: 'San Jose', state: 'CA' },
      { city: 'Sacramento', state: 'CA' },
      { city: 'Los Angeles', state: 'CA' },
      { city: 'Long Beach', state: 'CA' },
      { city: 'San Diego', state: 'CA' },
      { city: 'Santa Cruz', state: 'CA' },
    ]
  },
];

// Flatten for easy access
const ALL_CITIES = REGIONS.flatMap((r, regionIndex) => 
  r.cities.map((c, cityIndex) => ({
    ...c,
    region: r.name,
    // Priority: earlier regions and earlier cities in region get higher priority
    priority: (REGIONS.length - regionIndex) * 100 + (r.cities.length - cityIndex)
  }))
);

// =============================================================================
// SEARCH STRATEGIES: Smart DIY-specific searches, not basic Google results
// =============================================================================

// Phase 1: Find scene SOURCES (blogs, calendars, forums, zines)
const SOURCE_SEARCH_TEMPLATES = [
  '{city} {state} DIY show calendar listing',
  '{city} punk house show listings blog',
  '{city} underground music scene report',
  '{city} all ages shows calendar',
  '{city} basement shows hardcore punk',
  '{city} local music blog upcoming shows',
  'site:reddit.com {city} DIY venues house shows',
  'site:facebook.com {city} DIY punk shows events',
  '{city} {state} zine punk scene',
];

// Phase 2: Dig into specific source types
const DIG_SEARCH_TEMPLATES = [
  // Forum/community searches
  'site:reddit.com/r/punk {city} venue where to play',
  'site:reddit.com {city} house shows basement venue',
  // Show listing specific
  '{city} show listing {genre} upcoming',
  // Bandcamp/music platform searches (find local bands, then their venues)
  'site:bandcamp.com {city} {genre} "playing at" OR "live at"',
  // Instagram/social (often has venue tags)
  '{city} {genre} show flyer venue',
];

const DIY_GENRES = [
  'punk', 'hardcore', 'noise', 'experimental', 'indie', 'metal',
  'emo', 'screamo', 'post-punk', 'garage', 'folk-punk', 'crust', 'powerviolence'
];

// GET - List discovery queue and stats
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Get queue
  const jobs = await prisma.discoveryJob.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: [
      { priority: 'desc' },
      { scheduledFor: 'asc' },
      { createdAt: 'asc' }
    ],
    take: 100
  });

  // Get today's budget
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

  // Get counts
  const counts = await prisma.discoveryJob.groupBy({
    by: ['status'],
    _count: true
  });

  // Get recent progress
  const recentProgress = await prisma.discoveryProgress.findMany({
    orderBy: { lastSearched: 'desc' },
    take: 20
  });

  // Get staged counts
  const stagedCounts = await prisma.stagedEntity.groupBy({
    by: ['status'],
    _count: true
  });

  return NextResponse.json({
    queue: jobs,
    counts: Object.fromEntries(counts.map(c => [c.status, c._count])),
    budget: {
      daily: dailyBudget || { searchesUsed: 0, costCents: 0, searchLimit: 50, costLimitCents: 100 },
      monthly: monthlyBudget || { searchesUsed: 0, costCents: 0, searchLimit: 1000, costLimitCents: 2000 }
    },
    recentProgress,
    stagedCounts: Object.fromEntries(stagedCounts.map(c => [c.status, c._count]))
  });
}

// POST - Add jobs to queue
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...params } = body;

  switch (action) {
    case 'add_job': {
      // Add a single job
      const job = await prisma.discoveryJob.create({
        data: {
          jobType: params.jobType,
          parameters: params.parameters,
          priority: params.priority || 0,
          scheduledFor: params.scheduledFor ? new Date(params.scheduledFor) : null
        }
      });
      return NextResponse.json({ success: true, job });
    }

    case 'seed_region': {
      // Seed a specific region with smart searches
      const regionName = params.region || 'New England'; // Default to home region
      const region = REGIONS.find(r => r.name === regionName);
      
      if (!region) {
        return NextResponse.json({ 
          error: `Unknown region: ${regionName}. Available: ${REGIONS.map(r => r.name).join(', ')}` 
        }, { status: 400 });
      }

      const existing = await prisma.discoveryProgress.findMany({
        select: { searchKey: true }
      });
      const existingKeys = new Set(existing.map(p => p.searchKey));

      const jobsToCreate: any[] = [];
      
      for (const city of region.cities) {
        // Phase 1: Find scene sources for this city
        for (const template of SOURCE_SEARCH_TEMPLATES.slice(0, 3)) { // Top 3 source searches
          const searchQuery = template
            .replace('{city}', city.city)
            .replace('{state}', city.state);
          const key = `source-${city.city.toLowerCase()}-${city.state.toLowerCase()}-${jobsToCreate.length}`;
          
          if (!existingKeys.has(key)) {
            jobsToCreate.push({
              jobType: 'FIND_SOURCES' as const,
              parameters: { 
                city: city.city, 
                state: city.state, 
                region: regionName,
                searchQuery 
              },
              priority: 100, // High priority for source finding
            });
          }
        }
      }

      if (jobsToCreate.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: `Region "${regionName}" already fully queued`,
          created: 0 
        });
      }

      await prisma.discoveryJob.createMany({ data: jobsToCreate });
      
      return NextResponse.json({ 
        success: true, 
        message: `Added ${jobsToCreate.length} source-finding jobs for ${regionName}`,
        created: jobsToCreate.length,
        region: regionName,
        cities: region.cities.length
      });
    }

    case 'seed_cities': {
      // Legacy: Seed all cities with basic venue search (now uses regional priority)
      const existing = await prisma.discoveryProgress.findMany({
        select: { searchKey: true }
      });
      const existingKeys = new Set(existing.map(p => p.searchKey));

      const jobsToCreate = ALL_CITIES
        .filter(c => !existingKeys.has(`${c.city.toLowerCase()}-${c.state.toLowerCase()}-sources`))
        .map(city => ({
          jobType: 'FIND_SOURCES' as const,
          parameters: { 
            city: city.city, 
            state: city.state, 
            region: city.region,
            searchQuery: `${city.city} ${city.state} DIY show calendar house shows punk venue`
          },
          priority: city.priority,
        }));

      if (jobsToCreate.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'All cities already queued or searched',
          created: 0 
        });
      }

      await prisma.discoveryJob.createMany({ data: jobsToCreate });
      
      return NextResponse.json({ 
        success: true, 
        message: `Added ${jobsToCreate.length} source-finding searches (starting from Providence/New England)`,
        created: jobsToCreate.length
      });
    }

    case 'seed_deep_dig': {
      // Phase 2: Deep dig searches for a specific city (forums, bandcamp, flyers)
      const { city, state } = params;
      if (!city || !state) {
        return NextResponse.json({ error: 'city and state required' }, { status: 400 });
      }

      const jobsToCreate: any[] = [];
      
      // Add forum/community digs
      for (const template of DIG_SEARCH_TEMPLATES) {
        for (const genre of DIY_GENRES.slice(0, 5)) { // Top 5 genres
          const searchQuery = template
            .replace('{city}', city)
            .replace('{genre}', genre);
          
          jobsToCreate.push({
            jobType: 'DIG_SOURCES' as const,
            parameters: { city, state, genre, searchQuery },
            priority: 50, // Medium priority
          });
        }
      }

      // Limit to avoid huge queue
      const toCreate = jobsToCreate.slice(0, 20);
      await prisma.discoveryJob.createMany({ data: toCreate });
      
      return NextResponse.json({ 
        success: true, 
        message: `Added ${toCreate.length} deep-dig searches for ${city}, ${state}`,
        created: toCreate.length
      });
    }

    case 'seed_genres': {
      // Add genre-specific scene searches for a region
      const regionName = params.region || 'New England';
      const region = REGIONS.find(r => r.name === regionName);
      
      if (!region) {
        return NextResponse.json({ error: `Unknown region: ${regionName}` }, { status: 400 });
      }

      const jobsToCreate: any[] = [];

      for (const city of region.cities) {
        for (const genre of DIY_GENRES) {
          const key = `${city.city.toLowerCase()}-${city.state.toLowerCase()}-${genre}`;
          const exists = await prisma.discoveryProgress.findUnique({
            where: { searchKey: key }
          });
          
          if (!exists) {
            jobsToCreate.push({
              jobType: 'GENRE_CITY' as const,
              parameters: { 
                city: city.city, 
                state: city.state, 
                genre,
                searchQuery: `${city.city} ${genre} shows venue house basement all ages`
              },
              priority: 30,
            });
          }
        }
      }

      if (jobsToCreate.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: `All genre searches for ${regionName} already queued`,
          created: 0 
        });
      }

      // Limit to 50 at a time
      const toCreate = jobsToCreate.slice(0, 50);
      await prisma.discoveryJob.createMany({ data: toCreate });
      
      return NextResponse.json({ 
        success: true, 
        message: `Added ${toCreate.length} genre searches for ${regionName}`,
        created: toCreate.length
      });
    }
    
    case 'list_regions': {
      // Return available regions with their cities
      return NextResponse.json({
        regions: REGIONS.map(r => ({
          name: r.name,
          cities: r.cities.length,
          cityList: r.cities.map(c => `${c.city}, ${c.state}`)
        }))
      });
    }

    case 'clear_completed': {
      // Clear old completed jobs
      const deleted = await prisma.discoveryJob.deleteMany({
        where: {
          status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] },
          completedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Older than 7 days
        }
      });
      return NextResponse.json({ success: true, deleted: deleted.count });
    }

    case 'set_budget': {
      // Set daily/monthly budget limits
      const { periodType, searchLimit, costLimitCents } = params;
      const period = periodType === 'daily' 
        ? new Date().toISOString().split('T')[0]
        : new Date().toISOString().slice(0, 7);

      const budget = await prisma.discoveryBudget.upsert({
        where: { period_periodType: { period, periodType } },
        update: { searchLimit, costLimitCents },
        create: { period, periodType, searchLimit, costLimitCents }
      });
      
      return NextResponse.json({ success: true, budget });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

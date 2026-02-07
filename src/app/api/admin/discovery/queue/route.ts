import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// US cities with active DIY scenes - good starting list
const DIY_CITIES = [
  // Major scenes
  { city: 'Portland', state: 'OR' },
  { city: 'Seattle', state: 'WA' },
  { city: 'Oakland', state: 'CA' },
  { city: 'Los Angeles', state: 'CA' },
  { city: 'Brooklyn', state: 'NY' },
  { city: 'Chicago', state: 'IL' },
  { city: 'Philadelphia', state: 'PA' },
  { city: 'Austin', state: 'TX' },
  { city: 'Denver', state: 'CO' },
  { city: 'Richmond', state: 'VA' },
  { city: 'Baltimore', state: 'MD' },
  { city: 'Boston', state: 'MA' },
  { city: 'Minneapolis', state: 'MN' },
  { city: 'Detroit', state: 'MI' },
  { city: 'Atlanta', state: 'GA' },
  { city: 'Nashville', state: 'TN' },
  { city: 'New Orleans', state: 'LA' },
  { city: 'San Francisco', state: 'CA' },
  { city: 'Washington', state: 'DC' },
  { city: 'Pittsburgh', state: 'PA' },
  // Smaller but active scenes
  { city: 'Olympia', state: 'WA' },
  { city: 'Asheville', state: 'NC' },
  { city: 'Columbus', state: 'OH' },
  { city: 'Cleveland', state: 'OH' },
  { city: 'Louisville', state: 'KY' },
  { city: 'Providence', state: 'RI' },
  { city: 'San Diego', state: 'CA' },
  { city: 'Phoenix', state: 'AZ' },
  { city: 'Tucson', state: 'AZ' },
  { city: 'Albuquerque', state: 'NM' },
  { city: 'Salt Lake City', state: 'UT' },
  { city: 'Boise', state: 'ID' },
  { city: 'Reno', state: 'NV' },
  { city: 'Sacramento', state: 'CA' },
  { city: 'Kansas City', state: 'MO' },
  { city: 'St Louis', state: 'MO' },
  { city: 'Tampa', state: 'FL' },
  { city: 'Miami', state: 'FL' },
  { city: 'Jacksonville', state: 'FL' },
];

const DIY_GENRES = [
  'punk', 'hardcore', 'noise', 'experimental', 'indie', 'metal',
  'emo', 'screamo', 'post-punk', 'garage', 'folk-punk'
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

    case 'seed_cities': {
      // Seed queue with all DIY cities (venue search)
      const existing = await prisma.discoveryProgress.findMany({
        select: { searchKey: true }
      });
      const existingKeys = new Set(existing.map(p => p.searchKey));

      const jobsToCreate = DIY_CITIES
        .filter(c => !existingKeys.has(`${c.city.toLowerCase()}-${c.state.toLowerCase()}-venues`))
        .map((city, i) => ({
          jobType: 'CITY_VENUES' as const,
          parameters: { city: city.city, state: city.state },
          priority: DIY_CITIES.length - i, // Major cities first
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
        message: `Added ${jobsToCreate.length} city venue searches`,
        created: jobsToCreate.length
      });
    }

    case 'seed_genres': {
      // Add genre-specific searches for top cities
      const topCities = DIY_CITIES.slice(0, 15);
      const jobsToCreate: any[] = [];

      for (const city of topCities) {
        for (const genre of DIY_GENRES) {
          const key = `${city.city.toLowerCase()}-${city.state.toLowerCase()}-${genre}`;
          const exists = await prisma.discoveryProgress.findUnique({
            where: { searchKey: key }
          });
          
          if (!exists) {
            jobsToCreate.push({
              jobType: 'GENRE_CITY' as const,
              parameters: { city: city.city, state: city.state, genre },
              priority: 0, // Lower priority than city-wide searches
            });
          }
        }
      }

      if (jobsToCreate.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'All genre searches already queued',
          created: 0 
        });
      }

      // Only add first 50 to avoid massive queue
      const toCreate = jobsToCreate.slice(0, 50);
      await prisma.discoveryJob.createMany({ data: toCreate });
      
      return NextResponse.json({ 
        success: true, 
        message: `Added ${toCreate.length} genre searches (${jobsToCreate.length - toCreate.length} remaining)`,
        created: toCreate.length
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

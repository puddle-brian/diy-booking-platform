import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDiscoveryDigest } from '@/lib/email';

// GET - Send daily digest email
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  // Get today's budget stats
  const [dailyBudget, monthlyBudget] = await Promise.all([
    prisma.discoveryBudget.findUnique({
      where: { period_periodType: { period: today, periodType: 'daily' } }
    }),
    prisma.discoveryBudget.findUnique({
      where: { period_periodType: { period: month, periodType: 'monthly' } }
    })
  ]);

  // Get pending counts
  const [pendingJobs, pendingReview] = await Promise.all([
    prisma.discoveryJob.count({ where: { status: 'PENDING' } }),
    prisma.stagedEntity.count({ where: { status: 'PENDING' } })
  ]);

  // Get today's errors
  const failedJobs = await prisma.discoveryJob.findMany({
    where: {
      status: 'FAILED',
      completedAt: { gte: new Date(today) }
    },
    select: { errorMessage: true, parameters: true }
  });

  const errors = failedJobs
    .filter(j => j.errorMessage)
    .map(j => {
      const params = j.parameters as { city?: string; state?: string };
      return `${params.city}, ${params.state}: ${j.errorMessage}`;
    });

  // Get jobs run today
  const jobsRunToday = await prisma.discoveryJob.count({
    where: {
      status: 'COMPLETED',
      completedAt: { gte: new Date(today) }
    }
  });

  // Build summary
  const summary = {
    jobsRun: jobsRunToday,
    venuesFound: dailyBudget?.venuesStaged || 0,
    artistsFound: dailyBudget?.artistsStaged || 0,
    totalCost: dailyBudget?.costCents || 0,
    dailyBudgetUsed: dailyBudget 
      ? Math.round((dailyBudget.costCents / (dailyBudget.costLimitCents || 100)) * 100)
      : 0,
    monthlyBudgetUsed: monthlyBudget 
      ? Math.round((monthlyBudget.costCents / (monthlyBudget.costLimitCents || 2000)) * 100)
      : 0,
    pendingJobs,
    pendingReview,
    errors
  };

  // Only send email if there was activity today OR there are pending reviews
  if (summary.jobsRun === 0 && summary.venuesFound === 0 && summary.artistsFound === 0 && summary.pendingReview === 0) {
    return NextResponse.json({
      success: true,
      message: 'No activity today, skipping email',
      summary
    });
  }

  // Send the email
  const sent = await sendDiscoveryDigest(summary);

  return NextResponse.json({
    success: true,
    emailSent: sent,
    summary
  });
}

// POST - Manual trigger with preview option
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { preview = false } = body;

  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  // Get stats (same as GET)
  const [dailyBudget, monthlyBudget] = await Promise.all([
    prisma.discoveryBudget.findUnique({
      where: { period_periodType: { period: today, periodType: 'daily' } }
    }),
    prisma.discoveryBudget.findUnique({
      where: { period_periodType: { period: month, periodType: 'monthly' } }
    })
  ]);

  const [pendingJobs, pendingReview] = await Promise.all([
    prisma.discoveryJob.count({ where: { status: 'PENDING' } }),
    prisma.stagedEntity.count({ where: { status: 'PENDING' } })
  ]);

  const failedJobs = await prisma.discoveryJob.findMany({
    where: {
      status: 'FAILED',
      completedAt: { gte: new Date(today) }
    },
    select: { errorMessage: true, parameters: true }
  });

  const errors = failedJobs
    .filter(j => j.errorMessage)
    .map(j => {
      const params = j.parameters as { city?: string; state?: string };
      return `${params.city}, ${params.state}: ${j.errorMessage}`;
    });

  const jobsRunToday = await prisma.discoveryJob.count({
    where: {
      status: 'COMPLETED',
      completedAt: { gte: new Date(today) }
    }
  });

  const summary = {
    jobsRun: jobsRunToday,
    venuesFound: dailyBudget?.venuesStaged || 0,
    artistsFound: dailyBudget?.artistsStaged || 0,
    totalCost: dailyBudget?.costCents || 0,
    dailyBudgetUsed: dailyBudget 
      ? Math.round((dailyBudget.costCents / (dailyBudget.costLimitCents || 100)) * 100)
      : 0,
    monthlyBudgetUsed: monthlyBudget 
      ? Math.round((monthlyBudget.costCents / (monthlyBudget.costLimitCents || 2000)) * 100)
      : 0,
    pendingJobs,
    pendingReview,
    errors
  };

  if (preview) {
    return NextResponse.json({
      success: true,
      preview: true,
      summary
    });
  }

  const sent = await sendDiscoveryDigest(summary);

  return NextResponse.json({
    success: true,
    emailSent: sent,
    summary
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

/**
 * GET /api/admin/discovery/usage - Get discovery search usage stats
 * 
 * Tracks how many searches have been made this month.
 * Note: Tavily doesn't have a public API to check remaining credits,
 * so we track usage locally and estimate.
 */
export async function GET() {
  try {
    // Get the start of the current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count staged entities created this month via web_search
    const stagedThisMonth = await prisma.stagedEntity.count({
      where: {
        sourceType: 'web_search',
        createdAt: { gte: monthStart }
      }
    });

    // Count total staged entities from discovery
    const totalStaged = await prisma.stagedEntity.count({
      where: {
        sourceType: 'web_search'
      }
    });

    // Estimate searches (rough: assume ~5 staged items per search on average)
    // This is imprecise but gives a ballpark
    const estimatedSearches = Math.ceil(stagedThisMonth / 5) || 0;
    
    // Tavily free tier: 1000 searches/month
    // Basic search: 1 credit, Advanced: 2 credits
    const FREE_TIER_LIMIT = 1000;
    
    return NextResponse.json({
      thisMonth: {
        stagedEntities: stagedThisMonth,
        estimatedSearches: estimatedSearches,
        // We can't know exact credits without Tavily telling us
        // but we can estimate based on our tracking
      },
      allTime: {
        totalStaged: totalStaged
      },
      tavilyInfo: {
        freeTierLimit: FREE_TIER_LIMIT,
        creditsPerBasicSearch: 1,
        creditsPerAdvancedSearch: 2,
        note: "Exact remaining credits available at tavily.com dashboard",
        dashboardUrl: "https://app.tavily.com"
      },
      monthStartDate: monthStart.toISOString()
    });
  } catch (error) {
    console.error('Error getting discovery usage:', error);
    return NextResponse.json(
      { error: 'Failed to get usage stats' },
      { status: 500 }
    );
  }
}

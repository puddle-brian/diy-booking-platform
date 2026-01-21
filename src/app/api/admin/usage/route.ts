import { NextRequest, NextResponse } from 'next/server';
import { getPlatformUsageStats } from '../../../../services/UsageService';

/**
 * GET /api/admin/usage - Get platform-wide usage statistics (admin only)
 * Query params:
 *   - days: Number of days to look back (default 30)
 * 
 * TODO: Add admin authentication check
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // TODO: Add admin authentication check here
    // For now, this is accessible but should be protected

    const stats = await getPlatformUsageStats(days);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting platform usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to get platform usage stats' },
      { status: 500 }
    );
  }
}

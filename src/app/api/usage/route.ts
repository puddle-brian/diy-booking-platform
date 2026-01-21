import { NextRequest, NextResponse } from 'next/server';
import { 
  checkUsageLimit, 
  getUserUsageStats, 
  getOrCreateSubscription 
} from '../../../services/UsageService';

/**
 * GET /api/usage - Get usage stats for a user
 * Query params:
 *   - userId: User ID (required)
 *   - days: Number of days to look back (default 30)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const stats = await getUserUsageStats(userId, days);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to get usage stats' },
      { status: 500 }
    );
  }
}

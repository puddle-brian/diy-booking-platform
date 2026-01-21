import { NextRequest, NextResponse } from 'next/server';
import { checkUsageLimit } from '../../../../services/UsageService';

/**
 * GET /api/usage/check - Check if user can make an agent request
 * Query params:
 *   - userId: User ID (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const result = await checkUsageLimit(userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return NextResponse.json(
      { error: 'Failed to check usage limit' },
      { status: 500 }
    );
  }
}

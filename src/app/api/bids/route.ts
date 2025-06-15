import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentShowId = searchParams.get('parentShowId');
    const artistId = searchParams.get('artistId');
    const isLineupSlot = searchParams.get('isLineupSlot');

    // CLEANUP: Lineup system removed - return empty arrays for lineup requests
    if (isLineupSlot === 'true') {
      if (parentShowId) {
        console.log(`🎵 API: Lineup system removed - returning empty array for show ${parentShowId}`);
      } else if (artistId) {
        console.log(`🎵 API: Lineup system removed - returning empty array for artist ${artistId}`);
      }
      return NextResponse.json([]);
    }

    // For regular bid queries (non-lineup), we can implement proper logic later
    // For now, return empty array to prevent crashes
    console.log('🎵 API: Regular bid queries not yet implemented in simplified system');
    return NextResponse.json([]);
    
  } catch (error) {
    console.error('Error in GET /api/bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
} 
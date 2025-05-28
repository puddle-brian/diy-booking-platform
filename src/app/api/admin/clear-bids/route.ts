import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Clear all bids and tour requests from database
    await prisma.bid.deleteMany({});
    await prisma.tourRequest.deleteMany({});
    
    console.log('🧹 Admin: Cleared all bids and tour requests from database');
    
    return NextResponse.json({ 
      success: true, 
      message: 'All bids and tour requests cleared successfully from database' 
    });
  } catch (error) {
    console.error('Error clearing bids:', error);
    return NextResponse.json(
      { error: 'Failed to clear bids', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
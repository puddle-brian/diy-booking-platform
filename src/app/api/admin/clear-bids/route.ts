import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // 🎯 UPDATED: Clear NEW unified system instead of old legacy system
    await prisma.showRequestBid.deleteMany({});
    await prisma.showRequest.deleteMany({});
    
    console.log('🧹 Admin: Cleared all show request bids and show requests from database (NEW UNIFIED SYSTEM)');
    
    return NextResponse.json({ 
      success: true, 
      message: 'All show request bids and show requests cleared successfully from database (NEW UNIFIED SYSTEM)' 
    });
  } catch (error) {
    console.error('Error clearing show request bids:', error);
    return NextResponse.json(
      { error: 'Failed to clear show request bids', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
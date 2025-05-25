import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const bidsFilePath = path.join(process.cwd(), 'data', 'bids.json');

export async function POST(request: NextRequest) {
  try {
    // Clear all bids by writing an empty array
    const dir = path.dirname(bidsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(bidsFilePath, JSON.stringify([], null, 2));
    
    console.log('🧹 Admin: Cleared all bids');
    
    return NextResponse.json({ 
      success: true, 
      message: 'All bids cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing bids:', error);
    return NextResponse.json(
      { error: 'Failed to clear bids' },
      { status: 500 }
    );
  }
} 
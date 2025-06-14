import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // EMERGENCY: ENDPOINT DISABLED TO PREVENT DATA LOSS
  return NextResponse.json(
    { 
      error: 'ENDPOINT DISABLED - This endpoint was accidentally wiping production data. Contact admin to re-enable safely.',
      timestamp: new Date().toISOString()
    },
    { status: 403 }
  );
}
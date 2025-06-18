import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Admin API: Starting comprehensive test data reset...');
    
    // Use the comprehensive test data script
    const { resetTestData } = require('../../../../../scripts/reset-test-data');
    await resetTestData();
    
    console.log('✅ Admin API: Comprehensive test data reset completed successfully!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Comprehensive test data reset completed successfully!'
    });

  } catch (error) {
    console.error('❌ Admin API: Error resetting test data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset test data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Admin API: Starting comprehensive test data reset...');
    
    // Use the comprehensive test data script
    const { resetTestData } = require('../../../../../scripts/reset-test-data');
    
    console.log('🔄 Admin API: About to call resetTestData function...');
    await resetTestData();
    
    console.log('✅ Admin API: Comprehensive test data reset completed successfully!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Comprehensive test data reset completed successfully!'
    });

  } catch (error) {
    console.error('❌ Admin API: Detailed error information:');
    console.error('Error name:', (error as any)?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Error stack:', (error as any)?.stack);
    console.error('Full error object:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to reset test data', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
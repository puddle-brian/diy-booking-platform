import { NextRequest, NextResponse } from 'next/server';
import { backupDatabase } from '../../../../../scripts/backup-database';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Admin backup request received');
    
    // Create backup
    const backupFile = await backupDatabase();
    
    return NextResponse.json({
      success: true,
      message: `✅ Backup created successfully: ${backupFile}`,
      backupFile
    });
    
  } catch (error) {
    console.error('❌ Admin backup failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create backup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({
        success: true,
        backups: [],
        message: 'No backups directory found'
      });
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(1)}MB`,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());
    
    return NextResponse.json({
      success: true,
      backups: files,
      count: files.length
    });
    
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list backups',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
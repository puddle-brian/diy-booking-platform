import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Running Prisma DB push...');
    
    // Run prisma db push
    const { stdout, stderr } = await execAsync('npx prisma db push', {
      cwd: process.cwd()
    });
    
    console.log('✅ Prisma DB push completed');
    console.log('STDOUT:', stdout);
    if (stderr) {
      console.log('STDERR:', stderr);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database schema updated successfully',
      output: stdout,
      errors: stderr || null
    });
    
  } catch (error: any) {
    console.error('❌ Prisma DB push failed:', error);
    return NextResponse.json(
      { 
        error: 'Database push failed', 
        details: error.message,
        output: error.stdout || null,
        errors: error.stderr || null
      },
      { status: 500 }
    );
  }
} 
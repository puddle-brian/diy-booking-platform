import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Running Prisma generate...');
    
    // Run prisma generate
    const { stdout, stderr } = await execAsync('npx prisma generate', {
      cwd: process.cwd()
    });
    
    console.log('✅ Prisma generate completed');
    console.log('STDOUT:', stdout);
    if (stderr) {
      console.log('STDERR:', stderr);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Prisma client regenerated successfully',
      output: stdout,
      errors: stderr || null
    });
    
  } catch (error: any) {
    console.error('❌ Prisma generate failed:', error);
    return NextResponse.json(
      { 
        error: 'Prisma generate failed', 
        details: error.message,
        output: error.stdout || null,
        errors: error.stderr || null
      },
      { status: 500 }
    );
  }
} 
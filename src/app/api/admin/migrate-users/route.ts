import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  // Same logic as POST - allow GET for easy browser access
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting user migration...');
    
    // Load file-based users
    const usersFile = path.join(process.cwd(), 'data', 'users.json');
    if (!fs.existsSync(usersFile)) {
      return NextResponse.json({ error: 'Users file not found' }, { status: 404 });
    }
    
    const fileUsers = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    console.log(`📊 Found ${fileUsers.length} file users`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    const results = [];
    
    for (const fileUser of fileUsers) {
      try {
        // Check if user already exists
        const existing = await prisma.user.findUnique({ 
          where: { id: fileUser.id } 
        });
        
        if (existing) {
          console.log(`⏭️ User ${fileUser.name} already exists`);
          skippedCount++;
          results.push({ id: fileUser.id, name: fileUser.name, status: 'skipped' });
          continue;
        }
        
        // Create user in database
        const newUser = await prisma.user.create({
          data: {
            id: fileUser.id,
            email: fileUser.email,
            username: fileUser.name,
            passwordHash: fileUser.password,
            role: fileUser.role.toUpperCase(),
            verified: fileUser.isVerified || false,
            createdAt: new Date(fileUser.createdAt)
          }
        });
        
        console.log(`✅ Migrated: ${newUser.username}`);
        migratedCount++;
        results.push({ id: fileUser.id, name: fileUser.name, status: 'migrated' });
        
      } catch (error: any) {
        console.error(`❌ Failed to migrate ${fileUser.name}:`, error);
        results.push({ id: fileUser.id, name: fileUser.name, status: 'error', error: error.message });
      }
    }
    
    // Set Lightning Bolt ownership
    try {
      const brianGibson = await prisma.user.findUnique({ where: { id: 'brian-gibson' } });
      if (brianGibson) {
        await prisma.artist.update({
          where: { id: '1748101913848' },
          data: { submittedById: brianGibson.id }
        });
        console.log('🎵 Set Brian Gibson as Lightning Bolt owner');
      }
    } catch (error) {
      console.warn('⚠️ Failed to set Lightning Bolt ownership:', error);
    }
    
    // Set Lost Bag ownership
    try {
      const lidz = await prisma.user.findUnique({ where: { id: 'lidz-bierenday' } });
      if (lidz) {
        const lostBag = await prisma.venue.findFirst({ 
          where: { name: { contains: 'Lost Bag' } } 
        });
        if (lostBag) {
          await prisma.venue.update({
            where: { id: lostBag.id },
            data: { submittedById: lidz.id }
          });
          console.log('🏢 Set Lidz as Lost Bag owner');
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to set Lost Bag ownership:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      summary: {
        total: fileUsers.length,
        migrated: migratedCount,
        skipped: skippedCount,
        errors: results.filter(r => r.status === 'error').length
      },
      results
    });
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
} 
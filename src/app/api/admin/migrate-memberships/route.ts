import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting membership migration...');
    
    // Load file-based memberships
    const artistMembershipsFile = path.join(process.cwd(), 'data', 'artist-memberships.json');
    const venueMembershipsFile = path.join(process.cwd(), 'data', 'venue-memberships.json');
    
    let artistMemberships = [];
    let venueMemberships = [];
    
    if (fs.existsSync(artistMembershipsFile)) {
      artistMemberships = JSON.parse(fs.readFileSync(artistMembershipsFile, 'utf8'));
    }
    
    if (fs.existsSync(venueMembershipsFile)) {
      venueMemberships = JSON.parse(fs.readFileSync(venueMembershipsFile, 'utf8'));
    }
    
    console.log(`📊 Found ${artistMemberships.length} artist memberships`);
    console.log(`📊 Found ${venueMemberships.length} venue memberships`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    const results = [];
    
    // Migrate artist memberships
    for (const membership of artistMemberships) {
      try {
        // Check if membership already exists
        const existing = await prisma.membership.findUnique({
          where: {
            userId_entityType_entityId: {
              userId: membership.userId,
              entityType: 'ARTIST',
              entityId: membership.artistId
            }
          }
        });
        
        if (existing) {
          console.log(`⏭️ Artist membership already exists: ${membership.userId} -> ${membership.artistId}`);
          skippedCount++;
          results.push({
            userId: membership.userId,
            entityType: 'artist',
            entityId: membership.artistId,
            status: 'skipped'
          });
          continue;
        }
        
        // Create membership in database
        await prisma.membership.create({
          data: {
            userId: membership.userId,
            entityType: 'ARTIST',
            entityId: membership.artistId,
            role: membership.role,
            permissions: membership.permissions,
            status: membership.status === 'active' ? 'ACTIVE' : 'INACTIVE',
            joinedAt: new Date(membership.joinedAt),
            invitedBy: membership.invitedBy === 'system' ? null : membership.invitedBy
          }
        });
        
        console.log(`✅ Migrated artist membership: ${membership.userId} -> ${membership.artistId}`);
        migratedCount++;
        results.push({
          userId: membership.userId,
          entityType: 'artist',
          entityId: membership.artistId,
          status: 'migrated'
        });
        
      } catch (error: any) {
        console.error(`❌ Failed to migrate artist membership:`, error);
        results.push({
          userId: membership.userId,
          entityType: 'artist',
          entityId: membership.artistId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Migrate venue memberships
    for (const membership of venueMemberships) {
      try {
        // Check if membership already exists
        const existing = await prisma.membership.findUnique({
          where: {
            userId_entityType_entityId: {
              userId: membership.userId,
              entityType: 'VENUE',
              entityId: membership.venueId
            }
          }
        });
        
        if (existing) {
          console.log(`⏭️ Venue membership already exists: ${membership.userId} -> ${membership.venueId}`);
          skippedCount++;
          results.push({
            userId: membership.userId,
            entityType: 'venue',
            entityId: membership.venueId,
            status: 'skipped'
          });
          continue;
        }
        
        // Create membership in database
        await prisma.membership.create({
          data: {
            userId: membership.userId,
            entityType: 'VENUE',
            entityId: membership.venueId,
            role: membership.role,
            permissions: membership.permissions,
            status: membership.status === 'active' ? 'ACTIVE' : 'INACTIVE',
            joinedAt: new Date(membership.joinedAt),
            invitedBy: membership.invitedBy === 'system' ? null : membership.invitedBy
          }
        });
        
        console.log(`✅ Migrated venue membership: ${membership.userId} -> ${membership.venueId}`);
        migratedCount++;
        results.push({
          userId: membership.userId,
          entityType: 'venue',
          entityId: membership.venueId,
          status: 'migrated'
        });
        
      } catch (error: any) {
        console.error(`❌ Failed to migrate venue membership:`, error);
        results.push({
          userId: membership.userId,
          entityType: 'venue',
          entityId: membership.venueId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Membership migration completed',
      summary: {
        total: artistMemberships.length + venueMemberships.length,
        migrated: migratedCount,
        skipped: skippedCount,
        errors: results.filter(r => r.status === 'error').length
      },
      results
    });
    
  } catch (error: any) {
    console.error('❌ Membership migration failed:', error);
    return NextResponse.json(
      { error: 'Membership migration failed', details: error.message },
      { status: 500 }
    );
  }
} 
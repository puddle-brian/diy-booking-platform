import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Admin API: Starting smart restore from backup...');
    
    // Use the most recent backup
    const backupFile = path.join(process.cwd(), 'backups/backup-2025-06-15T01-11-19-656Z.json');
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    console.log(`📁 Admin API: Loading backup from ${backupFile}`);
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    // Filter out lineup-specific fields that we removed
    const filterData = (records: any[]) => {
      return records.map(record => {
        const filtered = { ...record };
        
        // Remove lineup fields that no longer exist
        delete filtered.isLineupSlot;
        delete filtered.parentShowId;
        delete filtered.lineupRole;
        delete filtered.billingOrder;
        delete filtered.invitedByUserId;
        
        return filtered;
      });
    };

    console.log('🧹 Admin API: Filtering and restoring data...');
    let restoredCounts = {
      artists: 0,
      venues: 0,
      users: 0,
      shows: 0,
      showRequests: 0,
      memberships: 0
    };
    
    // Restore Artists
    if (backup.artists && backup.artists.length > 0) {
      const filteredArtists = filterData(backup.artists);
      console.log(`📊 Admin API: Restoring ${filteredArtists.length} artists...`);
      
      for (const artist of filteredArtists) {
        await prisma.artist.upsert({
          where: { id: artist.id },
          update: artist,
          create: artist
        });
      }
      restoredCounts.artists = filteredArtists.length;
      console.log('✅ Admin API: Artists restored');
    }

    // Restore Venues
    if (backup.venues && backup.venues.length > 0) {
      const filteredVenues = filterData(backup.venues);
      console.log(`📊 Admin API: Restoring ${filteredVenues.length} venues...`);
      
      for (const venue of filteredVenues) {
        await prisma.venue.upsert({
          where: { id: venue.id },
          update: venue,
          create: venue
        });
      }
      restoredCounts.venues = filteredVenues.length;
      console.log('✅ Admin API: Venues restored');
    }

    // Restore Users
    if (backup.users && backup.users.length > 0) {
      const filteredUsers = filterData(backup.users);
      console.log(`📊 Admin API: Restoring ${filteredUsers.length} users...`);
      
      for (const user of filteredUsers) {
        await prisma.user.upsert({
          where: { id: user.id },
          update: user,
          create: user
        });
      }
      restoredCounts.users = filteredUsers.length;
      console.log('✅ Admin API: Users restored');
    }

    // Restore Shows (filter lineup fields)
    if (backup.shows && backup.shows.length > 0) {
      const filteredShows = filterData(backup.shows);
      console.log(`📊 Admin API: Restoring ${filteredShows.length} shows...`);
      
      for (const show of filteredShows) {
        await prisma.show.upsert({
          where: { id: show.id },
          update: show,
          create: show
        });
      }
      restoredCounts.shows = filteredShows.length;
      console.log('✅ Admin API: Shows restored');
    }

    // Restore ShowRequests
    if (backup.showRequests && backup.showRequests.length > 0) {
      const filteredRequests = filterData(backup.showRequests);
      console.log(`📊 Admin API: Restoring ${filteredRequests.length} show requests...`);
      
      for (const request of filteredRequests) {
        await prisma.showRequest.upsert({
          where: { id: request.id },
          update: request,
          create: request
        });
      }
      restoredCounts.showRequests = filteredRequests.length;
      console.log('✅ Admin API: Show requests restored');
    }

    // Restore memberships
    if (backup.memberships && backup.memberships.length > 0) {
      console.log(`📊 Admin API: Restoring ${backup.memberships.length} memberships...`);
      
      for (const membership of backup.memberships) {
        await prisma.membership.upsert({
          where: { id: membership.id },
          update: membership,
          create: membership
        });
      }
      restoredCounts.memberships = backup.memberships.length;
      console.log('✅ Admin API: Memberships restored');
    }

    console.log('\n🎉 Admin API: SMART RESTORE COMPLETE!');
    console.log('=======================================');
    
    // Verify restoration
    const finalCounts = {
      artists: await prisma.artist.count(),
      venues: await prisma.venue.count(),
      shows: await prisma.show.count(),
      showRequests: await prisma.showRequest.count(),
      bids: await prisma.bid.count()
    };
    
    console.log(`📊 Admin API: RESTORED DATA:`);
    console.log(`   - Artists: ${finalCounts.artists}`);
    console.log(`   - Venues: ${finalCounts.venues}`);
    console.log(`   - Shows: ${finalCounts.shows}`);
    console.log(`   - Show Requests: ${finalCounts.showRequests}`);
    console.log(`   - Bids: ${finalCounts.bids}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Smart restore completed successfully with diverse test data!',
      summary: {
        restored: restoredCounts,
        final: finalCounts,
        backupFile: 'backup-2025-06-15T01-11-19-656Z.json'
      }
    });

  } catch (error) {
    console.error('❌ Admin API: Smart restore failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to restore from backup', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
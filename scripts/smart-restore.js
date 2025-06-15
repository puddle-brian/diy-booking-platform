const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function smartRestore() {
  console.log('🔄 SMART RESTORE: Filtering out lineup fields from backup');
  console.log('==================================================\n');

  try {
    // Use the most recent backup
    const backupFile = 'backups/backup-2025-06-15T01-11-19-656Z.json';
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    console.log(`📁 Loading backup: ${backupFile}`);
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    // Filter out lineup-specific fields that we removed
    const filterData = (records) => {
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

    console.log('🧹 Filtering data...');
    
    // Restore Artists
    if (backup.artists && backup.artists.length > 0) {
      const filteredArtists = filterData(backup.artists);
      console.log(`📊 Restoring ${filteredArtists.length} artists...`);
      
      for (const artist of filteredArtists) {
        await prisma.artist.upsert({
          where: { id: artist.id },
          update: artist,
          create: artist
        });
      }
      console.log('✅ Artists restored');
    }

    // Restore Venues
    if (backup.venues && backup.venues.length > 0) {
      const filteredVenues = filterData(backup.venues);
      console.log(`📊 Restoring ${filteredVenues.length} venues...`);
      
      for (const venue of filteredVenues) {
        await prisma.venue.upsert({
          where: { id: venue.id },
          update: venue,
          create: venue
        });
      }
      console.log('✅ Venues restored');
    }

    // Restore Users
    if (backup.users && backup.users.length > 0) {
      const filteredUsers = filterData(backup.users);
      console.log(`📊 Restoring ${filteredUsers.length} users...`);
      
      for (const user of filteredUsers) {
        await prisma.user.upsert({
          where: { id: user.id },
          update: user,
          create: user
        });
      }
      console.log('✅ Users restored');
    }

    // Restore Shows (filter lineup fields)
    if (backup.shows && backup.shows.length > 0) {
      const filteredShows = filterData(backup.shows);
      console.log(`📊 Restoring ${filteredShows.length} shows...`);
      
      for (const show of filteredShows) {
        await prisma.show.upsert({
          where: { id: show.id },
          update: show,
          create: show
        });
      }
      console.log('✅ Shows restored');
    }

    // Restore ShowRequests
    if (backup.showRequests && backup.showRequests.length > 0) {
      const filteredRequests = filterData(backup.showRequests);
      console.log(`📊 Restoring ${filteredRequests.length} show requests...`);
      
      for (const request of filteredRequests) {
        await prisma.showRequest.upsert({
          where: { id: request.id },
          update: request,
          create: request
        });
      }
      console.log('✅ Show requests restored');
    }

    // Restore regular Bids (filter lineup fields)
    if (backup.bids && backup.bids.length > 0) {
      const filteredBids = backup.bids.filter(bid => !bid.isLineupSlot); // Skip lineup bids entirely
      const cleanBids = filterData(filteredBids);
      
      console.log(`📊 Restoring ${cleanBids.length} regular bids (${backup.bids.length - cleanBids.length} lineup bids skipped)...`);
      
      for (const bid of cleanBids) {
        try {
          await prisma.bid.upsert({
            where: { id: bid.id },
            update: bid,
            create: bid
          });
        } catch (error) {
          console.warn(`⚠️  Skipped bid ${bid.id}: ${error.message}`);
        }
      }
      console.log('✅ Regular bids restored');
    }

    // Restore other tables as needed (memberships, etc.)
    if (backup.memberships && backup.memberships.length > 0) {
      console.log(`📊 Restoring ${backup.memberships.length} memberships...`);
      
      for (const membership of backup.memberships) {
        await prisma.membership.upsert({
          where: { id: membership.id },
          update: membership,
          create: membership
        });
      }
      console.log('✅ Memberships restored');
    }

    console.log('\n🎉 SMART RESTORE COMPLETE!');
    console.log('=============================');
    
    // Verify restoration
    const artistCount = await prisma.artist.count();
    const venueCount = await prisma.venue.count();
    const showCount = await prisma.show.count();
    const requestCount = await prisma.showRequest.count();
    const bidCount = await prisma.bid.count();
    
    console.log(`📊 RESTORED DATA:`);
    console.log(`   - Artists: ${artistCount}`);
    console.log(`   - Venues: ${venueCount}`);
    console.log(`   - Shows: ${showCount}`);
    console.log(`   - Show Requests: ${requestCount}`);
    console.log(`   - Bids: ${bidCount}`);
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

smartRestore(); 
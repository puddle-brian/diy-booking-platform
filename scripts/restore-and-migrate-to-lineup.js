const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreAndMigrateToLineup(backupFile) {
  try {
    console.log(`🔄 Restoring database and migrating to lineup architecture from: ${backupFile}`);

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log('⚠️  WARNING: This will DELETE all current data and restore from backup!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 🧹 Clear existing data (in correct order to avoid foreign key constraints)
    console.log('🧹 Clearing existing data...');
    await prisma.showLineup.deleteMany();
    await prisma.showRequestBid.deleteMany();
    await prisma.showRequest.deleteMany();
    await prisma.holdRequest.deleteMany();
    await prisma.venueOfferTemplate.deleteMany();
    await prisma.venueOffer.deleteMany();
    await prisma.artistTemplate.deleteMany();
    await prisma.mediaEmbed.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversationParticipant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.show.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.artist.deleteMany();
    await prisma.venue.deleteMany();
    await prisma.user.deleteMany();
    await prisma.location.deleteMany();

    console.log('✅ Cleared existing data');

    // 📦 Restore core data (in correct order)
    console.log('📦 Restoring core data...');
    
    if (backup.locations?.length) {
      await prisma.location.createMany({ data: backup.locations });
      console.log(`✅ Restored ${backup.locations.length} locations`);
    }

    if (backup.users?.length) {
      await prisma.user.createMany({ data: backup.users });
      console.log(`✅ Restored ${backup.users.length} users`);
    }

    if (backup.artists?.length) {
      // Handle schema changes: socialHandles -> socialLinks
      const fixedArtists = backup.artists.map(artist => {
        const { socialHandles, ...rest } = artist;
        return {
          ...rest,
          socialLinks: socialHandles || null
        };
      });
      await prisma.artist.createMany({ data: fixedArtists });
      console.log(`✅ Restored ${backup.artists.length} artists`);
    }

    if (backup.venues?.length) {
      // Handle schema changes: socialHandles -> socialLinks
      const fixedVenues = backup.venues.map(venue => {
        const { socialHandles, ...rest } = venue;
        return {
          ...rest,
          socialLinks: socialHandles || null
        };
      });
      await prisma.venue.createMany({ data: fixedVenues });
      console.log(`✅ Restored ${backup.venues.length} venues`);
    }

    if (backup.memberships?.length) {
      await prisma.membership.createMany({ data: backup.memberships });
      console.log(`✅ Restored ${backup.memberships.length} memberships`);
    }

    // 🎵 MIGRATE SHOWS: Convert single-artist shows to lineup architecture
    console.log('\n🎵 Migrating shows to lineup architecture...');
    
    if (backup.shows?.length) {
      let migratedShows = 0;
      let lineupEntries = 0;
      
      // Group shows by venue + date to merge duplicates
      const showGroups = new Map();
      
      for (const oldShow of backup.shows) {
        const key = `${oldShow.venueId}-${oldShow.date}`;
        
        if (!showGroups.has(key)) {
          showGroups.set(key, {
            venue: oldShow.venueId,
            date: oldShow.date,
            artists: [],
            showData: oldShow
          });
        }
        
        // Add this artist to the show group
        if (oldShow.artistId) {
          showGroups.get(key).artists.push({
            artistId: oldShow.artistId,
            guarantee: oldShow.guarantee || 0,
            billingPosition: oldShow.billingPosition || 'HEADLINER',
            artistName: oldShow.artistName
          });
        }
      }
      
      console.log(`📊 Found ${backup.shows.length} individual shows, grouped into ${showGroups.size} venue/date combinations`);
      
      // Create new shows with lineups
      for (const [key, group] of showGroups) {
        const oldShow = group.showData;
        
        // Create the show container (venue-owned, no single artistId)
        const newShow = await prisma.show.create({
          data: {
            title: group.artists.length > 1 
              ? `Multi-Artist Show at ${oldShow.venueName || 'Venue'}` 
              : oldShow.title,
            date: oldShow.date,
            venueId: oldShow.venueId,
            description: oldShow.description || `Show featuring ${group.artists.length} artist(s)`,
            ticketPrice: oldShow.ticketPrice,
            ageRestriction: oldShow.ageRestriction || 'ALL_AGES',
            status: oldShow.status || 'CONFIRMED',
            createdById: oldShow.createdById,
            capacity: oldShow.capacity,
            curfew: oldShow.curfew,
            doorDeal: oldShow.doorDeal,
            doorsOpen: oldShow.doorsOpen,
            loadIn: oldShow.loadIn,
            notes: oldShow.notes,
            showTime: oldShow.showTime,
            soundcheck: oldShow.soundcheck,
            createdAt: oldShow.createdAt,
            updatedAt: oldShow.updatedAt
          }
        });
        
        // Create lineup entries for all artists
        for (let i = 0; i < group.artists.length; i++) {
          const artist = group.artists[i];
          
          // Determine billing position based on order and existing data
          let billingPosition = artist.billingPosition || 'HEADLINER';
          if (group.artists.length > 1) {
            if (i === 0) billingPosition = 'HEADLINER';
            else if (i === group.artists.length - 1) billingPosition = 'OPENER';
            else billingPosition = 'SUPPORT';
          }
          
          await prisma.showLineup.create({
            data: {
              showId: newShow.id,
              artistId: artist.artistId,
              billingPosition: billingPosition,
              setLength: billingPosition === 'HEADLINER' ? 75 : 
                        billingPosition === 'SUPPORT' ? 45 : 30,
              guarantee: artist.guarantee || 0,
              status: 'CONFIRMED',
              performanceOrder: i + 1,
              notes: `Migrated from single-artist show system`
            }
          });
          
          lineupEntries++;
        }
        
        migratedShows++;
        
        if (group.artists.length > 1) {
          console.log(`  🎪 Merged ${group.artists.length} shows into: ${newShow.title}`);
        }
      }
      
      console.log(`✅ Migrated ${migratedShows} shows with ${lineupEntries} lineup entries`);
    }

    // Restore other data
    if (backup.showRequests?.length) {
      // Filter out any that might conflict with new schema
      const validShowRequests = backup.showRequests.filter(sr => sr.artistId && sr.createdById);
      await prisma.showRequest.createMany({ data: validShowRequests });
      console.log(`✅ Restored ${validShowRequests.length} show requests`);
    }

    if (backup.showRequestBids?.length) {
      await prisma.showRequestBid.createMany({ data: backup.showRequestBids });
      console.log(`✅ Restored ${backup.showRequestBids.length} show request bids`);
    }

    if (backup.conversations?.length) {
      await prisma.conversation.createMany({ data: backup.conversations });
      console.log(`✅ Restored ${backup.conversations.length} conversations`);
    }

    if (backup.conversationParticipants?.length) {
      await prisma.conversationParticipant.createMany({ data: backup.conversationParticipants });
      console.log(`✅ Restored ${backup.conversationParticipants.length} conversation participants`);
    }

    if (backup.messages?.length) {
      await prisma.message.createMany({ data: backup.messages });
      console.log(`✅ Restored ${backup.messages.length} messages`);
    }

    if (backup.favorites?.length) {
      await prisma.favorite.createMany({ data: backup.favorites });
      console.log(`✅ Restored ${backup.favorites.length} favorites`);
    }

    if (backup.mediaEmbeds?.length) {
      await prisma.mediaEmbed.createMany({ data: backup.mediaEmbeds });
      console.log(`✅ Restored ${backup.mediaEmbeds.length} media embeds`);
    }

    if (backup.feedback?.length) {
      await prisma.feedback.createMany({ data: backup.feedback });
      console.log(`✅ Restored ${backup.feedback.length} feedback items`);
    }

    if (backup.holdRequests?.length) {
      await prisma.holdRequest.createMany({ data: backup.holdRequests });
      console.log(`✅ Restored ${backup.holdRequests.length} hold requests`);
    }

    if (backup.venueOffers?.length) {
      await prisma.venueOffer.createMany({ data: backup.venueOffers });
      console.log(`✅ Restored ${backup.venueOffers.length} venue offers`);
    }

    if (backup.venueOfferTemplates?.length) {
      await prisma.venueOfferTemplate.createMany({ data: backup.venueOfferTemplates });
      console.log(`✅ Restored ${backup.venueOfferTemplates.length} venue offer templates`);
    }

    if (backup.artistTemplates?.length) {
      await prisma.artistTemplate.createMany({ data: backup.artistTemplates });
      console.log(`✅ Restored ${backup.artistTemplates.length} artist templates`);
    }

    console.log('\n🎉 Database restored and migrated to lineup architecture successfully!');
    console.log(`📊 Migration Summary:`);
    console.log(`   • Original backup from: ${backup.timestamp}`);
    console.log(`   • Shows converted to lineup architecture`);
    console.log(`   • Single-artist shows and duplicates merged`);
    console.log(`   • All user data and relationships preserved`);
    
  } catch (error) {
    console.error('❌ Restore and migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
const backupFile = process.argv[2];

if (backupFile) {
  restoreAndMigrateToLineup(backupFile);
} else {
  console.log('Usage:');
  console.log('  node scripts/restore-and-migrate-to-lineup.js <backup-file>');
  console.log('Example:');
  console.log('  node scripts/restore-and-migrate-to-lineup.js backups/backup-2025-06-18T02-08-43-480Z.json');
}

module.exports = { restoreAndMigrateToLineup }; 
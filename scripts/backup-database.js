const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('🔄 Starting database backup...');

    // Backup all critical data
    const backup = {
      timestamp,
      users: await prisma.user.findMany(),
      artists: await prisma.artist.findMany(),
      venues: await prisma.venue.findMany(),
      locations: await prisma.location.findMany(),
      shows: await prisma.show.findMany(),
      tourRequests: await prisma.tourRequest.findMany(),
      bids: await prisma.bid.findMany(),
      memberships: await prisma.membership.findMany(),
      conversations: await prisma.conversation.findMany(),
      messages: await prisma.message.findMany(),
      favorites: await prisma.favorite.findMany(),
      mediaEmbeds: await prisma.mediaEmbed.findMany(),
      feedback: await prisma.feedback.findMany()
    };

    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log(`✅ Backup completed: ${backupFile}`);
    console.log(`📊 Backup contains:`);
    console.log(`   Users: ${backup.users.length}`);
    console.log(`   Artists: ${backup.artists.length}`);
    console.log(`   Venues: ${backup.venues.length}`);
    console.log(`   Shows: ${backup.shows.length}`);
    console.log(`   Tour Requests: ${backup.tourRequests.length}`);
    console.log(`   Bids: ${backup.bids.length}`);
    console.log(`   Memberships: ${backup.memberships.length}`);

    return backupFile;

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function restoreDatabase(backupFile) {
  try {
    console.log(`🔄 Restoring database from: ${backupFile}`);

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log('⚠️  WARNING: This will DELETE all current data and restore from backup!');
    console.log('Press Ctrl+C to cancel, or wait 10 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Clear existing data (in correct order to avoid foreign key constraints)
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.mediaEmbed.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.tourRequest.deleteMany();
    await prisma.show.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.artist.deleteMany();
    await prisma.venue.deleteMany();
    await prisma.user.deleteMany();
    await prisma.location.deleteMany();

    console.log('🧹 Cleared existing data');

    // Restore data (in correct order)
    if (backup.locations?.length) {
      await prisma.location.createMany({ data: backup.locations });
      console.log(`✅ Restored ${backup.locations.length} locations`);
    }

    if (backup.users?.length) {
      await prisma.user.createMany({ data: backup.users });
      console.log(`✅ Restored ${backup.users.length} users`);
    }

    if (backup.artists?.length) {
      await prisma.artist.createMany({ data: backup.artists });
      console.log(`✅ Restored ${backup.artists.length} artists`);
    }

    if (backup.venues?.length) {
      await prisma.venue.createMany({ data: backup.venues });
      console.log(`✅ Restored ${backup.venues.length} venues`);
    }

    if (backup.memberships?.length) {
      await prisma.membership.createMany({ data: backup.memberships });
      console.log(`✅ Restored ${backup.memberships.length} memberships`);
    }

    if (backup.shows?.length) {
      await prisma.show.createMany({ data: backup.shows });
      console.log(`✅ Restored ${backup.shows.length} shows`);
    }

    if (backup.tourRequests?.length) {
      await prisma.tourRequest.createMany({ data: backup.tourRequests });
      console.log(`✅ Restored ${backup.tourRequests.length} tour requests`);
    }

    if (backup.bids?.length) {
      await prisma.bid.createMany({ data: backup.bids });
      console.log(`✅ Restored ${backup.bids.length} bids`);
    }

    if (backup.conversations?.length) {
      await prisma.conversation.createMany({ data: backup.conversations });
      console.log(`✅ Restored ${backup.conversations.length} conversations`);
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

    console.log(`🎉 Database restored successfully from backup: ${backup.timestamp}`);

  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
const command = process.argv[2];
const backupFile = process.argv[3];

if (command === 'backup') {
  backupDatabase();
} else if (command === 'restore' && backupFile) {
  restoreDatabase(backupFile);
} else {
  console.log('Usage:');
  console.log('  node scripts/backup-database.js backup');
  console.log('  node scripts/backup-database.js restore <backup-file>');
}

module.exports = { backupDatabase, restoreDatabase }; 
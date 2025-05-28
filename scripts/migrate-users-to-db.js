const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const ARTIST_MEMBERSHIPS_FILE = path.join(process.cwd(), 'data', 'artist-memberships.json');
const VENUE_MEMBERSHIPS_FILE = path.join(process.cwd(), 'data', 'venue-memberships.json');

async function migrateUsersToDatabase() {
  try {
    console.log('🔄 Starting migration of file-based users to database...');

    // 1. Load file-based data
    const fileUsers = loadFileUsers();
    const artistMemberships = loadArtistMemberships();
    const venueMemberships = loadVenueMemberships();

    console.log(`📊 Found ${fileUsers.length} file-based users`);
    console.log(`📊 Found ${artistMemberships.length} artist memberships`);
    console.log(`📊 Found ${venueMemberships.length} venue memberships`);

    // 2. Migrate users to database
    let migratedUsers = 0;
    let skippedUsers = 0;

    for (const fileUser of fileUsers) {
      try {
        // Check if user already exists in database
        const existingUser = await prisma.user.findUnique({
          where: { id: fileUser.id }
        });

        if (existingUser) {
          console.log(`⏭️  User ${fileUser.name} already exists in database`);
          skippedUsers++;
          continue;
        }

        // Create user in database
        const newUser = await prisma.user.create({
          data: {
            id: fileUser.id,
            email: fileUser.email,
            username: fileUser.name,
            passwordHash: fileUser.password, // Migrate existing password hash
            role: fileUser.role.toUpperCase(),
            verified: fileUser.isVerified || false,
            createdAt: new Date(fileUser.createdAt)
          }
        });

        console.log(`✅ Migrated user: ${newUser.username} (${newUser.email})`);
        migratedUsers++;

      } catch (error) {
        console.error(`❌ Failed to migrate user ${fileUser.name}:`, error.message);
      }
    }

    // 3. Create membership tables in database (if they don't exist)
    console.log('\n🔗 Setting up membership relationships...');

    // For now, we'll use the submittedBy relationship for ownership
    // and create a proper membership system later if needed

    // 4. Update artist ownership based on memberships
    for (const membership of artistMemberships) {
      if (membership.status === 'active' && membership.role === 'member') {
        try {
          const artist = await prisma.artist.findUnique({
            where: { id: membership.artistId }
          });

          const user = await prisma.user.findUnique({
            where: { id: membership.userId }
          });

          if (artist && user && !artist.submittedById) {
            // Set the first member as the owner
            await prisma.artist.update({
              where: { id: membership.artistId },
              data: { submittedById: user.id }
            });

            console.log(`🎵 Set ${user.username} as owner of ${artist.name}`);
          }
        } catch (error) {
          console.warn(`⚠️  Failed to set artist ownership:`, error.message);
        }
      }
    }

    // 5. Update venue ownership based on memberships
    for (const membership of venueMemberships) {
      if (membership.status === 'active') {
        try {
          const venue = await prisma.venue.findUnique({
            where: { id: membership.venueId }
          });

          const user = await prisma.user.findUnique({
            where: { id: membership.userId }
          });

          if (venue && user && !venue.submittedById) {
            await prisma.venue.update({
              where: { id: membership.venueId },
              data: { submittedById: user.id }
            });

            console.log(`🏢 Set ${user.username} as owner of ${venue.name}`);
          }
        } catch (error) {
          console.warn(`⚠️  Failed to set venue ownership:`, error.message);
        }
      }
    }

    // 6. Summary
    console.log('\n📋 Migration Summary:');
    console.log(`✅ Users migrated: ${migratedUsers}`);
    console.log(`⏭️  Users skipped: ${skippedUsers}`);
    console.log(`🔗 Artist memberships processed: ${artistMemberships.length}`);
    console.log(`🔗 Venue memberships processed: ${venueMemberships.length}`);

    // 7. Verification
    console.log('\n🔍 Verification:');
    const totalDbUsers = await prisma.user.count();
    console.log(`📊 Total users in database: ${totalDbUsers}`);

    const artistsWithOwners = await prisma.artist.count({
      where: { submittedById: { not: null } }
    });
    console.log(`🎵 Artists with owners: ${artistsWithOwners}`);

    const venuesWithOwners = await prisma.venue.count({
      where: { submittedById: { not: null } }
    });
    console.log(`🏢 Venues with owners: ${venuesWithOwners}`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update authentication system to use database only');
    console.log('2. Remove file-based user loading from APIs');
    console.log('3. Create proper membership tables if multi-member support is needed');
    console.log('4. Test login functionality');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions
function loadFileUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function loadArtistMemberships() {
  try {
    if (!fs.existsSync(ARTIST_MEMBERSHIPS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ARTIST_MEMBERSHIPS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function loadVenueMemberships() {
  try {
    if (!fs.existsSync(VENUE_MEMBERSHIPS_FILE)) return [];
    return JSON.parse(fs.readFileSync(VENUE_MEMBERSHIPS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

// Run migration
migrateUsersToDatabase(); 
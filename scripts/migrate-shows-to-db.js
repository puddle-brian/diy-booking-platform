const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrateShowsToDatabase() {
  try {
    console.log('🎵 Starting shows migration to database...');

    // Check if shows.json exists
    const showsFile = path.join(process.cwd(), 'data', 'shows.json');
    if (!fs.existsSync(showsFile)) {
      console.log('📁 No shows.json file found - nothing to migrate');
      return;
    }

    // Read existing shows from JSON
    const showsData = fs.readFileSync(showsFile, 'utf8');
    const shows = JSON.parse(showsData);

    if (shows.length === 0) {
      console.log('📁 No shows found in JSON file');
      return;
    }

    console.log(`📊 Found ${shows.length} shows to migrate`);

    // Create system user if it doesn't exist
    let systemUser = await prisma.user.findFirst({
      where: { username: 'system' }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          username: 'system',
          email: 'system@diyshows.com',
          verified: true
        }
      });
      console.log('👤 Created system user');
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const show of shows) {
      try {
        // Check if show already exists in database
        const existingShow = await prisma.show.findFirst({
          where: {
            date: new Date(show.date),
            OR: [
              { title: show.title || `${show.artistName} at ${show.venueName}` },
              {
                AND: [
                  { artist: { name: show.artistName } },
                  { venue: { name: show.venueName } }
                ]
              }
            ]
          }
        });

        if (existingShow) {
          console.log(`⏭️  Skipping existing show: ${show.artistName} at ${show.venueName} on ${show.date}`);
          skippedCount++;
          continue;
        }

        // Find or create location
        const location = await prisma.location.findFirst({
          where: {
            city: show.city || 'Unknown',
            stateProvince: show.state || 'Unknown'
          }
        });

        let locationId = location?.id;
        if (!locationId) {
          const newLocation = await prisma.location.create({
            data: {
              city: show.city || 'Unknown',
              stateProvince: show.state || 'Unknown',
              country: show.country || 'USA'
            }
          });
          locationId = newLocation.id;
        }

        // Find or create artist
        let artist = await prisma.artist.findFirst({
          where: { name: show.artistName }
        });

        if (!artist) {
          artist = await prisma.artist.create({
            data: {
              name: show.artistName,
              locationId: locationId,
              genres: show.genres || [],
              verified: false
            }
          });
        }

        // Find or create venue
        let venue = await prisma.venue.findFirst({
          where: { name: show.venueName }
        });

        if (!venue) {
          venue = await prisma.venue.create({
            data: {
              name: show.venueName,
              locationId: locationId,
              venueType: 'OTHER',
              capacity: show.capacity || null,
              verified: false
            }
          });
        }

        // Convert status to enum format
        let status = 'CONFIRMED';
        if (show.status) {
          status = show.status.toUpperCase();
          if (!['CONFIRMED', 'PENDING', 'CANCELLED'].includes(status)) {
            status = 'CONFIRMED';
          }
        }

        // Convert age restriction to enum format
        let ageRestriction = 'ALL_AGES';
        if (show.ageRestriction) {
          const ageMap = {
            'all-ages': 'ALL_AGES',
            'all_ages': 'ALL_AGES',
            '18+': 'EIGHTEEN_PLUS',
            'eighteen-plus': 'EIGHTEEN_PLUS',
            'eighteen_plus': 'EIGHTEEN_PLUS',
            '21+': 'TWENTY_ONE_PLUS',
            'twenty-one-plus': 'TWENTY_ONE_PLUS',
            'twenty_one_plus': 'TWENTY_ONE_PLUS'
          };
          ageRestriction = ageMap[show.ageRestriction.toLowerCase()] || 'ALL_AGES';
        }

        // Create show in database
        const newShow = await prisma.show.create({
          data: {
            title: show.title || `${show.artistName} at ${show.venueName}`,
            date: new Date(show.date),
            artistId: artist.id,
            venueId: venue.id,
            description: show.notes || show.description,
            ticketPrice: show.ticketPrice ? parseFloat(show.ticketPrice) : null,
            ageRestriction: ageRestriction,
            status: status,
            createdById: systemUser.id,
            createdAt: show.createdAt ? new Date(show.createdAt) : new Date(),
            updatedAt: show.updatedAt ? new Date(show.updatedAt) : new Date()
          }
        });

        console.log(`✅ Migrated: ${show.artistName} at ${show.venueName} on ${show.date} (ID: ${newShow.id})`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrating show ${show.artistName} at ${show.venueName}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Successfully migrated: ${migratedCount} shows`);
    console.log(`⏭️  Skipped: ${skippedCount} shows`);

    // Backup the original file
    const backupFile = path.join(process.cwd(), 'data', `shows-backup-${Date.now()}.json`);
    fs.copyFileSync(showsFile, backupFile);
    console.log(`💾 Original file backed up to: ${backupFile}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateShowsToDatabase(); 
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('📊 Checking database contents...\n');

    // Check artists
    const artists = await prisma.artist.findMany({
      include: {
        location: true
      }
    });
    console.log(`🎵 Artists (${artists.length}):`);
    artists.forEach(artist => {
      console.log(`  - ${artist.name} (ID: ${artist.id}) - ${artist.location.city}, ${artist.location.stateProvince}`);
    });

    // Check venues
    const venues = await prisma.venue.findMany({
      include: {
        location: true
      }
    });
    console.log(`\n🏢 Venues (${venues.length}):`);
    venues.slice(0, 5).forEach(venue => {
      console.log(`  - ${venue.name} (ID: ${venue.id}) - ${venue.location.city}, ${venue.location.stateProvince}`);
    });
    if (venues.length > 5) {
      console.log(`  ... and ${venues.length - 5} more venues`);
    }

    // Check users
    const users = await prisma.user.findMany({
      include: {
        submittedArtists: true,
        submittedVenues: true
      }
    });
    console.log(`\n👥 Users (${users.length}):`);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - Role: ${user.role}`);
      if (user.submittedArtists.length > 0) {
        user.submittedArtists.forEach(artist => {
          console.log(`    → Owns Artist: ${artist.name}`);
        });
      }
      if (user.submittedVenues.length > 0) {
        user.submittedVenues.forEach(venue => {
          console.log(`    → Owns Venue: ${venue.name}`);
        });
      }
    });

    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 
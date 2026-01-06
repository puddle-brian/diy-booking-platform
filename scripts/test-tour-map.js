/**
 * Test Tour Map Data
 * 
 * Quick script to check if you have the data needed for the tour map.
 * Run with: node scripts/test-tour-map.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🗺️  Tour Map Data Check');
  console.log('========================\n');

  // 1. Check locations with coordinates
  const locationsWithCoords = await prisma.location.count({
    where: {
      latitude: { not: null },
      longitude: { not: null }
    }
  });
  
  const totalLocations = await prisma.location.count();
  
  console.log(`📍 Locations:`);
  console.log(`   Total: ${totalLocations}`);
  console.log(`   With coordinates: ${locationsWithCoords}`);
  console.log(`   Missing coordinates: ${totalLocations - locationsWithCoords}\n`);

  // 2. Check date entries
  const dateEntries = await prisma.dateEntry.findMany({
    take: 10,
    include: {
      artist: { select: { id: true, name: true } },
      venue: {
        select: {
          name: true,
          location: {
            select: { city: true, stateProvince: true, latitude: true, longitude: true }
          }
        }
      }
    },
    orderBy: { date: 'asc' }
  });

  console.log(`📅 Date Entries: ${dateEntries.length} found\n`);

  if (dateEntries.length > 0) {
    console.log('Sample dates:');
    for (const entry of dateEntries.slice(0, 5)) {
      const hasCoords = entry.venue?.location?.latitude != null;
      const coordsStatus = hasCoords ? '✅' : '❌';
      console.log(`   ${coordsStatus} ${entry.artist.name} @ ${entry.venue?.name || 'Unknown'}`);
      console.log(`      Date: ${entry.date.toISOString().split('T')[0]}`);
      console.log(`      Location: ${entry.venue?.location?.city}, ${entry.venue?.location?.stateProvince}`);
      if (hasCoords) {
        console.log(`      Coords: ${entry.venue.location.latitude}, ${entry.venue.location.longitude}`);
      }
      console.log(`      Artist ID: ${entry.artistId}`);
      console.log('');
    }

    // 3. Find an artist with mappable dates
    const artistsWithDates = await prisma.dateEntry.groupBy({
      by: ['artistId'],
      _count: true,
      orderBy: { _count: { artistId: 'desc' } },
      take: 5
    });

    if (artistsWithDates.length > 0) {
      console.log('🎸 Artists with most date entries:');
      for (const item of artistsWithDates) {
        const artist = await prisma.artist.findUnique({
          where: { id: item.artistId },
          select: { name: true }
        });
        console.log(`   - ${artist?.name || 'Unknown'}: ${item._count} dates (ID: ${item.artistId})`);
      }
      
      console.log('\n💡 To test the map, visit:');
      console.log(`   http://localhost:3000/artists/${artistsWithDates[0].artistId}`);
    }
  } else {
    console.log('⚠️  No date entries found. Create some bookings first!\n');
    
    // Show artists that exist
    const artists = await prisma.artist.findMany({
      take: 5,
      select: { id: true, name: true }
    });
    
    if (artists.length > 0) {
      console.log('Available artists:');
      artists.forEach(a => console.log(`   - ${a.name} (ID: ${a.id})`));
      console.log('\nTo test with no dates, visit any artist profile.');
    }
  }

  // 4. API endpoint test URL
  if (dateEntries.length > 0) {
    const testArtistId = dateEntries[0].artistId;
    console.log(`\n🔗 Test API directly:`);
    console.log(`   http://localhost:3000/api/artists/${testArtistId}/tour-map`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});


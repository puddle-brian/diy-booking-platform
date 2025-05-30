const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkShowSchedules() {
  try {
    console.log('🔍 Checking show schedules...\n');

    // Get Lightning Bolt shows specifically
    const lightningBoltShows = await prisma.show.findMany({
      where: {
        artist: {
          id: '1748101913848' // Lightning Bolt ID
        }
      },
      include: {
        artist: true,
        venue: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    console.log(`⚡ Lightning Bolt shows: ${lightningBoltShows.length}`);
    
    lightningBoltShows.forEach((show, index) => {
      console.log(`\n${index + 1}. ${show.title}`);
      console.log(`   Date: ${new Date(show.date).toLocaleDateString()}`);
      console.log(`   Venue: ${show.venue.name}`);
      console.log(`   Schedule Details:`);
      console.log(`     Load In: ${show.loadIn || 'Not set'}`);
      console.log(`     Soundcheck: ${show.soundcheck || 'Not set'}`);
      console.log(`     Doors Open: ${show.doorsOpen || 'Not set'}`);
      console.log(`     Show Time: ${show.showTime || 'Not set'}`);
      console.log(`     Curfew: ${show.curfew || 'Not set'}`);
      console.log(`   Other Details:`);
      console.log(`     Capacity: ${show.capacity || 'Not set'}`);
      console.log(`     Guarantee: ${show.guarantee ? `$${show.guarantee}` : 'Not set'}`);
      console.log(`     Notes: ${show.notes || 'None'}`);
    });

    // Check a few other shows too
    const otherShows = await prisma.show.findMany({
      where: {
        artist: {
          id: {
            not: '1748101913848'
          }
        }
      },
      include: {
        artist: true,
        venue: true
      },
      take: 3,
      orderBy: {
        date: 'asc'
      }
    });

    console.log(`\n🎵 Sample of other shows: ${otherShows.length}`);
    
    otherShows.forEach((show, index) => {
      console.log(`\n${index + 1}. ${show.artist.name} at ${show.venue.name}`);
      console.log(`   Date: ${new Date(show.date).toLocaleDateString()}`);
      console.log(`   Schedule: ${show.loadIn || 'N/A'} → ${show.soundcheck || 'N/A'} → ${show.doorsOpen || 'N/A'} → ${show.showTime || 'N/A'} → ${show.curfew || 'N/A'}`);
    });

    console.log('\n✅ Schedule check complete!');

  } catch (error) {
    console.error('❌ Error checking schedules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShowSchedules(); 
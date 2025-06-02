const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // Check a few ShowRequests for the Lightning Bolt artist
    const showRequests = await prisma.showRequest.findMany({
      where: { artistId: '1748101913848' },
      take: 3,
      include: {
        bids: {
          include: {
            venue: true
          }
        },
        artist: true,
        venue: true
      }
    });
    
    console.log('Sample ShowRequests:');
    showRequests.forEach((req, i) => {
      console.log(`\n--- ShowRequest ${i + 1} ---`);
      console.log(`ID: ${req.id}`);
      console.log(`Title: ${req.title}`);
      console.log(`InitiatedBy: ${req.initiatedBy}`);
      console.log(`VenueId: ${req.venueId}`);
      console.log(`Artist: ${req.artist?.name}`);
      console.log(`Venue: ${req.venue?.name || 'null'}`);
      console.log(`Bids count: ${req.bids?.length || 0}`);
      
      if (req.bids?.length > 0) {
        req.bids.forEach((bid, j) => {
          console.log(`  Bid ${j + 1}: ${bid.venue?.name || 'NO VENUE'} (venueId: ${bid.venueId})`);
        });
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 
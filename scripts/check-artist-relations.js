const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRelatedRecords() {
  try {
    const artistId = 'cmbaplfh7001i010w1trw5pzs';
    console.log('🔍 Checking related records for artist:', artistId);
    
    // Check shows
    const shows = await prisma.show.findMany({
      where: { artistId }
    });
    console.log('Shows:', shows.length);
    if (shows.length > 0) {
      shows.forEach(show => {
        console.log(`  - Show: ${show.title} (${show.date})`);
      });
    }
    
    // Check tour requests
    const tourRequests = await prisma.tourRequest.findMany({
      where: { artistId }
    });
    console.log('Tour requests:', tourRequests.length);
    if (tourRequests.length > 0) {
      tourRequests.forEach(tr => {
        console.log(`  - Tour request: ${tr.title}`);
      });
    }
    
    // Check bids (indirectly through tour requests)
    const bids = await prisma.bid.findMany({
      where: {
        tourRequest: {
          artistId
        }
      }
    });
    console.log('Bids:', bids.length);
    
    // Check memberships
    const memberships = await prisma.membership.findMany({
      where: {
        entityType: 'ARTIST',
        entityId: artistId
      }
    });
    console.log('Memberships:', memberships.length);
    if (memberships.length > 0) {
      memberships.forEach(m => {
        console.log(`  - Membership: User ${m.userId} (${m.role})`);
      });
    }
    
    // Check favorites
    const favorites = await prisma.favorite.findMany({
      where: {
        entityType: 'ARTIST',
        entityId: artistId
      }
    });
    console.log('Favorites:', favorites.length);
    
    // Get artist details
    const artist = await prisma.artist.findUnique({
      where: { id: artistId }
    });
    console.log('Artist name:', artist?.name);
    console.log('Artist location:', artist?.locationId);
    console.log('Submitted by:', artist?.submittedById);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelatedRecords(); 
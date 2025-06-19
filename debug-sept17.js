const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSept17() {
  try {
    console.log('🔍 Debugging SEPT 17 data inconsistency...\n');
    
    // Check shows for Sept 17, 2024
    const shows = await prisma.show.findMany({
      where: {
        date: {
          gte: new Date('2024-09-17T00:00:00Z'),
          lt: new Date('2024-09-18T00:00:00Z')
        }
      },
      include: {
        venue: { select: { name: true } },
        lineup: {
          include: {
            artist: { select: { name: true } }
          }
        }
      }
    });
    
    console.log('📅 Shows on Sept 17, 2024:', shows.length);
    shows.forEach(show => {
      console.log('Show ID:', show.id);
      console.log('Title:', show.title);
      console.log('Venue:', show.venue?.name);
      console.log('Status:', show.status);
      console.log('Lineup:');
      show.lineup.forEach(item => {
        console.log('  -', item.artist?.name, '(Status:', item.status + ')');
      });
      console.log('---');
    });
    
    // Check show requests for Sept 17
    console.log('\n🎯 Show Requests for Sept 17, 2024:');
    const showRequests = await prisma.showRequest.findMany({
      where: {
        requestedDate: {
          gte: new Date('2024-09-17T00:00:00Z'),
          lt: new Date('2024-09-18T00:00:00Z')
        }
      },
      include: {
        artist: { select: { name: true } },
        venue: { select: { name: true } },
        bids: {
          include: {
            venue: { select: { name: true } }
          }
        }
      }
    });
    
    console.log('Show Requests:', showRequests.length);
    showRequests.forEach(req => {
      console.log('Request ID:', req.id);
      console.log('Title:', req.title);
      console.log('Artist:', req.artist?.name);
      console.log('Venue:', req.venue?.name || 'NONE (Artist-initiated)');
      console.log('Status:', req.status);
      console.log('Bids:', req.bids.length);
      req.bids.forEach(bid => {
        console.log('  -', bid.venue?.name, '($' + bid.amount + ')', bid.status);
      });
      console.log('---');
    });
    
    // Check specifically for Lightning Bolt data
    console.log('\n⚡ Lightning Bolt specific check:');
    const lightningBoltShows = await prisma.show.findMany({
      where: {
        lineup: {
          some: {
            artistId: '1748101913848'
          }
        }
      },
      include: {
        venue: { select: { name: true } },
        lineup: {
          where: { artistId: '1748101913848' },
          include: { artist: { select: { name: true } } }
        }
      },
      orderBy: { date: 'asc' }
    });
    
    console.log('Lightning Bolt shows:', lightningBoltShows.length);
    lightningBoltShows.forEach(show => {
      console.log(`- ${show.date.toDateString()}: ${show.venue?.name} (Status: ${show.lineup[0]?.status})`);
    });
    
    const lightningBoltRequests = await prisma.showRequest.findMany({
      where: {
        artistId: '1748101913848'
      },
      include: {
        venue: { select: { name: true } },
        bids: {
          include: { venue: { select: { name: true } } }
        }
      },
      orderBy: { requestedDate: 'asc' }
    });
    
    console.log('Lightning Bolt requests:', lightningBoltRequests.length);
    lightningBoltRequests.forEach(req => {
      console.log(`- ${req.requestedDate.toDateString()}: ${req.bids.length} bids (Status: ${req.status})`);
      req.bids.forEach(bid => {
        console.log(`  - ${bid.venue?.name}: $${bid.amount} (${bid.status})`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSept17(); 
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentHolds() {
  console.log('🔍 Checking current held bids...');
  
  const heldBids = await prisma.bid.findMany({
    where: { holdState: 'HELD' },
    include: {
      venue: { select: { name: true, id: true } },
      tourRequest: {
        include: {
          artist: { select: { name: true, id: true } },
        }
      }
    },
    orderBy: [
      { tourRequest: { artist: { name: 'asc' } } },
      { proposedDate: 'asc' }
    ]
  });

  console.log(`Found ${heldBids.length} HELD bids:`);
  
  heldBids.forEach(bid => {
    console.log(`
📍 HELD BID:
  - Artist: ${bid.tourRequest.artist.name} (ID: ${bid.tourRequest.artist.id})
  - Venue: ${bid.venue.name}
  - Date: ${bid.proposedDate}
  - Bid ID: ${bid.id}
  - Tour Request ID: ${bid.tourRequest.id}
    `);
  });

  // Also check frozen bids for same dates
  console.log('\n❄️ Checking frozen bids...');
  const frozenBids = await prisma.bid.findMany({
    where: { holdState: 'FROZEN' },
    include: {
      venue: { select: { name: true } },
      tourRequest: {
        include: {
          artist: { select: { name: true, id: true } }
        }
      }
    },
    orderBy: [
      { tourRequest: { artist: { name: 'asc' } } },
      { proposedDate: 'asc' }
    ]
  });

  console.log(`Found ${frozenBids.length} FROZEN bids:`);
  
  const frozenByArtistDate = {};
  frozenBids.forEach(bid => {
    const key = `${bid.tourRequest.artist.name}-${bid.proposedDate}`;
    if (!frozenByArtistDate[key]) {
      frozenByArtistDate[key] = [];
    }
    frozenByArtistDate[key].push(bid.venue.name);
  });

  Object.entries(frozenByArtistDate).forEach(([key, venues]) => {
    console.log(`  ${key}: ${venues.join(', ')}`);
  });

  // Check what Lightning Bolt specifically has
  console.log('\n⚡ Lightning Bolt specific check...');
  const lightningBoltBids = await prisma.bid.findMany({
    where: {
      tourRequest: {
        artist: { id: '1748101913848' }
      }
    },
    include: {
      venue: { select: { name: true } },
      tourRequest: {
        include: {
          artist: { select: { name: true, id: true } }
        }
      }
    },
    orderBy: { proposedDate: 'asc' }
  });

  console.log(`Found ${lightningBoltBids.length} total bids for Lightning Bolt:`);
  lightningBoltBids.forEach(bid => {
    console.log(`  - ${bid.venue.name}: ${bid.proposedDate} (${bid.holdState}) - Status: ${bid.status}`);
  });

  await prisma.$disconnect();
}

checkCurrentHolds().catch(console.error); 
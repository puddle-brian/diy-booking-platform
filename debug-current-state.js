const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCurrentState() {
  console.log('🔍 Checking current held bids...');
  
  try {
    // Check for held bids using ShowRequestBid
    const heldBids = await prisma.showRequestBid.findMany({
      where: { holdState: 'HELD' },
      include: {
        venue: { select: { name: true } },
        showRequest: { 
          include: { 
            artist: { select: { name: true } } 
          } 
        }
      }
    });

    console.log(`Found ${heldBids.length} HELD bids:`);
    heldBids.forEach(bid => {
      console.log(`  - ${bid.venue.name}: ${bid.showRequest.artist.name} (${bid.holdState}) - Hold ID: ${bid.frozenByHoldId}`);
    });

    console.log('\n❄️ Checking frozen bids...');
    const frozenBids = await prisma.showRequestBid.findMany({
      where: { holdState: 'FROZEN' },
      include: {
        venue: { select: { name: true } },
        showRequest: { 
          include: { 
            artist: { select: { name: true } } 
          } 
        }
      }
    });

    console.log(`Found ${frozenBids.length} FROZEN bids:`);
    frozenBids.forEach(bid => {
      console.log(`  - ${bid.venue.name}: ${bid.showRequest.artist.name} (${bid.holdState}) - Hold ID: ${bid.frozenByHoldId}`);
    });

    console.log('\n⚡ Lightning Bolt specific check...');
    const lightningBoltBids = await prisma.showRequestBid.findMany({
      where: {
        showRequest: {
          artist: { id: '1748101913848' }
        }
      },
      include: {
        venue: { select: { name: true } },
        showRequest: { 
          include: { 
            artist: { select: { name: true } } 
          } 
        }
      },
      orderBy: { proposedDate: 'asc' }
    });

    console.log(`Found ${lightningBoltBids.length} total bids for Lightning Bolt:`);
    lightningBoltBids.forEach(bid => {
      const status = bid.holdState === 'AVAILABLE' ? bid.status.toUpperCase() : bid.holdState;
      console.log(`  - ${bid.venue.name}: ${bid.proposedDate} (${status}) - Status: ${bid.status}`);
    });

    // Check active hold requests
    console.log('\n🔒 Checking active hold requests...');
    const activeHolds = await prisma.holdRequest.findMany({
      where: { status: 'ACTIVE' },
      include: {
        showRequest: {
          include: {
            artist: { select: { name: true } }
          }
        }
      }
    });

    console.log(`Found ${activeHolds.length} ACTIVE hold requests:`);
    activeHolds.forEach(hold => {
      console.log(`  - Hold ${hold.id.slice(-8)}: ${hold.showRequest?.artist?.name || 'Unknown'}`);
      console.log(`    Reason: ${hold.reason}`);
      console.log(`    Expires: ${hold.expiresAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCurrentState(); 
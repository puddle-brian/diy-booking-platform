const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTimelineCreation() {
  console.log('🧪 Testing timeline creation with held bids...');
  
  // Get Lightning Bolt's held and frozen bids from ShowRequestBids
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
          artist: { select: { name: true, id: true } }
        }
      }
    },
    orderBy: { proposedDate: 'asc' }
  });

  console.log(`Found ${lightningBoltBids.length} total bids for Lightning Bolt`);
  
  // Convert to the format expected by timeline creation
  const venueBids = lightningBoltBids.map(bid => ({
    id: bid.id,
    showRequestId: bid.showRequestId,
    venueId: bid.venueId,
    venueName: bid.venue.name,
    proposedDate: bid.proposedDate.toISOString(),
    guarantee: bid.amount,
    capacity: 0,
    ageRestriction: 'all-ages',
    equipmentProvided: {
      pa: false,
      mics: false,
      drums: false,
      amps: false,
      piano: false
    },
    loadIn: '',
    soundcheck: '',
    doorsOpen: '',
    showTime: '',
    curfew: '',
    promotion: {
      social: false,
      flyerPrinting: false,
      radioSpots: false,
      pressCoverage: false
    },
    message: bid.message || '',
    status: bid.status.toLowerCase(),
    readByArtist: true,
    createdAt: bid.createdAt.toISOString(),
    updatedAt: bid.updatedAt.toISOString(),
    expiresAt: '',
    location: bid.venue.name,
    artistId: bid.showRequest.artist.id,
    artistName: bid.showRequest.artist.name,
    holdState: bid.holdState,
    frozenByHoldId: bid.frozenByHoldId,
    frozenAt: bid.frozenAt?.toISOString(),
    unfrozenAt: bid.unfrozenAt?.toISOString(),
    isFrozen: bid.holdState === 'FROZEN',
    venue: bid.venue
  }));

  console.log('\n📊 Processed venue bids:');
  venueBids.forEach(bid => {
    console.log(`  - ${bid.venueName}: ${bid.proposedDate.split('T')[0]} (${bid.holdState}) - Status: ${bid.status}`);
  });

  // Filter held bids like the timeline logic does
  const heldBids = venueBids.filter(bid => 
    bid.holdState === 'HELD' && 
    !['cancelled', 'declined', 'rejected', 'expired'].includes(bid.status.toLowerCase())
  );

  console.log(`\n🎯 Found ${heldBids.length} held bids that should create parent rows:`);
  heldBids.forEach(bid => {
    const bidDate = bid.proposedDate.split('T')[0];
    console.log(`  - Creating parent row: "${bid.venueName}" on ${bidDate}`);
    
    // Count frozen bids for the same show request
    const frozenBidsForSameRequest = venueBids.filter(b => 
      b.showRequestId === bid.showRequestId && 
      b.holdState === 'FROZEN'
    );
    
    console.log(`    → Should show as: "${bid.venueName} +${frozenBidsForSameRequest.length}"`);
    console.log(`    → Frozen venues: ${frozenBidsForSameRequest.map(b => b.venueName).join(', ')}`);
  });

  await prisma.$disconnect();
}

testTimelineCreation().catch(console.error); 
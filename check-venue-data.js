const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Checking what Lost Bag should see...\n');
    
    // Lost Bag venue ID from logs
    const venueId = '1748094967307';
    
    // Check all show requests
    const allRequests = await prisma.showRequest.findMany({
      include: {
        artist: { select: { name: true } },
        venue: { select: { name: true } },
        bids: {
          where: { venueId: venueId },
          select: { id: true, amount: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log('📋 All Recent Show Requests:');
    allRequests.forEach((r, i) => {
      const location = r.venue?.name || r.targetLocations[0];
      const type = r.initiatedBy === 'VENUE' ? 'VENUE OFFER' : 'ARTIST REQUEST';
      const bidsForVenue = r.bids.length;
      console.log(`${i+1}. ${r.artist.name} ${r.initiatedBy === 'VENUE' ? 'at' : 'looking for venue in'} ${location} (${type}) - ${bidsForVenue} bid(s) from Lost Bag`);
    });

    // Check specifically for venue-specific requests
    const venueRequests = await prisma.showRequest.findMany({
      where: { venueId: venueId },
      include: {
        artist: { select: { name: true } }
      }
    });

    console.log(`\n🏢 Requests specifically for Lost Bag: ${venueRequests.length}`);
    venueRequests.forEach(r => {
      console.log(`- ${r.artist.name} at Lost Bag (${r.initiatedBy})`);
    });

    // Check bids FROM Lost Bag
    const bidsFromVenue = await prisma.showRequestBid.findMany({
      where: { venueId: venueId },
      include: {
        showRequest: {
          include: {
            artist: { select: { name: true } }
          }
        }
      }
    });

    console.log(`\n💰 Bids FROM Lost Bag: ${bidsFromVenue.length}`);
    bidsFromVenue.forEach(bid => {
      console.log(`- $${bid.amount} bid on ${bid.showRequest.artist.name} request (${bid.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})(); 
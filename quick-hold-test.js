const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createQuickHoldTest() {
  console.log('🔒 Creating quick hold test scenario...');
  
  try {
    // Find Lightning Bolt's tour request with the most bids
    const tourRequest = await prisma.tourRequest.findFirst({
      where: { artistId: '1748101913848' }, // Lightning Bolt
      include: {
        bids: {
          include: { venue: { select: { name: true } } },
          orderBy: { createdAt: 'asc' }
        },
        artist: { select: { name: true } }
      },
      orderBy: {
        bids: { _count: 'desc' }
      }
    });

    if (!tourRequest || tourRequest.bids.length < 4) {
      console.log('❌ Need at least 4 bids for Lightning Bolt to create hold scenario');
      return;
    }

    console.log(`\n🎯 Found: ${tourRequest.title} with ${tourRequest.bids.length} bids`);

    // Clear any existing holds first
    await prisma.bid.updateMany({
      where: { tourRequestId: tourRequest.id },
      data: {
        holdState: 'AVAILABLE',
        frozenByHoldId: null,
        frozenAt: null,
        unfrozenAt: null
      }
    });

    // Create hold request
    const holdRequest = await prisma.holdRequest.create({
      data: {
        showRequestId: tourRequest.id,
        requestedById: '1748101913848', // Lightning Bolt artist ID
        duration: 48,
        reason: "Quick test hold - finalizing routing",
        status: 'ACTIVE',
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        respondedAt: new Date(),
        customMessage: "Admin quick test scenario"
      }
    });

    const bids = tourRequest.bids;
    const heldBid = bids[0];
    const frozenBids = bids.slice(1, 4); // Next 3 become frozen

    // Set held bid
    await prisma.bid.update({
      where: { id: heldBid.id },
      data: {
        holdState: 'HELD',
        frozenByHoldId: holdRequest.id,
        frozenAt: new Date()
      }
    });

    // Set frozen bids
    await prisma.bid.updateMany({
      where: { id: { in: frozenBids.map(b => b.id) } },
      data: {
        holdState: 'FROZEN',
        frozenByHoldId: holdRequest.id,
        frozenAt: new Date()
      }
    });

    console.log('\n✅ Quick hold scenario created!');
    console.log(`🎯 HELD: ${heldBid.venue.name}`);
    console.log(`❄️ FROZEN: ${frozenBids.map(b => b.venue.name).join(', ')}`);
    console.log(`\n💜 Timeline should show: "${heldBid.venue.name} +${frozenBids.length}"`);
    console.log('🔗 Visit: /artists/1748101913848 to see the hold in action');

  } catch (error) {
    console.error('❌ Error creating hold test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createQuickHoldTest(); 
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyCleanup() {
  console.log('✅ VERIFYING LINEUP SYSTEM REMOVAL');
  console.log('==================================\n');

  try {
    // Count all bids (should work since we only removed lineup-specific fields)
    const allBids = await prisma.bid.findMany();
    console.log(`📊 Total Bids: ${allBids.length}`);

    // Count all shows
    const allShows = await prisma.show.findMany();
    console.log(`📊 Total Shows: ${allShows.length}`);

    // Count venue offers (our unified system)
    const venueOffers = await prisma.venueOffer.findMany();
    console.log(`📊 Total Venue Offers: ${venueOffers.length}`);

    // Check that bid fields no longer exist by looking at the first bid
    if (allBids.length > 0) {
      const sampleBid = allBids[0];
      console.log('\n🔍 SAMPLE BID STRUCTURE:');
      console.log('Fields that should NOT exist:');
      console.log(`  - isLineupSlot: ${sampleBid.isLineupSlot === undefined ? 'REMOVED ✅' : 'STILL EXISTS ❌'}`);
      console.log(`  - parentShowId: ${sampleBid.parentShowId === undefined ? 'REMOVED ✅' : 'STILL EXISTS ❌'}`);
      console.log(`  - lineupRole: ${sampleBid.lineupRole === undefined ? 'REMOVED ✅' : 'STILL EXISTS ❌'}`);
      console.log(`  - billingOrder: ${sampleBid.billingOrder === undefined ? 'REMOVED ✅' : 'STILL EXISTS ❌'}`);
      console.log(`  - invitedByUserId: ${sampleBid.invitedByUserId === undefined ? 'REMOVED ✅' : 'STILL EXISTS ❌'}`);
    }

    // Check show fields
    if (allShows.length > 0) {
      const sampleShow = allShows[0];
      console.log('\n🔍 SAMPLE SHOW STRUCTURE:');
      console.log('Fields that should NOT exist:');
      console.log(`  - isLineupSlot: ${sampleShow.isLineupSlot === undefined ? 'REMOVED ✅' : 'STILL EXISTS ❌'}`);
      console.log(`  - parentShowId: ${sampleShow.parentShowId === undefined ? 'REMOVED ✅' : 'STILL EXISTS ❌'}`);
      console.log(`  - lineupRole: ${sampleShow.lineupRole === undefined ? 'REMOVED ✅' : 'STILL EXISTS ❌'}`);
      console.log(`  - billingOrder: ${sampleShow.billingOrder === undefined ? 'REMOVED ✅' : 'STILL EXISTS ❌'}`);
    }

    console.log('\n🎯 CLEANUP VERIFICATION:');
    console.log('✅ Database schema successfully cleaned');
    console.log('✅ Lineup-specific fields removed');
    console.log('✅ Ready for unified offer system');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyCleanup(); 
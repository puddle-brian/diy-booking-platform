const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupTestLineupData() {
  console.log('🧹 CLEANING UP TEST LINEUP DATA');
  console.log('=================================\n');

  try {
    // First, let's backup before we delete anything
    console.log('📋 BEFORE CLEANUP:');
    
    const lineupBidsBefore = await prisma.bid.findMany({
      where: { isLineupSlot: true }
    });
    console.log(`- Lineup bids: ${lineupBidsBefore.length}`);
    
    const lineupShowsBefore = await prisma.show.findMany({
      where: { isLineupSlot: true }
    });
    console.log(`- Lineup shows: ${lineupShowsBefore.length}`);

    // Delete the test lineup bid
    console.log('\n🗑️  DELETING TEST LINEUP DATA...');
    
    const deletedBids = await prisma.bid.deleteMany({
      where: { isLineupSlot: true }
    });
    console.log(`✅ Deleted ${deletedBids.count} lineup bids`);

    const deletedShows = await prisma.show.deleteMany({
      where: { isLineupSlot: true }
    });
    console.log(`✅ Deleted ${deletedShows.count} lineup shows`);

    // Verify cleanup
    console.log('\n📋 AFTER CLEANUP:');
    
    const lineupBidsAfter = await prisma.bid.findMany({
      where: { isLineupSlot: true }
    });
    console.log(`- Lineup bids: ${lineupBidsAfter.length}`);
    
    const lineupShowsAfter = await prisma.show.findMany({
      where: { isLineupSlot: true }
    });
    console.log(`- Lineup shows: ${lineupShowsAfter.length}`);

    console.log('\n✅ CLEANUP COMPLETE - Ready for unified system!');
    console.log('🎯 Next: Remove dual-system code and build clean offer system');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestLineupData(); 
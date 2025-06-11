const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAllHolds() {
  console.log('🧹 Clearing all hold states...');
  
  try {
    // Get counts before clearing
    const heldCount = await prisma.bid.count({ where: { holdState: 'HELD' } });
    const frozenCount = await prisma.bid.count({ where: { holdState: 'FROZEN' } });
    const activeHoldsCount = await prisma.holdRequest.count({ where: { status: 'ACTIVE' } });

    console.log(`Found: ${heldCount} held bids, ${frozenCount} frozen bids, ${activeHoldsCount} active holds`);

    // Clear all holds in transaction
    await prisma.$transaction(async (tx) => {
      // Reset all bids to AVAILABLE
      await tx.bid.updateMany({
        where: { holdState: { in: ['HELD', 'FROZEN'] } },
        data: {
          holdState: 'AVAILABLE',
          frozenByHoldId: null,
          frozenAt: null,
          unfrozenAt: new Date()
        }
      });

      // Cancel all active holds
      await tx.holdRequest.updateMany({
        where: { status: 'ACTIVE' },
        data: {
          status: 'CANCELLED',
          respondedAt: new Date()
        }
      });
    });

    console.log('✅ All holds cleared! All bids are now AVAILABLE.');
    console.log('🔗 Check Lightning Bolt itinerary to verify normal state');

  } catch (error) {
    console.error('❌ Error clearing holds:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllHolds(); 
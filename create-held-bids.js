const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createHeldBids() {
  try {
    console.log('🎯 Creating held bids for Lightning Bolt...');
    
    // Find Lightning Bolt's tour requests with bids
    const tourRequests = await prisma.tourRequest.findMany({
      where: { artistId: '1748101913848' },
      include: {
        bids: {
          include: {
            venue: {
              select: { name: true }
            }
          }
        }
      }
    });
    
    console.log(`\n📋 Found ${tourRequests.length} Lightning Bolt tour requests`);
    
    for (const request of tourRequests) {
      console.log(`\n🎯 ${request.title} (${request.startDate.toDateString()})`);
      console.log(`   ${request.bids.length} bids available`);
      
      if (request.bids.length >= 4) {
        // Set first bid as HELD
        const heldBid = request.bids[0];
        await prisma.bid.update({
          where: { id: heldBid.id },
          data: {
            holdState: 'HELD',
            status: 'PENDING'
          }
        });
        
        console.log(`   ✅ Set HELD: ${heldBid.venue.name}`);
        
        // Set next 3 bids as FROZEN
        for (let i = 1; i < Math.min(4, request.bids.length); i++) {
          const frozenBid = request.bids[i];
          await prisma.bid.update({
            where: { id: frozenBid.id },
            data: {
              holdState: 'FROZEN',
              status: 'PENDING'
            }
          });
          
          console.log(`   ❄️ Set FROZEN: ${frozenBid.venue.name}`);
        }
        
        console.log(`\n🎉 Hold scenario created for ${request.title}!`);
        console.log(`💜 Should see: "${heldBid.venue.name} +3" purple row`);
      } else {
        console.log(`   ⚠️ Not enough bids (${request.bids.length}) to create hold scenario`);
      }
    }
    
    console.log('\n📍 Go to: http://localhost:3000/artists/1748101913848');
    console.log('🔍 Look for purple rows with "+N" notation');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createHeldBids(); 
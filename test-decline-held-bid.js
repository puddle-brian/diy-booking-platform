const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDeclineHeldBid() {
  console.log('🧪 Testing decline-held-bid workflow...');
  
  try {
    // Find a held bid to decline
    const heldBid = await prisma.showRequestBid.findFirst({
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

    if (!heldBid) {
      console.log('❌ No held bids found to test with');
      return;
    }

    console.log(`Found held bid: ${heldBid.venue.name} for ${heldBid.showRequest.artist.name}`);
    console.log(`Hold ID: ${heldBid.frozenByHoldId}`);

    // Check current state before action
    const beforeState = await prisma.showRequestBid.findMany({
      where: { showRequestId: heldBid.showRequestId },
      include: { venue: { select: { name: true } } }
    });

    console.log('\n📊 Before declining held bid:');
    beforeState.forEach(bid => {
      console.log(`  - ${bid.venue.name}: ${bid.holdState} (Status: ${bid.status})`);
    });

    // TEST: Decline the held bid via API endpoint
    console.log('\n🎯 Declining held bid...');
    
    const response = await fetch(`http://localhost:3000/api/show-requests/${heldBid.showRequestId}/bids`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bidId: heldBid.id,
        action: 'decline-held',
        reason: 'Artist chose different venue'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ Failed to decline held bid:', error);
      return;
    }

    const result = await response.json();
    console.log('✅ API Response:', {
      status: result.status,
      holdState: result.holdState,
      declinedAt: result.declinedAt,
      declinedReason: result.declinedReason
    });

    // Check state after action
    const afterState = await prisma.showRequestBid.findMany({
      where: { showRequestId: heldBid.showRequestId },
      include: { venue: { select: { name: true } } }
    });

    console.log('\n📊 After declining held bid:');
    afterState.forEach(bid => {
      console.log(`  - ${bid.venue.name}: ${bid.holdState} (Status: ${bid.status})`);
    });

    // Check hold request status
    const holdRequest = await prisma.holdRequest.findUnique({
      where: { id: heldBid.frozenByHoldId }
    });

    console.log('\n🔒 Hold request status:');
    console.log(`  Status: ${holdRequest?.status}`);
    console.log(`  Responded at: ${holdRequest?.respondedAt}`);

    console.log('\n✅ Decline-held workflow test completed!');
    console.log('🎯 Expected result: Hold released, competitors unfrozen and available again');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeclineHeldBid(); 
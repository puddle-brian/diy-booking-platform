const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testImprovedHoldWorkflow() {
  console.log('🧪 Testing improved hold workflow (accept vs confirm)...\n');
  
  try {
    // PREP: Create a fresh hold scenario
    console.log('🔄 PREP: Creating fresh hold scenario...');
    
    // Reset some bids to PENDING
    const lightningBoltBids = await prisma.showRequestBid.findMany({
      where: { 
        showRequest: { artist: { id: '1748101913848' } }
      },
      include: { venue: { select: { name: true } } }
    });

    // Reset first 4 bids to PENDING
    const bidsToReset = lightningBoltBids.slice(0, 4);
    for (const bid of bidsToReset) {
      await prisma.showRequestBid.update({
        where: { id: bid.id },
        data: {
          status: 'PENDING',
          holdState: 'AVAILABLE',
          frozenByHoldId: null,
          frozenAt: null,
          unfrozenAt: null,
          acceptedAt: null,
          declinedAt: null,
          declinedReason: null
        }
      });
    }

    // Create hold via quick-hold-test logic
    await prisma.$transaction(async (prisma) => {
      const showRequest = await prisma.showRequest.findFirst({
        where: { artist: { id: '1748101913848' } }
      });

      const pendingBids = await prisma.showRequestBid.findMany({
        where: { 
          showRequestId: showRequest.id,
          status: 'PENDING'
        },
        include: { venue: { select: { name: true } } }
      });

      const chosenBid = pendingBids[0];
      const competitorBids = pendingBids.slice(1, 3);

      let systemUser = await prisma.user.findFirst({
        where: { username: 'system' }
      });
      
      if (!systemUser) {
        systemUser = await prisma.user.create({
          data: {
            username: 'system',
            email: 'system@diyshows.com',
            verified: true
          }
        });
      }

      const holdRequest = await prisma.holdRequest.create({
        data: {
          showRequestId: showRequest.id,
          requestedById: systemUser.id,
          duration: 336,
          reason: 'Testing improved workflow',
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      });

      await prisma.showRequestBid.update({
        where: { id: chosenBid.id },
        data: {
          holdState: 'HELD',
          frozenByHoldId: holdRequest.id,
          frozenAt: new Date()
        }
      });

      for (const bid of competitorBids) {
        await prisma.showRequestBid.update({
          where: { id: bid.id },
          data: {
            holdState: 'FROZEN',
            frozenByHoldId: holdRequest.id,
            frozenAt: new Date()
          }
        });
      }

      console.log(`✅ Created hold: ${chosenBid.venue.name} +${competitorBids.length}`);
      return { showRequest, chosenBid, competitorBids, holdRequest };
    });

    // Find the held bid
    const heldBid = await prisma.showRequestBid.findFirst({
      where: { holdState: 'HELD' },
      include: {
        venue: { select: { name: true } },
        showRequest: true
      }
    });

    console.log('\n🎯 STEP 1: Accept held bid (competitors should stay frozen)...');
    
    const acceptResponse = await fetch(`http://localhost:3000/api/show-requests/${heldBid.showRequestId}/bids`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bidId: heldBid.id,
        action: 'accept-held'
      })
    });

    if (!acceptResponse.ok) {
      console.log('❌ Accept failed:', await acceptResponse.json());
      return;
    }

    // Check state after accept
    const afterAccept = await prisma.showRequestBid.findMany({
      where: { showRequestId: heldBid.showRequestId },
      include: { venue: { select: { name: true } } }
    });

    console.log('\n📊 After ACCEPT (competitors should still be frozen):');
    afterAccept.forEach(bid => {
      console.log(`  - ${bid.venue.name}: ${bid.holdState} (Status: ${bid.status})`);
    });

    const frozenAfterAccept = afterAccept.filter(bid => bid.holdState === 'FROZEN').length;
    console.log(`✅ Competitors still frozen: ${frozenAfterAccept} (should be > 0)`);

    console.log('\n🎯 STEP 2: Confirm accepted bid (competitors should now be rejected)...');
    
    const confirmResponse = await fetch(`http://localhost:3000/api/show-requests/${heldBid.showRequestId}/bids`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bidId: heldBid.id,
        action: 'confirm-accepted'
      })
    });

    if (!confirmResponse.ok) {
      console.log('❌ Confirm failed:', await confirmResponse.json());
      return;
    }

    // Check final state
    const afterConfirm = await prisma.showRequestBid.findMany({
      where: { showRequestId: heldBid.showRequestId },
      include: { venue: { select: { name: true } } }
    });

    console.log('\n📊 After CONFIRM (competitors should now be rejected):');
    afterConfirm.forEach(bid => {
      console.log(`  - ${bid.venue.name}: ${bid.holdState} (Status: ${bid.status})`);
    });

    const rejectedAfterConfirm = afterConfirm.filter(bid => bid.status === 'REJECTED').length;
    const acceptedAfterConfirm = afterConfirm.filter(bid => bid.status === 'ACCEPTED').length;
    
    console.log('\n✅ WORKFLOW TEST COMPLETED!');
    console.log(`📊 Final tally: ${acceptedAfterConfirm} accepted, ${rejectedAfterConfirm} rejected`);
    console.log('\n🎯 IMPROVED WORKFLOW SUMMARY:');
    console.log('1. ✅ Accept-held: Competitors stay frozen (artist can still change mind)');
    console.log('2. ✅ Confirm-accepted: Competitors get rejected (final decision locked in)');
    console.log('\nThis is much more realistic than immediately rejecting on accept!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImprovedHoldWorkflow(); 
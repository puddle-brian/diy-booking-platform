const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModels() {
  console.log('=== CHECKING ACTUAL DATA ===\n');
  
  try {
    // Check TourRequest vs ShowRequest
    try {
      const tourRequests = await prisma.tourRequest.count();
      console.log('✅ TourRequest records:', tourRequests);
      
      if (tourRequests > 0) {
        const sample = await prisma.tourRequest.findFirst({
          select: { id: true, title: true, createdAt: true }
        });
        console.log('   Sample:', sample);
      }
    } catch(e) {
      console.log('❌ TourRequest table issue:', e.message);
    }

    try {
      const showRequests = await prisma.showRequest.count();
      console.log('✅ ShowRequest records:', showRequests);
      
      if (showRequests > 0) {
        const sample = await prisma.showRequest.findFirst({
          select: { id: true, title: true, createdAt: true }
        });
        console.log('   Sample:', sample);
      }
    } catch(e) {
      console.log('❌ ShowRequest table issue:', e.message);
    }

    console.log('');

    // Check Bid vs ShowRequestBid
    try {
      const bids = await prisma.bid.count();
      console.log('✅ Bid records:', bids);
      
      if (bids > 0) {
        const sample = await prisma.bid.findFirst({
          select: { id: true, tourRequestId: true, status: true }
        });
        console.log('   Sample:', sample);
      }
    } catch(e) {
      console.log('❌ Bid table issue:', e.message);
    }

    try {
      const showRequestBids = await prisma.showRequestBid.count();
      console.log('✅ ShowRequestBid records:', showRequestBids);
      
      if (showRequestBids > 0) {
        const sample = await prisma.showRequestBid.findFirst({
          select: { id: true, showRequestId: true, status: true }
        });
        console.log('   Sample:', sample);
      }
    } catch(e) {
      console.log('❌ ShowRequestBid table issue:', e.message);
    }

    console.log('');

    // Check hold requests
    try {
      const holdRequests = await prisma.holdRequest.count();
      console.log('✅ HoldRequest records:', holdRequests);
      
      if (holdRequests > 0) {
        const sample = await prisma.holdRequest.findFirst({
          select: { id: true, showRequestId: true, status: true }
        });
        console.log('   Sample:', sample);
        console.log('   → This uses ShowRequest, not TourRequest!');
      }
    } catch(e) {
      console.log('❌ HoldRequest table issue:', e.message);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkModels(); 
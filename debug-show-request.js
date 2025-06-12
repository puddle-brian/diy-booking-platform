const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugShowRequest() {
  console.log('🔍 Debugging Show Request with Hold...\n');
  
  try {
    const showRequestId = 'cmbtdptv000gl3u0vufng931k';
    
    // 1. Check the show request details
    const showRequest = await prisma.showRequest.findUnique({
      where: { id: showRequestId },
      include: {
        venue: true,
        artist: true,
        bids: {
          include: {
            venue: true
          }
        }
      }
    });
    
    console.log('📊 Show Request Details:');
    console.log(`ID: ${showRequest?.id}`);
    console.log(`Title: ${showRequest?.title}`);
    console.log(`Artist: ${showRequest?.artist?.name} (ID: ${showRequest?.artistId})`);
    console.log(`Venue: ${showRequest?.venue?.name || 'NONE'} (ID: ${showRequest?.venueId || 'NONE'})`);
    console.log(`Initiated by: ${showRequest?.initiatedBy}`);
    console.log(`Created by: ${showRequest?.createdById}`);
    console.log(`Date: ${showRequest?.requestedDate}`);
    console.log(`Status: ${showRequest?.status}`);
    
    console.log('\n🎯 Bids on this request:');
    if (showRequest?.bids && showRequest.bids.length > 0) {
      showRequest.bids.forEach((bid, index) => {
        console.log(`${index + 1}. ${bid.venue?.name} (ID: ${bid.venueId})`);
        console.log(`   Status: ${bid.status}`);
        console.log(`   Hold State: ${bid.holdState}`);
      });
      
      // Check specifically for Lost Bag bid
      const lostBagBid = showRequest.bids.find(bid => bid.venueId === '1748094967307');
      if (lostBagBid) {
        console.log('\n✅ Found Lost Bag bid:');
        console.log(`   Bid ID: ${lostBagBid.id}`);
        console.log(`   Status: ${lostBagBid.status}`);
        console.log(`   Hold State: ${lostBagBid.holdState}`);
      } else {
        console.log('\n❌ No Lost Bag bid found on this request');
      }
    } else {
      console.log('❌ No bids found');
    }
    
    // 2. Check what the hold request is supposed to be targeting
    console.log('\n🔒 Hold Request Analysis:');
    console.log('The hold request points to this show request, but:');
    console.log(`- Show request venue: ${showRequest?.venue?.name || 'NONE'}`);
    console.log(`- Expected venue: Lost Bag (1748094967307)`);
    
    if (!showRequest?.venue) {
      console.log('\n🚨 ISSUE FOUND: Show request has no venue!');
      console.log('This is an artist-initiated request, so the venue should come from the BID, not the request itself.');
      console.log('Our API query logic needs to be updated to handle this case.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugShowRequest(); 
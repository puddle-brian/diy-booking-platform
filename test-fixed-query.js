const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFixedQuery() {
  console.log('🧪 Testing Fixed Hold Query...\n');
  
  try {
    const targetVenueId = '1748094967307'; // Lost Bag
    
    // Use our new fixed query logic
    const query = `
      SELECT hr.*, 
             u1.username as requester_name,
             u2.username as responder_name,
             s.title as show_title,
             s.date as show_date,
             sr.title as show_request_title,
             sr."requestedDate" as show_request_date,
             vo.title as venue_offer_title,
             vo."proposedDate" as venue_offer_date,
             a.name as artist_name
      FROM "hold_requests" hr
      LEFT JOIN "User" u1 ON hr."requestedById" = u1.id
      LEFT JOIN "User" u2 ON hr."respondedById" = u2.id
      LEFT JOIN shows s ON hr."showId" = s.id
      LEFT JOIN venues v ON s."venueId" = v.id
      LEFT JOIN "show_requests" sr ON hr."showRequestId" = sr.id
      LEFT JOIN venues srv ON sr."venueId" = srv.id
      LEFT JOIN artists a ON sr."artistId" = a.id
      LEFT JOIN "venue_offers" vo ON hr."venueOfferId" = vo.id
      LEFT JOIN venues vov ON vo."venueId" = vov.id
      LEFT JOIN "show_request_bids" srb ON hr."showRequestId" = srb."showRequestId" AND srb."venueId" = $1
      WHERE (srv.id = $1 OR v.id = $1 OR vov.id = $1 OR srb."venueId" = $1)
      AND hr.status = 'PENDING'
      ORDER BY hr."createdAt" DESC
    `;
    
    const holdRequests = await prisma.$queryRawUnsafe(query, targetVenueId);
    
    console.log(`🎯 Hold requests for Lost Bag (${targetVenueId}): ${holdRequests.length}`);
    
    if (holdRequests.length > 0) {
      console.log('\n✅ Found hold requests:');
      holdRequests.forEach((hold, index) => {
        console.log(`${index + 1}. ${hold.artist_name} → Lost Bag`);
        console.log(`   Requested by: ${hold.requester_name}`);
        console.log(`   Show: ${hold.show_request_title}`);
        console.log(`   Date: ${hold.show_request_date}`);
        console.log(`   Status: ${hold.status}`);
        console.log(`   Hold ID: ${hold.id}`);
      });
    } else {
      console.log('❌ Still no holds found - checking why...');
      
      // Debug: Check if there are any PENDING holds at all
      const allPendingHolds = await prisma.holdRequest.findMany({
        where: { status: 'PENDING' },
        include: {
          requestedBy: { select: { username: true } },
          showRequest: { 
            include: { 
              artist: { select: { name: true } },
              bids: {
                where: { venueId: targetVenueId },
                include: { venue: { select: { name: true } } }
              }
            } 
          }
        }
      });
      
      console.log(`\n🔍 All PENDING holds: ${allPendingHolds.length}`);
      allPendingHolds.forEach((hold) => {
        const hasBid = hold.showRequest?.bids?.length > 0;
        console.log(`- Hold ${hold.id}`);
        console.log(`  Artist: ${hold.showRequest?.artist?.name}`);
        console.log(`  Has Lost Bag bid: ${hasBid ? 'YES' : 'NO'}`);
        if (hasBid) {
          console.log(`  Bid venue: ${hold.showRequest?.bids[0]?.venue?.name}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFixedQuery(); 
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugHoldRequests() {
  console.log('🔍 Debugging Hold Requests...\n');
  
  try {
    // 1. Check all hold requests in database
    const allHolds = await prisma.holdRequest.findMany({
      include: {
        requestedBy: { select: { username: true } },
        respondedBy: { select: { username: true } },
        showRequest: { 
          include: { 
            venue: { select: { id: true, name: true } },
            artist: { select: { id: true, name: true } }
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Total hold requests in database: ${allHolds.length}\n`);
    
    if (allHolds.length > 0) {
      console.log('🔍 All hold requests:');
      allHolds.forEach((hold, index) => {
        console.log(`${index + 1}. ID: ${hold.id}`);
        console.log(`   Status: ${hold.status}`);
        console.log(`   Requested by: ${hold.requestedBy?.username || 'Unknown'}`);
        console.log(`   Show Request: ${hold.showRequestId || 'None'}`);
        console.log(`   Venue: ${hold.showRequest?.venue?.name || 'None'} (ID: ${hold.showRequest?.venue?.id || 'None'})`);
        console.log(`   Artist: ${hold.showRequest?.artist?.name || 'None'}`);
        console.log(`   Created: ${hold.createdAt}`);
        console.log('   ---');
      });
    }
    
    // 2. Check specifically for Lost Bag venue (ID: 1748094967307)
    console.log('\n🎯 Checking for Lost Bag venue holds...');
    const lostBagVenueId = '1748094967307';
    
    // Query using our API logic
    const lostBagHolds = await prisma.$queryRaw`
      SELECT hr.*, 
             u1.username as requester_name,
             sr.title as show_request_title,
             sr."requestedDate" as show_request_date,
             a.name as artist_name,
             v.name as venue_name
      FROM "hold_requests" hr
      LEFT JOIN "User" u1 ON hr."requestedById" = u1.id
      LEFT JOIN "show_requests" sr ON hr."showRequestId" = sr.id
      LEFT JOIN venues v ON sr."venueId" = v.id
      LEFT JOIN artists a ON sr."artistId" = a.id
      WHERE v.id = ${lostBagVenueId}
      AND hr.status = 'PENDING'
      ORDER BY hr."createdAt" DESC
    `;
    
    console.log(`📍 Hold requests for Lost Bag (${lostBagVenueId}): ${lostBagHolds.length}`);
    
    if (lostBagHolds.length > 0) {
      lostBagHolds.forEach((hold, index) => {
        console.log(`${index + 1}. ${hold.artist_name} → ${hold.venue_name}`);
        console.log(`   Requested by: ${hold.requester_name}`);
        console.log(`   Show date: ${hold.show_request_date}`);
        console.log(`   Status: ${hold.status}`);
      });
    } else {
      console.log('❌ No pending holds found for Lost Bag');
    }
    
    // 3. Check Lightning Bolt requests specifically
    console.log('\n⚡ Checking Lightning Bolt user holds...');
    const lightningBoltHolds = await prisma.holdRequest.findMany({
      where: {
        requestedBy: {
          username: {
            contains: 'brian-gibson'
          }
        }
      },
      include: {
        requestedBy: { select: { username: true } },
        showRequest: { 
          include: { 
            venue: { select: { name: true } },
            artist: { select: { name: true } }
          } 
        }
      }
    });
    
    console.log(`⚡ Holds requested by Lightning Bolt user: ${lightningBoltHolds.length}`);
    if (lightningBoltHolds.length > 0) {
      lightningBoltHolds.forEach((hold) => {
        console.log(`- ${hold.showRequest?.artist?.name} → ${hold.showRequest?.venue?.name}`);
        console.log(`  Status: ${hold.status}, Created: ${hold.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugHoldRequests(); 
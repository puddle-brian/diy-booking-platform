const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSept26() {
  try {
    console.log('🔍 Checking SEPT 26, 2025 data...\n');
    
    // The actual show from our query results
    const show = await prisma.show.findFirst({
      where: {
        date: {
          gte: new Date('2025-09-26T00:00:00Z'),
          lt: new Date('2025-09-27T00:00:00Z')
        },
        venue: { name: 'Lost Bag' }
      },
      include: {
        venue: { select: { name: true } },
        lineup: {
          include: {
            artist: { select: { name: true } }
          }
        }
      }
    });
    
    if (show) {
      console.log('✅ Found Sept 26 show:');
      console.log('Show ID:', show.id);
      console.log('Title:', show.title);
      console.log('Venue:', show.venue?.name);
      console.log('Show Status:', show.status);
      console.log('Lineup:');
      show.lineup.forEach(item => {
        console.log(`  - ${item.artist?.name}: ${item.status}`);
      });
      
      // Now check for any show requests that might correspond
      const showRequests = await prisma.showRequest.findMany({
        where: {
          requestedDate: {
            gte: new Date('2025-09-26T00:00:00Z'),
            lt: new Date('2025-09-27T00:00:00Z')
          }
        },
        include: {
          artist: { select: { name: true } },
          venue: { select: { name: true } },
          bids: {
            include: { venue: { select: { name: true } } }
          }
        }
      });
      
      console.log('\n🎯 Show Requests for Sept 26:');
      console.log('Found:', showRequests.length, 'requests');
      showRequests.forEach(req => {
        console.log('Request ID:', req.id);
        console.log('Artist:', req.artist?.name);
        console.log('Bids:', req.bids.length);
        req.bids.forEach(bid => {
          console.log(`  - ${bid.venue?.name}: $${bid.amount} (${bid.status})`);
        });
      });
      
      // Check what timeline logic would do with this
      console.log('\n🔍 Timeline Logic Analysis:');
      console.log('This show has:');
      console.log(`- Show status: ${show.status}`);
      console.log(`- Lightning Bolt status in lineup: ${show.lineup.find(l => l.artist?.name === 'Lightning Bolt')?.status}`);
      console.log('');
      console.log('Timeline logic would:');
      if (show.status?.toLowerCase() === 'confirmed') {
        console.log('✅ Add as type: "show" (because aggregate show status is confirmed)');
      } else {
        console.log('❌ NOT add as type: "show" (because aggregate show status is not confirmed)');
      }
      
      const lbStatus = show.lineup.find(l => l.artist?.name === 'Lightning Bolt')?.status?.toLowerCase();
      if (lbStatus === 'confirmed') {
        console.log('✅ Lightning Bolt is confirmed → should show lineup on expand');
      } else {
        console.log('❌ Lightning Bolt is NOT confirmed → should show competing bids on expand');
        console.log(`   But there might be no corresponding show-request to get bids from!`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSept26(); 
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compareModels() {
  console.log('🔍 COMPARING TourRequest vs ShowRequest\n');
  
  try {
    // Get TourRequest data with details
    console.log('=== TOUR REQUESTS ===');
    const tourRequests = await prisma.tourRequest.findMany({
      include: {
        artist: { select: { name: true } },
        bids: { 
          include: { venue: { select: { name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    tourRequests.forEach(tr => {
      console.log(`📋 ${tr.title}`);
      console.log(`   Artist: ${tr.artist.name}`);
      console.log(`   Dates: ${tr.requestDate || `${tr.startDate} to ${tr.endDate}`}`);
      console.log(`   Legacy Range: ${tr.isLegacyRange}`);
      console.log(`   Locations: ${tr.targetLocations.join(', ')}`);
      console.log(`   Bids: ${tr.bids.length} (${tr.bids.map(b => b.venue.name).join(', ')})`);
      console.log(`   Created: ${tr.createdAt.toISOString().split('T')[0]}\n`);
    });

    console.log('=== SHOW REQUESTS ===');
    const showRequests = await prisma.showRequest.findMany({
      include: {
        artist: { select: { name: true } },
        venue: { select: { name: true } },
        bids: { 
          include: { venue: { select: { name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    showRequests.forEach(sr => {
      console.log(`🎯 ${sr.title}`);
      console.log(`   Artist: ${sr.artist.name}`);
      console.log(`   Venue: ${sr.venue?.name || 'Open to any venue'}`);
      console.log(`   Date: ${sr.requestedDate.toISOString().split('T')[0]}`);
      console.log(`   Initiated by: ${sr.initiatedBy}`);
      console.log(`   Status: ${sr.status}`);
      console.log(`   Locations: ${sr.targetLocations.join(', ')}`);
      console.log(`   Amount: $${sr.amount || 'Not specified'}`);
      console.log(`   Bids: ${sr.bids.length} (${sr.bids.map(b => b.venue.name).join(', ')})`);
      console.log(`   Created: ${sr.createdAt.toISOString().split('T')[0]}\n`);
    });

    // Compare bid counts
    console.log('=== BID COMPARISON ===');
    const oldBids = await prisma.bid.count();
    const newBids = await prisma.showRequestBid.count();
    console.log(`Old Bids (from TourRequest): ${oldBids}`);
    console.log(`New Bids (from ShowRequest): ${newBids}`);

    // Look at hold request references
    console.log('\n=== HOLD REQUEST REFERENCES ===');
    const holdRequests = await prisma.holdRequest.findMany({
      select: {
        id: true,
        showRequestId: true,
        status: true,
        reason: true
      }
    });

    holdRequests.forEach(hr => {
      console.log(`🔒 Hold ${hr.id.slice(-8)}: ${hr.status}`);
      console.log(`   ShowRequest: ${hr.showRequestId || 'NULL'}`);
      console.log(`   Reason: ${hr.reason}\n`);
    });

    // Check which APIs are actually being used
    console.log('=== USAGE PATTERNS ===');
    console.log('TourRequest model used by:');
    console.log('- Artist profile pages (for viewing artist\'s tour requests)');
    console.log('- Venue browsing (for finding tours to bid on)');
    console.log('- Bidding system (when venues submit bids)');
    console.log('');
    console.log('ShowRequest model used by:');
    console.log('- Timeline/itinerary (for displaying unified requests)');
    console.log('- Hold system (for managing holds)');
    console.log('- Venue offers (when venues make direct offers)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareModels(); 
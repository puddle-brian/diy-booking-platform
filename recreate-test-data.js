const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recreateTestData() {
  console.log('🔄 Recreating test data with current ShowRequest system...\n');
  
  try {
    // STEP 1: Analyze existing TourRequest test data
    console.log('=== ANALYZING OLD TEST DATA ===');
    const tourRequests = await prisma.tourRequest.findMany({
      include: {
        artist: { select: { id: true, name: true } },
        bids: { 
          include: { 
            venue: { select: { id: true, name: true } },
            bidder: { select: { id: true, username: true } }
          }
        }
      }
    });

    console.log(`Found ${tourRequests.length} old TourRequests to convert:`);
    
    const conversionPlan = [];
    
    for (const tr of tourRequests) {
      console.log(`\n📋 ${tr.title}`);
      console.log(`   Artist: ${tr.artist.name} (${tr.artistId})`);
      console.log(`   Date range: ${tr.requestDate || `${tr.startDate} to ${tr.endDate}`}`);
      console.log(`   Bids: ${tr.bids.length}`);
      
      // For each TourRequest, we'll create a ShowRequest with the same artist
      // Use the middle date or requestDate
      const showDate = tr.requestDate || new Date(
        (tr.startDate.getTime() + tr.endDate.getTime()) / 2
      );
      
      const newShowRequest = {
        artistId: tr.artistId,
        artistName: tr.artist.name,
        title: tr.title,
        description: tr.description,
        requestedDate: showDate,
        targetLocations: tr.targetLocations,
        genres: tr.genres,
        bids: tr.bids.map(bid => ({
          venueId: bid.venueId,
          venueName: bid.venue.name,
          bidderId: bid.bidderId,
          bidderName: bid.bidder.username,
          proposedDate: bid.proposedDate || showDate,
          message: bid.message,
          amount: bid.amount,
          status: bid.status
        }))
      };
      
      conversionPlan.push(newShowRequest);
      
      console.log(`   → Will create ShowRequest for ${showDate.toISOString().split('T')[0]}`);
      console.log(`   → Will create ${tr.bids.length} ShowRequestBids`);
    }

    // STEP 2: Ask for confirmation
    console.log('\n=== CONVERSION PLAN ===');
    console.log(`Will create ${conversionPlan.length} new ShowRequests`);
    console.log(`Will create ${conversionPlan.reduce((sum, sr) => sum + sr.bids.length, 0)} new ShowRequestBids`);
    console.log(`Will delete ${tourRequests.length} old TourRequests`);
    console.log(`Will delete ${tourRequests.reduce((sum, tr) => sum + tr.bids.length, 0)} old Bids`);
    
    console.log('\n⚠️ This will replace old test data with current-system test data');
    console.log('🛡️ Creating backup first...');

    // STEP 3: Create backup
    const backupData = {
      tourRequests: await prisma.tourRequest.findMany({ include: { bids: true } }),
      timestamp: new Date().toISOString()
    };
    
    const fs = require('fs');
    const backupFile = `backup-before-test-data-recreation-${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup saved to ${backupFile}`);

    // STEP 4: Create new ShowRequests and ShowRequestBids
    console.log('\n=== CREATING NEW TEST DATA ===');
    
    for (const plan of conversionPlan) {
      console.log(`\n🎯 Creating ShowRequest: ${plan.title}`);
      
      const newShowRequest = await prisma.showRequest.create({
        data: {
          artistId: plan.artistId,
          venueId: null, // Open to any venue (artist-initiated)
          title: plan.title,
          description: plan.description,
          requestedDate: plan.requestedDate,
          initiatedBy: 'ARTIST',
          createdById: plan.bids[0]?.bidderId || 'brian-gibson', // Use first bidder as creator
          status: 'OPEN',
          targetLocations: plan.targetLocations,
          genres: plan.genres
        }
      });

      console.log(`   ✅ Created ShowRequest ${newShowRequest.id}`);

      // Create corresponding ShowRequestBids
      for (const bidPlan of plan.bids) {
        const newBid = await prisma.showRequestBid.create({
          data: {
            showRequestId: newShowRequest.id,
            venueId: bidPlan.venueId,
            bidderId: bidPlan.bidderId,
            proposedDate: bidPlan.proposedDate,
            message: bidPlan.message || `Bid from ${bidPlan.venueName}`,
            amount: bidPlan.amount,
            status: bidPlan.status
          }
        });
        
        console.log(`     → Created bid from ${bidPlan.venueName}`);
      }
    }

    // STEP 5: Remove old data
    console.log('\n=== REMOVING OLD TEST DATA ===');
    
    const deletedBids = await prisma.bid.deleteMany({
      where: { 
        tourRequestId: { 
          in: tourRequests.map(tr => tr.id) 
        } 
      }
    });
    console.log(`🗑️ Deleted ${deletedBids.count} old Bids`);

    const deletedTourRequests = await prisma.tourRequest.deleteMany({
      where: { 
        id: { 
          in: tourRequests.map(tr => tr.id) 
        } 
      }
    });
    console.log(`🗑️ Deleted ${deletedTourRequests.count} old TourRequests`);

    // STEP 6: Verify new state
    console.log('\n=== VERIFICATION ===');
    const newShowRequests = await prisma.showRequest.count();
    const newShowRequestBids = await prisma.showRequestBid.count();
    const remainingTourRequests = await prisma.tourRequest.count();
    const remainingBids = await prisma.bid.count();

    console.log(`✅ Current state:`);
    console.log(`   ShowRequests: ${newShowRequests}`);
    console.log(`   ShowRequestBids: ${newShowRequestBids}`);
    console.log(`   TourRequests: ${remainingTourRequests} (should be 0)`);
    console.log(`   Bids: ${remainingBids} (should be 0)`);

    if (remainingTourRequests === 0 && remainingBids === 0) {
      console.log('\n🎉 SUCCESS: Test data successfully recreated!');
      console.log('🔒 Hold system should now work with ShowRequest data');
      console.log('🧪 Try running: node quick-hold-test.js');
    } else {
      console.log('\n⚠️ WARNING: Some old data remains. Check the output above.');
    }

  } catch (error) {
    console.error('❌ Error recreating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateTestData(); 
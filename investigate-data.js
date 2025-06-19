#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateData() {
  try {
    console.log('🔍 Investigating Database vs Migration Discrepancy...\n');
    
    // CHECK SHOW REQUESTS
    console.log('📋 SHOW REQUESTS ANALYSIS:');
    const totalShowRequests = await prisma.showRequest.count();
    const showRequestsWithVenue = await prisma.showRequest.count({
      where: { venueId: { not: null } }
    });
    const showRequestsWithoutVenue = await prisma.showRequest.count({
      where: { venueId: null }
    });
    
    console.log(`   Total ShowRequests in DB: ${totalShowRequests}`);
    console.log(`   ShowRequests WITH venue: ${showRequestsWithVenue}`);
    console.log(`   ShowRequests WITHOUT venue: ${showRequestsWithoutVenue}`);
    console.log(`   Migration script migrated: ${showRequestsWithVenue} (only ones with venues)`);
    
    // CHECK SHOW LINEUPS
    console.log('\n🎭 SHOW LINEUPS ANALYSIS:');
    const totalLineups = await prisma.showLineup.count();
    const pendingLineups = await prisma.showLineup.count({
      where: { status: 'PENDING' }
    });
    const confirmedLineups = await prisma.showLineup.count({
      where: { status: 'CONFIRMED' }
    });
    const cancelledLineups = await prisma.showLineup.count({
      where: { status: 'CANCELLED' }
    });
    
    console.log(`   Total ShowLineups in DB: ${totalLineups}`);
    console.log(`   PENDING lineups: ${pendingLineups}`);
    console.log(`   CONFIRMED lineups: ${confirmedLineups}`);
    console.log(`   CANCELLED lineups: ${cancelledLineups}`);
    console.log(`   Migration script migrated: ${pendingLineups} (only PENDING ones)`);
    
    // CHECK VENUE OFFERS
    console.log('\n🏢 VENUE OFFERS ANALYSIS:');
    const totalVenueOffers = await prisma.venueOffer.count();
    console.log(`   Total VenueOffers in DB: ${totalVenueOffers}`);
    console.log(`   Migration script migrated: ${totalVenueOffers} (all of them)`);
    
    // CHECK WHAT WE MISSED
    console.log('\n❌ WHAT THE MIGRATION MISSED:');
    console.log(`   ShowRequests without venues: ${showRequestsWithoutVenue}`);
    console.log(`   Confirmed lineups: ${confirmedLineups}`);
    console.log(`   Cancelled lineups: ${cancelledLineups}`);
    
    const totalMissed = showRequestsWithoutVenue + confirmedLineups + cancelledLineups;
    console.log(`   Total opportunities NOT migrated: ${totalMissed}`);
    
    // SHOW SOME EXAMPLES OF MISSED DATA
    console.log('\n📋 Examples of missed ShowRequests (no venue):');
    const missedRequests = await prisma.showRequest.findMany({
      where: { venueId: null },
      take: 5,
      include: { artist: { select: { name: true } } }
    });
    
    missedRequests.forEach(req => {
      console.log(`   • ${req.artist.name} - ${req.title}`);
    });
    
    console.log('\n🎭 Examples of missed lineups (confirmed/cancelled):');
    const missedLineups = await prisma.showLineup.findMany({
      where: { status: { not: 'PENDING' } },
      take: 5,
      include: { 
        artist: { select: { name: true } },
        show: { 
          include: { venue: { select: { name: true } } }
        }
      }
    });
    
    missedLineups.forEach(lineup => {
      console.log(`   • ${lineup.artist.name} at ${lineup.show.venue.name} (${lineup.status})`);
    });
    
    console.log('\n💡 EXPLANATION:');
    console.log('The migration script was conservative and only migrated:');
    console.log('   1. ShowRequests that have a specific venue (not open requests)');
    console.log('   2. ShowLineups that are PENDING (not confirmed shows)');
    console.log('   3. All VenueOffers');
    console.log('\nThis makes sense because:');
    console.log('   • Open requests (no venue) need different handling');
    console.log('   • Confirmed shows are actual shows, not "opportunities"');
    console.log('   • We focused on the "booking opportunities" concept');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateData(); 
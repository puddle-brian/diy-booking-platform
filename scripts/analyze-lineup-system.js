const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeLineupSystem() {
  console.log('🔍 LINEUP SYSTEM ANALYSIS - READ ONLY');
  console.log('=====================================\n');

  try {
    // 1. Count lineup bids in Bid table
    const lineupBids = await prisma.bid.findMany({
      where: { isLineupSlot: true },
      include: {
        tourRequest: {
          include: { artist: true }
        },
        venue: true,
        parentShow: true
      }
    });

    console.log(`📊 LINEUP BIDS (isLineupSlot=true in Bid table): ${lineupBids.length}`);
    
    if (lineupBids.length > 0) {
      console.log('\nLINEUP BID DETAILS:');
      lineupBids.forEach(bid => {
        console.log(`  - ID: ${bid.id}`);
        console.log(`    Artist: ${bid.tourRequest.artist.name}`);
        console.log(`    Venue: ${bid.venue?.name || 'Unknown'}`);
        console.log(`    Status: ${bid.status}`);
        console.log(`    Parent Show: ${bid.parentShowId || 'None'}`);
        console.log(`    Lineup Role: ${bid.lineupRole || 'None'}`);
        console.log(`    Billing Order: ${bid.billingOrder || 'None'}`);
        console.log(`    Created: ${bid.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // 2. Count lineup shows in Show table
    const lineupShows = await prisma.show.findMany({
      where: { isLineupSlot: true },
      include: {
        artist: true,
        venue: true,
        parentShow: true
      }
    });

    console.log(`📊 LINEUP SHOWS (isLineupSlot=true in Show table): ${lineupShows.length}`);
    
    if (lineupShows.length > 0) {
      console.log('\nLINEUP SHOW DETAILS:');
      lineupShows.forEach(show => {
        console.log(`  - ID: ${show.id}`);
        console.log(`    Artist: ${show.artistName}`);
        console.log(`    Venue: ${show.venueName}`);
        console.log(`    Date: ${show.date.toISOString()}`);
        console.log(`    Status: ${show.status}`);
        console.log(`    Parent Show: ${show.parentShowId || 'None'}`);
        console.log(`    Lineup Role: ${show.lineupRole || 'None'}`);
        console.log(`    Billing Order: ${show.billingOrder || 'None'}`);
        console.log('');
      });
    }

    // 3. Count regular venue offers
    const venueOffers = await prisma.venueOffer.findMany({
      include: {
        artist: true,
        venue: true
      }
    });

    console.log(`📊 VENUE OFFERS (VenueOffer table): ${venueOffers.length}`);
    
    if (venueOffers.length > 0) {
      console.log('\nVENUE OFFER DETAILS:');
      venueOffers.slice(0, 5).forEach(offer => { // Show first 5 only
        console.log(`  - ID: ${offer.id}`);
        console.log(`    Artist: ${offer.artist.name}`);
        console.log(`    Venue: ${offer.venue.name}`);
        console.log(`    Status: ${offer.status}`);
        console.log(`    Date: ${offer.proposedDate.toISOString()}`);
        console.log('');
      });
      if (venueOffers.length > 5) {
        console.log(`    ... and ${venueOffers.length - 5} more`);
      }
    }

    // 4. Count regular bids (non-lineup)
    const regularBids = await prisma.bid.findMany({
      where: { isLineupSlot: false }
    });

    console.log(`📊 REGULAR BIDS (isLineupSlot=false): ${regularBids.length}`);

    // 5. Summary
    console.log('\n🎯 SUMMARY:');
    console.log(`Total Lineup Bids: ${lineupBids.length}`);
    console.log(`Total Lineup Shows: ${lineupShows.length}`);
    console.log(`Total Venue Offers: ${venueOffers.length}`);
    console.log(`Total Regular Bids: ${regularBids.length}`);
    
    console.log('\n✅ ANALYSIS COMPLETE - No changes made to database');

  } catch (error) {
    console.error('❌ Error analyzing lineup system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeLineupSystem(); 
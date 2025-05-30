const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyTestData() {
  try {
    console.log('🔍 Verifying test data creation...\n');

    // Check tour requests
    const tourRequests = await prisma.tourRequest.findMany({
      include: {
        artist: true
      }
    });

    console.log(`📋 Tour Requests: ${tourRequests.length}`);
    tourRequests.forEach(tr => {
      console.log(`  - ${tr.artist.name}: "${tr.title}"`);
    });

    // Check bids by status
    const bids = await prisma.bid.findMany({
      include: {
        tourRequest: {
          include: {
            artist: true
          }
        },
        venue: true
      }
    });

    console.log(`\n🎯 Bids: ${bids.length} total`);
    
    const bidsByStatus = {
      PENDING: bids.filter(b => b.status === 'PENDING').length,
      ACCEPTED: bids.filter(b => b.status === 'ACCEPTED').length,
      REJECTED: bids.filter(b => b.status === 'REJECTED').length,
      WITHDRAWN: bids.filter(b => b.status === 'WITHDRAWN').length,
      HOLD: bids.filter(b => b.status === 'HOLD').length,
      CANCELLED: bids.filter(b => b.status === 'CANCELLED').length
    };

    console.log('  Status breakdown:');
    Object.entries(bidsByStatus).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`    ${status}: ${count}`);
      }
    });

    // Check bids by artist
    console.log('\n  Bids by artist:');
    const bidsByArtist = {};
    bids.forEach(bid => {
      const artistName = bid.tourRequest.artist.name;
      if (!bidsByArtist[artistName]) {
        bidsByArtist[artistName] = [];
      }
      bidsByArtist[artistName].push(bid);
    });

    Object.entries(bidsByArtist).forEach(([artistName, artistBids]) => {
      console.log(`    ${artistName}: ${artistBids.length} bids`);
      const statusCounts = {};
      artistBids.forEach(bid => {
        statusCounts[bid.status] = (statusCounts[bid.status] || 0) + 1;
      });
      const statusSummary = Object.entries(statusCounts)
        .map(([status, count]) => `${count} ${status.toLowerCase()}`)
        .join(', ');
      console.log(`      (${statusSummary})`);
    });

    // Check shows
    const shows = await prisma.show.findMany({
      include: {
        artist: true,
        venue: true
      }
    });

    console.log(`\n🎪 Shows: ${shows.length} total`);
    
    const showsByStatus = {
      CONFIRMED: shows.filter(s => s.status === 'CONFIRMED').length,
      PENDING: shows.filter(s => s.status === 'PENDING').length,
      CANCELLED: shows.filter(s => s.status === 'CANCELLED').length
    };

    console.log('  Status breakdown:');
    Object.entries(showsByStatus).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`    ${status}: ${count}`);
      }
    });

    // Show some example shows
    console.log('\n  Example shows:');
    shows.slice(0, 5).forEach(show => {
      const date = new Date(show.date).toLocaleDateString();
      console.log(`    ${date}: ${show.artist.name} at ${show.venue.name} (${show.status})`);
    });

    console.log('\n✅ Test data verification complete!');
    console.log('\n🎉 You now have comprehensive test data including:');
    console.log('   • Multiple tour requests with different scenarios');
    console.log('   • Bids in various statuses (pending, accepted, rejected, etc.)');
    console.log('   • Confirmed shows from accepted bids');
    console.log('   • Realistic booking data for testing all workflows');

  } catch (error) {
    console.error('❌ Error verifying test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTestData(); 
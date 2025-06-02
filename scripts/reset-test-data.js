const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetTestData() {
  console.log('🧹 Starting test data reset...');
  
  try {
    // Clear all show request bids first (due to foreign key constraints)
    console.log('🗑️ Clearing all show request bids...');
    const deletedBids = await prisma.showRequestBid.deleteMany();
    console.log(`✅ Deleted ${deletedBids.count} show request bids`);

    // Clear all show requests
    console.log('🗑️ Clearing all show requests...');
    const deletedRequests = await prisma.showRequest.deleteMany();
    console.log(`✅ Deleted ${deletedRequests.count} show requests`);

    console.log('🎯 Generating new test data with unified show requests...');

    // Get test data
    const systemUser = await prisma.user.findFirst({
      where: { email: 'system@diyshows.com' }
    });

    if (!systemUser) {
      throw new Error('System user not found');
    }

    const lightningBolt = await prisma.artist.findFirst({
      where: { name: 'lightning bolt' }
    });

    if (!lightningBolt) {
      throw new Error('Lightning Bolt artist not found');
    }

    // Get some venues for bidding
    const venues = await prisma.venue.findMany({
      take: 10,
      select: { id: true, name: true, capacity: true }
    });

    console.log(`Found ${venues.length} venues for test data`);

    // Create artist-initiated show requests with multiple bids
    const locations = [
      'Boston, MA',
      'Portland, OR', 
      'Atlanta, GA',
      'Nashville, TN',
      'Austin, TX',
      'Seattle, WA',
      'Denver, CO'
    ];

    const artistGenres = ['noise rock', 'experimental', 'avant-garde'];

    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];
      const requestDate = new Date();
      requestDate.setDate(requestDate.getDate() + 30 + (i * 10)); // Spread out over time

      console.log(`🎵 Creating show request for ${location}...`);

      // Artist-initiated show request
      const showRequest = await prisma.showRequest.create({
        data: {
          artistId: lightningBolt.id,
          venueId: null, // Artist doesn't specify venue initially
          createdById: systemUser.id,
          title: `${lightningBolt.name} - ${location}`,
          description: `Looking for a venue in ${location} for a ${artistGenres.join('/')} show.`,
          requestedDate: requestDate,
          initiatedBy: 'ARTIST',
          status: 'OPEN',
          targetLocations: [location],
          genres: artistGenres
        }
      });

      console.log(`✅ Created show request: ${showRequest.title}`);

      // Create 2-4 bids from different venues for each request
      const numBids = Math.floor(Math.random() * 3) + 2; // 2-4 bids
      const selectedVenues = venues.slice(0, numBids);

      for (let j = 0; j < selectedVenues.length; j++) {
        const venue = selectedVenues[j];
        const guaranteeAmount = Math.floor(Math.random() * 800) + 200; // $200-$1000
        
        console.log(`  💰 Creating bid from ${venue.name} for $${guaranteeAmount}...`);

        const bid = await prisma.showRequestBid.create({
          data: {
            showRequestId: showRequest.id,
            venueId: venue.id,
            bidderId: systemUser.id,
            amount: guaranteeAmount,
            message: `Hey! We'd love to have Lightning Bolt play at ${venue.name}. We think you'd be a great fit for our ${venue.capacity || 'intimate'} capacity space.`,
            status: j === 0 ? 'PENDING' : (Math.random() > 0.7 ? 'HOLD' : 'PENDING'), // First bid pending, others random
            proposedDate: requestDate,
            billingPosition: 'headliner',
            lineupPosition: 1,
            setLength: Math.floor(Math.random() * 30) + 45, // 45-75 minutes
            billingNotes: Math.random() > 0.5 ? 'Headlining slot with full production support' : null,
            otherActs: Math.random() > 0.5 ? 'Local opener TBD' : null
          }
        });

        console.log(`  ✅ Created bid from ${venue.name}: $${guaranteeAmount}`);
      }
    }

    // Create a few venue-initiated show requests (offers) as well
    console.log('🏢 Creating venue-initiated show requests...');
    
    for (let i = 0; i < 3; i++) {
      const venue = venues[i];
      const requestDate = new Date();
      requestDate.setDate(requestDate.getDate() + 60 + (i * 15));
      const amount = Math.floor(Math.random() * 600) + 400; // $400-$1000
      
      console.log(`🏢 Creating venue offer from ${venue.name}...`);

      const venueOffer = await prisma.showRequest.create({
        data: {
          artistId: lightningBolt.id,
          venueId: venue.id,
          createdById: systemUser.id,
          title: `${lightningBolt.name} at ${venue.name}`,
          description: `${venue.name} would love to host Lightning Bolt for an unforgettable show!`,
          requestedDate: requestDate,
          initiatedBy: 'VENUE',
          status: 'OPEN',
          targetLocations: [venue.name],
          genres: artistGenres,
          amount: amount,
          capacity: venue.capacity,
          ageRestriction: 'ALL_AGES',
          message: `Hey Lightning Bolt! We're huge fans and would love to have you play at ${venue.name}. We can offer $${amount} guarantee and think our audience would absolutely love your sound.`
        }
      });

      console.log(`✅ Created venue offer: ${venueOffer.title} ($${amount})`);
    }

    console.log('✅ Test data reset completed successfully!');
    
    // Show summary
    const totalRequests = await prisma.showRequest.count();
    const totalBids = await prisma.showRequestBid.count();
    
    console.log(`\n📊 Summary:`);
    console.log(`   - ${totalRequests} total show requests`);
    console.log(`   - ${totalBids} total bids`);
    console.log(`   - Lightning Bolt now has multiple venues bidding on their requests!`);

  } catch (error) {
    console.error('❌ Error resetting test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestData(); 
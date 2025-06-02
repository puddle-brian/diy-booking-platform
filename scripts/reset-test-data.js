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

    // Get some artists, venues, and system user for creating requests
    const artists = await prisma.artist.findMany({ take: 3 });
    const venues = await prisma.venue.findMany({ take: 8 }); // Get more venues for bidding
    let systemUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'system@diy-booking.com' },
          { username: 'system' }
        ]
      }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@diy-booking.com',
          username: 'system-user',
          role: 'ADMIN'
        }
      });
    }

    if (artists.length === 0) {
      console.log('⚠️ No artists found - skipping test data generation');
      return;
    }

    if (venues.length === 0) {
      console.log('⚠️ No venues found - skipping bid generation');
    }

    // Generate unified show requests for the next few months
    const locations = [
      'Seattle, WA',
      'Portland, OR', 
      'San Francisco, CA',
      'Los Angeles, CA',
      'Denver, CO',
      'Austin, TX',
      'Nashville, TN',
      'Atlanta, GA',
      'Brooklyn, NY',
      'Boston, MA'
    ];

    const genres = [
      ['punk', 'hardcore'],
      ['indie', 'rock'],
      ['electronic', 'ambient'],
      ['folk', 'acoustic'],
      ['metal', 'doom']
    ];

    let createdRequests = [];
    let createdCount = 0;

    for (const artist of artists) {
      // Create 3-4 show requests per artist with single dates
      const requestCount = 3 + Math.floor(Math.random() * 2); // 3-4 requests
      
      for (let i = 0; i < requestCount; i++) {
        // Generate dates 2-8 weeks in the future
        const weeksFromNow = 2 + Math.floor(Math.random() * 6);
        const requestDate = new Date();
        requestDate.setDate(requestDate.getDate() + (weeksFromNow * 7) + Math.floor(Math.random() * 7));

        const location = locations[Math.floor(Math.random() * locations.length)];
        const artistGenres = genres[Math.floor(Math.random() * genres.length)];

        // Artist-initiated show request
        const showRequest = await prisma.showRequest.create({
          data: {
            artistId: artist.id,
            venueId: null, // Artist doesn't specify venue initially
            createdById: systemUser.id,
            title: `${artist.name} - ${location}`,
            description: `Looking for a venue in ${location} for a ${artistGenres.join('/')} show.`,
            requestedDate: requestDate,
            initiatedBy: 'ARTIST',
            status: 'OPEN',
            targetLocations: [location],
            genres: artistGenres
          }
        });

        createdRequests.push(showRequest);
        createdCount++;
        console.log(`✅ Created show request: ${artist.name} - ${requestDate.toDateString()} in ${location}`);
      }
    }

    console.log(`🎉 Successfully created ${createdCount} new show requests!`);

    // Now generate realistic bids for these show requests
    if (venues.length > 0) {
      console.log('🎭 Generating realistic test bids...');
      
      const bidStatuses = ['PENDING', 'HOLD', 'ACCEPTED', 'REJECTED'];
      const ageRestrictions = ['ALL_AGES', 'EIGHTEEN_PLUS', 'TWENTY_ONE_PLUS'];
      const billingPositions = ['headliner', 'co-headliner', 'direct-support', 'opener'];
      
      const bidMessages = [
        "Hey! We'd love to have you play at our venue. Great fit for our audience.",
        "Perfect date for us! We can offer a solid guarantee plus door split.",
        "This would be an amazing show. Let's make it happen!",
        "We've been wanting to book you for months. Excited about this opportunity.",
        "Our crowd would absolutely love this show. Hope we can work something out.",
        "This date works perfectly with our calendar. Looking forward to hearing back!"
      ];

      let bidCount = 0;
      let holdPosition = 1;

      for (const request of createdRequests) {
        // Each show request gets 2-4 bids from different venues
        const numBids = 2 + Math.floor(Math.random() * 3);
        const shuffledVenues = [...venues].sort(() => 0.5 - Math.random()).slice(0, numBids);
        
        for (let i = 0; i < shuffledVenues.length; i++) {
          const venue = shuffledVenues[i];
          
          // Determine bid status - make it realistic
          let status;
          if (i === 0) {
            // First bid is often pending or hold
            status = Math.random() > 0.5 ? 'PENDING' : 'HOLD';
          } else if (i === 1 && Math.random() > 0.7) {
            // Sometimes second bid gets accepted
            status = 'ACCEPTED';
          } else {
            // Random status for others, weighted toward pending
            const rand = Math.random();
            if (rand < 0.5) status = 'PENDING';
            else if (rand < 0.7) status = 'HOLD';
            else if (rand < 0.9) status = 'REJECTED';
            else status = 'ACCEPTED';
          }

          // Generate realistic bid details
          const guarantee = 200 + Math.floor(Math.random() * 600); // $200-800
          const capacity = venue.capacity || (100 + Math.floor(Math.random() * 400));
          const ageRestriction = ageRestrictions[Math.floor(Math.random() * ageRestrictions.length)];
          const billingPosition = billingPositions[Math.floor(Math.random() * billingPositions.length)];
          const message = bidMessages[Math.floor(Math.random() * bidMessages.length)];

          // Create the proposed date (same as request date or nearby)
          const proposedDate = new Date(request.requestedDate);
          // Occasionally suggest alternative dates
          if (Math.random() > 0.8) {
            proposedDate.setDate(proposedDate.getDate() + (Math.random() > 0.5 ? 1 : -1));
          }

          const bidData = {
            showRequestId: request.id,
            venueId: venue.id,
            bidderId: systemUser.id,
            proposedDate: proposedDate,
            message: message,
            amount: guarantee,
            status: status,
            billingPosition: billingPosition,
            lineupPosition: billingPosition === 'headliner' ? 1 : billingPosition === 'direct-support' ? 2 : 3,
            setLength: 30 + Math.floor(Math.random() * 60), // 30-90 minutes
            // Add hold position for HOLD status bids
            ...(status === 'HOLD' && { holdPosition: holdPosition++ }),
            // Add accepted/declined timestamps for completed bids
            ...(status === 'ACCEPTED' && { acceptedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) }),
            ...(status === 'REJECTED' && { 
              declinedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
              declinedReason: Math.random() > 0.5 ? 'Date conflict' : 'Budget not aligned'
            })
          };

          const bid = await prisma.showRequestBid.create({ data: bidData });
          bidCount++;

          console.log(`✅ Created ${status.toLowerCase()} bid: ${venue.name} → ${request.artistId} ($${guarantee})`);
        }
      }

      console.log(`🎭 Successfully created ${bidCount} realistic test bids!`);
      console.log(`📊 Bid statuses: pending, hold, accepted, rejected`);
    }

    console.log('📅 All requests use the new unified show request format');
    console.log('🔄 Refresh your browser to see the new data');

  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetTestData()
  .then(() => {
    console.log('🎊 Test data reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Reset failed:', error);
    process.exit(1);
  }); 
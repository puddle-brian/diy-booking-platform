const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 🎵 Helper functions for realistic test data generation

function weightedRandom(options, weights) {
  const random = Math.random();
  let weightSum = 0;
  
  for (let i = 0; i < options.length; i++) {
    weightSum += weights[i];
    if (random <= weightSum) {
      return options[i];
    }
  }
  return options[options.length - 1];
}

function getBillingMessage(venueName, billingPosition, amount, capacity) {
  const messages = {
    'headliner': [
      `Hey Lightning Bolt! We'd love to have you headline at ${venueName}. $${amount} guarantee with full production support and ${capacity || 'intimate'} capacity crowd that loves experimental music.`,
      `${venueName} calling! We can offer you the headlining spot for $${amount}. Our ${capacity || 'passionate'} person space is perfect for your sound.`,
      `Headlining offer from ${venueName}: $${amount} guarantee. We'll handle promotion and have a killer sound system ready for you.`
    ],
    'co-headliner': [
      `Co-headlining opportunity at ${venueName}! $${amount} guarantee to share the bill with another established act. Perfect fit for our ${capacity || 'mid-size'} venue.`,
      `${venueName} here - interested in co-headlining with us? $${amount} split billing with strong local promotion support.`
    ],
    'support': [
      `Support slot at ${venueName} - $${amount} to open for a killer headliner. Great exposure for ${capacity || 'engaged'} person audience.`,
      `Opening act opportunity: $${amount} at ${venueName}. Perfect way to reach new fans in our market.`
    ],
    'local-support': [
      `Local support slot at ${venueName} - $${amount} to help build the scene. Our ${capacity || 'community-focused'} space loves discovering new acts.`,
      `${venueName} community slot: $${amount} to play with touring acts and connect with local music lovers.`
    ]
  };
  
  const positionMessages = messages[billingPosition];
  return positionMessages[Math.floor(Math.random() * positionMessages.length)];
}

function getBillingNotes(billingPosition) {
  const notes = {
    'headliner': [
      'Full headlining slot with complete production support',
      'Top billing with sound/lights handled',
      'Headline act - venue will handle all promotion'
    ],
    'co-headliner': [
      'Shared top billing with touring act',
      'Co-headline - equal promotion and stage time',
      'Split headlining duties'
    ],
    'support': [
      'Direct support for established headliner',
      'Opening for touring headliner',
      'Support slot with headliner promotion'
    ],
    'local-support': [
      'Local opener building community',
      'Community support slot',
      'Local act supporting touring bands'
    ]
  };
  
  const positionNotes = notes[billingPosition];
  return Math.random() > 0.5 ? positionNotes[Math.floor(Math.random() * positionNotes.length)] : null;
}

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

        // 🎵 Enhanced billing positions using new simplified system
        const billingOptions = ['headliner', 'support', 'local-support', 'co-headliner'];
        const billingWeights = [0.6, 0.2, 0.15, 0.05]; // Mostly headliners, some support
        const selectedBilling = weightedRandom(billingOptions, billingWeights);
        
        // Set appropriate set lengths based on billing position
        const setLengthByPosition = {
          'headliner': Math.floor(Math.random() * 30) + 60, // 60-90 minutes
          'co-headliner': Math.floor(Math.random() * 20) + 55, // 55-75 minutes  
          'support': Math.floor(Math.random() * 15) + 30, // 30-45 minutes
          'local-support': Math.floor(Math.random() * 10) + 20 // 20-30 minutes
        };

        // Generate realistic other acts based on billing position
        const otherActsByPosition = {
          'headliner': ['Local Opener A', 'Regional Support Band'],
          'co-headliner': ['Third Act TBD'],
          'support': ['Lightning Bolt (headliner)', 'Local Opener'],
          'local-support': ['Lightning Bolt (headliner)', 'Touring Support Act']
        };

        const bid = await prisma.showRequestBid.create({
          data: {
            showRequestId: showRequest.id,
            venueId: venue.id,
            bidderId: systemUser.id,
            amount: guaranteeAmount,
            message: getBillingMessage(venue.name, selectedBilling, guaranteeAmount, venue.capacity),
            status: j === 0 ? 'PENDING' : (Math.random() > 0.7 ? 'HOLD' : 'PENDING'),
            proposedDate: requestDate,
            billingPosition: selectedBilling,
            lineupPosition: selectedBilling === 'headliner' ? 1 : (selectedBilling === 'co-headliner' ? 1 : 2),
            setLength: setLengthByPosition[selectedBilling],
            billingNotes: getBillingNotes(selectedBilling),
            otherActs: otherActsByPosition[selectedBilling].join(', ')
          }
        });

        console.log(`  ✅ Created bid from ${venue.name}: $${guaranteeAmount}`);
      }
    }

    // Create a few venue-initiated show requests (offers) with diverse billing positions
    console.log('🏢 Creating venue-initiated show requests...');
    
    const venueOfferScenarios = [
      { billing: 'headliner', baseAmount: 600 },
      { billing: 'support', baseAmount: 300 },
      { billing: 'co-headliner', baseAmount: 500 }
    ];
    
    for (let i = 0; i < 3; i++) {
      const venue = venues[i];
      const scenario = venueOfferScenarios[i];
      const requestDate = new Date();
      requestDate.setDate(requestDate.getDate() + 60 + (i * 15));
      const amount = scenario.baseAmount + Math.floor(Math.random() * 200); // Add some variation
      
      console.log(`🏢 Creating ${scenario.billing} offer from ${venue.name}...`);

      const venueOffer = await prisma.showRequest.create({
        data: {
          artistId: lightningBolt.id,
          venueId: venue.id,
          createdById: systemUser.id,
          title: `${lightningBolt.name} at ${venue.name} (${scenario.billing})`,
          description: `${venue.name} would love to host Lightning Bolt for an unforgettable ${scenario.billing} show!`,
          requestedDate: requestDate,
          initiatedBy: 'VENUE',
          status: 'OPEN',
          targetLocations: [venue.name],
          genres: artistGenres,
          amount: amount,
          capacity: venue.capacity,
          ageRestriction: 'ALL_AGES',
          billingPosition: scenario.billing,
          message: getBillingMessage(venue.name, scenario.billing, amount, venue.capacity)
        }
      });

      console.log(`✅ Created ${scenario.billing} offer: ${venueOffer.title} ($${amount})`);
    }

    console.log('✅ Test data reset completed successfully!');
    
    // Show summary
    const totalRequests = await prisma.showRequest.count();
    const totalBids = await prisma.showRequestBid.count();
    
    console.log(`\n📊 Summary:`);
    console.log(`   - ${totalRequests} total show requests`);
    console.log(`   - ${totalBids} total bids`);
    console.log(`   - 🎵 Realistic billing positions: headliner, support, local-support, co-headliner`);
    console.log(`   - 💰 Varied financial offers based on billing position`);
    console.log(`   - 🎭 Complete lineup information with set lengths and other acts`);
    console.log(`   - Lightning Bolt now has venues offering different roles and experiences!`);

  } catch (error) {
    console.error('❌ Error resetting test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestData(); 
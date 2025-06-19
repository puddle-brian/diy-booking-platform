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
    // Clear all data in the correct order (due to foreign key constraints)
    console.log('🗑️ Clearing all show lineup records...');
    const deletedLineups = await prisma.showLineup.deleteMany();
    console.log(`✅ Deleted ${deletedLineups.count} show lineup records`);

    console.log('🗑️ Clearing all show records...');
    const deletedShows = await prisma.show.deleteMany();
    console.log(`✅ Deleted ${deletedShows.count} show records`);

    console.log('🗑️ Clearing all show request bids...');
    const deletedBids = await prisma.showRequestBid.deleteMany();
    console.log(`✅ Deleted ${deletedBids.count} show request bids`);

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

    // 🎵 GET MULTIPLE ARTISTS for diverse data (filter out unnamed/unknown artists)
    const artists = await prisma.artist.findMany({
      where: {
        name: {
          not: null,
          not: '',
          notIn: ['Unknown', 'unknown', 'Unknown Artist', 'unknown artist']
        }
      },
      take: 20, // Get more artists to ensure we have enough after filtering
      select: { id: true, name: true, genres: true }
    });

    if (artists.length === 0) {
      throw new Error('No artists found in database');
    }

    console.log(`🎸 Found ${artists.length} artists for diverse test data`);

    // Get some venues for bidding
    const venues = await prisma.venue.findMany({
      take: 10,
      select: { id: true, name: true, capacity: true }
    });

    console.log(`🏢 Found ${venues.length} venues for test data`);

    // 🎯 CREATE OVERLAPPING REQUESTS - Multiple artists targeting same cities/dates
    const popularCities = [
      'Boston, MA',
      'Portland, OR', 
      'Nashville, TN',
      'Austin, TX'
    ];

    let totalRequests = 0;

    for (let cityIndex = 0; cityIndex < popularCities.length; cityIndex++) {
      const city = popularCities[cityIndex];
      
      // 🎯 CREATE SHARED DATES - Multiple artists competing for same dates!
      const sharedDates = [];
      for (let dateIndex = 0; dateIndex < 3; dateIndex++) {
        const sharedDate = new Date();
        sharedDate.setDate(sharedDate.getDate() + 30 + (cityIndex * 20) + (dateIndex * 10)); // 3 dates per city, 10 days apart
        sharedDates.push(sharedDate);
      }
      
      console.log(`🏙️ Creating competing requests for ${city} on ${sharedDates.length} shared dates...`);

      // 6-7 different artists request shows in the same city on the SAME DATES (more competition!)
      const artistsForCity = artists.slice(cityIndex * 4, (cityIndex * 4) + 7).filter(a => a.name && a.name.trim() !== ''); // Filter out unnamed artists
      
      for (let artistIndex = 0; artistIndex < artistsForCity.length; artistIndex++) {
        const artist = artistsForCity[artistIndex];
        // 🎯 ENHANCED: More artists competing for same dates (3-4 per date instead of 2)
        const requestDate = sharedDates[artistIndex % sharedDates.length]; // Cycle through shared dates
        
        console.log(`🎵 Creating show request for ${artist.name} in ${city} on ${requestDate.toDateString()}...`);

        // Artist-initiated show request
        const showRequest = await prisma.showRequest.create({
          data: {
            artistId: artist.id,
            venueId: null, // Artist doesn't specify venue initially
            createdById: systemUser.id,
            title: `${artist.name} - ${city}`,
            description: `Looking for a venue in ${city} for a ${artist.genres?.join('/')} show.`,
            requestedDate: requestDate,
            initiatedBy: 'ARTIST',
            status: 'OPEN',
            targetLocations: [city],
            genres: artist.genres || ['rock', 'indie'],
            billingPosition: 'headliner' // Artists usually request headliner spots
          }
        });

        console.log(`✅ Created show request: ${showRequest.title}`);
        totalRequests++;

        // Create 2-4 bids from different venues for each request
        const numBids = Math.floor(Math.random() * 3) + 2; // 2-4 bids
        const selectedVenues = venues.slice(0, numBids);

        for (let j = 0; j < selectedVenues.length; j++) {
          const venue = selectedVenues[j];
          const guaranteeAmount = Math.floor(Math.random() * 800) + 200; // $200-$1000
          
          console.log(`  💰 Creating bid from ${venue.name} for $${guaranteeAmount}...`);

          // 🎵 Enhanced billing positions using weighted system
          const billingOptions = ['headliner', 'support', 'local-support', 'co-headliner'];
          const billingWeights = [0.6, 0.2, 0.15, 0.05]; // Mostly headliners, some support
          const selectedBilling = weightedRandom(billingOptions, billingWeights);
          
          // 🎯 DIVERSE BID STATUSES for realistic testing
          const statusOptions = ['PENDING', 'HOLD', 'ACCEPTED'];
          const statusWeights = [0.5, 0.3, 0.2]; // More balanced: 50% pending, 30% hold, 20% accepted
          const bidStatus = weightedRandom(statusOptions, statusWeights);
          
          console.log(`    🎯 Bid status selected: ${bidStatus} (from ${statusOptions.join(', ')})`);
          
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
            'support': [`${artist.name} (headliner)`, 'Local Opener'],
            'local-support': [`${artist.name} (headliner)`, 'Touring Support Act']
          };

          const bid = await prisma.showRequestBid.create({
            data: {
              showRequestId: showRequest.id,
              venueId: venue.id,
              bidderId: systemUser.id,
              amount: guaranteeAmount,
              message: getBillingMessage(venue.name, selectedBilling, guaranteeAmount, venue.capacity),
              status: bidStatus, // 🎯 DIVERSE STATUSES
              proposedDate: requestDate,
              billingPosition: selectedBilling,
              lineupPosition: selectedBilling === 'headliner' ? 1 : (selectedBilling === 'co-headliner' ? 1 : 2),
              setLength: setLengthByPosition[selectedBilling],
              billingNotes: getBillingNotes(selectedBilling),
              otherActs: otherActsByPosition[selectedBilling].join(', ')
            }
          });

          console.log(`  ✅ Created ${bidStatus} bid from ${venue.name}: $${guaranteeAmount}`);
        }
      }
    }

    // 🏢 CREATE VENUE-INITIATED OFFERS TO MULTIPLE ARTISTS
    console.log('🏢 Creating venue-initiated show requests...');
    
    const venueOfferScenarios = [
      { billing: 'headliner', baseAmount: 600 },
      { billing: 'support', baseAmount: 300 },
      { billing: 'co-headliner', baseAmount: 500 },
      { billing: 'headliner', baseAmount: 800 },
      { billing: 'support', baseAmount: 250 }
    ];
    
    // Create offers to different artists
    for (let i = 0; i < Math.min(venueOfferScenarios.length, venues.length); i++) {
      const venue = venues[i];
      const artist = artists[i + 10]; // Use different artists for venue offers
      const scenario = venueOfferScenarios[i];
      const requestDate = new Date();
      requestDate.setDate(requestDate.getDate() + 60 + (i * 15));
      const amount = scenario.baseAmount + Math.floor(Math.random() * 200); // Add some variation
      
      console.log(`🏢 Creating ${scenario.billing} offer from ${venue.name} to ${artist.name}...`);

      const venueOffer = await prisma.showRequest.create({
        data: {
          artistId: artist.id,
          venueId: venue.id,
          createdById: systemUser.id,
          title: `${artist.name} at ${venue.name} (${scenario.billing})`,
          description: `${venue.name} would love to host ${artist.name} for an unforgettable ${scenario.billing} show!`,
          requestedDate: requestDate,
          initiatedBy: 'VENUE',
          status: 'OPEN',
          targetLocations: [venue.name],
          genres: artist.genres || ['rock', 'indie'],
          amount: amount,
          capacity: venue.capacity,
          ageRestriction: 'ALL_AGES',
          billingPosition: scenario.billing,
          message: getBillingMessage(venue.name, scenario.billing, amount, venue.capacity)
        }
      });

      console.log(`✅ Created ${scenario.billing} offer: ${venueOffer.title} ($${amount})`);
      totalRequests++;
    }

    // 🎯 CREATE COMPREHENSIVE LIGHTNING BOLT TEST DATA
    console.log('⚡ Creating comprehensive Lightning Bolt test scenarios...');
    
    // Find Lightning Bolt specifically (our test case artist)
    const lightningBolt = artists.find(a => a.name?.toLowerCase().includes('lightning bolt'));
    
    if (!lightningBolt) {
      console.log('⚠️ Lightning Bolt not found, using first available artist');
      return;
    }
    
    console.log(`🎸 Found Lightning Bolt: ${lightningBolt.name} (ID: ${lightningBolt.id})`);
    console.log(`🏢 Available venues: ${venues.map(v => v.name).join(', ')}`);
    console.log(`🎭 Available artists: ${artists.slice(0, 10).map(a => a.name).join(', ')}...`);
    
    // Get other artists for lineup diversity (exclude Lightning Bolt)
    const otherArtists = artists.filter(a => a.id !== lightningBolt.id).slice(0, 15);
    
    let confirmedShowsCreated = 0;
    let lightningBoltRequests = 0;
    
    // 🎯 SCENARIO 1: Lightning Bolt as HEADLINER with mixed support act statuses
    console.log('\n🎯 SCENARIO 1: Lightning Bolt headlining with mixed lineup statuses');
    
    const headlinerShows = [
      {
        title: 'Lightning Bolt + Support at Lost Bag',
        venue: venues.find(v => v.name?.toLowerCase().includes('lost bag')) || venues[0],
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        supportActs: [
          { artist: otherArtists[0], status: 'CONFIRMED' },
          { artist: otherArtists[1], status: 'PENDING' }, // This creates our test case!
        ],
        ticketPrice: 25,
        guarantee: 1500
      },
      {
        title: 'Noise Festival Headliner',
        venue: venues[1] || venues[0],
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        supportActs: [
          { artist: otherArtists[2], status: 'CONFIRMED' },
          { artist: otherArtists[3], status: 'CONFIRMED' },
          { artist: otherArtists[4], status: 'PENDING' },
        ],
        ticketPrice: 30,
        guarantee: 2000
      },
      {
        title: 'Experimental Music Showcase',
        venue: venues[2] || venues[0],
        date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        supportActs: [
          { artist: otherArtists[5], status: 'CONFIRMED' },
        ],
        ticketPrice: 20,
        guarantee: 1200
      }
    ];
    
    for (const showData of headlinerShows) {
      console.log(`\n🎤 Creating headliner show: ${showData.title}`);
      
      // 1. Create show request
      const showRequest = await prisma.showRequest.create({
        data: {
          artistId: lightningBolt.id,
          venueId: null,
          createdById: systemUser.id,
          title: showData.title,
          description: `${lightningBolt.name} headlining with ${showData.supportActs.length} support acts`,
          requestedDate: showData.date,
          initiatedBy: 'ARTIST',
          status: 'CONFIRMED',
          targetLocations: ['Multi-city tour'],
          genres: lightningBolt.genres || ['experimental', 'noise'],
          billingPosition: 'headliner'
        }
      });
      
      // 2. Create winning bid
      const winningBid = await prisma.showRequestBid.create({
        data: {
          showRequestId: showRequest.id,
          venueId: showData.venue.id,
          bidderId: systemUser.id,
          amount: showData.guarantee,
          message: `Confirmed headliner booking for ${showData.title}`,
          status: 'ACCEPTED',
          proposedDate: showData.date,
          billingPosition: 'headliner',
          lineupPosition: 1,
          setLength: 75,
          billingNotes: 'Headliner slot with full production support'
        }
      });
      
      // 3. Create show
      const show = await prisma.show.create({
        data: {
          title: showData.title,
          date: showData.date,
          venueId: showData.venue.id,
          description: `${lightningBolt.name} headlining experimental noise show`,
          ticketPrice: showData.ticketPrice,
          status: 'CONFIRMED',
          createdById: systemUser.id,
          capacity: showData.venue.capacity || 250,
          notes: `Created from show request: ${showRequest.id}`
        }
      });
      
      // 4. Add Lightning Bolt to lineup as confirmed headliner
      await prisma.showLineup.create({
        data: {
          showId: show.id,
          artistId: lightningBolt.id,
          status: 'CONFIRMED',
          billingPosition: 'HEADLINER',
          setLength: 75,
          performanceOrder: 1,
          guarantee: showData.guarantee
        }
      });
      
      // 5. Add support acts with varied statuses
      for (let i = 0; i < showData.supportActs.length; i++) {
        const supportAct = showData.supportActs[i];
        console.log(`     Adding ${supportAct.artist.name} as ${supportAct.status} support`);
        
        await prisma.showLineup.create({
          data: {
            showId: show.id,
            artistId: supportAct.artist.id,
            status: supportAct.status,
            billingPosition: 'SUPPORT',
            setLength: 30,
            performanceOrder: i + 2,
            guarantee: 200 + (i * 50) // Varied support guarantees
          }
        });
      }
      
      confirmedShowsCreated++;
      console.log(`✅ Created headliner show with ${showData.supportActs.length} support acts`);
    }
    
    // 🎯 SCENARIO 2: Lightning Bolt as SUPPORT ACT with different statuses
    console.log('\n🎯 SCENARIO 2: Lightning Bolt as support act with different statuses');
    
    const supportShows = [
      {
        title: 'Indie Rock Night',
        venue: venues[3] || venues[0],
        date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
        headliner: otherArtists[6],
        lightningBoltStatus: 'CONFIRMED',
        otherSupport: [{ artist: otherArtists[7], status: 'PENDING' }],
        guarantee: 800
      },
      {
        title: 'Underground Festival',
        venue: venues[4] || venues[0],
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        headliner: otherArtists[8],
        lightningBoltStatus: 'PENDING', // Lightning Bolt pending!
        otherSupport: [
          { artist: otherArtists[9], status: 'CONFIRMED' },
          { artist: otherArtists[10], status: 'CONFIRMED' }
        ],
        guarantee: 600
      }
    ];
    
    for (const showData of supportShows) {
      console.log(`\n🎵 Creating support show: ${showData.title} (Lightning Bolt: ${showData.lightningBoltStatus})`);
      
      // 1. Create show request (initiated by headliner)
      const showRequest = await prisma.showRequest.create({
        data: {
          artistId: showData.headliner.id,
          venueId: null,
          createdById: systemUser.id,
          title: showData.title,
          description: `Multi-artist show with ${showData.headliner.name} headlining`,
          requestedDate: showData.date,
          initiatedBy: 'ARTIST',
          status: 'CONFIRMED',
          targetLocations: ['Local scene'],
          genres: ['indie', 'rock', 'experimental'],
          billingPosition: 'headliner'
        }
      });
      
      // 2. Create winning bid
      const winningBid = await prisma.showRequestBid.create({
        data: {
          showRequestId: showRequest.id,
          venueId: showData.venue.id,
          bidderId: systemUser.id,
          amount: 2000,
          message: `Multi-artist show booking confirmed`,
          status: 'ACCEPTED',
          proposedDate: showData.date,
          billingPosition: 'headliner',
          lineupPosition: 1,
          setLength: 60
        }
      });
      
      // 3. Create show
      const show = await prisma.show.create({
        data: {
          title: showData.title,
          date: showData.date,
          venueId: showData.venue.id,
          description: `Multi-artist showcase featuring ${showData.headliner.name}`,
          ticketPrice: 22,
          status: 'CONFIRMED',
          createdById: systemUser.id,
          capacity: showData.venue.capacity || 200,
          notes: `Created from show request: ${showRequest.id}`
        }
      });
      
      // 4. Add headliner
      await prisma.showLineup.create({
        data: {
          showId: show.id,
          artistId: showData.headliner.id,
          status: 'CONFIRMED',
          billingPosition: 'HEADLINER',
          setLength: 60,
          performanceOrder: 1,
          guarantee: 1200
        }
      });
      
      // 5. Add Lightning Bolt as support
      await prisma.showLineup.create({
        data: {
          showId: show.id,
          artistId: lightningBolt.id,
          status: showData.lightningBoltStatus, // CONFIRMED or PENDING
          billingPosition: 'SUPPORT',
          setLength: 45,
          performanceOrder: 2,
          guarantee: showData.guarantee
        }
      });
      
      // 6. Add other support acts
      for (let i = 0; i < showData.otherSupport.length; i++) {
        const supportAct = showData.otherSupport[i];
        await prisma.showLineup.create({
          data: {
            showId: show.id,
            artistId: supportAct.artist.id,
            status: supportAct.status,
            billingPosition: 'SUPPORT',
            setLength: 30,
            performanceOrder: i + 3,
            guarantee: 300
          }
        });
      }
      
      confirmedShowsCreated++;
      console.log(`✅ Created support show (Lightning Bolt: ${showData.lightningBoltStatus})`);
    }
    
    // 🎯 SCENARIO 3: Lightning Bolt OPEN SHOW REQUESTS with diverse venue bids
    console.log('\n🎯 SCENARIO 3: Lightning Bolt open show requests with diverse bids');
    
    const openRequests = [
      {
        title: 'Lightning Bolt East Coast Tour',
        date: new Date(Date.now() + 105 * 24 * 60 * 60 * 1000),
        targetLocations: ['Boston, MA', 'New York, NY', 'Philadelphia, PA'],
        description: 'Looking for venues for east coast tour dates'
      },
      {
        title: 'Lightning Bolt Midwest Run',
        date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        targetLocations: ['Chicago, IL', 'Detroit, MI', 'Minneapolis, MN'],
        description: 'Seeking midwest venues for experimental noise tour'
      },
      {
        title: 'Lightning Bolt West Coast Shows',
        date: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000),
        targetLocations: ['Portland, OR', 'Seattle, WA', 'San Francisco, CA'],
        description: 'West coast tour seeking underground venues'
      }
    ];
    
    for (const requestData of openRequests) {
      console.log(`\n📋 Creating open request: ${requestData.title}`);
      
      // Create show request
      const showRequest = await prisma.showRequest.create({
        data: {
          artistId: lightningBolt.id,
          venueId: null,
          createdById: systemUser.id,
          title: requestData.title,
          description: requestData.description,
          requestedDate: requestData.date,
          initiatedBy: 'ARTIST',
          status: 'OPEN', // Open for bids
          targetLocations: requestData.targetLocations,
          genres: lightningBolt.genres || ['experimental', 'noise', 'rock'],
          billingPosition: 'headliner'
        }
      });
      
      // Create diverse bids from different venues with different statuses
      const bidStatuses = ['PENDING', 'HOLD', 'ACCEPTED'];
      const bidAmounts = [800, 1200, 1500, 2000, 2500];
      
      for (let i = 0; i < Math.min(venues.length, 5); i++) {
        const venue = venues[i];
        const status = bidStatuses[i % bidStatuses.length];
        const amount = bidAmounts[i % bidAmounts.length];
        
        await prisma.showRequestBid.create({
          data: {
            showRequestId: showRequest.id,
            venueId: venue.id,
            bidderId: systemUser.id,
            amount: amount,
            message: `${venue.name} interested in booking Lightning Bolt for $${amount}`,
            status: status,
            proposedDate: requestData.date,
            billingPosition: 'headliner',
            lineupPosition: 1,
            setLength: 60,
            billingNotes: `${status} bid from ${venue.name}`
          }
        });
        
        console.log(`     Created ${status} bid from ${venue.name}: $${amount}`);
      }
      
      lightningBoltRequests++;
      console.log(`✅ Created open request with ${Math.min(venues.length, 5)} diverse bids`);
    }

    console.log('⚡ Lightning Bolt comprehensive test data created successfully!');
    
    // Show summary
    const totalBids = await prisma.showRequestBid.count();
    const totalShows = await prisma.show.count();
    const totalLineupEntries = await prisma.showLineup.count();
    const lightningBoltShows = await prisma.showLineup.count({
      where: { artistId: lightningBolt.id }
    });
    
    console.log(`\n📊 Lightning Bolt Test Data Summary:`);
    console.log(`   - ${totalRequests} total show requests from all artists`);
    console.log(`   - ${lightningBoltRequests} open Lightning Bolt show requests with competing bids`);
    console.log(`   - ${confirmedShowsCreated} confirmed shows featuring Lightning Bolt`);
    console.log(`   - ${lightningBoltShows} total Lightning Bolt lineup entries`);
    console.log(`   - ${totalBids} total bids with diverse statuses (PENDING/HOLD/ACCEPTED)`);
    console.log(`   - ${totalShows} total shows in database`);
    console.log(`   - ${totalLineupEntries} total lineup entries`);
    console.log(`\n⚡ Lightning Bolt Scenarios Created:`);
    console.log(`   🎤 HEADLINER scenarios:`);
    console.log(`      - Lightning Bolt confirmed headliner with PENDING support acts`);
    console.log(`      - Lightning Bolt confirmed headliner with mixed support statuses`);
    console.log(`      - Lightning Bolt confirmed headliner with all confirmed support`);
    console.log(`   🎵 SUPPORT scenarios:`);
    console.log(`      - Lightning Bolt CONFIRMED as support act`);
    console.log(`      - Lightning Bolt PENDING as support act (key test case!)`);
    console.log(`   📋 OPEN REQUEST scenarios:`);
    console.log(`      - Multiple open tour requests with diverse venue bids`);
    console.log(`      - Different bid statuses: PENDING, HOLD, ACCEPTED`);
    console.log(`      - Varied financial offers: $800-$2500`);
    console.log(`\n🎯 Timeline Testing Benefits:`);
    console.log(`   ✅ Shows Lightning Bolt as both headliner AND support`);
    console.log(`   ✅ Tests CONFIRMED vs PENDING status logic`);
    console.log(`   ✅ Creates scenarios where Lightning Bolt sees lineup vs competing bids`);
    console.log(`   ✅ Provides diverse data for comprehensive timeline debugging`);
    console.log(`   ✅ No duplicate scenarios - each show is unique`);
    console.log(`   ✅ Proper ShowRequest → ShowRequestBid → Show → ShowLineup workflow`);
    console.log(`   🐛 BUG FIX: Multiple test cases for Lightning Bolt PENDING status timeline behavior!`);

  } catch (error) {
    console.error('❌ Error resetting test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if called directly
if (require.main === module) {
  resetTestData()
    .then(() => {
      console.log('✅ Script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { resetTestData }; 
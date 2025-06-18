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

    // 🎭 CREATE REALISTIC MULTI-ARTIST CONFIRMED SHOWS
    console.log('🎭 Creating diverse confirmed multi-artist shows...');
    
    const multiArtistShows = [
      {
        title: 'Punk & Indie Night',
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        venueId: venues[1].id, // Lost Bag
        headliner: artists.find(a => a.name === 'Against Me!') || artists[0],
        lineup: ['The Menzingers', 'Joyce Manor', 'Local Opener TBD'],
        description: 'Three-band punk lineup with Against Me! headlining',
        ticketPrice: 25,
        guarantee: 2000
      },
      {
        title: 'Hardcore Showcase',
        date: new Date(Date.now() + 52 * 24 * 60 * 60 * 1000),
        venueId: venues[0].id, // Joe's Basement
        headliner: artists.find(a => a.name === 'Minor Threat') || artists[1],
        lineup: ['Fugazi', 'The Body', 'Screaming Females'],
        description: 'Four-band hardcore showcase featuring legendary acts',
        ticketPrice: 30,
        guarantee: 2500
      },
      {
        title: 'Indie Rock Festival',
        date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        venueId: venues[2].id, // Brillobox
        headliner: artists.find(a => a.name === 'Dinosaur Jr.') || artists[2],
        lineup: ['Guided by Voices', 'Sleater-Kinney', 'Bikini Kill', 'Local Support'],
        description: 'Five-band indie rock festival with classic 90s acts',
        ticketPrice: 35,
        guarantee: 3000
      },
      {
        title: 'Folk & Alternative Evening',
        date: new Date(Date.now() + 67 * 24 * 60 * 60 * 1000),
        venueId: venues[3].id, // First Avenue
        headliner: artists.find(a => a.name === 'Ani DiFranco') || artists[3],
        lineup: ['Henry Rollins (spoken word)', 'The Replacements', 'Opening Act TBD'],
        description: 'Diverse evening mixing folk, punk, and spoken word',
        ticketPrice: 28,
        guarantee: 1800
      }
    ];

    let confirmedShowsCreated = 0;
    
    for (const showData of multiArtistShows) {
      if (showData.headliner) {
        const confirmedShow = await prisma.show.create({
          data: {
            title: showData.title,
            date: showData.date,
            venueId: showData.venueId,
            artistId: showData.headliner.id, // Primary artist
            description: showData.description,
            ticketPrice: showData.ticketPrice,
            status: 'CONFIRMED',
            createdById: systemUser.id,
            guarantee: showData.guarantee,
            // 🎯 MULTI-ARTIST LINEUP INFO - This is what creates the multi-band shows!
            notes: `LINEUP: ${showData.headliner.name} (headliner) + ${showData.lineup.join(' + ')}`,
            capacity: venues.find(v => v.id === showData.venueId)?.capacity || 200
          }
        });
        
        console.log(`✅ Created multi-artist show: ${showData.title}`);
        console.log(`   🎤 Headliner: ${showData.headliner.name}`);
        console.log(`   🎵 Supporting acts: ${showData.lineup.join(', ')}`);
        confirmedShowsCreated++;
      }
    }

    console.log('✅ Test data reset completed successfully!');
    
    // Show summary
    const totalBids = await prisma.showRequestBid.count();
    const totalShows = await prisma.show.count();
    const uniqueArtists = new Set(artists.map(a => a.name)).size;
    
    console.log(`\n📊 Summary:`);
    console.log(`   - ${totalRequests} total show requests from ${uniqueArtists} different artists`);
    console.log(`   - ${totalBids} total bids with diverse statuses (PENDING/HOLD/ACCEPTED)`);
    console.log(`   - ${confirmedShowsCreated} confirmed multi-artist shows with full lineups`);
    console.log(`   - ${totalShows} total shows in database`);
    console.log(`   - 🎵 Realistic billing positions: headliner, support, local-support, co-headliner`);
    console.log(`   - 💰 Varied financial offers based on billing position`);
    console.log(`   - 🎭 Complete lineup information with set lengths and other acts`);
    console.log(`   - 🏙️ Multiple artists competing for IDENTICAL dates in same cities!`);
    console.log(`   - 🎯 Venues see realistic competition with multiple bands bidding for same time slots!`);
    console.log(`   - 🎪 Multi-artist confirmed shows with 3-5 bands per lineup!`);

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
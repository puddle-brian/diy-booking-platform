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
    'HEADLINER': [
      `Hey Lightning Bolt! We'd love to have you headline at ${venueName}. $${amount} guarantee with full production support and ${capacity || 'intimate'} capacity crowd that loves experimental music.`,
      `${venueName} calling! We can offer you the headlining spot for $${amount}. Our ${capacity || 'passionate'} person space is perfect for your sound.`,
      `Headlining offer from ${venueName}: $${amount} guarantee. We'll handle promotion and have a killer sound system ready for you.`
    ],
    'CO_HEADLINER': [
      `Co-headlining opportunity at ${venueName}! $${amount} guarantee to share the bill with another established act. Perfect fit for our ${capacity || 'mid-size'} venue.`,
      `${venueName} here - interested in co-headlining with us? $${amount} split billing with strong local promotion support.`
    ],
    'SUPPORT': [
      `Support slot at ${venueName} - $${amount} to open for a killer headliner. Great exposure for ${capacity || 'engaged'} person audience.`,
      `Opening act opportunity: $${amount} at ${venueName}. Perfect way to reach new fans in our market.`
    ],
    'LOCAL_SUPPORT': [
      `Local support slot at ${venueName} - $${amount} to help build the scene. Our ${capacity || 'community-focused'} space loves discovering new acts.`,
      `${venueName} community slot: $${amount} to play with touring acts and connect with local music lovers.`
    ]
  };
  
  const positionMessages = messages[billingPosition] || messages['SUPPORT'];
  return positionMessages[Math.floor(Math.random() * positionMessages.length)];
}

function getBillingNotes(billingPosition) {
  const notes = {
    'HEADLINER': [
      'Full headlining slot with complete production support',
      'Top billing with sound/lights handled',
      'Headline act - venue will handle all promotion'
    ],
    'CO_HEADLINER': [
      'Shared top billing with touring act',
      'Co-headline - equal promotion and stage time',
      'Split headlining duties'
    ],
    'SUPPORT': [
      'Direct support for established headliner',
      'Opening for touring headliner',
      'Support slot with headliner promotion'
    ],
    'LOCAL_SUPPORT': [
      'Local opener building community',
      'Community support slot',
      'Local act supporting touring bands'
    ]
  };
  
  const positionNotes = notes[billingPosition] || notes['SUPPORT'];
  return Math.random() > 0.5 ? positionNotes[Math.floor(Math.random() * positionNotes.length)] : null;
}

// 🎭 Enhanced function to create realistic multi-artist shows with proper ShowLineup entries
async function createRealisticMultiArtistShow(showData, venues, artists, systemUser) {
  console.log(`🎭 Creating realistic multi-artist show: ${showData.title}`);
  
  // Find venue
  const venue = venues.find(v => v.id === showData.venueId);
  if (!venue) {
    console.log(`❌ Venue not found for ${showData.title}`);
    return null;
  }

  // Create the venue-owned show (new architecture)
  const show = await prisma.show.create({
    data: {
      title: showData.title,
      date: showData.date,
      venueId: showData.venueId,
      description: showData.description,
      ticketPrice: showData.ticketPrice,
      status: showData.status || 'CONFIRMED',
      createdById: systemUser.id,
      capacity: venue.capacity,
      doorsOpen: showData.doorsOpen || '7:00 PM',
      showTime: showData.showTime || '8:00 PM',
      curfew: showData.curfew || '12:00 AM'
    }
  });

  // Create ShowLineup entries for each artist
  let totalGuarantee = 0;
  const createdLineupEntries = [];

  for (let i = 0; i < showData.lineup.length; i++) {
    const lineupEntry = showData.lineup[i];
    const artist = artists.find(a => a.name === lineupEntry.artistName);
    
    if (artist) {
      const lineupRecord = await prisma.showLineup.create({
        data: {
          showId: show.id,
          artistId: artist.id,
          billingPosition: lineupEntry.billingPosition,
          setLength: lineupEntry.setLength,
          guarantee: lineupEntry.guarantee,
          status: lineupEntry.status || 'CONFIRMED',
          performanceOrder: i + 1,
          notes: lineupEntry.notes
        }
      });
      
      createdLineupEntries.push(lineupRecord);
      totalGuarantee += lineupEntry.guarantee || 0;
      
      console.log(`  🎤 ${lineupEntry.billingPosition}: ${artist.name} ($${lineupEntry.guarantee}, ${lineupEntry.setLength}min)`);
    } else {
      console.log(`  ❌ Artist not found: ${lineupEntry.artistName}`);
    }
  }

  console.log(`  💰 Total show guarantee: $${totalGuarantee}`);
  console.log(`  🏢 Venue: ${venue.name} (${venue.capacity} capacity)`);
  
  return { show, lineup: createdLineupEntries };
}

// 🎯 Enhanced function specifically for creating diverse Lost Bag scenarios
async function createLostBagDiverseScenarios(venues, artists, systemUser) {
  console.log('🎯 Creating diverse Lost Bag booking scenarios...');
  
  // Find Lost Bag venue
  const lostBag = venues.find(v => v.name?.toLowerCase().includes('lost bag'));
  if (!lostBag) {
    console.log('❌ Lost Bag venue not found - skipping diverse scenarios');
    return;
  }

  console.log(`🏠 Found Lost Bag: ${lostBag.name} (ID: ${lostBag.id})`);
  console.log(`🎸 Available artists: ${artists.map(a => a.name).join(', ')}`);

  // Ensure we have enough artists
  if (artists.length < 10) {
    console.log('❌ Not enough artists found - need at least 10 for diverse scenarios');
    return;
  }

  // 🎭 Create multiple shows with diverse lineup scenarios using REAL artists
  const lostBagShows = [
    {
      title: 'DIY Punk Festival at Lost Bag',
      date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      venueId: lostBag.id,
      description: 'Five-band punk lineup showcasing the best of the underground scene',
      ticketPrice: 15,
      status: 'CONFIRMED',
      doorsOpen: '6:30 PM',
      showTime: '7:30 PM',
      curfew: '11:30 PM',
      lineup: [
        { artistIndex: 0, billingPosition: 'HEADLINER', setLength: 75, guarantee: 1200, status: 'CONFIRMED', notes: 'Full sound and lighting package' },
        { artistIndex: 1, billingPosition: 'CO_HEADLINER', setLength: 60, guarantee: 800, status: 'CONFIRMED', notes: 'Direct support, shared top billing' },
        { artistIndex: 2, billingPosition: 'SUPPORT', setLength: 45, guarantee: 400, status: 'CONFIRMED', notes: 'Perfect fit for this lineup' },
        { artistIndex: 3, billingPosition: 'SUPPORT', setLength: 35, guarantee: 300, status: 'PENDING', notes: 'Waiting on rider confirmation' },
        { artistIndex: 4, billingPosition: 'OPENER', setLength: 25, guarantee: 150, status: 'CONFIRMED', notes: 'Local experimental noise duo' }
      ]
    },
    {
      title: 'Hardcore Matinee at Lost Bag',
      date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000), // 32 days from now
      venueId: lostBag.id,
      description: 'All-ages hardcore show featuring regional and touring acts',
      ticketPrice: 12,
      status: 'CONFIRMED',
      doorsOpen: '2:00 PM',
      showTime: '3:00 PM',
      curfew: '7:00 PM',
      lineup: [
        { artistIndex: 5, billingPosition: 'HEADLINER', setLength: 45, guarantee: 800, status: 'CONFIRMED', notes: 'Legendary hardcore act' },
        { artistIndex: 6, billingPosition: 'CO_HEADLINER', setLength: 45, guarantee: 700, status: 'CONFIRMED', notes: 'Co-headlining set' },
        { artistIndex: 7, billingPosition: 'SUPPORT', setLength: 30, guarantee: 300, status: 'CONFIRMED', notes: 'Heavy support act' },
        { artistIndex: 8, billingPosition: 'LOCAL_SUPPORT', setLength: 20, guarantee: 100, status: 'CANCELLED', notes: 'Cancelled due to van issues' }
      ]
    },
    {
      title: 'Indie Rock Showcase at Lost Bag',
      date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now  
      venueId: lostBag.id,
      description: 'Four-band indie rock showcase',
      ticketPrice: 20,
      status: 'CONFIRMED',
      doorsOpen: '7:00 PM',
      showTime: '8:00 PM',
      curfew: '12:00 AM',
      lineup: [
        { artistIndex: 9, billingPosition: 'HEADLINER', setLength: 80, guarantee: 1500, status: 'CONFIRMED', notes: 'Full catalog performance' },
        { artistIndex: 10, billingPosition: 'SUPPORT', setLength: 50, guarantee: 600, status: 'CONFIRMED', notes: 'Direct support slot' },
        { artistIndex: 11, billingPosition: 'SUPPORT', setLength: 40, guarantee: 500, status: 'PENDING', notes: 'Negotiating rider details' },
        { artistIndex: 12, billingPosition: 'OPENER', setLength: 35, guarantee: 350, status: 'CONFIRMED', notes: 'Opening the show strong' }
      ]
    },
    {
      title: 'Lost Bag Late Night Electronic',
      date: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000), // 38 days from now
      venueId: lostBag.id,
      description: 'Late-night electronic and experimental showcase',
      ticketPrice: 8,
      status: 'PENDING',
      doorsOpen: '9:00 PM',
      showTime: '10:00 PM', 
      curfew: '2:00 AM',
      lineup: [
        { artistIndex: 13, billingPosition: 'HEADLINER', setLength: 60, guarantee: 400, status: 'CONFIRMED', notes: 'Perfect late-night headliner' },
        { artistIndex: 14, billingPosition: 'SUPPORT', setLength: 45, guarantee: 250, status: 'PENDING', notes: 'Checking tour routing' },
        { artistIndex: 15, billingPosition: 'OPENER', setLength: 30, guarantee: 150, status: 'CONFIRMED', notes: 'Great opener for experimental night' }
      ]
    }
  ];

  // Create all the Lost Bag shows with proper lineup architecture
  const createdShows = [];
  for (const showData of lostBagShows) {
    // Convert artistIndex to actual artists
    const lineupWithArtists = showData.lineup.map(entry => ({
      ...entry,
      artistName: artists[entry.artistIndex % artists.length]?.name || 'Unknown Artist'
    }));
    
    const showDataWithArtists = {
      ...showData,
      lineup: lineupWithArtists
    };
    
    const result = await createRealisticMultiArtistShow(showDataWithArtists, venues, artists, systemUser);
    if (result) {
      createdShows.push(result);
    }
  }

  console.log(`✅ Created ${createdShows.length} diverse Lost Bag shows with proper lineups`);
  return createdShows;
}

async function resetTestData() {
  console.log('🧹 Starting enhanced test data reset with diverse Lost Bag scenarios...');
  
  try {
    // Clear existing data (in correct order due to foreign keys)
    console.log('🗑️ Clearing existing test data...');
    
    // Clear ShowLineup entries first
    const deletedLineup = await prisma.showLineup.deleteMany();
    console.log(`✅ Deleted ${deletedLineup.count} show lineup entries`);
    
    // Clear shows
    const deletedShows = await prisma.show.deleteMany();
    console.log(`✅ Deleted ${deletedShows.count} shows`);
    
    // Clear show request bids
    const deletedBids = await prisma.showRequestBid.deleteMany();
    console.log(`✅ Deleted ${deletedBids.count} show request bids`);

    // Clear show requests
    const deletedRequests = await prisma.showRequest.deleteMany();
    console.log(`✅ Deleted ${deletedRequests.count} show requests`);

    console.log('🎯 Generating enhanced test data with proper lineup architecture...');

    // Get system user
    const systemUser = await prisma.user.findFirst({
      where: { email: 'system@diyshows.com' }
    });

    if (!systemUser) {
      throw new Error('System user not found');
    }

    // Get artists and venues
    const artists = await prisma.artist.findMany({
      where: {
        name: {
          not: null,
          not: '',
          notIn: ['Unknown', 'unknown', 'Unknown Artist', 'unknown artist']
        }
      },
      take: 30, // Get more artists for diverse lineups
      select: { id: true, name: true, genres: true }
    });

    const venues = await prisma.venue.findMany({
      take: 15,
      select: { id: true, name: true, capacity: true }
    });

    console.log(`🎸 Found ${artists.length} artists and ${venues.length} venues for test data`);

    // 🎯 CREATE DIVERSE LOST BAG SCENARIOS FIRST
    await createLostBagDiverseScenarios(venues, artists, systemUser);

    // Create some additional multi-artist shows at other venues using real artists
    const additionalShows = [
      {
        title: 'Punk Rock Bowling After-Party',
        date: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
        venueId: venues[0].id, // First venue (not Lost Bag)
        description: 'Four-band punk showcase',
        ticketPrice: 18,
        status: 'CONFIRMED',
        lineup: [
          { artistName: artists[16 % artists.length]?.name || 'Artist 1', billingPosition: 'HEADLINER', setLength: 70, guarantee: 1000, status: 'CONFIRMED' },
          { artistName: artists[17 % artists.length]?.name || 'Artist 2', billingPosition: 'SUPPORT', setLength: 45, guarantee: 500, status: 'CONFIRMED' },
          { artistName: artists[18 % artists.length]?.name || 'Artist 3', billingPosition: 'SUPPORT', setLength: 35, guarantee: 300, status: 'CONFIRMED' },
          { artistName: artists[19 % artists.length]?.name || 'Artist 4', billingPosition: 'OPENER', setLength: 25, guarantee: 150, status: 'CONFIRMED' }
        ]
      },
      {
        title: 'Experimental Noise Night',
        date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        venueId: venues[2]?.id || venues[0].id,
        description: 'Experimental and noise showcase',
        ticketPrice: 10,
        status: 'CONFIRMED', 
        lineup: [
          { artistName: artists[20 % artists.length]?.name || 'Artist 5', billingPosition: 'HEADLINER', setLength: 60, guarantee: 350, status: 'CONFIRMED' },
          { artistName: artists[21 % artists.length]?.name || 'Artist 6', billingPosition: 'SUPPORT', setLength: 45, guarantee: 200, status: 'CONFIRMED' },
          { artistName: artists[22 % artists.length]?.name || 'Artist 7', billingPosition: 'OPENER', setLength: 30, guarantee: 150, status: 'CONFIRMED' }
        ]
      }
    ];

    // Create additional shows
    for (const showData of additionalShows) {
      await createRealisticMultiArtistShow(showData, venues, artists, systemUser);
    }

    // 🎯 CREATE VENUE OFFERS FOR ARTIST PAGES - This is key for testing artist action buttons!
    console.log('🎯 Creating venue offers that artists will see and can act on...');
    
    // Create venue offers that will show up in artist itineraries with action buttons
    const venueOfferScenarios = [
      { venueIndex: 0, artistIndex: 0, billing: 'HEADLINER', amount: 800, status: 'PENDING', daysOut: 30 },
      { venueIndex: 1, artistIndex: 1, billing: 'SUPPORT', amount: 400, status: 'PENDING', daysOut: 35 },
      { venueIndex: 2, artistIndex: 2, billing: 'CO_HEADLINER', amount: 650, status: 'PENDING', daysOut: 40 },
      { venueIndex: 0, artistIndex: 3, billing: 'HEADLINER', amount: 750, status: 'PENDING', daysOut: 45 },
      { venueIndex: 3, artistIndex: 4, billing: 'SUPPORT', amount: 350, status: 'PENDING', daysOut: 50 },
      { venueIndex: 1, artistIndex: 5, billing: 'LOCAL_SUPPORT', amount: 200, status: 'PENDING', daysOut: 55 },
    ];

    let venueOffers = 0;
    for (const scenario of venueOfferScenarios) {
      if (scenario.venueIndex < venues.length && scenario.artistIndex < artists.length) {
        const venue = venues[scenario.venueIndex];
        const artist = artists[scenario.artistIndex];
        const offerDate = new Date();
        offerDate.setDate(offerDate.getDate() + scenario.daysOut);

        // Create venue offer (venue-initiated show request)
        const venueOffer = await prisma.venueOffer.create({
          data: {
            venueId: venue.id,
            artistId: artist.id,
            createdById: systemUser.id,
            title: `${venue.name} Show Offer`,
            description: `Venue offer for ${scenario.billing} slot`,
            proposedDate: offerDate,
            amount: scenario.amount,
            message: getBillingMessage(venue.name, scenario.billing, scenario.amount, venue.capacity),
            status: scenario.status,
            billingPosition: scenario.billing,
            capacity: venue.capacity,
            ageRestriction: 'ALL_AGES'
          }
        });

        console.log(`  🎤 Created ${scenario.billing} offer: ${venue.name} → ${artist.name} ($${scenario.amount})`);
        venueOffers++;
      }
    }

    // Create some show requests and bids for ongoing booking activity
    console.log('🎵 Creating show requests and bids for active booking scenarios...');
    
    const popularCities = ['Boston, MA', 'Portland, OR', 'Nashville, TN', 'Austin, TX'];
    let totalRequests = 0;

    // Create fewer show requests but with more diverse statuses
    for (let cityIndex = 0; cityIndex < 2; cityIndex++) { // Reduced from 4 to 2 cities
      const city = popularCities[cityIndex];
      const sharedDate = new Date();
      sharedDate.setDate(sharedDate.getDate() + 35 + (cityIndex * 15));
      
      // 3 artists competing for same date in same city
      const competingArtists = artists.slice(cityIndex * 3, (cityIndex * 3) + 3);
      
      for (const artist of competingArtists) {
        if (!artist.name) continue;
        
        const showRequest = await prisma.showRequest.create({
          data: {
            artistId: artist.id,
            createdById: systemUser.id,
            title: `${artist.name} - ${city}`,
            description: `Looking for a venue in ${city} for a ${artist.genres?.join('/')} show.`,
            requestedDate: sharedDate,
            initiatedBy: 'ARTIST',
            status: 'OPEN',
            targetLocations: [city],
            genres: artist.genres || ['rock', 'indie'],
            billingPosition: 'headliner'
          }
        });

        totalRequests++;

        // Create 2-3 bids with diverse statuses
        const biddingVenues = venues.slice(0, 3);
        for (let j = 0; j < biddingVenues.length; j++) {
          const venue = biddingVenues[j];
          const guaranteeAmount = Math.floor(Math.random() * 600) + 300;
          
          // More diverse bid statuses
          const statusOptions = ['PENDING', 'HOLD', 'ACCEPTED', 'REJECTED'];
          const statusWeights = [0.4, 0.3, 0.2, 0.1];
          const bidStatus = weightedRandom(statusOptions, statusWeights);
          
          const billingOptions = ['HEADLINER', 'SUPPORT', 'LOCAL_SUPPORT'];
          const billingWeights = [0.6, 0.3, 0.1];
          const selectedBilling = weightedRandom(billingOptions, billingWeights);
          
          await prisma.showRequestBid.create({
            data: {
              showRequestId: showRequest.id,
              venueId: venue.id,
              bidderId: systemUser.id,
              amount: guaranteeAmount,
              message: getBillingMessage(venue.name, selectedBilling, guaranteeAmount, venue.capacity),
              status: bidStatus,
              proposedDate: sharedDate,
              billingPosition: selectedBilling,
              setLength: selectedBilling === 'HEADLINER' ? 75 : (selectedBilling === 'SUPPORT' ? 45 : 30),
              billingNotes: getBillingNotes(selectedBilling)
            }
          });
        }
      }
    }

    console.log('✅ Enhanced test data reset completed successfully!');
    
    // Show summary
    const totalBids = await prisma.showRequestBid.count();
    const totalShows = await prisma.show.count();
    const totalLineupEntries = await prisma.showLineup.count();
    const totalVenueOffers = await prisma.venueOffer.count();
    const lostBagShows = await prisma.show.count({
      where: { venue: { name: { contains: 'Lost Bag', mode: 'insensitive' } } }
    });
    
    console.log(`\n📊 ENHANCED TEST DATA SUMMARY:`);
    console.log(`   🎭 ${totalShows} total shows with proper lineup architecture`);
    console.log(`   🎵 ${totalLineupEntries} individual artist lineup slots`);
    console.log(`   🏠 ${lostBagShows} diverse Lost Bag shows with 3-5 band lineups`);
    console.log(`   💰 ${totalBids} venue bids with realistic statuses (PENDING/HOLD/ACCEPTED/DECLINED)`);
    console.log(`   🎤 ${totalVenueOffers} venue offers for artists to review (PERFECT FOR TESTING ACTION BUTTONS!)`);
    console.log(`   🎯 ${totalRequests} active show requests creating booking competition`);
    console.log(`   ✨ Proper ShowLineup architecture with billing positions and guarantees`);
    console.log(`   🎪 Diverse lineup scenarios: festivals, matinees, late shows, showcases`);
    console.log(`   📅 Multiple shows on same dates creating realistic venue conflicts`);
    console.log(`   🔄 Mixed show statuses: CONFIRMED, PENDING, with lineup changes`);
    console.log(`\n🎯 FOR ARTIST PAGE TESTING:`);
    console.log(`   👤 Visit any artist page to see their shows, venue offers, and action buttons`);
    console.log(`   🔘 Test Accept/Decline/Hold buttons on venue offers`);
    console.log(`   📋 View their confirmed shows in timeline format`);
    console.log(`   🤝 See their role in multi-artist lineups (HEADLINER, SUPPORT, etc.)`);
    console.log(`\n🏢 FOR VENUE PAGE TESTING:`);
    console.log(`   🏠 Visit Lost Bag venue page to see diverse multi-artist shows`);
    console.log(`   📊 Multiple shows with different statuses and lineups`);
    console.log(`   🎭 Complex booking scenarios with 3-5 band lineups`);

  } catch (error) {
    console.error('❌ Error resetting test data:', error);
    throw error;
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
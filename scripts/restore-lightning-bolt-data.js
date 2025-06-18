const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreLightningBoltData() {
  console.log('🔧 Restoring rich timeline data for Lightning Bolt...\n');
  
  try {
    // Find lightning bolt and venues
    const lightningBolt = await prisma.artist.findFirst({
      where: { name: { contains: 'lightning bolt', mode: 'insensitive' } }
    });

    if (!lightningBolt) {
      console.log('❌ Lightning bolt not found');
      return;
    }

    console.log('✅ Found lightning bolt:', lightningBolt.name);

    // Get a variety of venues for rich data
    const venues = await prisma.venue.findMany({
      include: { location: true },
      take: 15
    });

    console.log('✅ Found', venues.length, 'venues for test data');

    // Find a system user
    let systemUser = await prisma.user.findFirst({
      where: { username: 'system' }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          username: 'system',
          email: 'system@diyshows.com',
          verified: true
        }
      });
    }

    // Create rich show request data - multiple tour requests with lots of competing venues
    const tourRequests = [
      {
        title: 'Lightning Bolt East Coast Tour - NYC',
        description: 'Looking for DIY venues in NYC area for late summer tour',
        requestedDate: new Date('2025-08-15'),
        targetLocations: ['New York, NY', 'Brooklyn, NY', 'Queens, NY'],
        amount: 800,
        expectedBids: 7
      },
      {
        title: 'Lightning Bolt Midwest Run - Chicago',
        description: 'Need solid venue in Chicago for September tour',
        requestedDate: new Date('2025-09-12'),
        targetLocations: ['Chicago, IL', 'Milwaukee, WI'],
        amount: 650,
        expectedBids: 6
      },
      {
        title: 'Lightning Bolt West Coast - Portland',
        description: 'Looking for all-ages venue in Portland',
        requestedDate: new Date('2025-10-08'),
        targetLocations: ['Portland, OR', 'Seattle, WA'],
        amount: 700,
        expectedBids: 8
      },
      {
        title: 'Lightning Bolt South Tour - Austin',
        description: 'Need venue for SXSW warm-up shows',
        requestedDate: new Date('2025-03-10'),
        targetLocations: ['Austin, TX', 'Dallas, TX', 'Houston, TX'],
        amount: 900,
        expectedBids: 9
      },
      {
        title: 'Lightning Bolt New England - Boston',
        description: 'Home base shows, looking for multiple venue options',
        requestedDate: new Date('2025-11-22'),
        targetLocations: ['Boston, MA', 'Cambridge, MA', 'Providence, RI'],
        amount: 750,
        expectedBids: 6
      }
    ];

    console.log('\n🎯 Creating', tourRequests.length, 'show requests with competing venues...');

    for (let i = 0; i < tourRequests.length; i++) {
      const request = tourRequests[i];
      
      // Create the show request
      const showRequest = await prisma.showRequest.create({
        data: {
          artistId: lightningBolt.id,
          title: request.title,
          description: request.description,
          requestedDate: request.requestedDate,
          initiatedBy: 'ARTIST',
          createdById: systemUser.id,
          status: 'OPEN',
          amount: request.amount,
          targetLocations: request.targetLocations,
          genres: ['noise rock', 'experimental', 'math rock'],
          billingPosition: 'HEADLINER',
          setLength: 45,
          capacity: 200,
          ageRestriction: 'ALL_AGES'
        }
      });

      console.log('  ✅ Created:', request.title);

      // Create multiple competing venue bids
      const selectedVenues = venues.slice(i * 3, i * 3 + request.expectedBids);
      
      for (let j = 0; j < selectedVenues.length; j++) {
        const venue = selectedVenues[j];
        const bidAmount = request.amount + (Math.random() * 400 - 200); // Vary bids ±$200
        
        const bidStatuses = ['PENDING', 'ACCEPTED', 'HOLD', 'REJECTED'];
        const status = j === 0 ? 'ACCEPTED' : // First bid is accepted
                     j === 1 ? 'HOLD' :    // Second bid on hold
                     bidStatuses[Math.floor(Math.random() * bidStatuses.length)];

        await prisma.showRequestBid.create({
          data: {
            showRequestId: showRequest.id,
            venueId: venue.id,
            bidderId: systemUser.id,
            artistId: lightningBolt.id,
            proposedDate: request.requestedDate,
            amount: Math.round(bidAmount),
            status: status,
            message: `We'd love to have Lightning Bolt play at ${venue.name}! ${status === 'ACCEPTED' ? 'This offer looks great.' : status === 'HOLD' ? 'Considering this option.' : 'Competitive offer from our venue.'}`,
            billingPosition: 'HEADLINER',
            setLength: 45 + Math.floor(Math.random() * 20), // 45-65 minutes
            lineupPosition: 1
          }
        });
      }

      console.log('    💰 Created', selectedVenues.length, 'competing venue bids');
    }

    // Create additional venue-initiated offers (venues reaching out to lightning bolt)
    console.log('\n🎯 Creating venue-initiated offers...');
    
    const venueOffers = [
      {
        venueId: venues[0].id,
        title: `${venues[0].name} Summer Series`,
        description: `We'd love Lightning Bolt for our summer noise series`,
        proposedDate: new Date('2025-07-20'),
        amount: 1200
      },
      {
        venueId: venues[2].id,
        title: `${venues[2].name} Anniversary Show`,
        description: `Celebrating our 5th anniversary with Lightning Bolt`,
        proposedDate: new Date('2025-08-30'),
        amount: 1500
      },
      {
        venueId: venues[4].id,
        title: `${venues[4].name} Fall Festival`,
        description: `Headliner spot for our fall experimental festival`,
        proposedDate: new Date('2025-10-15'),
        amount: 2000
      },
      {
        venueId: venues[6].id,
        title: `${venues[6].name} New Year Show`,
        description: `Ring in 2026 with Lightning Bolt`,
        proposedDate: new Date('2025-12-31'),
        amount: 2500
      }
    ];

    for (const offer of venueOffers) {
      const venue = venues.find(v => v.id === offer.venueId);
      
      await prisma.showRequest.create({
        data: {
          artistId: lightningBolt.id,
          venueId: offer.venueId,
          title: offer.title,
          description: offer.description,
          requestedDate: offer.proposedDate,
          initiatedBy: 'VENUE',
          createdById: systemUser.id,
          status: 'OPEN',
          amount: offer.amount,
          billingPosition: 'HEADLINER',
          setLength: 60,
          capacity: venue.capacity || 300,
          ageRestriction: 'ALL_AGES',
          targetLocations: [`${venue.location?.city || 'Unknown'}, ${venue.location?.stateProvince || 'Unknown'}`]
        }
      });

      console.log('  ✅ Created venue offer:', offer.title, 'from', venue.name);
    }

    // Create additional confirmed shows (past and future)
    console.log('\n🎯 Creating additional confirmed shows...');
    
    const confirmedShows = [
      {
        title: 'Lightning Bolt + Support',
        venue: venues[1],
        date: new Date('2025-06-15'),
        status: 'CONFIRMED'
      },
      {
        title: 'Noise Festival',
        venue: venues[3],
        date: new Date('2025-05-20'),
        status: 'CONFIRMED'
      },
      {
        title: 'Lightning Bolt Record Release',
        venue: venues[5],
        date: new Date('2025-09-08'),
        status: 'CONFIRMED'
      },
      {
        title: 'Underground Showcase',
        venue: venues[7],
        date: new Date('2025-04-12'),
        status: 'CONFIRMED'
      }
    ];

    for (const showData of confirmedShows) {
      const show = await prisma.show.create({
        data: {
          title: showData.title,
          venueId: showData.venue.id,
          date: showData.date,
          status: showData.status,
          capacity: showData.venue.capacity || 200,
          ageRestriction: 'ALL_AGES',
          createdById: systemUser.id
        }
      });

      // Add to lineup
      await prisma.showLineup.create({
        data: {
          showId: show.id,
          artistId: lightningBolt.id,
          billingPosition: 'HEADLINER',
          performanceOrder: 1,
          setLength: 60,
          guarantee: 800 + Math.floor(Math.random() * 400),
          status: 'CONFIRMED'
        }
      });

      console.log('  ✅ Created show:', showData.title, 'at', showData.venue.name);
    }

    // Clean up old duplicate venue offers
    console.log('\n🧹 Cleaning up duplicate venue offers...');
    await prisma.venueOffer.deleteMany({
      where: { artistId: lightningBolt.id }
    });

    console.log('\n🎉 Lightning Bolt timeline restoration complete!');
    console.log('📊 Summary:');
    console.log('  - 5 show requests with 6-9 competing venue bids each');
    console.log('  - 4 venue-initiated offers');
    console.log('  - 5 confirmed/completed shows (including original)');
    console.log('  - Total expected timeline items: ~45+');
    console.log('\n✨ Lightning Bolt should now have a rich, diverse timeline!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreLightningBoltData(); 
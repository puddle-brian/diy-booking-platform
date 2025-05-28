import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { RequestStatus, BidStatus, AgeRestriction, ShowStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting comprehensive data reset...');

    // First, clear existing tour requests, bids, and shows
    await prisma.bid.deleteMany({});
    await prisma.tourRequest.deleteMany({});
    await prisma.show.deleteMany({});
    console.log('🧹 Cleared existing tour requests, bids, and shows');

    // Get debug artists and venues - use specific IDs to ensure we get the right ones
    const debugArtists = await prisma.artist.findMany({
      where: {
        OR: [
          { id: '1748101913848' }, // lightning bolt (original)
          { id: '1' }, // Against Me!
          { id: '2' }, // The Menzingers
          { id: '3' }, // Patti Smith
          { id: '5' }, // Joyce Manor
        ]
      }
    });

    const debugVenues = await prisma.venue.findMany({
      where: {
        OR: [
          { name: { contains: 'Lost Bag', mode: 'insensitive' } },
          { name: { contains: 'Joe\'s Basement', mode: 'insensitive' } },
          { name: { contains: 'AS220', mode: 'insensitive' } },
          { name: { contains: 'Community Arts', mode: 'insensitive' } },
          { name: { contains: 'The Independent', mode: 'insensitive' } },
          { name: { contains: 'Underground', mode: 'insensitive' } },
          { name: { contains: 'VFW', mode: 'insensitive' } }
        ]
      }
    });

    // Get system user for creating data
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

    console.log(`🎵 Found ${debugArtists.length} debug artists:`, debugArtists.map(a => `${a.id}: ${a.name}`));
    console.log(`🏢 Found ${debugVenues.length} debug venues`);

    // Create comprehensive tour requests
    const tourRequests = [];
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Lightning Bolt - East Coast Tour (SHOWCASE BIDDING SYSTEM - 8+ bids)
    if (debugArtists.find(a => a.id === '1748101913848')) {
      const lightningBolt = debugArtists.find(a => a.id === '1748101913848');
      
      if (lightningBolt) {
        tourRequests.push({
          title: 'Lightning Bolt East Coast Noise Tour',
          description: 'Seeking experimental venues for our intense noise rock performances. We bring our own amps and need venues that can handle LOUD music. Looking for 3-5 dates between Providence and Brooklyn.',
          artistId: lightningBolt.id,
          startDate: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(futureDate.getTime() + 21 * 24 * 60 * 60 * 1000),
          status: RequestStatus.ACTIVE,
          genres: ['noise rock', 'experimental', 'avant-garde'],
          targetLocations: [],
          createdById: systemUser.id
        });
      }
    }

    // The Menzingers - Summer Festival Circuit (HOLD MANAGEMENT SHOWCASE - 6+ bids)
    if (debugArtists.find(a => a.id === '2')) {
      const menzingers = debugArtists.find(a => a.id === '2');
      
      if (menzingers) {
        tourRequests.push({
          title: 'Menzingers Summer Festival Run',
          description: 'Looking for mid-size venues and festivals for our summer tour. We have a strong following and can guarantee good turnout. Seeking 4-6 dates in the Northeast.',
          artistId: menzingers.id,
          startDate: new Date(futureDate.getTime() + 45 * 24 * 60 * 60 * 1000),
          endDate: new Date(futureDate.getTime() + 75 * 24 * 60 * 60 * 1000),
          status: RequestStatus.ACTIVE,
          genres: ['punk rock', 'indie rock', 'alternative'],
          targetLocations: [],
          createdById: systemUser.id
        });
      }
    }

    // Against Me! - Acoustic Tour (ACCEPTED BIDS SHOWCASE - 5+ bids)
    if (debugArtists.find(a => a.id === '1')) {
      const againstMe = debugArtists.find(a => a.id === '1');
      
      if (againstMe) {
        tourRequests.push({
          title: 'Against Me! Intimate Acoustic Shows',
          description: 'Laura Jane Grace solo acoustic performances. Looking for intimate venues, coffee shops, and small clubs. Perfect for venues under 200 capacity.',
          artistId: againstMe.id,
          startDate: new Date(futureDate.getTime() + 20 * 24 * 60 * 60 * 1000),
          endDate: new Date(futureDate.getTime() + 35 * 24 * 60 * 60 * 1000),
          status: RequestStatus.ACTIVE,
          genres: ['folk punk', 'acoustic', 'singer-songwriter'],
          targetLocations: [],
          createdById: systemUser.id
        });
      }
    }

    // Create the tour requests in database
    const createdTourRequests = [];
    for (const tourRequest of tourRequests) {
      const created = await prisma.tourRequest.create({
        data: tourRequest
      });
      createdTourRequests.push(created);
    }

    console.log(`✅ Created ${createdTourRequests.length} tour requests`);

    // 🎯 CREATE SOPHISTICATED BIDS WITH REALISTIC SCENARIOS
    const createdBids = [];

    for (const tourRequest of createdTourRequests) {
      const artist = debugArtists.find(a => a.id === tourRequest.artistId);
      
      // Create MANY bids per tour request to showcase the system
      let numBids = 8; // Default to 8 bids per request
      
      if (artist?.name.includes('Lightning Bolt')) {
        numBids = 10; // Lightning Bolt gets the most bids
      } else if (artist?.name.includes('Menzingers')) {
        numBids = 8; // Menzingers gets many bids
      } else if (artist?.name.includes('Against Me')) {
        numBids = 6; // Against Me gets moderate bids
      }
      
      // Shuffle venues to get random selection
      const shuffledVenues = [...debugVenues].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < Math.min(numBids, shuffledVenues.length); i++) {
        const venue = shuffledVenues[i];
        
        // Create realistic bid dates within tour window
        const tourDuration = tourRequest.endDate!.getTime() - tourRequest.startDate!.getTime();
        const randomOffset = Math.random() * tourDuration;
        const proposedDate = new Date(tourRequest.startDate!.getTime() + randomOffset);

        // 🎯 SOPHISTICATED STATUS DISTRIBUTION FOR REALISTIC TESTING
        let status: BidStatus = BidStatus.PENDING;
        
        if (artist?.id === '1748101913848') {
          // Lightning Bolt: Showcase ALL bid statuses for comprehensive testing
          if (i === 0) {
            status = BidStatus.ACCEPTED; // First bid accepted
          } else if (i === 1) {
            status = BidStatus.HOLD; // 1st hold position
          } else if (i === 2) {
            status = BidStatus.HOLD; // 2nd hold position
          } else if (i === 3) {
            status = BidStatus.PENDING; // Fresh pending bid
          } else if (i === 4) {
            status = BidStatus.REJECTED; // Artist declined
          } else if (i === 5) {
            status = BidStatus.WITHDRAWN; // Venue withdrew
          } else if (i === 6) {
            status = BidStatus.PENDING; // More pending for testing
          } else {
            status = BidStatus.PENDING; // Even more pending
          }
        } else if (artist?.id === '2') {
          // Menzingers: Showcase HOLD SYSTEM with many holds and pending bids
          if (i === 0) {
            status = BidStatus.HOLD; // 1st hold position
          } else if (i === 1) {
            status = BidStatus.HOLD; // 2nd hold position
          } else if (i === 2) {
            status = BidStatus.HOLD; // 3rd hold position
          } else if (i === 3) {
            status = BidStatus.PENDING; // Fresh pending bid
          } else if (i === 4) {
            status = BidStatus.REJECTED; // One rejected
          } else {
            status = BidStatus.PENDING; // More pending bids
          }
        } else if (artist?.id === '1') {
          // Against Me: Showcase ACCEPTED BIDS leading to confirmed shows
          if (i === 0) {
            status = BidStatus.ACCEPTED; // Accepted bid
          } else if (i === 1) {
            status = BidStatus.ACCEPTED; // Another accepted bid
          } else if (i === 2) {
            status = BidStatus.PENDING; // Pending bid
          } else if (i === 3) {
            status = BidStatus.PENDING; // Another pending
          } else {
            status = BidStatus.REJECTED; // Some rejected
          }
        } else {
          // Other artists: Mix of statuses
          const rand = Math.random();
          if (rand < 0.4) {
            status = BidStatus.PENDING;
          } else if (rand < 0.6) {
            status = BidStatus.ACCEPTED;
          } else if (rand < 0.8) {
            status = BidStatus.REJECTED;
          } else {
            status = BidStatus.WITHDRAWN;
          }
        }

        // 🎯 CREATE DETAILED BID WITH ALL FIELDS
        const bidData = {
          tourRequestId: tourRequest.id,
          venueId: venue.id,
          bidderId: systemUser.id,
          proposedDate,
          amount: Math.floor(Math.random() * 800) + 300, // $300-1100
          message: `Hey ${artist?.name}! ${venue.name} would be honored to host your show. We have ${venue.capacity || 150} capacity, great sound system, and an enthusiastic local scene. ${
            i === 0 ? 'We can offer you a headlining slot with full production support!' :
            i === 1 ? 'We\'d love to have you as our featured act for the evening.' :
            i === 2 ? 'Perfect fit for our intimate venue - we specialize in your genre!' :
            i === 3 ? 'Our venue has hosted similar acts and we guarantee a great turnout!' :
            i === 4 ? 'We can provide full backline and professional sound engineering!' :
            'We\'re excited about the possibility of working together!'
          }`,
          status: status,
          
                  // 🎯 HOLD MANAGEMENT - Set hold details for hold status bids
        holdPosition: status === BidStatus.HOLD ? (i <= 2 ? i + 1 : 3) : undefined, // First 3 bids get hold positions 1, 2, 3
        heldAt: status === BidStatus.HOLD ? new Date() : undefined,
        heldUntil: status === BidStatus.HOLD ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : undefined, // 14 days from now
          
          // 🎯 ACCEPTANCE/DECLINE TRACKING
          acceptedAt: status === BidStatus.ACCEPTED ? new Date() : undefined,
          declinedAt: status === BidStatus.REJECTED ? new Date() : undefined,
          declinedReason: status === BidStatus.REJECTED ? 'Schedule conflict' : undefined,
          
          // 🎯 BILLING ORDER - Realistic billing positions
          billingPosition: i === 0 ? 'headliner' :
                          i === 1 ? 'co-headliner' :
                          i === 2 ? 'direct-support' :
                          i === 3 ? 'opener' :
                          'local-opener',
          lineupPosition: i + 1,
          setLength: i === 0 ? 60 : i === 1 ? 45 : i === 2 ? 30 : 25, // Headliner gets longest set
          otherActs: i === 0 ? 'Local opener TBD' :
                    i === 1 ? `Co-headlining with ${artist?.name}` :
                    i === 2 ? `Supporting ${artist?.name}` :
                    `Opening for ${artist?.name}`,
          billingNotes: i === 0 ? 'Full headlining package with production support' :
                       i === 1 ? 'Co-headlining opportunity with equal billing' :
                       i === 2 ? 'Direct support slot with good exposure' :
                       'Opening slot, great for building local fanbase'
        };

        const createdBid = await prisma.bid.create({
          data: bidData
        });
        createdBids.push(createdBid);
      }
    }

    console.log(`✅ Created ${createdBids.length} sophisticated bids with realistic statuses`);

    // 🎯 CREATE CONFIRMED SHOWS (only from accepted bids)
    const acceptedBids = createdBids.filter(bid => bid.status === BidStatus.ACCEPTED);
    const createdShows = [];

    for (const bid of acceptedBids) {
      const tourRequest = createdTourRequests.find(tr => tr.id === bid.tourRequestId);
      const artist = debugArtists.find(a => a.id === tourRequest?.artistId);
      const venue = debugVenues.find(v => v.id === bid.venueId);

      if (artist && venue && tourRequest && bid.proposedDate) {
        const show = await prisma.show.create({
          data: {
            title: `${artist.name} at ${venue.name}`,
            date: bid.proposedDate,
            artistId: artist.id,
            venueId: venue.id,
            description: `${tourRequest.title} - Show at ${venue.name}`,
            ticketPrice: Math.floor(Math.random() * 20) + 15, // $15-35
            ageRestriction: AgeRestriction.ALL_AGES,
            status: ShowStatus.CONFIRMED,
            createdById: systemUser.id
          }
        });
        createdShows.push(show);
      }
    }

    console.log(`✅ Created ${createdShows.length} confirmed shows from accepted bids`);

    // 🎯 CREATE ADDITIONAL STANDALONE SHOWS (only confirmed)
    const additionalShows = [];
    const numAdditionalShows = Math.floor(Math.random() * 8) + 12; // 12-20 shows
    
    for (let i = 0; i < numAdditionalShows; i++) {
      const artist = debugArtists[Math.floor(Math.random() * debugArtists.length)];
      const venue = debugVenues[Math.floor(Math.random() * debugVenues.length)];
      
      // Random date in the next 4 months
      const randomDate = new Date(
        currentDate.getTime() + 
        Math.random() * (120 * 24 * 60 * 60 * 1000) // 120 days
      );
      
      const show = await prisma.show.create({
        data: {
          title: `${artist.name} at ${venue.name}`,
          date: randomDate,
          artistId: artist.id,
          venueId: venue.id,
          description: `${artist.name} brings their unique sound to ${venue.name}. Don't miss this incredible performance!`,
          ticketPrice: Math.floor(Math.random() * 25) + 10, // $10-35
          ageRestriction: [AgeRestriction.ALL_AGES, AgeRestriction.EIGHTEEN_PLUS, AgeRestriction.TWENTY_ONE_PLUS][Math.floor(Math.random() * 3)],
          status: ShowStatus.CONFIRMED,
          createdById: systemUser.id
        }
      });
      additionalShows.push(show);
    }

    console.log(`✅ Created ${additionalShows.length} additional confirmed shows`);

    // Summary
    const totalShows = createdShows.length + additionalShows.length;
    const summary = {
      tourRequests: createdTourRequests.length,
      bids: createdBids.length,
      totalShows: totalShows,
      bidsByStatus: {
        pending: createdBids.filter(b => b.status === BidStatus.PENDING).length,
        hold: createdBids.filter(b => b.status === BidStatus.HOLD).length,
        accepted: createdBids.filter(b => b.status === BidStatus.ACCEPTED).length,
        rejected: createdBids.filter(b => b.status === BidStatus.REJECTED).length,
        withdrawn: createdBids.filter(b => b.status === BidStatus.WITHDRAWN).length,
        cancelled: createdBids.filter(b => b.status === BidStatus.CANCELLED).length
      },
      scenarios: {
        lightningBolt: 'Lightning Bolt: 10 bids with all statuses (1 accepted, 6 pending, 1 rejected, 1 withdrawn) - perfect for testing bid management',
        menzingers: 'Menzingers: 8 bids mostly pending (6 pending, 1 rejected) - perfect for testing hold system',
        againstMe: 'Against Me: 6 bids with 2 accepted leading to confirmed shows - perfect for testing acceptance workflow'
      }
    };

    console.log('🎉 Sophisticated booking data created!', summary);

    return NextResponse.json({ 
      success: true, 
      message: `🎭 Created realistic booking scenarios! ${summary.tourRequests} tour requests with ${summary.bids} detailed bids (${summary.bidsByStatus.pending} pending, ${summary.bidsByStatus.accepted} accepted, ${summary.bidsByStatus.rejected} rejected, ${summary.bidsByStatus.withdrawn} withdrawn). ${summary.totalShows} confirmed shows. Lightning Bolt has 10 bids to test all statuses, Menzingers has 8 bids for hold testing, Against Me has 6 bids with acceptances. Click on tour requests to see expandable bid management!`,
      summary
    });

  } catch (error) {
    console.error('Error creating booking data:', error);
    return NextResponse.json(
      { error: 'Failed to create booking data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
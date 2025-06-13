import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { BidStatus, ShowStatus, AgeRestriction, BidHoldState } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting comprehensive data reset...');

    // 🎯 UPDATED: Clear NEW unified system instead of old legacy system
    await prisma.showRequestBid.deleteMany({});
    await prisma.showRequest.deleteMany({});
    await prisma.show.deleteMany({}); // Still clear shows as they're shared
    console.log('🧹 Cleared existing show requests, bids, and shows (NEW UNIFIED SYSTEM)');

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

    // 🎯 CREATE ARTIST-INITIATED SHOW REQUESTS (NEW UNIFIED SYSTEM)
    const showRequests = [];
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Lightning Bolt - East Coast Tour (SHOWCASE BIDDING SYSTEM - 10+ bids)
    const lightningBolt = debugArtists.find(a => a.id === '1748101913848');
    if (lightningBolt) {
      const lightningBoltRequest = await prisma.showRequest.create({
        data: {
          title: 'Lightning Bolt East Coast Noise Tour',
          description: 'Seeking experimental venues for our intense noise rock performances. We bring our own amps and need venues that can handle LOUD music. Looking for 3-5 dates between Providence and Brooklyn.',
          artistId: lightningBolt.id,
          venueId: null, // Artist-initiated, open to any venue
          createdById: systemUser.id,
          requestedDate: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          initiatedBy: 'ARTIST',
          status: 'OPEN',
          targetLocations: ['Providence, RI', 'Boston, MA', 'New York, NY', 'Philadelphia, PA'],
          genres: ['noise rock', 'experimental', 'avant-garde']
        }
      });
      showRequests.push(lightningBoltRequest);
    }

    // The Menzingers - Summer Festival Circuit (HOLD MANAGEMENT SHOWCASE - 8+ bids)
    const menzingers = debugArtists.find(a => a.id === '2');
    if (menzingers) {
      const menzingersRequest = await prisma.showRequest.create({
        data: {
          title: 'Menzingers Summer Festival Run',
          description: 'Looking for mid-size venues and festivals for our summer tour. We have a strong following and can guarantee good turnout. Seeking 4-6 dates in the Northeast.',
          artistId: menzingers.id,
          venueId: null,
          createdById: systemUser.id,
          requestedDate: new Date(futureDate.getTime() + 45 * 24 * 60 * 60 * 1000),
          initiatedBy: 'ARTIST',
          status: 'OPEN',
          targetLocations: ['Boston, MA', 'New York, NY', 'Philadelphia, PA'],
          genres: ['punk rock', 'indie rock', 'alternative']
        }
      });
      showRequests.push(menzingersRequest);
    }

    // Against Me! - Acoustic Tour (ACCEPTED BIDS SHOWCASE - 6+ bids)
    const againstMe = debugArtists.find(a => a.id === '1');
    if (againstMe) {
      const againstMeRequest = await prisma.showRequest.create({
        data: {
          title: 'Against Me! Intimate Acoustic Shows',
          description: 'Laura Jane Grace solo acoustic performances. Looking for intimate venues, coffee shops, and small clubs. Perfect for venues under 200 capacity.',
          artistId: againstMe.id,
          venueId: null,
          createdById: systemUser.id,
          requestedDate: new Date(futureDate.getTime() + 20 * 24 * 60 * 60 * 1000),
          initiatedBy: 'ARTIST',
          status: 'OPEN',
          targetLocations: ['Austin, TX', 'Nashville, TN', 'Atlanta, GA'],
          genres: ['folk punk', 'acoustic', 'singer-songwriter']
        }
      });
      showRequests.push(againstMeRequest);
    }

    console.log(`✅ Created ${showRequests.length} show requests (NEW UNIFIED SYSTEM)`);

    // 🎯 CREATE SOPHISTICATED BIDS WITH REALISTIC SCENARIOS (NEW SYSTEM)
    const createdBids = [];

    for (const showRequest of showRequests) {
      const artist = debugArtists.find(a => a.id === showRequest.artistId);
      
      // Create MANY bids per show request to showcase the system
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
        
        // 🎯 FIX: Use exact request date instead of random offset for logical consistency
        // Venues bidding on a specific date request should bid for that exact date
        const baseDate = new Date(showRequest.requestedDate);
        const proposedDate = new Date(showRequest.requestedDate);

        // 🎯 SOPHISTICATED STATUS DISTRIBUTION FOR REALISTIC TESTING
        let status: BidStatus = BidStatus.PENDING;
        
        if (artist?.id === '1748101913848') {
          // Lightning Bolt: Showcase bid statuses that are actually visible in UI
          if (i === 0) {
            status = BidStatus.ACCEPTED; // First bid accepted
          } else if (i === 1) {
            status = BidStatus.HOLD; // 1st hold position
          } else if (i === 2) {
            status = BidStatus.HOLD; // 2nd hold position
          } else if (i === 3) {
            status = BidStatus.PENDING; // Fresh pending bid
          } else if (i === 4) {
            status = BidStatus.PENDING; // More pending bids for testing
          } else if (i === 5) {
            status = BidStatus.HOLD; // 3rd hold position
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
            status = BidStatus.PENDING; // More pending for realistic testing
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
            status = BidStatus.PENDING; // More pending for testing
          }
        } else {
          // Other artists: Only visible statuses
          const rand = Math.random();
          if (rand < 0.6) {
            status = BidStatus.PENDING; // Most bids are pending
          } else if (rand < 0.8) {
            status = BidStatus.ACCEPTED; // Some accepted
          } else {
            status = BidStatus.HOLD; // Some on hold
          }
        }

        // 🎯 CREATE DETAILED BID WITH ALL FIELDS (NEW SYSTEM)
        const bidData = {
          showRequestId: showRequest.id,
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
          holdPosition: status === BidStatus.HOLD ? (i <= 2 ? i + 1 : 3) : null, // First 3 bids get hold positions 1, 2, 3
          heldAt: status === BidStatus.HOLD ? new Date() : null,
          heldUntil: status === BidStatus.HOLD ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null, // 14 days from now
          
          // 🎯 ACCEPTANCE/DECLINE TRACKING
          acceptedAt: status === BidStatus.ACCEPTED ? new Date() : null,
          
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

        const createdBid = await prisma.showRequestBid.create({
          data: bidData
        });
        createdBids.push(createdBid);
        
        if (status === BidStatus.ACCEPTED) {
          console.log(`🚀 Created ACCEPTED bid: ${createdBid.id} for ${artist?.name} at ${venue.name}`);
        }
      }
      
      // 🚀 NEW AUTO-HOLD WORKFLOW: Create auto-holds for accepted bids
      // Get only the bids we just created for this specific show request
      const bidsForThisRequest = createdBids.filter(bid => bid.showRequestId === showRequest.id);
      const acceptedBidsForThisRequest = bidsForThisRequest.filter(bid => bid.status === BidStatus.ACCEPTED);
      
      if (acceptedBidsForThisRequest.length > 0) {
        console.log(`🚀 Creating auto-holds for ${acceptedBidsForThisRequest.length} accepted bid(s) on ${showRequest.title}`);
        console.log(`🚀 Show request artist ID: ${showRequest.artistId}`);
        
        for (const acceptedBid of acceptedBidsForThisRequest) {
          // Update the accepted bid to have ACCEPTED_HELD state
          await prisma.showRequestBid.update({
            where: { id: acceptedBid.id },
            data: {
              holdState: 'ACCEPTED_HELD' as BidHoldState
            }
          });
          
          // Get the artist user who would have accepted this bid
          const artistUser = await prisma.membership.findFirst({
            where: {
              entityId: showRequest.artistId,
              entityType: 'ARTIST',
              status: 'ACTIVE'
            },
            select: {
              userId: true
            }
          });

          console.log(`🚀 Artist user lookup result:`, artistUser);

          if (artistUser) {
            // Create the auto-hold (24h expiry)
            const autoHoldExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const holdId = `hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await prisma.$executeRaw`
              INSERT INTO "hold_requests" (
                id, 
                "showRequestId", 
                "requestedById", 
                duration, 
                reason, 
                status,
                "requestedAt",
                "expiresAt",
                "createdAt",
                "updatedAt"
              ) VALUES (
                ${holdId},
                ${showRequest.id},
                ${artistUser.userId},
                ${24},
                ${'Automatic hold for acceptance confirmation - 24h to confirm or change mind'},
                ${'ACTIVE'}::"HoldStatus",
                ${new Date()},
                ${autoHoldExpiry},
                ${new Date()},
                ${new Date()}
              )
            `;
            
            console.log(`   🚀 Created auto-hold for accepted bid from venue ${acceptedBid.venueId}`);
          } else {
            console.log(`   ⚠️ No artist user found for artist ${showRequest.artistId} - skipping auto-hold`);
          }
          
          // Freeze all other bids on this show request (they're now competing with an accepted-held bid)
          const freezeResult = await prisma.showRequestBid.updateMany({
            where: {
              showRequestId: showRequest.id,
              id: { not: acceptedBid.id }, // Don't freeze the accepted bid itself
              status: { 
                notIn: ['ACCEPTED', 'REJECTED'] // Don't freeze already decided bids
              }
            },
            data: {
              holdState: 'FROZEN',
              frozenByHoldId: 'accept-' + acceptedBid.id, // Track what froze them
              frozenAt: new Date()
            }
          });
          
          console.log(`   ✅ Froze ${freezeResult.count} competing bids for accepted-held bid`);
        }
      } else {
        console.log(`   ℹ️ No accepted bids found for ${showRequest.title} - skipping auto-hold logic`);
      }
    }

    console.log(`✅ Created ${createdBids.length} sophisticated bids with realistic statuses (NEW SYSTEM)`);

    // 🎯 CREATE CONFIRMED SHOWS (only from accepted bids)
    const acceptedBids = createdBids.filter(bid => bid.status === BidStatus.ACCEPTED);
    const createdShows = [];

    for (const bid of acceptedBids) {
      const showRequest = showRequests.find(sr => sr.id === bid.showRequestId);
      const artist = debugArtists.find(a => a.id === showRequest?.artistId);
      const venue = debugVenues.find(v => v.id === bid.venueId);

      if (artist && venue && showRequest && bid.proposedDate) {
        const show = await prisma.show.create({
          data: {
            title: `${artist.name} at ${venue.name}`,
            date: bid.proposedDate,
            artistId: artist.id,
            venueId: venue.id,
            description: `${showRequest.title} - Show at ${venue.name}`,
            ticketPrice: Math.floor(Math.random() * 20) + 15, // $15-35
            ageRestriction: AgeRestriction.ALL_AGES,
            status: ShowStatus.CONFIRMED,
            createdById: systemUser.id,
            // 🎯 ADD DETAILED SCHEDULE INFORMATION
            loadIn: '17:00',
            soundcheck: '18:30',
            doorsOpen: '19:30',
            showTime: '20:30',
            curfew: '23:00',
            capacity: venue.capacity || 150,
            guarantee: bid.amount || 500,
            notes: `Confirmed show from accepted bid. ${bid.billingPosition} slot.`
          }
        });
        createdShows.push(show);
      }
    }

    console.log(`✅ Created ${createdShows.length} confirmed shows from accepted bids`);

    // 🎯 CREATE ADDITIONAL STANDALONE SHOWS (only confirmed)
    const additionalShows = [];
    const numAdditionalShows = Math.floor(Math.random() * 8) + 12;
    
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
          createdById: systemUser.id,
          // 🎯 ADD DETAILED SCHEDULE INFORMATION FOR ALL SHOWS
          loadIn: ['16:00', '16:30', '17:00', '17:30'][Math.floor(Math.random() * 4)],
          soundcheck: ['17:30', '18:00', '18:30', '19:00'][Math.floor(Math.random() * 4)],
          doorsOpen: ['19:00', '19:30', '20:00', '20:30'][Math.floor(Math.random() * 4)],
          showTime: ['20:00', '20:30', '21:00', '21:30'][Math.floor(Math.random() * 4)],
          curfew: ['23:00', '23:30', '00:00', '01:00'][Math.floor(Math.random() * 4)],
          capacity: venue.capacity || Math.floor(Math.random() * 200) + 50,
          guarantee: Math.floor(Math.random() * 600) + 200, // $200-800
          notes: `Standalone confirmed show. Great venue for ${artist.name}'s style.`
        }
      });
      additionalShows.push(show);
    }

    console.log(`✅ Created ${additionalShows.length} additional confirmed shows`);

    // 🎯 CREATE VENUE-INITIATED SHOW REQUESTS (Venue Offers)
    const venueOffers = [];
    
    // 🎯 FIX: Ensure specific venues get offers for better testing
    // Include Lost Bag specifically for debugging this issue
    const lostBag = debugVenues.find(v => v.name.toLowerCase().includes('lost bag'));
    const venuesToMakeOffers = [
      ...debugVenues.slice(0, 3), // First 3 venues
      ...(lostBag && !debugVenues.slice(0, 3).includes(lostBag) ? [lostBag] : []) // Add Lost Bag if not already included
    ].slice(0, 5); // Limit to 5 total venue offers
    
    for (let i = 0; i < venuesToMakeOffers.length; i++) {
      const venue = venuesToMakeOffers[i];
      const artist = debugArtists[Math.floor(Math.random() * debugArtists.length)];
      const requestDate = new Date(futureDate.getTime() + 60 + (i * 15) * 24 * 60 * 60 * 1000); // Days, not milliseconds
      const amount = Math.floor(Math.random() * 600) + 400; // $400-$1000
      
      if (venue && artist) {
        console.log(`🏢 Creating venue offer from ${venue.name} to ${artist.name}...`);
        
        const venueOffer = await prisma.showRequest.create({
          data: {
            artistId: artist.id,
            venueId: venue.id,
            createdById: systemUser.id,
            title: `${artist.name} at ${venue.name}`,
            description: `${venue.name} would love to host ${artist.name} for an unforgettable show!`,
            requestedDate: requestDate,
            initiatedBy: 'VENUE',
            status: 'OPEN',
            targetLocations: [venue.name],
            genres: artist.genres || ['rock'],
            amount: amount,
            capacity: venue.capacity,
            ageRestriction: 'ALL_AGES',
            message: `Hey ${artist.name}! We're huge fans and would love to have you play at ${venue.name}. We can offer $${amount} guarantee and think our audience would absolutely love your sound.`
          }
        });
        venueOffers.push(venueOffer);
      }
    }

    console.log(`✅ Created ${venueOffers.length} venue-initiated show requests (offers)`);

    // Summary
    const totalShows = createdShows.length + additionalShows.length;
    const summary = {
      showRequests: showRequests.length,
      venueOffers: venueOffers.length,
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
        lightningBolt: 'Lightning Bolt: 10 bids with visible statuses (1 accepted, 6 pending, 3 hold) - perfect for testing bid management',
        menzingers: 'Menzingers: 8 bids mostly pending (5 pending, 3 hold) - perfect for testing hold system',
        againstMe: 'Against Me: 6 bids with 2 accepted leading to confirmed shows - perfect for testing acceptance workflow'
      }
    };

    console.log('🎉 Sophisticated booking data created with NEW UNIFIED SYSTEM!', summary);

    return NextResponse.json({ 
      success: true, 
      message: `🎭 Created realistic booking scenarios! ${summary.showRequests} show requests + ${summary.venueOffers} venue offers with ${summary.bids} detailed bids (${summary.bidsByStatus.pending} pending, ${summary.bidsByStatus.hold} hold, ${summary.bidsByStatus.accepted} accepted). ${summary.totalShows} confirmed shows. Lightning Bolt has 10 bids with visible statuses, Menzingers has 8 bids for hold testing, Against Me has 6 bids with acceptances. All data uses realistic UI-visible statuses only!`,
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
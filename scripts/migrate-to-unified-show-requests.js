#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToUnifiedShowRequests() {
  console.log('🔄 Starting migration to unified ShowRequest model...');
  
  try {
    // 🚨 SAFETY: Create backup before migration
    console.log('🛡️ Creating safety backup...');
    const backupCommand = require('./backup-database.js');
    await backupCommand.backupDatabase();
    console.log('✅ Safety backup created');

    let migratedTourRequests = 0;
    let migratedVenueOffers = 0;
    let migratedBids = 0;

    // STEP 1: Migrate TourRequests in smaller batches
    console.log('📋 Step 1: Migrating TourRequest records...');
    
    await prisma.$transaction(async (tx) => {
      const tourRequests = await tx.tourRequest.findMany({
        include: {
          artist: { select: { id: true, name: true } },
          createdBy: { select: { id: true } }
        }
      });

      for (const tourRequest of tourRequests) {
        // Create ShowRequest from TourRequest (artist-initiated)
        const showRequest = await tx.showRequest.create({
          data: {
            artistId: tourRequest.artistId,
            venueId: null,
            title: tourRequest.title,
            description: tourRequest.description,
            requestedDate: tourRequest.requestDate || tourRequest.startDate || new Date(),
            initiatedBy: 'ARTIST',
            createdById: tourRequest.createdById,
            status: tourRequest.status === 'ACTIVE' ? 'OPEN' : 
                   tourRequest.status === 'COMPLETED' ? 'CONFIRMED' : 
                   tourRequest.status === 'CANCELLED' ? 'CANCELLED' : 'EXPIRED',
            targetLocations: tourRequest.targetLocations || [],
            genres: tourRequest.genres || [],
            createdAt: tourRequest.createdAt,
            updatedAt: tourRequest.updatedAt
          }
        });

        // Migrate existing bids to ShowRequestBid
        const existingBids = await tx.bid.findMany({
          where: { tourRequestId: tourRequest.id }
        });

        for (const bid of existingBids) {
          await tx.showRequestBid.create({
            data: {
              showRequestId: showRequest.id,
              venueId: bid.venueId,
              bidderId: bid.bidderId,
              proposedDate: bid.proposedDate,
              message: bid.message,
              amount: bid.amount,
              status: bid.status,
              createdAt: bid.createdAt,
              updatedAt: bid.updatedAt,
              acceptedAt: bid.acceptedAt,
              billingNotes: bid.billingNotes,
              billingPosition: bid.billingPosition,
              cancelledAt: bid.cancelledAt,
              cancelledReason: bid.cancelledReason,
              declinedAt: bid.declinedAt,
              declinedReason: bid.declinedReason,
              heldAt: bid.heldAt,
              heldUntil: bid.heldUntil,
              holdPosition: bid.holdPosition,
              lineupPosition: bid.lineupPosition,
              otherActs: bid.otherActs,
              setLength: bid.setLength
            }
          });
          migratedBids++;
        }

        migratedTourRequests++;
        console.log(`  ✅ Migrated TourRequest: ${tourRequest.title} (${existingBids.length} bids)`);
      }
    }, { timeout: 15000 });

    // STEP 2: Migrate VenueOffers in smaller batches  
    console.log('🏢 Step 2: Migrating VenueOffer records...');

    await prisma.$transaction(async (tx) => {
      const venueOffers = await tx.venueOffer.findMany({
        include: {
          artist: { select: { id: true, name: true } },
          venue: { select: { id: true, name: true } },
          createdBy: { select: { id: true } }
        }
      });

      // 🎯 GROUP BY ARTIST + DATE to solve duplicate issue
      const offersByArtistDate = new Map();
      
      for (const offer of venueOffers) {
        const dateKey = offer.proposedDate.toISOString().split('T')[0];
        const groupKey = `${offer.artistId}-${dateKey}`;
        
        if (!offersByArtistDate.has(groupKey)) {
          offersByArtistDate.set(groupKey, []);
        }
        offersByArtistDate.get(groupKey).push(offer);
      }

      console.log(`📊 Grouped ${venueOffers.length} offers into ${offersByArtistDate.size} unique artist+date combinations`);

      for (const [groupKey, offers] of offersByArtistDate) {
        const [artistId, dateStr] = groupKey.split('-', 2);
        const primaryOffer = offers[0];
        
        console.log(`  🎯 Processing ${offers.length} offers for ${primaryOffer.artist.name} on ${dateStr}`);

        // Create ShowRequest from primary VenueOffer (venue-initiated)
        const showRequest = await tx.showRequest.create({
          data: {
            artistId: primaryOffer.artistId,
            venueId: null,
            title: `${primaryOffer.artist.name} - ${new Date(primaryOffer.proposedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            description: primaryOffer.description || `Show request for ${primaryOffer.artist.name}`,
            requestedDate: primaryOffer.proposedDate,
            initiatedBy: 'VENUE', 
            createdById: primaryOffer.createdById,
            status: 'OPEN',
            targetLocations: [],
            genres: [],
            createdAt: primaryOffer.createdAt,
            updatedAt: new Date()
          }
        });

        // Convert ALL offers to ShowRequestBids
        for (const offer of offers) {
          await tx.showRequestBid.create({
            data: {
              showRequestId: showRequest.id,
              venueId: offer.venueId,
              bidderId: offer.createdById,
              proposedDate: offer.proposedDate,
              message: offer.message || `Offer from ${offer.venue.name}`,
              amount: offer.amount,
              status: offer.status === 'PENDING' ? 'PENDING' : 
                     offer.status === 'ACCEPTED' ? 'ACCEPTED' : 
                     offer.status === 'DECLINED' ? 'REJECTED' : 
                     offer.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING',
              billingNotes: offer.billingNotes,
              billingPosition: offer.billingPosition,
              lineupPosition: offer.lineupPosition,
              setLength: offer.setLength,
              otherActs: offer.otherActs,
              createdAt: offer.createdAt,
              updatedAt: offer.updatedAt,
              acceptedAt: offer.acceptedAt,
              declinedAt: offer.declinedAt,
              declinedReason: offer.declinedReason,
              cancelledAt: offer.cancelledAt,
              cancelledReason: offer.cancelledReason
            }
          });
        }

        migratedVenueOffers += offers.length;
        console.log(`    ✅ Created ShowRequest with ${offers.length} bids: ${showRequest.title}`);
      }
    }, { timeout: 15000 });

    // Summary
    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Migration Summary:`);
    console.log(`   • TourRequests migrated: ${migratedTourRequests}`);
    console.log(`   • VenueOffers migrated: ${migratedVenueOffers}`);
    console.log(`   • Bids migrated: ${migratedBids}`);
    console.log(`   • Total ShowRequests created: ${migratedTourRequests + (await prisma.showRequest.count() - migratedTourRequests)}`);
    
    // Verification
    console.log('\n🔍 Verifying migration...');
    const showRequestCount = await prisma.showRequest.count();
    const showRequestBidCount = await prisma.showRequestBid.count();
    console.log(`✅ Verification: ${showRequestCount} ShowRequests, ${showRequestBidCount} ShowRequestBids`);

  } catch (error) {
    console.error('🚨 Migration failed:', error);
    console.log('\n🛡️ Your data is safe - transactions were rolled back.');
    console.log('💡 You can restore from backup if needed: npm run restore');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToUnifiedShowRequests()
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

module.exports = { migrateToUnifiedShowRequests }; 
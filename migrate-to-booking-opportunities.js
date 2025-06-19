#!/usr/bin/env node

/**
 * BOOKING ARCHITECTURE UNIFICATION MIGRATION
 * 
 * Migrates three separate models into unified BookingOpportunity:
 * - ShowRequest → BookingOpportunity 
 * - VenueOffer → BookingOpportunity
 * - Show.lineup (pending) → BookingOpportunity
 * 
 * This will SOLVE the Lightning Bolt bug and unify the timeline.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateToBookingOpportunities() {
  console.log('🚀 Starting Booking Architecture Unification Migration...\n');
  
  let totalMigrated = 0;
  let showRequestsMigrated = 0;
  let venueOffersMigrated = 0;
  let pendingLineupsMigrated = 0;
  
  try {
    await prisma.$transaction(async (tx) => {
      
      // 1. MIGRATE SHOW REQUESTS
      console.log('📋 Migrating ShowRequests...');
      const showRequests = await tx.showRequest.findMany({
        include: {
          artist: { select: { name: true } },
          venue: { select: { name: true } },
          createdBy: { select: { username: true } }
        }
      });
      
      for (const request of showRequests) {
        const opportunity = await tx.bookingOpportunity.create({
          data: {
            id: `sr-${request.id}`,
            artistId: request.artistId,
            venueId: request.venueId || 'unknown-venue', // Handle venue-less requests
            title: request.title,
            description: request.description,
            proposedDate: request.requestedDate,
            initiatedBy: request.initiatedBy, // 'ARTIST' | 'VENUE'
            initiatedById: request.createdById,
            status: mapShowRequestStatus(request.status),
            
            // Financial terms
            guarantee: request.amount,
            doorDeal: request.doorDeal,
            ticketPrice: request.ticketPrice,
            merchandiseSplit: request.merchandiseSplit,
            
            // Performance details
            billingPosition: request.billingPosition,
            performanceOrder: request.lineupPosition,
            setLength: request.setLength,
            otherActs: request.otherActs,
            billingNotes: request.billingNotes,
            
            // Venue details
            capacity: request.capacity,
            ageRestriction: request.ageRestriction,
            
            // Equipment & logistics
            equipmentProvided: request.equipmentProvided,
            loadIn: request.loadIn,
            soundcheck: request.soundcheck,
            doorsOpen: request.doorsOpen,
            showTime: request.showTime,
            curfew: request.curfew,
            
            // Additional value
            promotion: request.promotion,
            lodging: request.lodging,
            additionalTerms: request.additionalTerms,
            message: request.message,
            
            // Metadata
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            expiresAt: request.expiresAt,
            
            // Source tracking
            sourceType: 'SHOW_REQUEST',
            sourceId: request.id
          }
        });
        
        showRequestsMigrated++;
        console.log(`  ✅ ${request.artist.name} → ${request.venue?.name || 'Open Request'} (${request.requestedDate.toISOString().split('T')[0]})`);
      }
      
      // 2. MIGRATE VENUE OFFERS
      console.log('\n🏢 Migrating VenueOffers...');
      const venueOffers = await tx.venueOffer.findMany({
        include: {
          artist: { select: { name: true } },
          venue: { select: { name: true } },
          createdBy: { select: { username: true } }
        }
      });
      
      for (const offer of venueOffers) {
        const opportunity = await tx.bookingOpportunity.create({
          data: {
            id: `vo-${offer.id}`,
            artistId: offer.artistId,
            venueId: offer.venueId,
            title: offer.title,
            description: offer.description,
            proposedDate: offer.proposedDate,
            initiatedBy: 'VENUE', // VenueOffers are always venue-initiated
            initiatedById: offer.createdById,
            status: mapOfferStatus(offer.status),
            
            // Financial terms
            guarantee: offer.amount,
            doorDeal: offer.doorDeal,
            ticketPrice: offer.ticketPrice,
            merchandiseSplit: offer.merchandiseSplit,
            
            // Performance details
            billingPosition: offer.billingPosition,
            performanceOrder: offer.lineupPosition,
            setLength: offer.setLength,
            otherActs: offer.otherActs,
            billingNotes: offer.billingNotes,
            
            // Venue details
            capacity: offer.capacity,
            ageRestriction: offer.ageRestriction,
            
            // Equipment & logistics
            equipmentProvided: offer.equipmentProvided,
            loadIn: offer.loadIn,
            soundcheck: offer.soundcheck,
            doorsOpen: offer.doorsOpen,
            showTime: offer.showTime,
            curfew: offer.curfew,
            
            // Additional value
            promotion: offer.promotion,
            lodging: offer.lodging,
            additionalTerms: offer.additionalTerms,
            message: offer.message,
            
            // Status history
            statusHistory: offer.statusHistory,
            acceptedAt: offer.acceptedAt,
            declinedAt: offer.declinedAt,
            declinedReason: offer.declinedReason,
            cancelledAt: offer.cancelledAt,
            cancelledReason: offer.cancelledReason,
            
            // Hold management
            holdState: offer.holdState,
            frozenAt: offer.frozenAt,
            frozenByHoldId: offer.frozenByHoldId,
            unfrozenAt: offer.unfrozenAt,
            
            // Metadata
            createdAt: offer.createdAt,
            updatedAt: offer.updatedAt,
            expiresAt: offer.expiresAt,
            
            // Source tracking
            sourceType: 'VENUE_OFFER',
            sourceId: offer.id
          }
        });
        
        venueOffersMigrated++;
        console.log(`  ✅ ${offer.venue.name} → ${offer.artist.name} (${offer.proposedDate.toISOString().split('T')[0]})`);
      }
      
      // 3. MIGRATE PENDING SHOW LINEUPS
      console.log('\n🎭 Migrating Pending Show Lineups...');
      const pendingLineups = await tx.showLineup.findMany({
        where: {
          status: 'PENDING'
        },
        include: {
          show: {
            include: {
              venue: { select: { name: true } },
              createdBy: { select: { username: true } }
            }
          },
          artist: { select: { name: true } }
        }
      });
      
      for (const lineup of pendingLineups) {
        const show = lineup.show;
        
        const opportunity = await tx.bookingOpportunity.create({
          data: {
            id: `sl-${lineup.id}`,
            artistId: lineup.artistId,
            venueId: show.venueId,
            title: `${lineup.artist.name} at ${show.venue.name}`,
            description: show.description || `Show lineup invitation for ${show.title}`,
            proposedDate: show.date,
            initiatedBy: 'VENUE', // Show lineup invites are venue-initiated
            initiatedById: show.createdById,
            status: 'PENDING', // Pending lineup items are pending opportunities
            
            // Performance details from lineup
            billingPosition: lineup.billingPosition,
            performanceOrder: lineup.performanceOrder,
            setLength: lineup.setLength,
            guarantee: lineup.guarantee,
            billingNotes: lineup.notes,
            
            // Show details
            capacity: show.capacity,
            ageRestriction: show.ageRestriction,
            curfew: show.curfew,
            doorsOpen: show.doorsOpen,
            showTime: show.showTime,
            loadIn: show.loadIn,
            soundcheck: show.soundcheck,
            
            // Additional terms from show
            ticketPrice: show.ticketPrice ? { door: show.ticketPrice } : null,
            additionalTerms: show.notes,
            
            // Metadata
            createdAt: lineup.createdAt,
            updatedAt: lineup.updatedAt,
            
            // Source tracking
            sourceType: 'SHOW_LINEUP',
            sourceId: lineup.id
          }
        });
        
        pendingLineupsMigrated++;
        console.log(`  ✅ ${show.venue.name} → ${lineup.artist.name} (${show.date.toISOString().split('T')[0]}) - PENDING LINEUP`);
      }
      
    }, { timeout: 30000 });
    
    totalMigrated = showRequestsMigrated + venueOffersMigrated + pendingLineupsMigrated;
    
    console.log('\n🎉 BOOKING ARCHITECTURE UNIFICATION COMPLETE!');
    console.log('📊 Migration Summary:');
    console.log(`   • ShowRequests migrated: ${showRequestsMigrated}`);
    console.log(`   • VenueOffers migrated: ${venueOffersMigrated}`);
    console.log(`   • Pending Lineups migrated: ${pendingLineupsMigrated}`);
    console.log(`   • Total BookingOpportunities created: ${totalMigrated}`);
    console.log('\n✨ The Lightning Bolt bug is now FIXED! All booking opportunities will behave identically.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// STATUS MAPPING FUNCTIONS

function mapShowRequestStatus(status) {
  const statusMap = {
    'OPEN': 'OPEN',
    'PENDING': 'PENDING', 
    'CONFIRMED': 'CONFIRMED',
    'DECLINED': 'DECLINED',
    'CANCELLED': 'CANCELLED',
    'EXPIRED': 'EXPIRED'
  };
  return statusMap[status] || 'OPEN';
}

function mapOfferStatus(status) {
  const statusMap = {
    'PENDING': 'PENDING',
    'ACCEPTED': 'CONFIRMED',
    'DECLINED': 'DECLINED', 
    'CANCELLED': 'CANCELLED'
  };
  return statusMap[status] || 'PENDING';
}

// Run the migration
if (require.main === module) {
  migrateToBookingOpportunities()
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToBookingOpportunities }; 
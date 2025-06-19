#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    console.log('🔍 Verifying BookingOpportunity Migration...\n');
    
    // Check total count
    const totalOpportunities = await prisma.bookingOpportunity.count();
    console.log(`📊 Total BookingOpportunities: ${totalOpportunities}`);
    
    // Check by source type
    const showRequestCount = await prisma.bookingOpportunity.count({ where: { sourceType: 'SHOW_REQUEST' } });
    const venueOfferCount = await prisma.bookingOpportunity.count({ where: { sourceType: 'VENUE_OFFER' } });
    const showLineupCount = await prisma.bookingOpportunity.count({ where: { sourceType: 'SHOW_LINEUP' } });
    
    console.log(`   • From ShowRequests: ${showRequestCount}`);
    console.log(`   • From VenueOffers: ${venueOfferCount}`);
    console.log(`   • From Show Lineups: ${showLineupCount}`);
    
    // LIGHTNING BOLT CHECK!
    console.log('\n⚡ Lightning Bolt September 27th Check:');
    const lightningBoltSept27 = await prisma.bookingOpportunity.findMany({
      where: {
        proposedDate: {
          gte: new Date('2025-09-27T00:00:00Z'),
          lte: new Date('2025-09-27T23:59:59Z')
        },
        artist: {
          name: {
            contains: 'lightning bolt',
            mode: 'insensitive'
          }
        }
      },
      include: {
        artist: { select: { name: true } },
        venue: { select: { name: true } }
      }
    });
    
    if (lightningBoltSept27.length > 0) {
      console.log('✅ FOUND Lightning Bolt Sept 27th opportunity!');
      lightningBoltSept27.forEach(opp => {
        console.log(`   ID: ${opp.id}`);
        console.log(`   Title: ${opp.title}`);
        console.log(`   Status: ${opp.status}`);
        console.log(`   Source: ${opp.sourceType}`);
        console.log(`   Artist: ${opp.artist.name}`);
        console.log(`   Venue: ${opp.venue.name}`);
        console.log(`   Date: ${opp.proposedDate}`);
      });
    } else {
      console.log('❌ Lightning Bolt Sept 27th NOT found');
    }
    
    // Show status distribution
    console.log('\n📈 Status Distribution:');
    const statuses = await prisma.bookingOpportunity.groupBy({
      by: ['status'],
      _count: true
    });
    
    statuses.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count}`);
    });
    
    console.log('\n🎉 Migration verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration(); 
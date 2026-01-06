/**
 * Migrate BookingOpportunity data to new DateEntry model
 * 
 * Run with: node scripts/migrate-to-date-entries.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Map old status to new status
const STATUS_MAP = {
  'OPEN': 'INQUIRY',
  'PENDING': 'PENDING',
  'CONFIRMED': 'CONFIRMED',
  'DECLINED': 'DECLINED',
  'CANCELLED': 'CANCELLED',
  'EXPIRED': 'DECLINED',
};

// Map billing position to simple string
const BILLING_MAP = {
  'HEADLINER': 'headliner',
  'CO_HEADLINER': 'co-headliner',
  'SUPPORT': 'support',
  'OPENER': 'opener',
  'LOCAL_SUPPORT': 'local',
};

async function migrate() {
  console.log('🚀 Starting migration to DateEntry...\n');

  // Get all existing BookingOpportunities
  const opportunities = await prisma.bookingOpportunity.findMany({
    include: {
      artist: { select: { name: true } },
      venue: { select: { name: true } },
    }
  });

  console.log(`📊 Found ${opportunities.length} BookingOpportunities to migrate\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const opp of opportunities) {
    try {
      // Check if already migrated
      const existing = await prisma.dateEntry.findUnique({
        where: {
          artistId_venueId_date: {
            artistId: opp.artistId,
            venueId: opp.venueId,
            date: opp.proposedDate,
          }
        }
      });

      if (existing) {
        console.log(`  ⏭️  Skip: ${opp.artist.name} @ ${opp.venue.name} (already exists)`);
        skipped++;
        continue;
      }

      // Map status
      const newStatus = STATUS_MAP[opp.status] || 'INQUIRY';
      
      // Map billing
      const billing = opp.billingPosition ? BILLING_MAP[opp.billingPosition] || opp.billingPosition.toLowerCase() : null;

      // Build door deal string
      let door = null;
      if (opp.doorDeal) {
        const deal = typeof opp.doorDeal === 'string' ? JSON.parse(opp.doorDeal) : opp.doorDeal;
        if (deal.split) {
          door = deal.minimumGuarantee ? `${deal.split} after $${deal.minimumGuarantee}` : deal.split;
        }
      }

      // Build notes from various fields
      const notesParts = [];
      if (opp.message) notesParts.push(opp.message);
      if (opp.otherActs) notesParts.push(`Other acts: ${opp.otherActs}`);
      if (opp.billingNotes) notesParts.push(opp.billingNotes);
      const notes = notesParts.length > 0 ? notesParts.join('\n') : null;

      // Create DateEntry
      await prisma.dateEntry.create({
        data: {
          date: opp.proposedDate,
          artistId: opp.artistId,
          venueId: opp.venueId,
          status: newStatus,
          guarantee: opp.guarantee,
          door,
          billing,
          setLength: opp.setLength,
          holdUntil: opp.holdState === 'HELD' ? opp.expiresAt : null,
          holdReason: opp.holdState === 'HELD' ? 'Migrated from hold' : null,
          notes,
        }
      });

      console.log(`  ✅ ${opp.artist.name} @ ${opp.venue.name} on ${opp.proposedDate.toISOString().split('T')[0]} → ${newStatus}`);
      migrated++;

    } catch (err) {
      console.error(`  ❌ Error: ${opp.artist?.name} @ ${opp.venue?.name}: ${err.message}`);
      errors++;
    }
  }

  console.log('\n📈 Migration Summary:');
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);

  // Verify
  const count = await prisma.dateEntry.count();
  console.log(`\n📊 Total DateEntry records: ${count}`);

  await prisma.$disconnect();
}

migrate().catch(console.error);





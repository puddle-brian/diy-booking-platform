const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBrianProfile() {
  try {
    console.log('🔍 Checking Brian Gibson profile...');
    
    const memberships = await prisma.membership.findMany({
      where: {
        userId: 'debug-brian-gibson',
        status: 'ACTIVE'
      }
    });
    
    console.log(`Brian Gibson memberships: ${memberships.length}`);
    for (const membership of memberships) {
      if (membership.entityType === 'ARTIST') {
        const artist = await prisma.artist.findUnique({
          where: { id: membership.entityId }
        });
        if (artist) {
          console.log(`  ✅ Artist: ${artist.name} (ID: ${membership.entityId})`);
          console.log(`      Location: ${artist.locationId}`);
          console.log(`      Submitted by: ${artist.submittedById}`);
        } else {
          console.log(`  ❌ Artist not found for ID: ${membership.entityId}`);
        }
      }
    }
    
    // Also check if there are any orphaned memberships
    console.log('\n🧹 Checking for orphaned memberships...');
    const allBrianMemberships = await prisma.membership.findMany({
      where: {
        userId: 'debug-brian-gibson'
      }
    });
    
    console.log(`Total memberships (including inactive): ${allBrianMemberships.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrianProfile(); 
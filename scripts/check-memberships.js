const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMemberships() {
  try {
    console.log('🔍 Checking all debug user memberships...');
    
    const debugUsers = [
      'debug-tom-may',
      'debug-laura-jane', 
      'debug-patti-smith',
      'debug-barry-johnson',
      'debug-brian-gibson',
      'debug-lidz-bierenday',
      'debug-joe-martinez',
      'debug-sarah-chen',
      'debug-mike-rodriguez',
      'debug-alex-thompson'
    ];
    
    for (const userId of debugUsers) {
      const memberships = await prisma.membership.findMany({
        where: { userId, status: 'ACTIVE' }
      });
      
      console.log(`${userId}: ${memberships.length} memberships`);
      for (const m of memberships) {
        console.log(`  - ${m.entityType} ${m.entityId} (${m.role})`);
      }
    }
    
    // Also check if Lightning Bolt artist exists
    const lightningBolt = await prisma.artist.findUnique({
      where: { id: '1748101913848' }
    });
    console.log(`\nLightning Bolt artist exists: ${!!lightningBolt}`);
    if (lightningBolt) {
      console.log(`  Name: ${lightningBolt.name}`);
      console.log(`  Submitted by: ${lightningBolt.submittedById}`);
    }
    
    // Check if debug-brian-gibson user exists
    const brianUser = await prisma.user.findUnique({
      where: { id: 'debug-brian-gibson' }
    });
    console.log(`\ndebug-brian-gibson user exists: ${!!brianUser}`);
    if (brianUser) {
      console.log(`  Username: ${brianUser.username}`);
      console.log(`  Email: ${brianUser.email}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMemberships(); 
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking all debug users...');
    
    const debugUserEmails = [
      'tom@debug.diyshows.com',
      'laura@debug.diyshows.com', 
      'patti@debug.diyshows.com',
      'barry@debug.diyshows.com',
      'brian.gibson@debug.diyshows.com',
      'brian.chippendale@debug.diyshows.com',
      'lidz@debug.diyshows.com',
      'joe@debug.diyshows.com',
      'sarah@debug.diyshows.com',
      'mike@debug.diyshows.com',
      'alex@debug.diyshows.com'
    ];
    
    console.log('\n📋 User Status:');
    for (const email of debugUserEmails) {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (user) {
        console.log(`✅ ${email} -> ${user.username} (ID: ${user.id})`);
      } else {
        console.log(`❌ ${email} -> NOT FOUND`);
      }
    }
    
    // Also check Lightning Bolt memberships
    console.log('\n🎸 Lightning Bolt memberships:');
    const lightningBoltMemberships = await prisma.membership.findMany({
      where: {
        entityType: 'ARTIST',
        entityId: '1748101913848'
      }
    });
    
    console.log(`Found ${lightningBoltMemberships.length} memberships for Lightning Bolt:`);
    for (const membership of lightningBoltMemberships) {
      const user = await prisma.user.findUnique({
        where: { id: membership.userId }
      });
      console.log(`  - ${user?.username || 'Unknown'} (${membership.role})`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 
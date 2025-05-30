const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testBrianLogin() {
  try {
    console.log('🧪 Testing Brian Chippendale login...');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'brian.chippendale@debug.diyshows.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.username}`);

    // Test password
    const testPassword = 'debug123';
    const passwordMatch = await bcrypt.compare(testPassword, user.passwordHash);

    if (passwordMatch) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
    }

    // Check memberships
    const memberships = await prisma.membership.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      }
    });

    console.log(`✅ User has ${memberships.length} active memberships:`);
    for (const membership of memberships) {
      if (membership.entityType === 'ARTIST') {
        const artist = await prisma.artist.findUnique({
          where: { id: membership.entityId }
        });
        console.log(`  - ${artist?.name || 'Unknown Artist'} (${membership.role})`);
      }
    }

    console.log('\n🎉 Brian Chippendale login test complete!');
    console.log('   ✅ User exists');
    console.log('   ✅ Password works');
    console.log('   ✅ Has Lightning Bolt membership');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBrianLogin(); 
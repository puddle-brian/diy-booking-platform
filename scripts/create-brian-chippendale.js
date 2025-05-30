const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createBrianChippendale() {
  try {
    console.log('🥁 Creating Brian Chippendale user...');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'brian.chippendale@debug.diyshows.com' }
    });

    if (existingUser) {
      console.log('⚠️  Brian Chippendale already exists');
      return;
    }

    // Create the user
    const debugPassword = 'debug123';
    const hashedPassword = await bcrypt.hash(debugPassword, 10);

    const user = await prisma.user.create({
      data: {
        id: 'debug-brian-chippendale',
        email: 'brian.chippendale@debug.diyshows.com',
        username: 'Brian Chippendale (Debug)',
        passwordHash: hashedPassword,
        role: 'USER',
        verified: true
      }
    });

    console.log(`✅ Created user: ${user.username} (${user.email})`);

    // Add him as a member of Lightning Bolt
    const lightningBoltId = '1748101913848';
    
    // Check if Lightning Bolt exists
    const lightningBolt = await prisma.artist.findUnique({
      where: { id: lightningBoltId }
    });

    if (!lightningBolt) {
      console.log('❌ Lightning Bolt artist not found');
      return;
    }

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        entityType: 'ARTIST',
        entityId: lightningBoltId,
        role: 'member',
        permissions: ['edit_profile', 'view_analytics'],
        status: 'ACTIVE',
        joinedAt: new Date(),
        invitedBy: 'debug-brian-gibson' // Invited by Brian Gibson
      }
    });

    console.log(`✅ Added Brian Chippendale as member of Lightning Bolt`);

    // Verify the setup
    console.log('\n🔍 Verification:');
    const allLightningBoltMembers = await prisma.membership.findMany({
      where: {
        entityType: 'ARTIST',
        entityId: lightningBoltId,
        status: 'ACTIVE'
      },
      include: {
        user: true
      }
    });

    console.log(`Lightning Bolt now has ${allLightningBoltMembers.length} members:`);
    allLightningBoltMembers.forEach(member => {
      console.log(`  - ${member.user.username} (${member.role})`);
    });

    console.log('\n🎉 Brian Chippendale setup complete!');
    console.log(`   Email: brian.chippendale@debug.diyshows.com`);
    console.log(`   Password: debug123`);
    console.log(`   Role: Member of Lightning Bolt`);

  } catch (error) {
    console.error('❌ Error creating Brian Chippendale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBrianChippendale(); 
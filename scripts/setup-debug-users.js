const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDebugUsers() {
  try {
    console.log('🔍 Setting up debug users...');
    
    // Create debug users
    const debugUsers = [
      {
        email: 'brian.gibson@debug.com',
        username: 'debug-brian-gibson',
        role: 'USER'
      },
      {
        email: 'brian.chippendale@debug.com', 
        username: 'debug-brian-chippendale',
        role: 'USER'
      },
      {
        email: 'lidz.bierenday@debug.com',
        username: 'debug-lidz-bierenday',
        role: 'USER'
      },
      {
        email: 'venue.owner@debug.com',
        username: 'debug-venue-owner',
        role: 'USER'
      }
    ];
    
    for (const userData of debugUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username }
      });
      
      if (existingUser) {
        console.log(`✅ User ${userData.username} already exists (${existingUser.id})`);
      } else {
        const newUser = await prisma.user.create({
          data: userData
        });
        console.log(`✅ Created user ${userData.username} (${newUser.id})`);
      }
    }
    
    // Check all debug users
    const allDebugUsers = await prisma.user.findMany({
      where: {
        username: {
          startsWith: 'debug-'
        }
      },
      select: {
        id: true,
        username: true,
        email: true
      }
    });
    
    console.log(`\n👥 Found ${allDebugUsers.length} debug users total:`);
    allDebugUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.id})`);
    });
    
    console.log('\n✅ Debug users setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up debug users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDebugUsers(); 
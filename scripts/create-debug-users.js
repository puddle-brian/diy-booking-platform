const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDebugUsers() {
  try {
    console.log('🔧 Creating debug users with real credentials...');

    // Common debug password for all test users
    const debugPassword = 'debug123';
    const hashedPassword = await bcrypt.hash(debugPassword, 10);

    const debugUsers = [
      // Artists
      {
        id: 'debug-tom-may',
        email: 'tom@debug.diyshows.com',
        username: 'Tom May (Debug)',
        password: hashedPassword,
        role: 'USER',
        artistId: '2', // The Menzingers
        artistName: 'The Menzingers'
      },
      {
        id: 'debug-laura-jane',
        email: 'laura@debug.diyshows.com',
        username: 'Laura Jane Grace (Debug)',
        password: hashedPassword,
        role: 'USER',
        artistId: '1', // Against Me!
        artistName: 'Against Me!'
      },
      {
        id: 'debug-patti-smith',
        email: 'patti@debug.diyshows.com',
        username: 'Patti Smith (Debug)',
        password: hashedPassword,
        role: 'USER',
        artistId: '3', // Patti Smith
        artistName: 'Patti Smith'
      },
      {
        id: 'debug-barry-johnson',
        email: 'barry@debug.diyshows.com',
        username: 'Barry Johnson (Debug)',
        password: hashedPassword,
        role: 'USER',
        artistId: '5', // Joyce Manor
        artistName: 'Joyce Manor'
      },
      {
        id: 'debug-brian-gibson',
        email: 'brian.gibson@debug.diyshows.com',
        username: 'Brian Gibson (Debug)',
        password: hashedPassword,
        role: 'USER',
        artistId: '1748101913848', // Lightning Bolt
        artistName: 'Lightning Bolt'
      },
      // Venues
      {
        id: 'debug-lidz-bierenday',
        email: 'lidz@debug.diyshows.com',
        username: 'Lidz Bierenday (Debug)',
        password: hashedPassword,
        role: 'USER',
        venueId: '1748094967307', // Lost Bag
        venueName: 'Lost Bag'
      },
      {
        id: 'debug-joe-martinez',
        email: 'joe@debug.diyshows.com',
        username: 'Joe Martinez (Debug)',
        password: hashedPassword,
        role: 'USER',
        venueId: '1', // Joe's Basement
        venueName: "Joe's Basement"
      },
      {
        id: 'debug-sarah-chen',
        email: 'sarah@debug.diyshows.com',
        username: 'Sarah Chen (Debug)',
        password: hashedPassword,
        role: 'USER',
        venueId: '2', // Community Arts Center
        venueName: 'Community Arts Center'
      },
      {
        id: 'debug-mike-rodriguez',
        email: 'mike@debug.diyshows.com',
        username: 'Mike Rodriguez (Debug)',
        password: hashedPassword,
        role: 'USER',
        venueId: '4', // The Underground
        venueName: 'The Underground'
      },
      {
        id: 'debug-alex-thompson',
        email: 'alex@debug.diyshows.com',
        username: 'Alex Thompson (Debug)',
        password: hashedPassword,
        role: 'USER',
        venueId: '5', // VFW Post 1138
        venueName: 'VFW Post 1138'
      }
    ];

    console.log(`\n📝 Creating ${debugUsers.length} debug users...`);

    for (const userData of debugUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userData.id }
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.username} already exists, skipping...`);
        continue;
      }

      // Create the user
      const user = await prisma.user.create({
        data: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          passwordHash: userData.password,
          role: userData.role,
          verified: true
        }
      });

      console.log(`✅ Created user: ${user.username} (${user.email})`);

      // Link to artist or venue if specified
      if (userData.artistId) {
        try {
          await prisma.artist.update({
            where: { id: userData.artistId },
            data: { submittedById: user.id }
          });
          console.log(`   🎵 Linked to artist: ${userData.artistName}`);
        } catch (error) {
          console.log(`   ⚠️  Could not link to artist ${userData.artistName}: ${error.message}`);
        }
      }

      if (userData.venueId) {
        try {
          await prisma.venue.update({
            where: { id: userData.venueId },
            data: { submittedById: user.id }
          });
          console.log(`   🏢 Linked to venue: ${userData.venueName}`);
        } catch (error) {
          console.log(`   ⚠️  Could not link to venue ${userData.venueName}: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Debug users created successfully!');
    console.log('\n📋 Login credentials for all debug users:');
    console.log(`   Password: ${debugPassword}`);
    console.log('   Emails:');
    debugUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.username})`);
    });

  } catch (error) {
    console.error('❌ Error creating debug users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDebugUsers(); 
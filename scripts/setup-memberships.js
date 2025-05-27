const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupMemberships() {
  try {
    console.log('🔗 Setting up user memberships...');

    // Find Lightning Bolt artist
    const lightningBolt = await prisma.artist.findFirst({
      where: { name: { contains: 'lightning bolt', mode: 'insensitive' } }
    });

    if (!lightningBolt) {
      console.log('❌ Lightning Bolt artist not found');
      return;
    }

    console.log(`✅ Found Lightning Bolt artist with ID: ${lightningBolt.id}`);

    // Find or create Brian Gibson user
    let brianUser = await prisma.user.findFirst({
      where: { email: 'brian@lightningbolt.com' }
    });

    if (!brianUser) {
      console.log('Creating Brian Gibson user...');
      brianUser = await prisma.user.create({
        data: {
          email: 'brian@lightningbolt.com',
          username: 'briangibson',
          role: 'USER'
        }
      });
    }

    console.log(`✅ Brian Gibson user ID: ${brianUser.id}`);

    // Update Lightning Bolt to be submitted by Brian
    await prisma.artist.update({
      where: { id: lightningBolt.id },
      data: { submittedById: brianUser.id }
    });

    console.log(`✅ Updated Lightning Bolt to be owned by Brian Gibson`);

    // Find venue for venue membership example
    const venue = await prisma.venue.findFirst({
      where: { name: { contains: 'AS220' } }
    });

    if (venue) {
      console.log(`✅ Found venue: ${venue.name} (ID: ${venue.id})`);

      // Find or create venue owner user
      let venueUser = await prisma.user.findFirst({
        where: { email: 'owner@as220.org' }
      });

      if (!venueUser) {
        console.log('Creating venue owner user...');
        venueUser = await prisma.user.create({
          data: {
            email: 'owner@as220.org',
            username: 'as220owner',
            role: 'USER'
          }
        });
      }

      console.log(`✅ Venue owner user ID: ${venueUser.id}`);

      // Update venue to be submitted by the owner
      await prisma.venue.update({
        where: { id: venue.id },
        data: { submittedById: venueUser.id }
      });

      console.log(`✅ Updated ${venue.name} to be owned by venue owner`);
    }

    // Find Lost Bag venue and create Lidz user
    const lostBag = await prisma.venue.findFirst({
      where: { name: { contains: 'Lost Bag', mode: 'insensitive' } }
    });

    if (lostBag) {
      console.log(`✅ Found Lost Bag venue: ${lostBag.name} (ID: ${lostBag.id})`);

      // Find or create Lidz user
      let lidzUser = await prisma.user.findFirst({
        where: { email: 'lidz@lostbag.com' }
      });

      if (!lidzUser) {
        console.log('Creating Lidz Bierenday user...');
        lidzUser = await prisma.user.create({
          data: {
            email: 'lidz@lostbag.com',
            username: 'lidzbierenday',
            role: 'USER'
          }
        });
      }

      console.log(`✅ Lidz user ID: ${lidzUser.id}`);

      // Update Lost Bag to be submitted by Lidz
      await prisma.venue.update({
        where: { id: lostBag.id },
        data: { submittedById: lidzUser.id }
      });

      console.log(`✅ Updated ${lostBag.name} to be owned by Lidz`);
    }

    // List all users and their submissions
    const allUsers = await prisma.user.findMany({
      include: {
        submittedArtists: true,
        submittedVenues: true
      }
    });

    console.log('\n📋 All users and their submissions:');
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email}):`);
      if (user.submittedArtists.length > 0) {
        user.submittedArtists.forEach(artist => {
          console.log(`    → Artist: ${artist.name}`);
        });
      }
      if (user.submittedVenues.length > 0) {
        user.submittedVenues.forEach(venue => {
          console.log(`    → Venue: ${venue.name}`);
        });
      }
    });

    console.log('\n🎉 User ownership setup complete!');
  } catch (error) {
    console.error('❌ Error setting up memberships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupMemberships(); 
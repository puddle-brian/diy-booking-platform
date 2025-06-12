const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true }
    });
    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log(`- ${user.username || 'No username'} (${user.email}) - ID: ${user.id}`);
    });

    // Also check artists
    const artists = await prisma.artist.findMany({
      select: { id: true, name: true, userId: true }
    });
    console.log('\nArtists found:', artists.length);
    artists.forEach(artist => {
      console.log(`- ${artist.name} - ID: ${artist.id}, UserID: ${artist.userId}`);
    });

    // Check Lightning Bolt specifically
    const lightningBolt = await prisma.artist.findFirst({
      where: { id: '1748101913848' },
      select: { id: true, name: true, userId: true }
    });
    console.log('\nLightning Bolt check:', lightningBolt);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 
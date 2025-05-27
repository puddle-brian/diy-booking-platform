const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkArtistIds() {
  try {
    console.log('=== CHECKING ARTIST IDS ===');
    
    const artists = await prisma.artist.findMany({
      where: {
        OR: [
          { name: { contains: 'menzingers', mode: 'insensitive' } },
          { name: { contains: 'patti smith', mode: 'insensitive' } },
          { name: { contains: 'against me', mode: 'insensitive' } },
          { name: { contains: 'joyce manor', mode: 'insensitive' } },
          { name: { contains: 'lightning bolt', mode: 'insensitive' } }
        ]
      },
      include: {
        submittedBy: true
      }
    });
    
    console.log('Found artists:');
    artists.forEach(artist => {
      console.log(`- ${artist.name}: ID = ${artist.id}, Owner = ${artist.submittedBy?.username || 'None'}`);
    });
    
    console.log('\n=== ALL ARTISTS (first 10) ===');
    const allArtists = await prisma.artist.findMany({
      take: 10,
      include: {
        submittedBy: true
      }
    });
    
    allArtists.forEach(artist => {
      console.log(`- ${artist.name}: ID = ${artist.id}, Owner = ${artist.submittedBy?.username || 'None'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArtistIds(); 
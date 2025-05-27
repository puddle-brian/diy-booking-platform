const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMemberships() {
  try {
    console.log('=== ALL MEMBERSHIPS ===');
    const memberships = await prisma.membership.findMany({
      include: {
        user: true
      }
    });
    
    memberships.forEach(m => {
      console.log(`- User: ${m.user.username} (${m.userId}) is member of ${m.entityType} ${m.entityId}`);
    });
    
    console.log('\n=== ARTIST MEMBERSHIPS ===');
    const artistMemberships = await prisma.membership.findMany({
      where: { entityType: 'ARTIST' },
      include: { user: true }
    });
    
    artistMemberships.forEach(m => {
      console.log(`- ${m.user.username} is member of artist ${m.entityId}`);
    });
    
    console.log('\n=== CHECKING SPECIFIC ARTISTS ===');
    // Check Patti Smith artist
    const pattiSmithArtist = await prisma.artist.findFirst({
      where: { name: { contains: 'patti smith', mode: 'insensitive' } }
    });
    
    if (pattiSmithArtist) {
      console.log(`Found Patti Smith artist: ${pattiSmithArtist.name} (${pattiSmithArtist.id})`);
      
      const pattiMembers = await prisma.membership.findMany({
        where: { 
          entityType: 'ARTIST',
          entityId: pattiSmithArtist.id 
        },
        include: { user: true }
      });
      
      console.log(`Members of ${pattiSmithArtist.name}:`, pattiMembers.map(m => m.user.username));
    }
    
    // Check Menzingers artist
    const menzingersArtist = await prisma.artist.findFirst({
      where: { name: { contains: 'menzingers', mode: 'insensitive' } }
    });
    
    if (menzingersArtist) {
      console.log(`Found Menzingers artist: ${menzingersArtist.name} (${menzingersArtist.id})`);
      
      const menzingersMembers = await prisma.membership.findMany({
        where: { 
          entityType: 'ARTIST',
          entityId: menzingersArtist.id 
        },
        include: { user: true }
      });
      
      console.log(`Members of ${menzingersArtist.name}:`, menzingersMembers.map(m => m.user.username));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMemberships(); 
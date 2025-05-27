const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDebugUsers() {
  try {
    console.log('=== CHECKING DEBUG USERS ===');
    
    const debugUsers = [
      'tom-may',
      'patti-smith',
      'laura-jane-grace',
      'barry-johnson',
      'brian-chippendale'
    ];
    
    for (const userId of debugUsers) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          submittedArtists: true,
          submittedVenues: true
        }
      });
      
      if (user) {
        console.log(`✅ Found user: ${user.username} (${user.id})`);
        console.log(`   - Submitted artists: ${user.submittedArtists.map(a => a.name).join(', ') || 'None'}`);
        console.log(`   - Submitted venues: ${user.submittedVenues.map(v => v.name).join(', ') || 'None'}`);
      } else {
        console.log(`❌ User not found: ${userId}`);
      }
    }
    
    console.log('\n=== CHECKING ARTIST OWNERSHIP ===');
    
    // Check specific artists
    const artistsToCheck = [
      { name: 'The Menzingers', id: '2' },
      { name: 'Patti Smith', id: '3' },
      { name: 'Against Me!', id: '1' },
      { name: 'Joyce Manor', id: '5' }
    ];
    
    for (const artistInfo of artistsToCheck) {
      const artist = await prisma.artist.findUnique({
        where: { id: artistInfo.id },
        include: { submittedBy: true }
      });
      
      if (artist) {
        console.log(`🎵 ${artist.name} (${artist.id}): Owner = ${artist.submittedBy?.username || 'None'}`);
      } else {
        console.log(`❌ Artist not found: ${artistInfo.name} (${artistInfo.id})`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDebugUsers(); 
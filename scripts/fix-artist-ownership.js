const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixArtistOwnership() {
  try {
    console.log('🔍 Checking artist ownership...');
    
    // Get all artists
    const artists = await prisma.artist.findMany({
      select: {
        id: true,
        name: true,
        submittedById: true
      }
    });
    
    console.log(`Found ${artists.length} artists total`);
    
    // Find artists without owners
    const artistsWithoutOwners = artists.filter(artist => !artist.submittedById);
    console.log(`Found ${artistsWithoutOwners.length} artists without owners:`);
    
    artistsWithoutOwners.forEach(artist => {
      console.log(`  - ${artist.name} (ID: ${artist.id})`);
    });
    
    // Find Lightning Bolt specifically
    const lightningBolt = artists.find(a => a.name.toLowerCase().includes('lightning bolt'));
    if (lightningBolt) {
      console.log(`\n⚡ Lightning Bolt artist:`, lightningBolt);
    }
    
    // Get debug users
    const debugUsers = await prisma.user.findMany({
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
    
    console.log(`\n👥 Found ${debugUsers.length} debug users:`);
    debugUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.id})`);
    });
    
    // Fix artist ownership
    if (artistsWithoutOwners.length > 0 && debugUsers.length > 0) {
      console.log('\n🔧 Fixing artist ownership...');
      
      // Map specific artists to specific debug users
      const artistMapping = {
        'lightning bolt': 'debug-brian-gibson',
      };
      
      const brianGibson = debugUsers.find(u => u.username === 'debug-brian-gibson');
      const brianChippendale = debugUsers.find(u => u.username === 'debug-brian-chippendale');
      const lidzUser = debugUsers.find(u => u.username === 'debug-lidz-bierenday');
      const defaultOwner = brianGibson || debugUsers[0];
      
      console.log(`Using ${defaultOwner.username} as default artist owner`);
      
      // Update artists without owners
      for (const artist of artistsWithoutOwners) {
        let ownerUser = defaultOwner;
        
        // Check for specific mappings
        const artistNameLower = artist.name.toLowerCase();
        if (artistNameLower.includes('lightning bolt') && brianGibson) {
          ownerUser = brianGibson;
        }
        
        await prisma.artist.update({
          where: { id: artist.id },
          data: { submittedById: ownerUser.id }
        });
        console.log(`✅ Fixed ownership for ${artist.name} -> ${ownerUser.username}`);
      }
      
      console.log('\n✅ All artist ownership issues fixed!');
    }
    
  } catch (error) {
    console.error('❌ Error checking artist ownership:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixArtistOwnership(); 
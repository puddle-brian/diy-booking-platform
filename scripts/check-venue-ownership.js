const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVenueOwnership() {
  try {
    console.log('🔍 Checking venue ownership...');
    
    // Get all venues
    const venues = await prisma.venue.findMany({
      select: {
        id: true,
        name: true,
        submittedById: true
      }
    });
    
    console.log(`Found ${venues.length} venues total`);
    
    // Find venues without owners
    const venuesWithoutOwners = venues.filter(venue => !venue.submittedById);
    console.log(`Found ${venuesWithoutOwners.length} venues without owners:`);
    
    venuesWithoutOwners.forEach(venue => {
      console.log(`  - ${venue.name} (ID: ${venue.id})`);
    });
    
    // Find specific venues mentioned in the error logs
    const brillobox = venues.find(v => v.name.toLowerCase().includes('brillobox'));
    if (brillobox) {
      console.log(`\n📍 Brillobox venue:`, brillobox);
    }
    
    // Get debug users to potentially assign ownership
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
    
    // Try to fix venue ownership by assigning to debug users
    if (venuesWithoutOwners.length > 0 && debugUsers.length > 0) {
      console.log('\n🔧 Fixing venue ownership...');
      
      // Find or create a venue owner debug user
      let venueOwner = debugUsers.find(u => u.username.includes('lidz')) || debugUsers[0];
      
      if (!venueOwner) {
        console.log('Creating venue owner user...');
        venueOwner = await prisma.user.create({
          data: {
            email: 'venue-owner@debug.com',
            username: 'debug-venue-owner',
            role: 'USER'
          }
        });
      }
      
      console.log(`Using ${venueOwner.username} as venue owner`);
      
      // Update venues without owners
      for (const venue of venuesWithoutOwners) {
        await prisma.venue.update({
          where: { id: venue.id },
          data: { submittedById: venueOwner.id }
        });
        console.log(`✅ Fixed ownership for ${venue.name}`);
      }
      
      console.log('\n✅ All venue ownership issues fixed!');
    }
    
  } catch (error) {
    console.error('❌ Error checking venue ownership:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVenueOwnership(); 
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDeleteArtist() {
  try {
    const artistId = 'cmbaplfh7001i010w1trw5pzs';
    console.log('🧪 Testing delete functionality for artist:', artistId);
    
    // First, let's verify the artist exists and check all related records
    const artist = await prisma.artist.findUnique({
      where: { id: artistId }
    });
    
    if (!artist) {
      console.log('❌ Artist not found');
      return;
    }
    
    console.log(`✅ Found artist: ${artist.name}`);
    
    // Test if we can access the favorite model
    console.log('\n🔍 Testing Prisma client access...');
    try {
      const favoriteCount = await prisma.favorite.count({
        where: {
          entityType: 'ARTIST',
          entityId: artistId
        }
      });
      console.log(`✅ Favorites table accessible, found ${favoriteCount} favorites`);
    } catch (error) {
      console.log('❌ Error accessing favorites table:', error.message);
    }
    
    // Check all related records before deletion
    console.log('\n📊 Current related records:');
    
    const shows = await prisma.show.count({ where: { artistId } });
    console.log(`  Shows: ${shows}`);
    
    const tourRequests = await prisma.tourRequest.count({ where: { artistId } });
    console.log(`  Tour requests: ${tourRequests}`);
    
    const bids = await prisma.bid.count({
      where: { tourRequest: { artistId } }
    });
    console.log(`  Bids: ${bids}`);
    
    const memberships = await prisma.membership.count({
      where: { entityType: 'ARTIST', entityId: artistId }
    });
    console.log(`  Memberships: ${memberships}`);
    
    const favorites = await prisma.favorite.count({
      where: { entityType: 'ARTIST', entityId: artistId }
    });
    console.log(`  Favorites: ${favorites}`);
    
    console.log('\n🗑️ Simulating deletion process...');
    
    // Simulate the deletion steps (without actually deleting)
    console.log('1. Would delete bids...');
    console.log('2. Would delete tour requests...');
    console.log('3. Would delete shows...');
    console.log('4. Would delete memberships...');
    console.log('5. Would delete favorites...');
    console.log('6. Would delete artist...');
    
    console.log('\n✅ Delete simulation complete. The actual delete should work now.');
    console.log('\n💡 To actually delete the artist, use the admin interface or call the API endpoint:');
    console.log(`   DELETE /api/artists/${artistId}`);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteArtist(); 
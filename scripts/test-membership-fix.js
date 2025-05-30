const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMembershipFix() {
  try {
    console.log('🧪 Testing membership fix...');
    
    // Test the specific user from the logs
    const userId = 'debug-lidz-bierenday';
    
    console.log(`\n1. Checking user ${userId} exists:`);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        submittedVenues: true,
        submittedArtists: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User found: ${user.username} (${user.email})`);
    console.log(`   Submitted venues: ${user.submittedVenues.length}`);
    console.log(`   Submitted artists: ${user.submittedArtists.length}`);
    
    // Check memberships in the new table
    console.log(`\n2. Checking memberships table:`);
    const memberships = await prisma.membership.findMany({
      where: {
        userId: userId,
        status: 'ACTIVE'
      }
    });
    
    console.log(`✅ Found ${memberships.length} memberships:`);
    for (const membership of memberships) {
      console.log(`   - ${membership.entityType} ${membership.entityId} (${membership.role})`);
      
      // Get entity details
      if (membership.entityType === 'VENUE') {
        const venue = await prisma.venue.findUnique({
          where: { id: membership.entityId }
        });
        if (venue) {
          console.log(`     Venue: ${venue.name}`);
        }
      } else if (membership.entityType === 'ARTIST') {
        const artist = await prisma.artist.findUnique({
          where: { id: membership.entityId }
        });
        if (artist) {
          console.log(`     Artist: ${artist.name}`);
        }
      }
    }
    
    // Simulate the API logic
    console.log(`\n3. Simulating API response:`);
    const apiMemberships = [];
    
    // Add ownership memberships
    for (const venue of user.submittedVenues) {
      apiMemberships.push({
        entityType: 'venue',
        entityId: venue.id,
        entityName: venue.name,
        role: 'owner',
        joinedAt: venue.createdAt.toISOString()
      });
    }
    
    for (const artist of user.submittedArtists) {
      apiMemberships.push({
        entityType: 'artist',
        entityId: artist.id,
        entityName: artist.name,
        role: 'owner',
        joinedAt: artist.createdAt.toISOString()
      });
    }
    
    // Add membership table entries
    for (const membership of memberships) {
      let entityName = 'Unknown';
      
      if (membership.entityType === 'VENUE') {
        const venue = await prisma.venue.findUnique({
          where: { id: membership.entityId }
        });
        if (venue) {
          entityName = venue.name;
          
          // Check if we already have this from ownership
          const existing = apiMemberships.find(m => 
            m.entityType === 'venue' && m.entityId === membership.entityId
          );
          
          if (!existing) {
            apiMemberships.push({
              entityType: 'venue',
              entityId: membership.entityId,
              entityName: venue.name,
              role: membership.role.toLowerCase(),
              joinedAt: membership.joinedAt.toISOString()
            });
          }
        }
      } else if (membership.entityType === 'ARTIST') {
        const artist = await prisma.artist.findUnique({
          where: { id: membership.entityId }
        });
        if (artist) {
          entityName = artist.name;
          
          // Check if we already have this from ownership
          const existing = apiMemberships.find(m => 
            m.entityType === 'artist' && m.entityId === membership.entityId
          );
          
          if (!existing) {
            apiMemberships.push({
              entityType: 'artist',
              entityId: membership.entityId,
              entityName: artist.name,
              role: membership.role.toLowerCase(),
              joinedAt: membership.joinedAt.toISOString()
            });
          }
        }
      }
    }
    
    console.log(`✅ API would return ${apiMemberships.length} memberships:`);
    apiMemberships.forEach(m => {
      console.log(`   - ${m.entityType}: ${m.entityName} (${m.role})`);
    });
    
    // Test a few other debug users
    console.log(`\n4. Quick check of other debug users:`);
    const otherUsers = [
      'debug-tom-may',
      'debug-brian-gibson',
      'debug-joe-martinez'
    ];
    
    for (const otherUserId of otherUsers) {
      const otherMemberships = await prisma.membership.findMany({
        where: {
          userId: otherUserId,
          status: 'ACTIVE'
        }
      });
      console.log(`   ${otherUserId}: ${otherMemberships.length} memberships`);
    }
    
    console.log('\n🎉 Membership fix verification complete!');
    console.log('\n📋 Summary:');
    console.log(`   - User ${userId} now has ${memberships.length} active memberships`);
    console.log(`   - This should resolve the "0 membership records" issue from the logs`);
    console.log(`   - The API should now return proper membership data`);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMembershipFix(); 
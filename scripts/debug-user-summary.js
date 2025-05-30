const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUserSummary() {
  try {
    console.log('📊 Debug User Summary Report');
    console.log('=' .repeat(50));
    
    const debugUsers = [
      { id: 'debug-tom-may', name: 'Tom May (Debug)', expectedEntity: 'The Menzingers (Artist)' },
      { id: 'debug-laura-jane', name: 'Laura Jane Grace (Debug)', expectedEntity: 'Against Me! (Artist)' },
      { id: 'debug-patti-smith', name: 'Patti Smith (Debug)', expectedEntity: 'Patti Smith (Artist)' },
      { id: 'debug-barry-johnson', name: 'Barry Johnson (Debug)', expectedEntity: 'Joyce Manor (Artist)' },
      { id: 'debug-brian-gibson', name: 'Brian Gibson (Debug)', expectedEntity: 'Lightning Bolt (Artist)' },
      { id: 'debug-lidz-bierenday', name: 'Lidz Bierenday (Debug)', expectedEntity: 'Lost Bag (Venue)' },
      { id: 'debug-joe-martinez', name: 'Joe Martinez (Debug)', expectedEntity: "Joe's Basement (Venue)" },
      { id: 'debug-sarah-chen', name: 'Sarah Chen (Debug)', expectedEntity: 'Community Arts Center (Venue)' },
      { id: 'debug-mike-rodriguez', name: 'Mike Rodriguez (Debug)', expectedEntity: 'The Underground (Venue)' },
      { id: 'debug-alex-thompson', name: 'Alex Thompson (Debug)', expectedEntity: 'VFW Post 1138 (Venue)' }
    ];
    
    let totalMemberships = 0;
    let usersWithMemberships = 0;
    
    for (const debugUser of debugUsers) {
      console.log(`\n👤 ${debugUser.name}`);
      console.log(`   Expected: ${debugUser.expectedEntity}`);
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: debugUser.id }
      });
      
      if (!user) {
        console.log('   ❌ User not found in database');
        continue;
      }
      
      console.log(`   ✅ User exists: ${user.email}`);
      
      // Check memberships
      const memberships = await prisma.membership.findMany({
        where: {
          userId: debugUser.id,
          status: 'ACTIVE'
        }
      });
      
      if (memberships.length === 0) {
        console.log('   ❌ No memberships found');
      } else {
        console.log(`   ✅ ${memberships.length} membership(s):`);
        usersWithMemberships++;
        totalMemberships += memberships.length;
        
        for (const membership of memberships) {
          // Get entity details
          let entityName = 'Unknown';
          if (membership.entityType === 'VENUE') {
            const venue = await prisma.venue.findUnique({
              where: { id: membership.entityId }
            });
            if (venue) {
              entityName = venue.name;
            }
          } else if (membership.entityType === 'ARTIST') {
            const artist = await prisma.artist.findUnique({
              where: { id: membership.entityId }
            });
            if (artist) {
              entityName = artist.name;
            }
          }
          
          console.log(`      - ${membership.entityType}: ${entityName} (${membership.role})`);
        }
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📈 Summary Statistics:');
    console.log(`   Total debug users: ${debugUsers.length}`);
    console.log(`   Users with memberships: ${usersWithMemberships}`);
    console.log(`   Total memberships: ${totalMemberships}`);
    console.log(`   Average memberships per user: ${(totalMemberships / debugUsers.length).toFixed(1)}`);
    
    if (usersWithMemberships === debugUsers.length) {
      console.log('\n🎉 SUCCESS: All debug users have memberships!');
      console.log('   The membership fix was successful.');
      console.log('   Users should now be able to log in and see their entities.');
    } else {
      console.log(`\n⚠️  WARNING: ${debugUsers.length - usersWithMemberships} users still missing memberships`);
      console.log('   You may need to run the fix script again or check for issues.');
    }
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Go to /admin to test quick login with debug users');
    console.log('   3. Verify that users can see their entities after login');
    console.log('   4. Check that the "0 membership records" error is resolved');
    
  } catch (error) {
    console.error('❌ Error generating summary:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserSummary(); 
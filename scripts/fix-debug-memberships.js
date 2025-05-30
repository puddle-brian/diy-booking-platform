const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDebugMemberships() {
  try {
    console.log('🔧 Fixing debug user memberships...');

    // Define the debug user mappings based on the create-debug-users.js script
    const debugUserMappings = [
      // Artists
      {
        userId: 'debug-tom-may',
        entityType: 'ARTIST',
        entityId: '2', // The Menzingers
        role: 'owner',
        entityName: 'The Menzingers'
      },
      {
        userId: 'debug-laura-jane',
        entityType: 'ARTIST',
        entityId: '1', // Against Me!
        role: 'owner',
        entityName: 'Against Me!'
      },
      {
        userId: 'debug-patti-smith',
        entityType: 'ARTIST',
        entityId: '3', // Patti Smith
        role: 'owner',
        entityName: 'Patti Smith'
      },
      {
        userId: 'debug-barry-johnson',
        entityType: 'ARTIST',
        entityId: '5', // Joyce Manor
        role: 'owner',
        entityName: 'Joyce Manor'
      },
      {
        userId: 'debug-brian-gibson',
        entityType: 'ARTIST',
        entityId: '1748101913848', // Lightning Bolt
        role: 'owner',
        entityName: 'Lightning Bolt'
      },
      // Venues
      {
        userId: 'debug-lidz-bierenday',
        entityType: 'VENUE',
        entityId: '1748094967307', // Lost Bag
        role: 'owner',
        entityName: 'Lost Bag'
      },
      {
        userId: 'debug-joe-martinez',
        entityType: 'VENUE',
        entityId: '1', // Joe's Basement
        role: 'owner',
        entityName: "Joe's Basement"
      },
      {
        userId: 'debug-sarah-chen',
        entityType: 'VENUE',
        entityId: '2', // Community Arts Center
        role: 'owner',
        entityName: 'Community Arts Center'
      },
      {
        userId: 'debug-mike-rodriguez',
        entityType: 'VENUE',
        entityId: '4', // The Underground
        role: 'owner',
        entityName: 'The Underground'
      },
      {
        userId: 'debug-alex-thompson',
        entityType: 'VENUE',
        entityId: '5', // VFW Post 1138
        role: 'owner',
        entityName: 'VFW Post 1138'
      }
    ];

    console.log(`\n📝 Processing ${debugUserMappings.length} debug user memberships...`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const mapping of debugUserMappings) {
      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: mapping.userId }
        });

        if (!user) {
          console.log(`⚠️  User ${mapping.userId} not found, skipping...`);
          skippedCount++;
          continue;
        }

        // Check if entity exists
        let entity = null;
        if (mapping.entityType === 'ARTIST') {
          entity = await prisma.artist.findUnique({
            where: { id: mapping.entityId }
          });
        } else {
          entity = await prisma.venue.findUnique({
            where: { id: mapping.entityId }
          });
        }

        if (!entity) {
          console.log(`⚠️  ${mapping.entityType} ${mapping.entityId} (${mapping.entityName}) not found, skipping...`);
          skippedCount++;
          continue;
        }

        // Check if membership already exists
        const existingMembership = await prisma.membership.findUnique({
          where: {
            userId_entityType_entityId: {
              userId: mapping.userId,
              entityType: mapping.entityType,
              entityId: mapping.entityId
            }
          }
        });

        if (existingMembership) {
          console.log(`⏭️  Membership already exists: ${user.username} -> ${mapping.entityName}`);
          skippedCount++;
          continue;
        }

        // Define permissions based on role and entity type
        let permissions = [];
        if (mapping.role === 'owner') {
          if (mapping.entityType === 'ARTIST') {
            permissions = ['edit_profile', 'manage_bookings', 'invite_members', 'manage_members', 'view_analytics', 'delete_artist'];
          } else {
            permissions = ['edit_profile', 'manage_bookings', 'invite_staff', 'manage_staff', 'view_analytics', 'delete_venue'];
          }
        }

        // Create the membership
        const membership = await prisma.membership.create({
          data: {
            userId: mapping.userId,
            entityType: mapping.entityType,
            entityId: mapping.entityId,
            role: mapping.role,
            permissions: permissions,
            status: 'ACTIVE',
            joinedAt: new Date(),
            invitedBy: mapping.userId // Self-created through ownership
          }
        });

        console.log(`✅ Created membership: ${user.username} -> ${mapping.entityName} (${mapping.role})`);
        createdCount++;

        // Also update the entity's submittedById if not already set
        if (mapping.entityType === 'ARTIST') {
          await prisma.artist.update({
            where: { id: mapping.entityId },
            data: { submittedById: mapping.userId }
          });
        } else {
          await prisma.venue.update({
            where: { id: mapping.entityId },
            data: { submittedById: mapping.userId }
          });
        }

      } catch (error) {
        console.error(`❌ Error processing ${mapping.userId} -> ${mapping.entityName}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${createdCount} memberships`);
    console.log(`   ⏭️  Skipped: ${skippedCount} (already existed or entity not found)`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Verify the fix by checking a specific user
    console.log('\n🔍 Verification - checking debug-lidz-bierenday memberships:');
    const lidzMemberships = await prisma.membership.findMany({
      where: {
        userId: 'debug-lidz-bierenday',
        status: 'ACTIVE'
      }
    });
    console.log(`   Found ${lidzMemberships.length} memberships for debug-lidz-bierenday`);

    if (lidzMemberships.length > 0) {
      for (const membership of lidzMemberships) {
        console.log(`   - ${membership.entityType} ${membership.entityId} (${membership.role})`);
      }
    }

    console.log('\n🎉 Debug membership fix complete!');

  } catch (error) {
    console.error('❌ Error fixing debug memberships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDebugMemberships();

// Export for potential reuse
module.exports = { fixDebugMemberships }; 
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateLegacyTourRequests() {
  console.log('🔄 Starting migration of legacy tour requests...');
  
  try {
    // Find all tour requests that have startDate and endDate but no requestDate
    const legacyRequests = await prisma.tourRequest.findMany({
      where: {
        AND: [
          { startDate: { not: null } },
          { endDate: { not: null } },
          { requestDate: null },
          { isLegacyRange: false } // These are the problematic ones
        ]
      }
    });
    
    console.log(`📊 Found ${legacyRequests.length} tour requests to migrate`);
    
    if (legacyRequests.length === 0) {
      console.log('✅ No migration needed - all tour requests are already properly formatted');
      return;
    }
    
    // Update them to be marked as legacy ranges
    const updateResult = await prisma.tourRequest.updateMany({
      where: {
        AND: [
          { startDate: { not: null } },
          { endDate: { not: null } },
          { requestDate: null },
          { isLegacyRange: false }
        ]
      },
      data: {
        isLegacyRange: true
      }
    });
    
    console.log(`✅ Successfully migrated ${updateResult.count} tour requests to legacy format`);
    console.log('🎯 These requests will now display properly as date ranges');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateLegacyTourRequests()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }); 
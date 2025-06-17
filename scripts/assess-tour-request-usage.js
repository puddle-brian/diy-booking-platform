const { PrismaClient } = require('@prisma/client');

async function assessTourRequestUsage() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Assessing TourRequest usage in production...\n');
    
    // 1. Check if TourRequest table exists and has data
    try {
      const tourRequestCount = await prisma.tourRequest.count();
      console.log(`📊 TourRequest records: ${tourRequestCount}`);
      
      if (tourRequestCount > 0) {
        const sampleRequests = await prisma.tourRequest.findMany({
          take: 3,
          include: {
            artist: { select: { name: true } },
            venue: { select: { name: true } }
          }
        });
        
        console.log('📋 Sample TourRequest data:');
        sampleRequests.forEach((req, i) => {
          console.log(`  ${i + 1}. ${req.artist?.name || 'Unknown'} → ${req.venue?.name || 'Unknown'}`);
          console.log(`     Status: ${req.status}, Dates: ${req.requestedDates?.length || 0}`);
        });
      }
    } catch (error) {
      console.log('⚠️  TourRequest table might not exist or is inaccessible');
    }
    
    // 2. Check ShowRequest usage
    const showRequestCount = await prisma.showRequest.count();
    console.log(`\n📊 ShowRequest records: ${showRequestCount}`);
    
    if (showRequestCount > 0) {
      const showRequestTypes = await prisma.showRequest.groupBy({
        by: ['initiatedBy'],
        _count: { initiatedBy: true }
      });
      
      console.log('📋 ShowRequest types:');
      showRequestTypes.forEach(type => {
        console.log(`  - ${type.initiatedBy}: ${type._count.initiatedBy} requests`);
      });
      
      // Check age restriction format inconsistencies
      const ageRestrictions = await prisma.showRequest.findMany({
        select: { ageRestriction: true },
        where: { ageRestriction: { not: null } },
        distinct: ['ageRestriction']
      });
      
      console.log('\n🎯 Age restriction formats found:');
      ageRestrictions.forEach(ar => {
        console.log(`  - "${ar.ageRestriction}"`);
      });
    }
    
    // 3. Check Show model for comparison
    const showCount = await prisma.show.count();
    console.log(`\n📊 Confirmed Show records: ${showCount}`);
    
    if (showCount > 0) {
      const showAgeRestrictions = await prisma.show.findMany({
        select: { ageRestriction: true },
        where: { ageRestriction: { not: null } },
        distinct: ['ageRestriction']
      });
      
      console.log('🎯 Show age restriction formats:');
      showAgeRestrictions.forEach(ar => {
        console.log(`  - ${ar.ageRestriction}`);
      });
    }
    
    // 4. Check for references to TourRequest in other tables
    console.log('\n🔗 Checking foreign key relationships...');
    
    // Check bids table for tourRequestId references
    try {
      const bidsWithTourRequest = await prisma.bid.count({
        where: { tourRequestId: { not: null } }
      });
      console.log(`📊 Bids linked to TourRequests: ${bidsWithTourRequest}`);
    } catch (error) {
      console.log('⚠️  No TourRequest foreign keys found in Bids table');
    }
    
    console.log('\n✅ Assessment complete. Safe to proceed with refactor planning.');
    
    // 5. Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (tourRequestCount === 0) {
      console.log('✅ TourRequest table is empty - safe to remove');
      console.log('✅ Focus refactor on ShowRequest → unified timeline');
    } else {
      console.log('⚠️  TourRequest has data - migration script needed');
      console.log('📋 Create migration: TourRequest → ShowRequest');
    }
    
    console.log('\n🎯 PRIORITY FIXES:');
    console.log('1. Standardize age restriction enum format');
    console.log('2. Remove ShowRequest → TourRequest conversion layer');
    console.log('3. Create unified timeline components');
    console.log('4. Update type definitions');
    
  } catch (error) {
    console.error('❌ Error during assessment:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

assessTourRequestUsage(); 
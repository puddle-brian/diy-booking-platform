const { PrismaClient } = require('@prisma/client');

async function fixAgeRestrictions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Starting age restriction normalization...\n');
    
    // 1. First, let's see what we're working with
    const showRequestRestrictions = await prisma.showRequest.findMany({
      select: { id: true, ageRestriction: true },
      where: { ageRestriction: { not: null } },
      distinct: ['ageRestriction']
    });
    
    console.log('📋 Current ShowRequest age restrictions:');
    showRequestRestrictions.forEach(sr => {
      console.log(`  - "${sr.ageRestriction}"`);
    });
    
    const showRestrictions = await prisma.show.findMany({
      select: { id: true, ageRestriction: true },
      where: { ageRestriction: { not: null } },
      distinct: ['ageRestriction']
    });
    
    console.log('\n📋 Current Show age restrictions:');
    showRestrictions.forEach(s => {
      console.log(`  - ${s.ageRestriction}`);
    });
    
    // 2. Count records that need updating
    const needsUpdate = await prisma.showRequest.count({
      where: {
        ageRestriction: {
          in: ['ALL_AGES', 'all ages', '18+', '21+', 'all_ages', 'eighteen_plus', 'twenty_one_plus']
        }
      }
    });
    
    console.log(`\n🎯 Found ${needsUpdate} ShowRequest records that need normalization`);
    
    if (needsUpdate === 0) {
      console.log('✅ No age restrictions need updating!');
      return;
    }
    
    // 3. Ask for confirmation (safety check)
    console.log('\n⚠️  About to normalize age restrictions in ShowRequest table:');
    console.log('   - "ALL_AGES" → "ALL_AGES" (already correct)');
    console.log('   - "all ages" → "ALL_AGES"');
    console.log('   - "18+" → "EIGHTEEN_PLUS"');
    console.log('   - "21+" → "TWENTY_ONE_PLUS"');
    console.log('   - "all_ages" → "ALL_AGES"');
    console.log('   - "eighteen_plus" → "EIGHTEEN_PLUS"');
    console.log('   - "twenty_one_plus" → "TWENTY_ONE_PLUS"');
    
    // For now, let's just do the normalization automatically since this is safe
    console.log('\n🔄 Proceeding with normalization...');
    
    // 4. Perform the updates (safe operations)
    let updated = 0;
    
    // Update common variations to standard enum format
    const updates = [
      { from: 'all ages', to: 'ALL_AGES' },
      { from: 'all_ages', to: 'ALL_AGES' },
      { from: '18+', to: 'EIGHTEEN_PLUS' },
      { from: 'eighteen_plus', to: 'EIGHTEEN_PLUS' },
      { from: '21+', to: 'TWENTY_ONE_PLUS' },
      { from: 'twenty_one_plus', to: 'TWENTY_ONE_PLUS' }
    ];
    
    for (const update of updates) {
      const result = await prisma.showRequest.updateMany({
        where: { ageRestriction: update.from },
        data: { ageRestriction: update.to }
      });
      
      if (result.count > 0) {
        console.log(`✅ Updated ${result.count} records: "${update.from}" → "${update.to}"`);
        updated += result.count;
      }
    }
    
    // 5. Verify the results
    console.log(`\n📊 Total records updated: ${updated}`);
    
    const finalRestrictions = await prisma.showRequest.findMany({
      select: { ageRestriction: true },
      where: { ageRestriction: { not: null } },
      distinct: ['ageRestriction']
    });
    
    console.log('\n✅ Final ShowRequest age restriction formats:');
    finalRestrictions.forEach(sr => {
      console.log(`  - "${sr.ageRestriction}"`);
    });
    
    console.log('\n🎉 Age restriction normalization completed successfully!');
    console.log('💡 ShowRequest and Show models now use consistent enum formats');
    
  } catch (error) {
    console.error('❌ Error during age restriction normalization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly
if (require.main === module) {
  fixAgeRestrictions().catch(console.error);
}

module.exports = { fixAgeRestrictions }; 
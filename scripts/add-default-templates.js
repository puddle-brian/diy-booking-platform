const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to create a default template
async function createDefaultTemplate(artistId, artistName) {
  try {
    const defaultTemplate = {
      artistId,
      name: 'My Standard Setup',
      type: 'COMPLETE',
      isDefault: true,
      description: 'Default template with common touring requirements. Edit this to match your needs!',
      equipment: {
        needsPA: true,
        needsMics: true,
        needsDrums: false,
        needsAmps: true,
        acoustic: false,
      },
      guaranteeRange: {
        min: 200,
        max: 500
      },
      acceptsDoorDeals: true,
      merchandising: true,
      travelMethod: 'van',
      lodging: 'flexible',
      ageRestriction: 'all-ages',
      tourStatus: 'exploring-interest',
      notes: 'This is your default template! Edit it in your artist dashboard to match your specific needs. You can create additional templates for different types of shows (acoustic, full band, festival, etc.)'
    };

    const template = await prisma.artistTemplate.create({
      data: defaultTemplate
    });

    console.log(`✅ Created default template for ${artistName} (${artistId})`);
    return template;
  } catch (error) {
    console.error(`❌ Failed to create default template for ${artistName} (${artistId}):`, error.message);
    return null;
  }
}

async function addDefaultTemplates() {
  try {
    console.log('🎨 Starting to add default templates to artists without templates...\n');

    // Find all artists
    const artists = await prisma.artist.findMany({
      select: {
        id: true,
        name: true,
        templates: true
      }
    });

    console.log(`📊 Found ${artists.length} total artists`);

    // Filter artists who don't have any templates
    const artistsWithoutTemplates = artists.filter(artist => artist.templates.length === 0);
    
    console.log(`🎯 Found ${artistsWithoutTemplates.length} artists without templates\n`);

    if (artistsWithoutTemplates.length === 0) {
      console.log('🎉 All artists already have templates!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Create default templates for artists who don't have any
    for (const artist of artistsWithoutTemplates) {
      const template = await createDefaultTemplate(artist.id, artist.name);
      if (template) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Successfully created templates: ${successCount}`);
    console.log(`❌ Failed to create templates: ${errorCount}`);
    console.log(`🎯 Total artists processed: ${artistsWithoutTemplates.length}`);

    if (successCount > 0) {
      console.log('\n🎉 Default templates have been added! Artists will now see:');
      console.log('   • A "My Standard Setup" template when they create tour requests');
      console.log('   • Auto-filled forms with sensible defaults');
      console.log('   • Guidance on how the template system works');
      console.log('   • Instructions to customize the template for their needs');
    }

  } catch (error) {
    console.error('❌ Error adding default templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addDefaultTemplates()
    .then(() => {
      console.log('\n🎨 Default template addition completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addDefaultTemplates, createDefaultTemplate }; 
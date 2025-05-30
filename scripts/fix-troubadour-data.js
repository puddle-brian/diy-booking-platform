const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTroubadourData() {
  try {
    console.log('🎭 Fixing The Troubadour venue data...');

    // Find The Troubadour venue
    const troubadour = await prisma.venue.findFirst({
      where: { name: 'The Troubadour' },
      include: { location: true }
    });

    if (!troubadour) {
      console.log('❌ The Troubadour venue not found');
      return;
    }

    console.log(`📍 Found The Troubadour: ${troubadour.id}`);
    console.log(`📍 Current location: ${troubadour.location.city}, ${troubadour.location.stateProvince}`);

    // Find or create Los Angeles location
    let laLocation = await prisma.location.findFirst({
      where: {
        city: 'Los Angeles',
        stateProvince: 'CA',
        country: 'USA'
      }
    });

    if (!laLocation) {
      console.log('🏙️ Creating Los Angeles location...');
      laLocation = await prisma.location.create({
        data: {
          city: 'Los Angeles',
          stateProvince: 'CA',
          country: 'USA'
        }
      });
    }

    // Update The Troubadour with correct data
    const updatedVenue = await prisma.venue.update({
      where: { id: troubadour.id },
      data: {
        locationId: laLocation.id,
        venueType: 'CLUB',
        capacity: 400,
        ageRestriction: 'ALL_AGES',
        contactEmail: 'booking@troubadour.com',
        contactPhone: '(310) 276-6168',
        website: 'https://www.troubadour.com',
        streetAddress: '9081 Santa Monica Blvd',
        postalCode: '90069',
        neighborhood: 'West Hollywood',
        description: 'Legendary West Hollywood music venue since 1957. Historic club that launched countless careers.',
        equipment: {
          pa: true,
          mics: true,
          drums: false,
          amps: true,
          piano: false
        },
        features: ['Historic Venue', 'Professional Sound', 'Full Bar'],
        pricing: {
          guarantee: 2000,
          door: true,
          merchandise: true
        },
        verified: true
      },
      include: { location: true }
    });

    console.log('✅ The Troubadour updated successfully!');
    console.log(`📍 New location: ${updatedVenue.location.city}, ${updatedVenue.location.stateProvince}`);
    console.log(`🏢 Venue type: ${updatedVenue.venueType}`);
    console.log(`👥 Capacity: ${updatedVenue.capacity}`);
    console.log(`📧 Email: ${updatedVenue.contactEmail}`);
    console.log(`🌐 Website: ${updatedVenue.website}`);

    // Clean up the old "Unknown" location if it's not used by other venues
    const unknownLocation = await prisma.location.findUnique({
      where: { id: troubadour.locationId },
      include: {
        venues: true,
        artists: true
      }
    });

    if (unknownLocation && 
        unknownLocation.city === 'Unknown' && 
        unknownLocation.venues.length === 0 && 
        unknownLocation.artists.length === 0) {
      await prisma.location.delete({
        where: { id: unknownLocation.id }
      });
      console.log('🧹 Cleaned up unused "Unknown" location');
    }

  } catch (error) {
    console.error('❌ Error fixing The Troubadour:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixTroubadourData();
}

module.exports = { fixTroubadourData }; 
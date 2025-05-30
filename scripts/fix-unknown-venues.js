const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Known venue data for common venues that might be created dynamically
const KNOWN_VENUES = {
  'The Troubadour': {
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
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
    }
  },
  'The Independent': {
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    venueType: 'CLUB',
    capacity: 500,
    ageRestriction: 'ALL_AGES',
    contactEmail: 'booking@theindependentsf.com',
    contactPhone: '(415) 771-1421',
    website: 'https://www.theindependentsf.com',
    streetAddress: '628 Divisadero St',
    postalCode: '94117',
    neighborhood: 'Divisadero',
    description: 'Premier independent music venue in San Francisco\'s Divisadero corridor.',
    equipment: {
      pa: true,
      mics: true,
      drums: false,
      amps: true,
      piano: false
    },
    features: ['Professional Sound', 'Full Bar', 'Merch Table'],
    pricing: {
      guarantee: 1500,
      door: true,
      merchandise: true
    }
  }
  // Add more known venues as needed
};

async function fixUnknownVenues() {
  try {
    console.log('🔍 Finding venues with unknown/missing location data...');

    // Find venues with "Unknown" locations
    const unknownVenues = await prisma.venue.findMany({
      include: { location: true },
      where: {
        OR: [
          { location: { city: 'Unknown' } },
          { location: { stateProvince: 'Unknown' } },
          { capacity: null },
          { contactEmail: null },
          { description: null }
        ]
      }
    });

    console.log(`📊 Found ${unknownVenues.length} venues with missing data:`);
    
    for (const venue of unknownVenues) {
      console.log(`  • ${venue.name} - ${venue.location.city}, ${venue.location.stateProvince}`);
    }

    let fixedCount = 0;

    for (const venue of unknownVenues) {
      const knownData = KNOWN_VENUES[venue.name];
      
      if (knownData) {
        console.log(`\n🔧 Fixing ${venue.name} with known data...`);
        
        // Find or create correct location
        let correctLocation = await prisma.location.findFirst({
          where: {
            city: knownData.city,
            stateProvince: knownData.state,
            country: knownData.country
          }
        });

        if (!correctLocation) {
          console.log(`🏙️ Creating location: ${knownData.city}, ${knownData.state}`);
          correctLocation = await prisma.location.create({
            data: {
              city: knownData.city,
              stateProvince: knownData.state,
              country: knownData.country
            }
          });
        }

        // Update venue with known data
        await prisma.venue.update({
          where: { id: venue.id },
          data: {
            locationId: correctLocation.id,
            venueType: knownData.venueType,
            capacity: knownData.capacity,
            ageRestriction: knownData.ageRestriction,
            contactEmail: knownData.contactEmail,
            contactPhone: knownData.contactPhone,
            website: knownData.website,
            streetAddress: knownData.streetAddress,
            postalCode: knownData.postalCode,
            neighborhood: knownData.neighborhood,
            description: knownData.description,
            equipment: knownData.equipment,
            features: knownData.features,
            pricing: knownData.pricing,
            verified: true
          }
        });

        console.log(`✅ Fixed ${venue.name}`);
        fixedCount++;
      } else {
        console.log(`\n⚠️ ${venue.name} - No known data available`);
        console.log(`   Current: ${venue.location.city}, ${venue.location.stateProvince}`);
        console.log(`   Capacity: ${venue.capacity || 'Unknown'}`);
        console.log(`   Contact: ${venue.contactEmail || 'Unknown'}`);
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} venues with known data`);
    console.log(`📝 ${unknownVenues.length - fixedCount} venues still need manual review`);

    // Clean up unused "Unknown" locations
    const unusedLocations = await prisma.location.findMany({
      where: {
        OR: [
          { city: 'Unknown' },
          { stateProvince: 'Unknown' }
        ]
      },
      include: {
        venues: true,
        artists: true
      }
    });

    let cleanedCount = 0;
    for (const location of unusedLocations) {
      if (location.venues.length === 0 && location.artists.length === 0) {
        await prisma.location.delete({
          where: { id: location.id }
        });
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} unused "Unknown" locations`);
    }

  } catch (error) {
    console.error('❌ Error fixing unknown venues:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixUnknownVenues();
}

module.exports = { fixUnknownVenues }; 
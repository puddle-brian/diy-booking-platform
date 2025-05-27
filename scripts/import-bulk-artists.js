const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

// Mapping functions
function mapArtistType(artistType) {
  const mapping = {
    'band': 'BAND',
    'solo': 'SOLO',
    'duo': 'SOLO', // Map duo to SOLO for now, or add DUO to schema
    'collective': 'COLLECTIVE',
    'dj': 'DJ',
    'comedian': 'OTHER',
    'poet': 'OTHER',
    'storyteller': 'OTHER',
    'dancer': 'OTHER',
    'magician': 'OTHER',
    'lecturer': 'OTHER',
    'theater-group': 'OTHER',
    'noise-artist': 'OTHER',
    'other': 'OTHER'
  };
  return mapping[artistType?.toLowerCase()] || 'OTHER';
}

function mapTourStatus(tourStatus) {
  const mapping = {
    'active': 'ACTIVE',
    'inactive': 'INACTIVE',
    'hiatus': 'HIATUS',
    'selective': 'ACTIVE' // Map selective to active
  };
  return mapping[tourStatus?.toLowerCase()] || 'ACTIVE';
}

function parseGenres(genresString) {
  if (!genresString) return [];
  if (Array.isArray(genresString)) return genresString;
  return genresString.split(',').map(g => g.trim()).filter(g => g);
}

function parseBooleanField(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
  }
  return false;
}

async function importFromCSV(filePath) {
  const artists = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Convert CSV row to artist object
        const artist = {
          name: row.name,
          city: row.city,
          state: row.state,
          country: row.country || 'USA',
          artistType: row.artistType,
          genres: parseGenres(row.genres),
          members: row.members ? parseInt(row.members) : null,
          yearFormed: row.yearFormed ? parseInt(row.yearFormed) : null,
          tourStatus: row.tourStatus,
          equipment: {
            needsPA: parseBooleanField(row.needsPA),
            needsMics: parseBooleanField(row.needsMics),
            needsDrums: parseBooleanField(row.needsDrums),
            needsAmps: parseBooleanField(row.needsAmps),
            acoustic: parseBooleanField(row.acoustic)
          },
          contact: {
            email: row.email || '',
            phone: row.phone || '',
            social: row.social || '',
            website: row.website || ''
          },
          description: row.description || '',
          expectedDraw: row.expectedDraw || '',
          tourRadius: row.tourRadius || 'regional'
        };
        artists.push(artist);
      })
      .on('end', () => {
        resolve(artists);
      })
      .on('error', reject);
  });
}

async function importFromJSON(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

async function createOrFindLocation(city, state, country) {
  // Try to find existing location
  let location = await prisma.location.findFirst({
    where: {
      city: city,
      stateProvince: state,
      country: country
    }
  });

  // Create if doesn't exist
  if (!location) {
    location = await prisma.location.create({
      data: {
        city: city,
        stateProvince: state,
        country: country
      }
    });
    console.log(`📍 Created new location: ${city}, ${state}, ${country}`);
  }

  return location.id;
}

async function importArtists(filePath) {
  try {
    console.log('🎵 Starting bulk artist import...');
    
    let artistsData;
    const fileExt = path.extname(filePath).toLowerCase();
    
    if (fileExt === '.csv') {
      console.log('📄 Reading CSV file...');
      artistsData = await importFromCSV(filePath);
    } else if (fileExt === '.json') {
      console.log('📄 Reading JSON file...');
      artistsData = await importFromJSON(filePath);
    } else {
      throw new Error('Unsupported file format. Use .csv or .json');
    }

    console.log(`📊 Found ${artistsData.length} artists to import`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const [index, artist] of artistsData.entries()) {
      try {
        console.log(`🎸 Processing ${index + 1}/${artistsData.length}: ${artist.name}`);

        // Create or find location
        const locationId = await createOrFindLocation(
          artist.city,
          artist.state,
          artist.country
        );

        // Create artist
        await prisma.artist.create({
          data: {
            name: artist.name,
            locationId: locationId,
            artistType: mapArtistType(artist.artistType),
            genres: artist.genres || [],
            members: artist.members,
            yearFormed: artist.yearFormed,
            tourStatus: mapTourStatus(artist.tourStatus),
            contactEmail: artist.contact?.email,
            website: artist.contact?.website,
            socialHandles: artist.contact?.social ? { social: artist.contact.social } : undefined,
            equipmentNeeds: artist.equipment || {},
            description: artist.description,
            images: [`/api/placeholder/${artist.artistType || 'band'}`],
            verified: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        successCount++;
        console.log(`✅ Created: ${artist.name}`);

      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to create ${artist.name}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log('\n🎉 Import completed!');
    console.log(`✅ Successfully imported: ${successCount} artists`);
    console.log(`❌ Failed: ${errorCount} artists`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Command line usage
const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: node scripts/import-bulk-artists.js <file-path>');
  console.log('Supported formats: .csv, .json');
  console.log('Example: node scripts/import-bulk-artists.js data/new-artists.csv');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

// Run the import
importArtists(filePath)
  .then(() => {
    console.log('✅ Import script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import script failed:', error);
    process.exit(1);
  }); 
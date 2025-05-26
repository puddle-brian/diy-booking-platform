const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Mapping functions to convert JSON data to database format
function mapVenueType(venueType) {
  const mapping = {
    'house-show': 'HOUSE_SHOW',
    'basement': 'BASEMENT',
    'club': 'CLUB',
    'bar': 'BAR',
    'coffee-shop': 'COFFEE_SHOP',
    'record-store': 'RECORD_STORE',
    'vfw-hall': 'VFW_HALL',
    'community-space': 'COMMUNITY_CENTER',
    'warehouse': 'WAREHOUSE',
    'park': 'PARK',
    'amphitheater': 'AMPHITHEATER',
    'theater': 'OTHER'
  }
  return mapping[venueType] || 'OTHER'
}

function mapAgeRestriction(ageRestriction) {
  const mapping = {
    'all-ages': 'ALL_AGES',
    '18+': 'EIGHTEEN_PLUS',
    '21+': 'TWENTY_ONE_PLUS'
  }
  return mapping[ageRestriction] || 'ALL_AGES'
}

function mapArtistType(artistType) {
  const mapping = {
    'band': 'BAND',
    'solo': 'SOLO',
    'collective': 'COLLECTIVE',
    'dj': 'DJ'
  }
  return mapping[artistType] || 'BAND'
}

function mapTourStatus(tourStatus) {
  const mapping = {
    'active': 'ACTIVE',
    'inactive': 'INACTIVE',
    'hiatus': 'HIATUS',
    'seeking-members': 'SEEKING_MEMBERS'
  }
  return mapping[tourStatus] || 'ACTIVE'
}

async function migrateData() {
  try {
    console.log('🚀 Starting data migration...')

    // Create locations first (needed for foreign keys)
    console.log('📍 Creating locations...')
    const locationMap = new Map()

    // Read venues to extract unique locations
    const venuesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/venues.json'), 'utf8'))
    const artistsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/artists.json'), 'utf8'))

    const uniqueLocations = new Set()
    
    // Extract locations from venues
    venuesData.forEach((venue) => {
      const locationKey = `${venue.city},${venue.state},${venue.country}`
      uniqueLocations.add(locationKey)
    })

    // Extract locations from artists
    artistsData.forEach((artist) => {
      const locationKey = `${artist.city},${artist.state},${artist.country}`
      uniqueLocations.add(locationKey)
    })

    // Create location records
    for (const locationKey of uniqueLocations) {
      const [city, state, country] = locationKey.split(',')
      const location = await prisma.location.create({
        data: {
          city: city.trim(),
          stateProvince: state?.trim(),
          country: country.trim()
        }
      })
      locationMap.set(locationKey, location.id)
    }

    console.log(`✅ Created ${uniqueLocations.size} locations`)

    // Migrate venues
    console.log('🏢 Migrating venues...')
    let venueCount = 0
    
    for (const venue of venuesData) {
      const locationKey = `${venue.city},${venue.state},${venue.country}`
      const locationId = locationMap.get(locationKey)
      
      if (!locationId) {
        console.warn(`⚠️ Location not found for venue: ${venue.name}`)
        continue
      }

      try {
        await prisma.venue.create({
          data: {
            id: venue.id?.toString() || undefined,
            name: venue.name,
            locationId,
            venueType: mapVenueType(venue.venueType),
            capacity: venue.capacity || null,
            ageRestriction: venue.ageRestriction ? mapAgeRestriction(venue.ageRestriction) : null,
            contactEmail: venue.contact?.email || null,
            contactPhone: venue.contact?.phone || null,
            website: venue.contact?.website || null,
            socialHandles: venue.contact?.social ? { social: venue.contact.social } : undefined,
            equipment: venue.equipment || null,
            features: venue.features || [],
            pricing: venue.pricing || null,
            description: venue.description || null,
            images: venue.images || [],
            verified: venue.verified || false,
            createdAt: venue.createdAt ? new Date(venue.createdAt) : undefined,
            updatedAt: venue.updatedAt ? new Date(venue.updatedAt) : undefined
          }
        })
        venueCount++
      } catch (error) {
        console.warn(`⚠️ Failed to create venue ${venue.name}:`, error.message)
      }
    }

    console.log(`✅ Migrated ${venueCount} venues`)

    // Migrate artists
    console.log('🎵 Migrating artists...')
    let artistCount = 0

    for (const artist of artistsData) {
      const locationKey = `${artist.city},${artist.state},${artist.country}`
      const locationId = locationMap.get(locationKey)
      
      if (!locationId) {
        console.warn(`⚠️ Location not found for artist: ${artist.name}`)
        continue
      }

      try {
        await prisma.artist.create({
          data: {
            id: artist.id?.toString() || undefined,
            name: artist.name,
            locationId,
            artistType: artist.artistType ? mapArtistType(artist.artistType) : null,
            genres: artist.genres || [],
            members: artist.members || null,
            yearFormed: artist.yearFormed || null,
            tourStatus: artist.tourStatus ? mapTourStatus(artist.tourStatus) : null,
            contactEmail: artist.contact?.email || null,
            website: artist.contact?.website || null,
            socialHandles: artist.contact?.social ? { social: artist.contact.social } : undefined,
            equipmentNeeds: artist.equipment || null,
            description: artist.description || null,
            images: artist.images || [],
            verified: artist.verified || false,
            createdAt: artist.createdAt ? new Date(artist.createdAt) : undefined,
            updatedAt: artist.updatedAt ? new Date(artist.updatedAt) : undefined
          }
        })
        artistCount++
      } catch (error) {
        console.warn(`⚠️ Failed to create artist ${artist.name}:`, error.message)
      }
    }

    console.log(`✅ Migrated ${artistCount} artists`)

    console.log('🎉 Data migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateData()
  .then(() => {
    console.log('✅ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  }) 
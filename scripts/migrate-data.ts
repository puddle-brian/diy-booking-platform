import { PrismaClient, VenueType, AgeRestriction, ArtistType, TourStatus } from '../src/generated/prisma'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Mapping functions to convert JSON data to database format
function mapVenueType(venueType: string): VenueType {
  const mapping: Record<string, VenueType> = {
    'house-show': VenueType.HOUSE_SHOW,
    'basement': VenueType.BASEMENT,
    'club': VenueType.CLUB,
    'bar': VenueType.BAR,
    'coffee-shop': VenueType.COFFEE_SHOP,
    'record-store': VenueType.RECORD_STORE,
    'vfw-hall': VenueType.VFW_HALL,
    'community-space': VenueType.COMMUNITY_CENTER,
    'warehouse': VenueType.WAREHOUSE,
    'park': VenueType.PARK,
    'amphitheater': VenueType.AMPHITHEATER,
    'theater': VenueType.OTHER
  }
  return mapping[venueType] || VenueType.OTHER
}

function mapAgeRestriction(ageRestriction: string): AgeRestriction {
  const mapping: Record<string, AgeRestriction> = {
    'all-ages': AgeRestriction.ALL_AGES,
    '18+': AgeRestriction.EIGHTEEN_PLUS,
    '21+': AgeRestriction.TWENTY_ONE_PLUS
  }
  return mapping[ageRestriction] || AgeRestriction.ALL_AGES
}

function mapArtistType(artistType: string): ArtistType {
  const mapping: Record<string, ArtistType> = {
    'band': ArtistType.BAND,
    'solo': ArtistType.SOLO,
    'collective': ArtistType.COLLECTIVE,
    'dj': ArtistType.DJ
  }
  return mapping[artistType] || ArtistType.BAND
}

function mapTourStatus(tourStatus: string): TourStatus {
  const mapping: Record<string, TourStatus> = {
    'active': TourStatus.ACTIVE,
    'inactive': TourStatus.INACTIVE,
    'hiatus': TourStatus.HIATUS,
    'seeking-members': TourStatus.SEEKING_MEMBERS
  }
  return mapping[tourStatus] || TourStatus.ACTIVE
}

async function migrateData() {
  try {
    console.log('🚀 Starting data migration...')

    // Create locations first (needed for foreign keys)
    console.log('📍 Creating locations...')
    const locationMap = new Map<string, string>()

    // Read venues to extract unique locations
    const venuesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/venues.json'), 'utf8'))
    const artistsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/artists.json'), 'utf8'))

    const uniqueLocations = new Set<string>()
    
    // Extract locations from venues
    venuesData.forEach((venue: any) => {
      const locationKey = `${venue.city},${venue.state},${venue.country}`
      uniqueLocations.add(locationKey)
    })

    // Extract locations from artists
    artistsData.forEach((artist: any) => {
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
            features: venue.features || null,
            pricing: venue.pricing || null,
            description: venue.description || null,
            images: venue.images || null,
            verified: venue.verified || false,
            createdAt: venue.createdAt ? new Date(venue.createdAt) : undefined,
            updatedAt: venue.updatedAt ? new Date(venue.updatedAt) : undefined
          }
        })
        venueCount++
      } catch (error) {
        console.warn(`⚠️ Failed to create venue ${venue.name}:`, error)
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
            genres: artist.genres || null,
            members: artist.members || null,
            yearFormed: artist.yearFormed || null,
            tourStatus: artist.tourStatus ? mapTourStatus(artist.tourStatus) : null,
            contactEmail: artist.contact?.email || null,
            website: artist.contact?.website || null,
            socialHandles: artist.contact?.social ? { social: artist.contact.social } : undefined,
            equipmentNeeds: artist.equipment || null,
            description: artist.description || null,
            images: artist.images || null,
            verified: artist.verified || false,
            createdAt: artist.createdAt ? new Date(artist.createdAt) : undefined,
            updatedAt: artist.updatedAt ? new Date(artist.updatedAt) : undefined
          }
        })
        artistCount++
      } catch (error) {
        console.warn(`⚠️ Failed to create artist ${artist.name}:`, error)
      }
    }

    console.log(`✅ Migrated ${artistCount} artists`)

    // Migrate tour requests if they exist
    try {
      const tourRequestsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/tour-requests.json'), 'utf8'))
      console.log('🗺️ Migrating tour requests...')
      let tourRequestCount = 0

      for (const request of tourRequestsData) {
        try {
          // Create a dummy user for now (we'll need to handle this properly later)
          let createdById = 'dummy-user-id'
          
          await prisma.tourRequest.create({
            data: {
              id: request.id?.toString() || undefined,
              artistId: request.artistId,
              createdById,
              title: request.title,
              description: request.description || null,
              startDate: request.startDate ? new Date(request.startDate) : null,
              endDate: request.endDate ? new Date(request.endDate) : null,
              targetLocations: request.targetLocations || null,
              genres: request.genres || null,
              status: request.status === 'active' ? 'ACTIVE' : 'COMPLETED',
              createdAt: request.createdAt ? new Date(request.createdAt) : undefined,
              updatedAt: request.updatedAt ? new Date(request.updatedAt) : undefined
            }
          })
          tourRequestCount++
        } catch (error) {
          console.warn(`⚠️ Failed to create tour request ${request.title}:`, error)
        }
      }

      console.log(`✅ Migrated ${tourRequestCount} tour requests`)
    } catch (error) {
      console.log('ℹ️ No tour requests file found, skipping...')
    }

    console.log('🎉 Data migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('✅ Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error)
      process.exit(1)
    })
}

export { migrateData } 
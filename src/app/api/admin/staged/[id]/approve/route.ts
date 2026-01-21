import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../../lib/prisma';
import { VenueType, ArtistType, AgeRestriction, TourStatus, InfrastructureType } from '@prisma/client';

// Map user-friendly values to database enums
const VENUE_TYPE_MAP: Record<string, VenueType> = {
  'house-show': 'HOUSE_SHOW',
  'house show': 'HOUSE_SHOW',
  'basement': 'BASEMENT',
  'bar': 'BAR',
  'club': 'CLUB',
  'warehouse': 'WAREHOUSE',
  'coffee-shop': 'COFFEE_SHOP',
  'coffee shop': 'COFFEE_SHOP',
  'record-store': 'RECORD_STORE',
  'record store': 'RECORD_STORE',
  'vfw-hall': 'VFW_HALL',
  'vfw': 'VFW_HALL',
  'community-center': 'COMMUNITY_CENTER',
  'community center': 'COMMUNITY_CENTER',
  'park': 'PARK',
  'amphitheater': 'AMPHITHEATER',
  'other': 'OTHER',
};

const ARTIST_TYPE_MAP: Record<string, ArtistType> = {
  'band': 'BAND',
  'solo': 'SOLO',
  'collective': 'COLLECTIVE',
  'dj': 'DJ',
  'other': 'OTHER',
};

const AGE_RESTRICTION_MAP: Record<string, AgeRestriction> = {
  'all-ages': 'ALL_AGES',
  'all ages': 'ALL_AGES',
  '18+': 'EIGHTEEN_PLUS',
  '21+': 'TWENTY_ONE_PLUS',
};

const TOUR_STATUS_MAP: Record<string, TourStatus> = {
  'active': 'ACTIVE',
  'inactive': 'INACTIVE',
  'hiatus': 'HIATUS',
  'seeking-members': 'SEEKING_MEMBERS',
};

const INFRASTRUCTURE_TYPE_MAP: Record<string, InfrastructureType> = {
  'label': 'LABEL',
  'radio': 'RADIO',
  'record-store': 'RECORD_STORE',
  'record store': 'RECORD_STORE',
  'zine': 'ZINE',
  'distributor': 'DISTRIBUTOR',
  'photographer': 'PHOTOGRAPHER',
  'sound-engineer': 'SOUND_ENGINEER',
  'sound engineer': 'SOUND_ENGINEER',
  'promoter': 'PROMOTER',
};

/**
 * POST /api/admin/staged/[id]/approve - Approve staged entity and create in live DB
 * Body (optional):
 *   - reviewNotes: Admin notes on approval
 *   - reviewedBy: User ID of reviewer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Get the staged entity
    const staged = await prisma.stagedEntity.findUnique({
      where: { id }
    });

    if (!staged) {
      return NextResponse.json(
        { error: 'Staged entity not found' },
        { status: 404 }
      );
    }

    if (staged.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Entity has already been approved', createdEntityId: staged.createdEntityId },
        { status: 400 }
      );
    }

    if (staged.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Cannot approve a rejected entity' },
        { status: 400 }
      );
    }

    const data = staged.data as Record<string, unknown>;
    let createdEntity: { id: string; name: string } | null = null;

    // Create the entity in the live database based on type
    if (staged.entityType === 'VENUE') {
      createdEntity = await createVenue(data);
    } else if (staged.entityType === 'ARTIST') {
      createdEntity = await createArtist(data);
    } else if (staged.entityType === 'SCENE_INFRASTRUCTURE') {
      createdEntity = await createInfrastructure(data);
    }

    if (!createdEntity) {
      return NextResponse.json(
        { error: 'Failed to create entity' },
        { status: 500 }
      );
    }

    // Update staged entity status
    const updatedStaged = await prisma.stagedEntity.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: body.reviewedBy || null,
        reviewNotes: body.reviewNotes || null,
        createdEntityId: createdEntity.id
      }
    });

    return NextResponse.json({
      success: true,
      staged: updatedStaged,
      createdEntity
    });
  } catch (error) {
    console.error('Error approving staged entity:', error);
    return NextResponse.json(
      { error: 'Failed to approve staged entity', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function findOrCreateLocation(city: string, state: string, country: string = 'USA') {
  let location = await prisma.location.findFirst({
    where: {
      city: { equals: city, mode: 'insensitive' },
      stateProvince: { equals: state, mode: 'insensitive' },
      country: { equals: country, mode: 'insensitive' }
    }
  });

  if (!location) {
    location = await prisma.location.create({
      data: { city, stateProvince: state, country }
    });
  }

  return location;
}

async function createVenue(data: Record<string, unknown>): Promise<{ id: string; name: string }> {
  const name = data.name as string;
  const city = data.city as string || 'Unknown';
  const state = data.state as string || '';
  const country = data.country as string || 'USA';

  const location = await findOrCreateLocation(city, state, country);

  const venueTypeKey = (data.venueType as string || 'other').toLowerCase();
  const venueType = VENUE_TYPE_MAP[venueTypeKey] || 'OTHER';

  const ageKey = data.ageRestriction as string | undefined;
  const ageRestriction = ageKey ? AGE_RESTRICTION_MAP[ageKey.toLowerCase()] : null;

  const venue = await prisma.venue.create({
    data: {
      name,
      locationId: location.id,
      venueType,
      capacity: data.capacity ? Number(data.capacity) : null,
      ageRestriction,
      contactEmail: data.contactEmail as string || null,
      contactPhone: data.contactPhone as string || null,
      website: data.website as string || null,
      description: data.description as string || null,
      streetAddress: data.streetAddress as string || null,
      neighborhood: data.neighborhood as string || null,
      postalCode: data.postalCode as string || null,
      features: Array.isArray(data.features) ? data.features : [],
      images: Array.isArray(data.images) ? data.images : [],
      socialLinks: data.socialLinks as object || null,
      equipment: data.equipment as object || null,
      verified: false // Admin can verify separately
    }
  });

  return { id: venue.id, name: venue.name };
}

async function createArtist(data: Record<string, unknown>): Promise<{ id: string; name: string }> {
  const name = data.name as string;
  const city = data.city as string || 'Unknown';
  const state = data.state as string || '';
  const country = data.country as string || 'USA';

  const location = await findOrCreateLocation(city, state, country);

  const artistTypeKey = (data.artistType as string || 'band').toLowerCase();
  const artistType = ARTIST_TYPE_MAP[artistTypeKey] || 'BAND';

  const tourStatusKey = data.tourStatus as string | undefined;
  const tourStatus = tourStatusKey ? TOUR_STATUS_MAP[tourStatusKey.toLowerCase()] : null;

  const artist = await prisma.artist.create({
    data: {
      name,
      locationId: location.id,
      artistType,
      genres: Array.isArray(data.genres) ? data.genres : [],
      members: data.members ? Number(data.members) : null,
      yearFormed: data.yearFormed ? Number(data.yearFormed) : null,
      tourStatus,
      contactEmail: data.contactEmail as string || null,
      contactPhone: data.contactPhone as string || null,
      website: data.website as string || null,
      description: data.description as string || null,
      images: Array.isArray(data.images) ? data.images : [],
      socialLinks: data.socialLinks as object || null,
      equipmentNeeds: data.equipmentNeeds as object || null,
      verified: false // Admin can verify separately
    }
  });

  return { id: artist.id, name: artist.name };
}

async function createInfrastructure(data: Record<string, unknown>): Promise<{ id: string; name: string }> {
  const name = data.name as string;
  const city = data.city as string || 'Unknown';
  const state = data.state as string || '';
  const country = data.country as string || 'USA';

  const location = await findOrCreateLocation(city, state, country);

  const typeKey = (data.type as string || 'other').toLowerCase();
  const infrastructureType = INFRASTRUCTURE_TYPE_MAP[typeKey] || 'PROMOTER';

  const infrastructure = await prisma.sceneInfrastructure.create({
    data: {
      name,
      locationId: location.id,
      type: infrastructureType,
      description: data.description as string || null,
      contactInfo: data.contactInfo as object || null,
      specialties: Array.isArray(data.specialties) ? data.specialties : [],
      verified: false
    }
  });

  return { id: infrastructure.id, name: infrastructure.name };
}

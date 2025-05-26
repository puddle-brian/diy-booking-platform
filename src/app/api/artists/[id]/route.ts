import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { Artist } from '../../../../../types/index';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    const artist = await prisma.artist.findUnique({
      where: { id: resolvedParams.id },
      include: {
        location: true
      }
    });
    
    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Transform data to match frontend expectations
    const transformedArtist = {
      id: artist.id,
      name: artist.name,
      city: artist.location.city,
      state: artist.location.stateProvince,
      country: artist.location.country,
      artistType: artist.artistType?.toLowerCase() || 'band',
      genres: artist.genres || [],
      features: artist.features || [],
      members: artist.members,
      yearFormed: artist.yearFormed,
      tourStatus: artist.tourStatus?.toLowerCase() || 'active',
      equipment: artist.equipmentNeeds || {},
      contact: {
        email: artist.contactEmail,
        phone: '',
        social: (artist.socialHandles as any)?.social,
        website: artist.website,
        booking: artist.contactEmail,
      },
      images: artist.images || ['/api/placeholder/band'],
      description: artist.description || '',
      expectedDraw: '',
      rating: 0,
      reviewCount: 0,
      verified: artist.verified,
      claimed: false,
      lastUpdated: artist.updatedAt.toISOString(),
      tourDates: [],
      bookedDates: [],
      homeBase: false,
      showsThisYear: 0,
      tourRadius: 'regional',
      hasAccount: false,
      createdAt: artist.createdAt,
      updatedAt: artist.updatedAt,
    };

    return NextResponse.json(transformedArtist);
  } catch (error) {
    console.error('Error in GET /api/artists/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    // Check if artist exists
    const existingArtist = await prisma.artist.findUnique({
      where: { id: resolvedParams.id }
    });
    
    if (!existingArtist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Validate email if provided
    if (body.contact?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.contact.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Update artist
    const updatedArtist = await prisma.artist.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name,
        artistType: body.artistType?.toUpperCase(),
        genres: body.genres,
        members: body.members,
        yearFormed: body.yearFormed,
        tourStatus: body.tourStatus?.toUpperCase(),
        equipmentNeeds: body.equipment,
        contactEmail: body.contact?.email,
        website: body.contact?.website,
        socialHandles: body.contact?.social ? { social: body.contact.social } : undefined,
        description: body.description,
        images: body.images
      },
      include: {
        location: true
      }
    });

    // Transform response
    const transformedArtist = {
      id: updatedArtist.id,
      name: updatedArtist.name,
      city: updatedArtist.location.city,
      state: updatedArtist.location.stateProvince,
      country: updatedArtist.location.country,
      artistType: updatedArtist.artistType?.toLowerCase() || 'band',
      genres: updatedArtist.genres || [],
      features: updatedArtist.features || [],
      members: updatedArtist.members,
      yearFormed: updatedArtist.yearFormed,
      tourStatus: updatedArtist.tourStatus?.toLowerCase() || 'active',
      equipment: updatedArtist.equipmentNeeds || {},
      contact: {
        email: updatedArtist.contactEmail,
        phone: '',
        social: (updatedArtist.socialHandles as any)?.social,
        website: updatedArtist.website,
        booking: updatedArtist.contactEmail,
      },
      images: updatedArtist.images || ['/api/placeholder/band'],
      description: updatedArtist.description || '',
      expectedDraw: '',
      rating: 0,
      reviewCount: 0,
      verified: updatedArtist.verified,
      claimed: false,
      lastUpdated: updatedArtist.updatedAt.toISOString(),
      tourDates: [],
      bookedDates: [],
      homeBase: false,
      showsThisYear: 0,
      tourRadius: 'regional',
      hasAccount: false,
      createdAt: updatedArtist.createdAt,
      updatedAt: updatedArtist.updatedAt,
    };

    return NextResponse.json(transformedArtist);
  } catch (error) {
    console.error('Error in PUT /api/artists/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update artist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    // Check if artist exists
    const existingArtist = await prisma.artist.findUnique({
      where: { id: resolvedParams.id }
    });
    
    if (!existingArtist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Delete artist
    await prisma.artist.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ message: 'Artist deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/artists/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete artist' },
      { status: 500 }
    );
  }
} 
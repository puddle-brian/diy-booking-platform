import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { Artist } from '../../../../../types/index';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log(`🎯 Fetching artist with ID: ${resolvedParams.id}`);
    
    const artist = await prisma.artist.findUnique({
      where: { id: resolvedParams.id },
      include: {
        location: true
      }
    });
    
    if (!artist) {
      console.log(`❌ Artist not found: ${resolvedParams.id}`);
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Found artist: ${artist.name}`);
    console.log(`📍 Location: ${artist.location?.city}, ${artist.location?.stateProvince}`);
    console.log(`🎵 Artist type: ${artist.artistType}`);
    console.log(`📱 Social handles:`, artist.socialLinks);

    // Transform data to match frontend expectations with better error handling
    const transformedArtist = {
      id: artist.id,
      name: artist.name,
      city: artist.location?.city || '',
      state: artist.location?.stateProvince || '',
      country: artist.location?.country || 'USA',
      artistType: artist.artistType?.toLowerCase() || 'band',
      genres: Array.isArray(artist.genres) ? artist.genres : [],
      members: artist.members || 1,
      yearFormed: artist.yearFormed || new Date().getFullYear(),
      tourStatus: artist.tourStatus?.toLowerCase() || 'active',
      equipment: artist.equipmentNeeds || {},
      contact: {
        email: artist.contactEmail || '',
        phone: '',
        social: (() => {
          try {
            if (artist.socialLinks && typeof artist.socialLinks === 'object') {
              return (artist.socialLinks as any)?.social || '';
            }
            return '';
          } catch (e) {
            console.warn('Error parsing social handles:', e);
            return '';
          }
        })(),
        website: artist.website || '',
        booking: artist.contactEmail || '',
      },
      images: Array.isArray(artist.images) ? artist.images : ['/api/placeholder/band'],
      description: artist.description || '',
      expectedDraw: '',
      rating: 0,
      reviewCount: 0,
      verified: Boolean(artist.verified),
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

    console.log(`🚀 Returning transformed artist data for: ${transformedArtist.name}`);
    return NextResponse.json(transformedArtist);
  } catch (error) {
    console.error('❌ Error in GET /api/artists/[id]:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
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
        socialLinks: body.contact?.social ? { social: body.contact.social } : undefined,
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
      members: updatedArtist.members,
      yearFormed: updatedArtist.yearFormed,
      tourStatus: updatedArtist.tourStatus?.toLowerCase() || 'active',
      equipment: updatedArtist.equipmentNeeds || {},
      contact: {
        email: updatedArtist.contactEmail,
        phone: '',
        social: (updatedArtist.socialLinks as any)?.social,
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
    
    console.log(`🗑️ Attempting to delete artist: ${resolvedParams.id}`);
    
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

    console.log(`🗑️ Found artist: ${existingArtist.name}`);

    // Delete related records in the correct order to avoid foreign key constraints
    
    try {
      // 1. Delete all conversations where this artist is a participant
      const conversationsToDelete = await prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId: resolvedParams.id
            }
          }
        },
        select: { id: true }
      });
      
      if (conversationsToDelete.length > 0) {
        await prisma.conversation.deleteMany({
          where: {
            id: {
              in: conversationsToDelete.map(c => c.id)
            }
          }
        });
      }
      console.log(`🗑️ Deleted ${conversationsToDelete.length} conversations`);
    } catch (error) {
      console.warn(`⚠️ Could not delete conversations:`, error);
    }

    try {
      // 2. Delete all messages sent by this artist
      const deletedMessages = await prisma.message.deleteMany({
        where: { senderId: resolvedParams.id }
      });
      console.log(`🗑️ Deleted ${deletedMessages.count} messages`);
    } catch (error) {
      console.warn(`⚠️ Could not delete messages:`, error);
    }

    try {
      // 3. Delete all bids related to tour requests for this artist
      const deletedBids = await prisma.bid.deleteMany({
        where: {
          tourRequest: {
            artistId: resolvedParams.id
          }
        }
      });
      console.log(`🗑️ Deleted ${deletedBids.count} bids`);
    } catch (error) {
      console.warn(`⚠️ Could not delete bids:`, error);
    }

    try {
      // 4. Delete all tour requests for this artist
      const deletedTourRequests = await prisma.tourRequest.deleteMany({
        where: { artistId: resolvedParams.id }
      });
      console.log(`🗑️ Deleted ${deletedTourRequests.count} tour requests`);
    } catch (error) {
      console.warn(`⚠️ Could not delete tour requests:`, error);
    }

    try {
      // 5. Delete all shows for this artist
      const deletedShows = await prisma.show.deleteMany({
        where: { artistId: resolvedParams.id }
      });
      console.log(`🗑️ Deleted ${deletedShows.count} shows`);
    } catch (error) {
      console.warn(`⚠️ Could not delete shows:`, error);
    }

    try {
      // 6. Delete all venue offers for this artist
      const deletedOffers = await prisma.venueOffer.deleteMany({
        where: { artistId: resolvedParams.id }
      });
      console.log(`🗑️ Deleted ${deletedOffers.count} venue offers`);
    } catch (error) {
      console.warn(`⚠️ Could not delete venue offers:`, error);
    }

    try {
      // 7. Delete all artist templates for this artist
      const deletedTemplates = await prisma.artistTemplate.deleteMany({
        where: { artistId: resolvedParams.id }
      });
      console.log(`🗑️ Deleted ${deletedTemplates.count} artist templates`);
    } catch (error) {
      console.warn(`⚠️ Could not delete artist templates:`, error);
    }

    try {
      // 8. Delete all memberships for this artist
      const deletedMemberships = await prisma.membership.deleteMany({
        where: {
          entityType: 'ARTIST',
          entityId: resolvedParams.id
        }
      });
      console.log(`🗑️ Deleted ${deletedMemberships.count} memberships`);
    } catch (error) {
      console.warn(`⚠️ Could not delete memberships:`, error);
    }

    try {
      // 9. Delete all favorites for this artist
      const deletedFavorites = await prisma.favorite.deleteMany({
        where: {
          entityType: 'ARTIST',
          entityId: resolvedParams.id
        }
      });
      console.log(`🗑️ Deleted ${deletedFavorites.count} favorites`);
    } catch (error) {
      console.warn(`⚠️ Could not delete favorites:`, error);
    }

    try {
      // 10. Finally, delete the artist itself
      await prisma.artist.delete({
        where: { id: resolvedParams.id }
      });
      console.log(`🗑️ Deleted artist: ${existingArtist.name}`);
    } catch (error) {
      console.error(`❌ Failed to delete artist:`, error);
      throw new Error(`Failed to delete artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log(`✅ Successfully deleted artist ${existingArtist.name} and all related records`);
    return NextResponse.json({ 
      message: 'Artist deleted successfully',
      deletedArtist: existingArtist.name
    });
  } catch (error) {
    console.error('❌ Error in DELETE /api/artists/[id]:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      meta: (error as any)?.meta
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to delete artist',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
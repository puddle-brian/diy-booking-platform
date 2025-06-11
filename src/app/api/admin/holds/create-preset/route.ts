import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PresetRequest {
  name: string;
  description: string;
  artistId: string;
  artistName: string;
  holdReason: string;
  holdDuration: number;
}

export async function POST(request: NextRequest) {
  try {
    const preset: PresetRequest = await request.json();
    console.log('🔒 Creating preset hold scenario:', preset);

    // First check if artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: preset.artistId },
      select: { name: true }
    });

    if (!artist) {
      console.log('❌ Artist not found:', preset.artistId);
      return NextResponse.json({ 
        error: `Artist not found: ${preset.artistId}` 
      }, { status: 404 });
    }

    console.log('✅ Found artist:', artist.name);

    // Find show requests for this artist that have multiple bids (using NEW model)
    console.log('🔍 Searching for show requests...');
    const showRequests = await prisma.showRequest.findMany({
      where: { 
        artistId: preset.artistId 
      },
      include: {
        bids: {
          include: {
            venue: { select: { name: true, id: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    console.log(`📋 Found ${showRequests.length} show requests`);
    showRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. "${req.title}" - ${req.bids.length} bids`);
    });

    // Find a show request with at least 2 bids (1 to hold + at least 1 to freeze)
    const suitableRequest = showRequests.find(req => req.bids.length >= 2);
    
    if (!suitableRequest) {
      console.log('❌ No suitable show request found');
      return NextResponse.json({ 
        error: `No show request found for ${preset.artistName} with enough bids (need at least 2 bids). Found ${showRequests.length} show requests.` 
      }, { status: 400 });
    }

    console.log(`✅ Using show request: "${suitableRequest.title}" with ${suitableRequest.bids.length} bids`);

    // Find the user who owns this artist (needed for foreign key)
    const artistMembership = await prisma.membership.findFirst({
      where: {
        entityType: 'ARTIST',
        entityId: preset.artistId,
        role: 'owner'
      },
      include: {
        user: {
          select: { id: true, username: true }
        }
      }
    });

    if (!artistMembership) {
      console.log('❌ No owner found for artist');
      return NextResponse.json({ 
        error: `No owner found for artist ${preset.artistName}` 
      }, { status: 400 });
    }

    if (!artistMembership.userId) {
      console.log('❌ Artist membership has null userId');
      return NextResponse.json({ 
        error: `Artist membership has invalid userId for ${preset.artistName}` 
      }, { status: 400 });
    }

    // Verify the user actually exists (prevent P2003 foreign key errors)
    if (!artistMembership.user) {
      console.log('❌ Owner user not found in database:', artistMembership.userId);
      return NextResponse.json({ 
        error: `Owner user not found for artist ${preset.artistName} (userId: ${artistMembership.userId})` 
      }, { status: 400 });
    }

    console.log(`👥 Found artist owner: ${artistMembership.user.username} (${artistMembership.user.id})`);

    // Clear any existing holds for this show request
    await prisma.showRequestBid.updateMany({
      where: { showRequestId: suitableRequest.id },
      data: {
        holdState: 'AVAILABLE',
        frozenByHoldId: null,
        frozenAt: null,
        unfrozenAt: null
      }
    });

    // Create the hold request with additional P2003 error handling
    let holdRequest;
    try {
      holdRequest = await prisma.holdRequest.create({
        data: {
          showRequestId: suitableRequest.id,
          requestedById: artistMembership.userId, // Use USER ID, not artist ID
          duration: preset.holdDuration,
          reason: preset.holdReason,
          status: 'ACTIVE', // Auto-approve for testing
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + preset.holdDuration * 60 * 60 * 1000), // duration in hours
          respondedAt: new Date(),
          customMessage: `Admin test scenario: ${preset.name}`
        }
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        console.log('❌ Foreign key constraint failed:', error.meta);
        return NextResponse.json({ 
          error: `Database constraint error: ${error.meta?.field_name || 'foreign key'} reference is invalid. User ID: ${artistMembership.userId}` 
        }, { status: 400 });
      }
      throw error; // Re-throw other errors
    }

    // Get the bids to modify
    const bids = suitableRequest.bids;
    const heldBid = bids[0]; // First bid becomes HELD
    const frozenBids = bids.slice(1); // ALL other bids become FROZEN

    // Set the held bid
    await prisma.showRequestBid.update({
      where: { id: heldBid.id },
      data: {
        holdState: 'HELD',
        frozenByHoldId: holdRequest.id,
        frozenAt: new Date()
      }
    });

    // Set the frozen bids
    await prisma.showRequestBid.updateMany({
      where: {
        id: { in: frozenBids.map(bid => bid.id) }
      },
      data: {
        holdState: 'FROZEN',
        frozenByHoldId: holdRequest.id,
        frozenAt: new Date()
      }
    });

    const summary = `Created hold on ${heldBid.venue?.name} with ${frozenBids.length} frozen competing bids for ${preset.artistName}`;

    return NextResponse.json({
      success: true,
      holdId: holdRequest.id,
      summary,
      details: {
        tourRequest: suitableRequest.title,
        heldVenue: heldBid.venue?.name,
        frozenVenues: frozenBids.map(bid => bid.venue?.name),
        expiresAt: holdRequest.expiresAt
      }
    });

  } catch (error) {
    console.error('Error creating preset scenario:', error);
    return NextResponse.json({ 
      error: `Failed to create scenario: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 
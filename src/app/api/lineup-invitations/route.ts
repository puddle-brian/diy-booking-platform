import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { LineupPosition } from '../../../../types';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { showId, artistId, lineupRole, billingOrder, guarantee, doorDeal, setLength, message } = body;

    console.log('🎵 API: Creating lineup invitation:', body);

    // Get current user from JWT token
    let currentUserId = 'system'; // fallback for testing
    try {
      const token = request.cookies.get('auth_token')?.value;
      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
        currentUserId = decoded.userId;
        console.log('🔐 Using authenticated user:', currentUserId);
      } else {
        console.log('⚠️ No auth token found, using system user for testing');
        // For testing, try to find any valid user ID
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
          currentUserId = anyUser.id;
          console.log('🔧 Using first available user for testing:', currentUserId);
        }
      }
    } catch (authError) {
      console.log('⚠️ Auth error, falling back to system user:', authError);
      // Try to find any valid user ID for testing
      const anyUser = await prisma.user.findFirst();
      if (anyUser) {
        currentUserId = anyUser.id;
        console.log('🔧 Using first available user for testing:', currentUserId);
      }
    }

    // Validate required fields
    if (!showId || !artistId || !lineupRole) {
      return NextResponse.json(
        { message: 'Missing required fields: showId, artistId, and lineupRole are required' },
        { status: 400 }
      );
    }

    // Verify the show exists
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        venue: {
          include: {
            location: true
          }
        },
        artist: true
      }
    });

    if (!show) {
      return NextResponse.json(
        { message: 'Show not found' },
        { status: 404 }
      );
    }

    // Verify the artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId }
    });

    if (!artist) {
      return NextResponse.json(
        { message: 'Artist not found' },
        { status: 404 }
      );
    }

    // Check for existing lineup invitation
    const existingInvitation = await prisma.bid.findFirst({
      where: {
        isLineupSlot: true,
        parentShowId: showId,
        tourRequest: {
          artistId: artistId
        }
      }
    });

    if (existingInvitation) {
      return NextResponse.json(
        { message: 'Artist already has a lineup invitation for this show' },
        { status: 400 }
      );
    }

    // Create a tour request for the lineup slot (required for bid structure)
    const venueLocation = show.venue.location;
    const locationString = `${venueLocation.city}, ${venueLocation.stateProvince || venueLocation.country}`;
    
    const tourRequest = await prisma.tourRequest.create({
      data: {
        artistId: artistId,
        createdById: currentUserId,
        title: `Lineup slot for ${show.venue.name} - ${new Date(show.date).toLocaleDateString()}`,
        description: `${lineupRole.toLowerCase().replace('_', ' ')} slot invitation`,
        requestDate: show.date,
        targetLocations: [locationString],
        genres: [], // Will be filled from artist data if needed
        status: 'ACTIVE',
        isLegacyRange: false
      }
    });

    // Create the lineup bid with all fields now that database is reset
    const lineupBid = await prisma.bid.create({
      data: {
        tourRequestId: tourRequest.id,
        venueId: show.venueId,
        bidderId: currentUserId,
        proposedDate: show.date,
        message: message || `${lineupRole} invitation for ${show.venue.name}`,
        amount: guarantee || null,
        setLength: setLength || null,
        status: 'PENDING',
        // Lineup-specific fields - should work now after database reset
        isLineupSlot: true,
        parentShowId: showId,
        lineupRole: lineupRole as LineupPosition,
        billingOrder: billingOrder || 2,
        invitedByUserId: currentUserId
      },
      include: {
        tourRequest: {
          include: {
            artist: true
          }
        },
        venue: true
      }
    });

    console.log('✅ Lineup invitation created:', lineupBid.id);

    // Transform response to match expected format
    const response = {
      id: lineupBid.id,
      showId: showId,
      artistId: artistId,
      artistName: lineupBid.tourRequest.artist.name,
      lineupRole: lineupBid.lineupRole,
      billingOrder: lineupBid.billingOrder,
      guarantee: lineupBid.amount,
      doorDeal: doorDeal,
      setLength: lineupBid.setLength,
      status: lineupBid.status.toLowerCase(),
      message: lineupBid.message,
      createdAt: lineupBid.createdAt.toISOString()
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating lineup invitation:', error);
    return NextResponse.json(
      { message: 'Failed to create lineup invitation' },
      { status: 500 }
    );
  }
} 
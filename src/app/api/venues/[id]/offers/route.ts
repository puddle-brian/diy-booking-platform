import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { OfferStatus } from '@prisma/client';
import { createNormalizedDateTime } from '@/utils/dateUtils';

// GET /api/venues/[id]/offers - Get all offers made by this venue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: venueId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const artistId = searchParams.get('artistId');

    console.log(`🏢 API: Fetching offers for venue ${venueId}`);

    // Build where clause
    const where: any = {
      venueId: venueId
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    if (artistId) {
      where.artistId = artistId;
    }

    const offers = await prisma.venueOffer.findMany({
      where,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            genres: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            venueType: true,
            capacity: true,
            location: {
              select: {
                city: true,
                stateProvince: true,
                country: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`🏢 API: Found ${offers.length} offers for venue ${venueId}`);

    return NextResponse.json(offers);
  } catch (error) {
    console.error('Error fetching venue offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue offers' },
      { status: 500 }
    );
  }
}

// POST /api/venues/[id]/offers - Create a new offer to an artist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: venueId } = await params;
    const body = await request.json();
    
    console.log('🏢 API: Creating venue offer:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const requiredFields = ['artistId', 'title', 'proposedDate', 'message'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        name: true,
        capacity: true
      }
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Check if artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: body.artistId },
      select: {
        id: true,
        name: true,
        genres: true
      }
    });

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Get system user for createdById (required field)
    let systemUser = await prisma.user.findFirst({
      where: { username: 'system' }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          username: 'system',
          email: 'system@diyshows.com',
          verified: true
        }
      });
    }

    // Set expiration date (30 days from now by default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Create new venue offer
    const newOffer = await prisma.venueOffer.create({
      data: {
        venueId,
        artistId: body.artistId,
        createdById: systemUser.id,
        title: body.title,
        description: body.description || null,
        proposedDate: createNormalizedDateTime(body.proposedDate), // Normalize to noon UTC to avoid timezone issues
        alternativeDates: body.alternativeDates ? body.alternativeDates.map((date: string) => new Date(date)) : [],
        message: body.message,
        
        // Financial terms
        amount: body.amount ? parseFloat(body.amount) : null,
        doorDeal: body.doorDeal || null,
        ticketPrice: body.ticketPrice || null,
        merchandiseSplit: body.merchandiseSplit || null,
        
        // Show details
        billingPosition: body.billingPosition || null,
        lineupPosition: body.lineupPosition ? parseInt(body.lineupPosition) : null,
        setLength: body.setLength ? parseInt(body.setLength) : null,
        otherActs: body.otherActs || null,
        billingNotes: body.billingNotes || null,
        
        // Venue details
        capacity: body.capacity ? parseInt(body.capacity) : venue.capacity,
        ageRestriction: body.ageRestriction || null,
        
        // Equipment & logistics
        equipmentProvided: body.equipmentProvided || null,
        loadIn: body.loadIn || null,
        soundcheck: body.soundcheck || null,
        doorsOpen: body.doorsOpen || null,
        showTime: body.showTime || null,
        curfew: body.curfew || null,
        
        // Additional value
        promotion: body.promotion || null,
        lodging: body.lodging || null,
        additionalTerms: body.additionalTerms || null,
        
        // Status
        status: OfferStatus.PENDING,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : expiresAt
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            genres: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            venueType: true,
            capacity: true,
            location: {
              select: {
                city: true,
                stateProvince: true,
                country: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    console.log(`✅ Venue offer created: ${venue.name} → ${artist.name} for ${body.proposedDate}`);

    return NextResponse.json(newOffer, { status: 201 });
  } catch (error) {
    console.error('Error creating venue offer:', error);
    return NextResponse.json(
      { error: 'Failed to create venue offer' },
      { status: 500 }
    );
  }
} 
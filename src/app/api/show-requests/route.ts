import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/show-requests - Get show requests with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const venueId = searchParams.get('venueId'); 
    const status = searchParams.get('status');
    const initiatedBy = searchParams.get('initiatedBy');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const forVenues = searchParams.get('forVenues') === 'true';

    console.log('🎯 API: Fetching show requests from database');
    console.log('🎯 API: Filters -', { artistId, venueId, status, initiatedBy, activeOnly, forVenues });

    // Build where clause
    const where: any = {};

    if (artistId) {
      where.artistId = artistId;
    }

    if (venueId) {
      where.venueId = venueId;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (initiatedBy) {
      where.initiatedBy = initiatedBy.toUpperCase();
    }

    if (activeOnly) {
      where.status = { in: ['OPEN', 'PENDING'] };
    }

    // For venues browsing opportunities (replaces tour-requests?forVenues=true)
    if (forVenues) {
      where.OR = [
        { initiatedBy: 'ARTIST', status: 'OPEN' }, // Artist requests open for bidding
        { initiatedBy: 'VENUE', status: 'OPEN' }   // Other venue requests (for reference)
      ];
    }

    const showRequests = await prisma.showRequest.findMany({
      where,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            genres: true,
            location: {
              select: {
                city: true,
                stateProvince: true,
                country: true
              }
            }
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
        },
        bids: {
          include: {
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
            bidder: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        requestedDate: 'asc'
      }
    });

    console.log(`🎯 API: Found ${showRequests.length} show requests in database`);

    return NextResponse.json(showRequests);
  } catch (error) {
    console.error('Error fetching show requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch show requests' },
      { status: 500 }
    );
  }
}

// POST /api/show-requests - Create a new show request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🎯 API: Creating show request:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const requiredFields = ['artistId', 'title', 'requestedDate', 'initiatedBy'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: body.artistId },
      select: { id: true, name: true }
    });

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Check if venue exists (for venue-initiated requests)
    if (body.venueId) {
      const venue = await prisma.venue.findUnique({
        where: { id: body.venueId },
        select: { id: true, name: true }
      });

      if (!venue) {
        return NextResponse.json(
          { error: 'Venue not found' },
          { status: 404 }
        );
      }
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

    // Parse venue-specific requests from targetLocations
    let parsedVenueId = body.venueId || null;
    let cleanTargetLocations = body.targetLocations || [];

    // Check if this is a venue-specific request (format: "venue:id:name")
    if (body.targetLocations && body.targetLocations.length > 0) {
      const firstLocation = body.targetLocations[0];
      if (firstLocation.startsWith('venue:')) {
        const parts = firstLocation.split(':');
        if (parts.length >= 3) {
          const venueId = parts[1];
          const venueName = parts.slice(2).join(':'); // Handle names with colons
          
          // Verify venue exists
          const venue = await prisma.venue.findUnique({
            where: { id: venueId },
            select: { id: true, name: true }
          });
          
          if (venue) {
            parsedVenueId = venueId;
            cleanTargetLocations = [venueName]; // Store clean venue name instead of venue:id:name
            console.log(`🎯 Venue-specific request detected: ${venueName} (${venueId})`);
          } else {
            console.warn(`⚠️ Venue ID ${venueId} not found, treating as regular location request`);
          }
        }
      }
    }

    // Create new show request
    const newShowRequest = await prisma.showRequest.create({
      data: {
        artistId: body.artistId,
        venueId: parsedVenueId, // Use parsed venue ID for venue-specific requests
        title: body.title,
        description: body.description || null,
        requestedDate: new Date(body.requestedDate),
        initiatedBy: body.initiatedBy.toUpperCase(),
        createdById: body.createdById || systemUser.id,
        status: body.status?.toUpperCase() || 'OPEN',
        
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
        capacity: body.capacity ? parseInt(body.capacity) : null,
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
        message: body.message || null,
        
        // Tour context
        targetLocations: cleanTargetLocations, // Use clean locations without venue:id:name format
        genres: body.genres || [],
        
        // Expiration
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
            capacity: true
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

    console.log(`✅ Show request created: ${newShowRequest.title}`);
    console.log(`🎯 Created by: ${body.initiatedBy} | Artist: ${artist.name} | Date: ${body.requestedDate}`);

    return NextResponse.json(newShowRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating show request:', error);
    return NextResponse.json(
      { error: 'Failed to create show request' },
      { status: 500 }
    );
  }
} 
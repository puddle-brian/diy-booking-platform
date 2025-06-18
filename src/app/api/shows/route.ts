import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { ShowStatus, AgeRestriction } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'book-yr-life-secret-key-change-in-production';

// Helper function to get user from request (JWT only)
async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('🎵 API: Using JWT user:', decoded.userId);
    return { userId: decoded.userId, source: 'jwt' };
  } catch (error) {
    console.error('🎵 API: JWT verification failed:', error);
    return null;
  }
}

// 🎯 UPDATED: Conflict resolution for the new ShowRequest system
async function resolveShowRequestConflicts(confirmedShow: any): Promise<void> {
  try {
    const showDate = new Date(confirmedShow.date);
    console.log(`🎯 Resolving conflicts for confirmed show on ${confirmedShow.date}`);

    // For now, just log that conflicts would be resolved here
    // TODO: Implement proper conflict resolution for ShowRequest system
    console.log(`🔄 Conflict resolution temporarily disabled - would check for conflicts on ${showDate.toISOString().split('T')[0]}`);
    
    let conflictsResolved = 0;

    if (conflictsResolved > 0) {
      console.log(`🎉 Resolved ${conflictsResolved} show request conflict(s)`);
    } else {
      console.log(`✨ No conflicts found for show on ${confirmedShow.date}`);
    }

  } catch (error) {
    console.error('Error resolving show request conflicts:', error);
    // Don't throw - we don't want to block show confirmation if conflict resolution fails
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const venueId = searchParams.get('venueId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    console.log(`🎵 API: Fetching shows from database`);
    
    const whereClause: any = {};
    
    // Filter by artistId (through lineup relationship)
    if (artistId) {
      whereClause.lineup = {
        some: {
          artistId: artistId
        }
      };
    }
    
    // Filter by venueId
    if (venueId) {
      whereClause.venueId = venueId;
    }
    
    // Filter by status
    if (status) {
      whereClause.status = status.toUpperCase() as ShowStatus;
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) {
        whereClause.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.date.lte = new Date(dateTo);
      }
    }
    
    const shows = await (prisma.show as any).findMany({
      where: whereClause,
      include: {
        lineup: {
          include: {
            artist: {
              select: {
                id: true,
                name: true,
                genres: true
              }
            }
          },
          orderBy: {
            performanceOrder: 'asc'
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
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
        date: 'asc'
      }
    });

    // Transform to match the expected format with lineup support
    const transformedShows = shows.map((show: any) => {
      // Properly transform age restriction
      let ageRestriction = 'all-ages';
      if (show.ageRestriction) {
        const ageStr = show.ageRestriction.toLowerCase();
        if (ageStr.includes('eighteen') || ageStr.includes('18')) {
          ageRestriction = '18+';
        } else if (ageStr.includes('twenty') || ageStr.includes('21')) {
          ageRestriction = '21+';
        } else if (ageStr.includes('all')) {
          ageRestriction = 'all-ages';
        }
      }

      // Get headliner from lineup (for backwards compatibility)
      const headliner = show.lineup?.find((l: any) => l.billingPosition === 'HEADLINER');
      const primaryArtist = headliner || show.lineup?.[0];

      return {
        id: show.id,
        // For backwards compatibility, provide artistId of headliner
        artistId: primaryArtist?.artistId || show.artistId || null,
        venueId: show.venueId,
        date: show.date.toISOString().split('T')[0],
        city: show.venue?.location?.city || show.city,
        state: show.venue?.location?.stateProvince || show.state || '',
        country: show.venue?.location?.country || show.country,
        venueName: show.venue?.name || show.venueName,
        // For backwards compatibility, show headliner as main artist
        artistName: primaryArtist?.artist?.name || show.artistName || 'TBA',
        title: show.title,
        status: show.status.toLowerCase(),
        ticketPrice: show.ticketPrice ? { door: show.ticketPrice } : null,
        ageRestriction: ageRestriction,
        description: show.description,
        guarantee: show.guarantee,
        doorDeal: show.doorDeal,
        capacity: show.capacity,
        loadIn: show.loadIn,
        soundcheck: show.soundcheck,
        doorsOpen: show.doorsOpen,
        showTime: show.showTime,
        curfew: show.curfew,
        notes: show.notes,
        createdAt: show.createdAt.toISOString(),
        updatedAt: show.updatedAt.toISOString(),
        createdBy: show.createdBy?.username || 'System',
        // NEW: Include full lineup information
        lineup: show.lineup?.map((lineupEntry: any) => ({
          artistId: lineupEntry.artistId,
          artistName: lineupEntry.artist.name,
          billingPosition: lineupEntry.billingPosition,
          performanceOrder: lineupEntry.performanceOrder,
          setLength: lineupEntry.setLength,
          guarantee: lineupEntry.guarantee,
          status: lineupEntry.status
        })) || []
      };
    });
    
    console.log(`🎵 API: Found ${transformedShows.length} shows in database`);
    return NextResponse.json(transformedShows);
  } catch (error) {
    console.error('Error in GET /api/shows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get authenticated user
    const userAuth = await getUserFromRequest(request);
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate required fields
    const requiredFields = ['date', 'venueName', 'artistName'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Find or create artist
    let artist;
    if (body.artistId) {
      artist = await prisma.artist.findUnique({
        where: { id: body.artistId }
      });
    }
    
    if (!artist) {
      // Create external artist if not found
      const location = await prisma.location.findFirst({
        where: {
          city: body.city || 'Unknown',
          stateProvince: body.state || 'Unknown'
        }
      });
      
      let locationId = location?.id;
      if (!locationId) {
        const newLocation = await prisma.location.create({
          data: {
            city: body.city || 'Unknown',
            stateProvince: body.state || 'Unknown',
            country: body.country || 'USA'
          }
        });
        locationId = newLocation.id;
      }
      
      artist = await prisma.artist.create({
        data: {
          name: body.artistName,
          locationId: locationId,
          genres: body.genres || [],
          verified: false
        }
      });
    }

    // Find or create venue
    let venue;
    if (body.venueId) {
      venue = await prisma.venue.findUnique({
        where: { id: body.venueId }
      });
    }
    
    if (!venue) {
      // Create external venue if not found
      const location = await prisma.location.findFirst({
        where: {
          city: body.city || 'Unknown',
          stateProvince: body.state || 'Unknown'
        }
      });
      
      let locationId = location?.id;
      if (!locationId) {
        const newLocation = await prisma.location.create({
          data: {
            city: body.city || 'Unknown',
            stateProvince: body.state || 'Unknown',
            country: body.country || 'USA'
          }
        });
        locationId = newLocation.id;
      }
      
      venue = await prisma.venue.create({
        data: {
          name: body.venueName,
          locationId: locationId,
          venueType: 'OTHER',
          capacity: body.capacity || null,
          verified: false
        }
      });
    }

    // Check for date conflicts - check if venue already has a show on this date
    const conflictingShow = await prisma.show.findFirst({
      where: {
        venueId: venue.id,
        date: new Date(body.date),
        status: { not: 'CANCELLED' }
      }
    });
    
    if (conflictingShow) {
      return NextResponse.json(
        { error: 'Date conflict: Venue already has a show on this date' },
        { status: 409 }
      );
    }
    
    // Create new show with lineup architecture
    const newShow = await (prisma.show as any).create({
      data: {
        title: body.title || `${artist.name} at ${venue.name}`,
        date: new Date(body.date),
        venueId: venue.id,
        description: body.notes || body.description,
        ticketPrice: body.ticketPrice ? parseFloat(body.ticketPrice) : null,
        ageRestriction: body.ageRestriction ? 
          body.ageRestriction.toUpperCase().replace('-', '_') as AgeRestriction : 
          'ALL_AGES',
        status: (body.status?.toUpperCase() || 'CONFIRMED') as ShowStatus,
        createdById: userAuth.userId,
        // Create lineup entry for the artist
        lineup: {
          create: {
            artistId: artist.id,
            billingPosition: 'HEADLINER',
            performanceOrder: 1,
            setLength: body.setLength || 75,
            guarantee: body.guarantee || null,
            status: 'CONFIRMED'
          }
        }
      },
      include: {
        lineup: {
          include: {
            artist: {
              select: {
                id: true,
                name: true,
                genres: true
              }
            }
          },
          orderBy: {
            performanceOrder: 'asc'
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
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

    // 🎯 CONFLICT RESOLUTION: Automatically resolve any conflicting tour requests
    if (newShow.status === 'CONFIRMED') {
      await resolveShowRequestConflicts(newShow);
    }

    // Get the headliner from lineup for backwards compatibility
    const headliner = newShow.lineup?.find((l: any) => l.billingPosition === 'HEADLINER') || newShow.lineup?.[0];

    console.log(`🎵 New show confirmed: ${headliner?.artist?.name} at ${newShow.venue.name} on ${newShow.date}`);

    // Transform to match expected format
    const transformedShow = {
      id: newShow.id,
      artistId: headliner?.artistId || null,
      venueId: newShow.venueId,
      date: newShow.date.toISOString().split('T')[0],
      city: newShow.venue.location.city,
      state: newShow.venue.location.stateProvince || '',
      country: newShow.venue.location.country,
      venueName: newShow.venue.name,
      artistName: headliner?.artist?.name || 'TBA',
      title: newShow.title,
      status: newShow.status.toLowerCase(),
      ticketPrice: newShow.ticketPrice ? { door: newShow.ticketPrice } : null,
      ageRestriction: (() => {
        if (!newShow.ageRestriction) return 'all-ages';
        const ageStr = newShow.ageRestriction.toLowerCase();
        if (ageStr.includes('eighteen') || ageStr.includes('18')) return '18+';
        if (ageStr.includes('twenty') || ageStr.includes('21')) return '21+';
        return 'all-ages';
      })(),
      description: newShow.description,
      guarantee: headliner?.guarantee || null,
      doorDeal: newShow.doorDeal,
      capacity: newShow.capacity,
      loadIn: newShow.loadIn,
      soundcheck: newShow.soundcheck,
      doorsOpen: newShow.doorsOpen,
      showTime: newShow.showTime,
      curfew: newShow.curfew,
      notes: newShow.notes,
      createdAt: newShow.createdAt.toISOString(),
      updatedAt: newShow.updatedAt.toISOString(),
      createdBy: newShow.createdBy.username,
      // NEW: Include full lineup information
      lineup: newShow.lineup?.map((lineupEntry: any) => ({
        artistId: lineupEntry.artistId,
        artistName: lineupEntry.artist.name,
        billingPosition: lineupEntry.billingPosition,
        performanceOrder: lineupEntry.performanceOrder,
        setLength: lineupEntry.setLength,
        guarantee: lineupEntry.guarantee,
        status: lineupEntry.status
      })) || []
    };

    return NextResponse.json(transformedShow, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/shows:', error);
    return NextResponse.json(
      { error: 'Failed to create show' },
      { status: 500 }
    );
  }
} 
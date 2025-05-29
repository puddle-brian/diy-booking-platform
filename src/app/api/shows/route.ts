import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { ShowStatus, AgeRestriction } from '@prisma/client';

// Conflict resolution: Update tour requests when a show is confirmed
async function resolveShowRequestConflicts(confirmedShow: any): Promise<void> {
  try {
    const showDate = new Date(confirmedShow.date);
    console.log(`🎯 Resolving conflicts for show: ${confirmedShow.artist?.name || 'Unknown'} on ${confirmedShow.date}`);

    // Find active tour requests for the same artist that overlap with the confirmed show date
    const conflictingRequests = await prisma.tourRequest.findMany({
      where: {
        artistId: confirmedShow.artistId,
        status: 'ACTIVE',
        AND: [
          { startDate: { lte: showDate } },
          { endDate: { gte: showDate } }
        ]
      }
    });

    let conflictsResolved = 0;

    for (const request of conflictingRequests) {
      const requestStart = new Date(request.startDate!);
      const requestEnd = new Date(request.endDate!);

      console.log(`⚡ Found conflicting request: ${request.title} (${request.startDate} - ${request.endDate})`);

      if (requestStart.getTime() === requestEnd.getTime() && requestStart.getTime() === showDate.getTime()) {
        // Single-day request that's now fulfilled
        await prisma.tourRequest.update({
          where: { id: request.id },
          data: { 
            status: 'COMPLETED',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Request fulfilled: ${request.title}`);
        conflictsResolved++;

      } else if (showDate.getTime() === requestStart.getTime()) {
        // Show is on start date - move start date forward by 1 day
        const newStart = new Date(showDate);
        newStart.setDate(newStart.getDate() + 1);
        
        if (newStart <= requestEnd) {
          await prisma.tourRequest.update({
            where: { id: request.id },
            data: {
              startDate: newStart,
              updatedAt: new Date()
            }
          });
          console.log(`📅 Moved request start date: ${request.title} now starts ${newStart.toISOString().split('T')[0]}`);
          conflictsResolved++;
        } else {
          // No valid date range left
          await prisma.tourRequest.update({
            where: { id: request.id },
            data: { 
              status: 'COMPLETED',
              updatedAt: new Date()
            }
          });
          console.log(`✅ Request fulfilled (no valid dates left): ${request.title}`);
          conflictsResolved++;
        }

      } else if (showDate.getTime() === requestEnd.getTime()) {
        // Show is on end date - move end date backward by 1 day
        const newEnd = new Date(showDate);
        newEnd.setDate(newEnd.getDate() - 1);
        
        await prisma.tourRequest.update({
          where: { id: request.id },
          data: {
            endDate: newEnd,
            updatedAt: new Date()
          }
        });
        console.log(`📅 Moved request end date: ${request.title} now ends ${newEnd.toISOString().split('T')[0]}`);
        conflictsResolved++;

      } else {
        // Show date is in the middle - mark as fulfilled
        await prisma.tourRequest.update({
          where: { id: request.id },
          data: { 
            status: 'COMPLETED',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Request fulfilled (show in middle of date range): ${request.title}`);
        conflictsResolved++;
      }
    }

    if (conflictsResolved > 0) {
      console.log(`🎉 Resolved ${conflictsResolved} show request conflict(s)`);
    } else {
      console.log(`✨ No conflicts found for ${confirmedShow.artist?.name || 'Unknown'} on ${confirmedShow.date}`);
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
    
    // Filter by artistId
    if (artistId) {
      whereClause.artistId = artistId;
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
    
    const shows = await prisma.show.findMany({
      where: whereClause,
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

    // Transform to match the expected format
    const transformedShows = shows.map(show => {
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

      return {
        id: show.id,
        artistId: show.artistId,
        venueId: show.venueId,
        date: show.date.toISOString().split('T')[0],
        city: show.venue.location.city,
        state: show.venue.location.stateProvince || '',
        country: show.venue.location.country,
        venueName: show.venue.name,
        artistName: show.artist.name,
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
        billingOrder: show.billingOrder,
        createdAt: show.createdAt.toISOString(),
        updatedAt: show.updatedAt.toISOString(),
        createdBy: show.createdBy.username
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

    // Find or create user for createdBy
    let createdById = body.createdBy;
    if (!createdById) {
      // Use system user or create one
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
      createdById = systemUser.id;
    }
    
    // Check for date conflicts
    const conflictingShow = await prisma.show.findFirst({
      where: {
        OR: [
          { artistId: artist.id },
          { venueId: venue.id }
        ],
        date: new Date(body.date),
        status: { not: 'CANCELLED' }
      }
    });
    
    if (conflictingShow) {
      return NextResponse.json(
        { error: 'Date conflict: Artist or venue already has a show on this date' },
        { status: 409 }
      );
    }
    
    // Create new show
    const newShow = await prisma.show.create({
      data: {
        title: body.title || `${artist.name} at ${venue.name}`,
        date: new Date(body.date),
        artistId: artist.id,
        venueId: venue.id,
        description: body.notes || body.description,
        ticketPrice: body.ticketPrice ? parseFloat(body.ticketPrice) : null,
        ageRestriction: body.ageRestriction ? 
          body.ageRestriction.toUpperCase().replace('-', '_') as AgeRestriction : 
          'ALL_AGES',
        status: (body.status?.toUpperCase() || 'CONFIRMED') as ShowStatus,
        createdById: createdById
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

    console.log(`🎵 New show confirmed: ${newShow.artist.name} at ${newShow.venue.name} on ${newShow.date}`);

    // Transform to match expected format
    const transformedShow = {
      id: newShow.id,
      artistId: newShow.artistId,
      venueId: newShow.venueId,
      date: newShow.date.toISOString().split('T')[0],
      city: newShow.venue.location.city,
      state: newShow.venue.location.stateProvince || '',
      country: newShow.venue.location.country,
      venueName: newShow.venue.name,
      artistName: newShow.artist.name,
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
      guarantee: newShow.guarantee,
      doorDeal: newShow.doorDeal,
      capacity: newShow.capacity,
      loadIn: newShow.loadIn,
      soundcheck: newShow.soundcheck,
      doorsOpen: newShow.doorsOpen,
      showTime: newShow.showTime,
      curfew: newShow.curfew,
      notes: newShow.notes,
      billingOrder: newShow.billingOrder,
      createdAt: newShow.createdAt.toISOString(),
      updatedAt: newShow.updatedAt.toISOString(),
      createdBy: newShow.createdBy.username
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
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { RequestStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const region = searchParams.get('region');
    const genre = searchParams.get('genre');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const forVenues = searchParams.get('forVenues') === 'true';
    
    // Build where clause for Prisma
    const where: any = {};
    
    console.log(`🗺️ API: Fetching tour requests from database`);
    console.log(`🗺️ API: Filters - artistId: ${artistId}, activeOnly: ${activeOnly}, forVenues: ${forVenues}`);
    
    // Filter by artistId (for artist's own requests)
    if (artistId) {
      where.artistId = artistId;
    }
    
    // Filter by status
    if (status) {
      where.status = status.toUpperCase() as RequestStatus;
    }
    
    // Filter by city/region (for venues browsing)
    if (city || region) {
      where.targetLocations = {
        hasSome: [city, region].filter(Boolean)
      };
    }
    
    // Filter by genre
    if (genre) {
      where.genres = {
        hasSome: [genre.toLowerCase()]
      };
    }
    
    // Only active requests (default for venue browsing)
    if (activeOnly) {
      const now = new Date();
      where.status = RequestStatus.ACTIVE;
      where.endDate = {
        gt: now
      };
      // Don't filter by startDate - tour requests are active if they haven't ended yet
    }
    
    // Fetch from database with artist information
    const requests = await prisma.tourRequest.findMany({
      where,
      include: {
        artist: {
          include: {
            location: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });
    
    console.log(`🗺️ API: Found ${requests.length} tour requests in database`);
    
    // Transform database results to match frontend expectations
    const transformedRequests = requests.map(request => {
      // Handle both single date and date range formats
      let displayStartDate = '';
      let displayEndDate = '';
      let isSingleDate = false;
      
      if (request.isLegacyRange && request.startDate && request.endDate) {
        // Legacy date range format
        displayStartDate = request.startDate.toISOString().split('T')[0];
        displayEndDate = request.endDate.toISOString().split('T')[0];
        isSingleDate = false;
      } else if (request.requestDate) {
        // New single date format - only set start date
        displayStartDate = request.requestDate.toISOString().split('T')[0];
        displayEndDate = ''; // Leave empty for single dates
        isSingleDate = true;
      }

      return {
        id: request.id,
        artistId: request.artistId,
        artistName: request.artist.name,
        title: request.title,
        description: request.description,
        requestDate: request.requestDate?.toISOString().split('T')[0] || '',
        startDate: displayStartDate,
        endDate: displayEndDate,
        isSingleDate: isSingleDate, // Add flag to distinguish single dates
        isLegacyRange: request.isLegacyRange,
        location: request.targetLocations.join(', ') || 'Flexible',
        radius: 200, // Default radius
        flexibility: 'route-flexible', // Default flexibility
        genres: request.genres,
        expectedDraw: {
          min: 100,
          max: 300,
          description: 'Expected audience size'
        },
        tourStatus: 'exploring-interest',
        ageRestriction: 'all-ages',
        equipment: {
          needsPA: true,
          needsMics: true,
          needsDrums: false,
          needsAmps: true,
          acoustic: false,
        },
        guaranteeRange: {
          min: 300,
          max: 800
        },
        acceptsDoorDeals: true,
        merchandising: true,
        travelMethod: 'van',
        lodging: 'flexible',
        status: request.status.toLowerCase(),
        priority: 'medium',
        responses: 0, // TODO: Count actual bids
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
        expiresAt: new Date((request.requestDate?.getTime() || request.endDate?.getTime() || Date.now()) + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
    
    // For venues, transform the data to match VenueBidding component expectations
    if (forVenues) {
      const venueRequests = transformedRequests.map(request => ({
        id: request.id,
        artistId: request.artistId,
        artistName: request.artistName,
        city: request.location.split(',')[0]?.trim() || '',
        state: request.location.split(',')[1]?.trim() || '',
        country: 'USA', // Default for now
        requestedDate: request.startDate,
        genre: request.genres,
        expectedDraw: request.expectedDraw.description || `${request.expectedDraw.min}-${request.expectedDraw.max}`,
        guarantee: request.guaranteeRange?.min || 0,
        doorSplit: 70, // Default door split percentage
        description: request.description,
        requirements: [
          ...(request.equipment.needsPA ? ['PA System'] : []),
          ...(request.equipment.needsMics ? ['Microphones'] : []),
          ...(request.equipment.needsDrums ? ['Drum Kit'] : []),
          ...(request.equipment.needsAmps ? ['Amplifiers'] : []),
          ...(request.ageRestriction !== 'flexible' ? [`${request.ageRestriction} venue`] : []),
        ],
        status: request.status,
        createdAt: request.createdAt,
        deadline: request.expiresAt,
      }));
      
      return NextResponse.json(venueRequests);
    }
    
    // Return in the format the frontend expects
    return NextResponse.json({
      requests: transformedRequests,
      total: transformedRequests.length
    });
  } catch (error) {
    console.error('Error in GET /api/tour-requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour requests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Determine if this is a single date request or legacy date range
    const isSingleDate = !!body.requestDate && !body.startDate && !body.endDate;
    const isDateRange = !!body.startDate && !!body.endDate && !body.requestDate;
    
    // Validate required fields based on format
    if (isSingleDate) {
      const requiredFields = ['artistId', 'artistName', 'title', 'requestDate'];
      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }
    } else if (isDateRange) {
      const requiredFields = ['artistId', 'artistName', 'title', 'startDate', 'endDate'];
      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid date format. Provide either requestDate (single date) or startDate+endDate (date range)' },
        { status: 400 }
      );
    }

    const now = new Date();
    let requestDate, startDate, endDate;

    // Validate dates based on format
    if (isSingleDate) {
      // Parse date as local date to avoid timezone issues
      const dateParts = body.requestDate.split('-');
      if (dateParts.length === 3) {
        requestDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      } else {
        requestDate = new Date(body.requestDate);
      }
      
      if (requestDate <= now) {
        return NextResponse.json(
          { error: 'Request date must be in the future' },
          { status: 400 }
        );
      }
    } else {
      // Legacy date range validation - also fix timezone issues
      const parseLocalDate = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          return new Date(dateStr);
        }
      };
      
      startDate = parseLocalDate(body.startDate);
      endDate = parseLocalDate(body.endDate);
      
      if (startDate <= now) {
        return NextResponse.json(
          { error: 'Start date must be in the future' },
          { status: 400 }
        );
      }
      
      if (endDate < startDate) {
        return NextResponse.json(
          { error: 'End date must be on or after start date' },
          { status: 400 }
        );
      }
    }

    // Get or create the system user for createdById
    let systemUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'system@diy-booking.com' },
          { username: 'system' }
        ]
      }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@diy-booking.com',
          username: 'system-user', // Use different username to avoid conflict
          role: 'ADMIN'
        }
      });
    }
    
    // Create new tour request in database with appropriate fields
    const createData: any = {
      artistId: body.artistId,
      title: body.title,
      description: body.description || '',
      status: RequestStatus.ACTIVE,
      genres: body.genres || [],
      targetLocations: body.location ? [body.location] : [],
      createdById: systemUser.id,
      isLegacyRange: !isSingleDate
    };

    // Add date fields based on format
    if (isSingleDate) {
      createData.requestDate = requestDate;
    } else {
      createData.startDate = startDate;
      createData.endDate = endDate;
    }

    const newRequest = await prisma.tourRequest.create({
      data: createData,
      include: {
        artist: {
          include: {
            location: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    console.log(`🎯 New tour request created in database: ${newRequest.artist.name} - ${newRequest.title} (${isSingleDate ? 'single date' : 'date range'})`);

    // Transform to match frontend expectations
    const transformedRequest = {
      id: newRequest.id,
      artistId: newRequest.artistId,
      artistName: newRequest.artist.name,
      title: newRequest.title,
      description: newRequest.description,
      // Return both formats for compatibility
      requestDate: newRequest.requestDate?.toISOString().split('T')[0] || '',
      startDate: newRequest.requestDate ? newRequest.requestDate.toISOString().split('T')[0] : (newRequest.startDate?.toISOString().split('T')[0] || ''),
      endDate: newRequest.isLegacyRange ? (newRequest.endDate?.toISOString().split('T')[0] || '') : '',
      isSingleDate: !newRequest.isLegacyRange, // True for single dates, false for legacy ranges
      isLegacyRange: newRequest.isLegacyRange,
      location: newRequest.targetLocations.join(', ') || 'Flexible',
      radius: 200,
      flexibility: 'route-flexible',
      genres: newRequest.genres,
      expectedDraw: {
        min: 100,
        max: 300,
        description: 'Expected audience size'
      },
      tourStatus: 'exploring-interest',
      ageRestriction: 'all-ages',
      equipment: {
        needsPA: true,
        needsMics: true,
        needsDrums: false,
        needsAmps: true,
        acoustic: false,
      },
      guaranteeRange: {
        min: 300,
        max: 800
      },
      acceptsDoorDeals: true,
      merchandising: true,
      travelMethod: 'van',
      lodging: 'flexible',
      status: newRequest.status.toLowerCase(),
      priority: 'medium',
      responses: 0,
      createdAt: newRequest.createdAt.toISOString(),
      updatedAt: newRequest.updatedAt.toISOString(),
      expiresAt: new Date((newRequest.requestDate?.getTime() || newRequest.endDate?.getTime() || Date.now()) + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json(transformedRequest, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tour-requests:', error);
    return NextResponse.json(
      { error: 'Failed to create tour request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { ActivityNotificationService } from '../../../services/ActivityNotificationService';

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
          select: {
            id: true,
            venueId: true,  // CRITICAL: Include venueId field
            proposedDate: true,
            message: true,
            amount: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            acceptedAt: true,
            billingNotes: true,
            billingPosition: true,
            cancelledAt: true,
            cancelledReason: true,
            declinedAt: true,
            declinedReason: true,
            heldAt: true,
            heldUntil: true,
            holdPosition: true,
            lineupPosition: true,
            otherActs: true,
            setLength: true,
            // Include hold state fields
            holdState: true,
            frozenByHoldId: true,
            frozenAt: true,
            unfrozenAt: true,
            statusHistory: true,
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

    // 🎯 UX IMPROVEMENT: Notify venue owners when artists request to play there
    console.log(`🔔 Notification check: parsedVenueId=${parsedVenueId}, initiatedBy=${body.initiatedBy}`);
    if (parsedVenueId && body.initiatedBy === 'ARTIST') {
      console.log(`🔔 Attempting to notify venue members for venue ${parsedVenueId}`);
      try {
        // Get venue owners to notify (using same pattern as bid notifications)
        const venueMembers = await prisma.membership.findMany({
          where: { 
            entityType: 'VENUE',
            entityId: parsedVenueId,
            status: 'ACTIVE'  // This was the missing piece!
          },
          include: {
            user: { 
              select: { id: true, username: true } 
            }
          }
        });
        
        console.log(`🔔 Found ${venueMembers.length} venue members with OWNER/ADMIN roles`);
        if (venueMembers.length === 0) {
          // Check if there are ANY members for this venue
          const allMembers = await prisma.membership.findMany({
            where: { 
              entityType: 'VENUE',
              entityId: parsedVenueId
            },
            include: {
              user: { 
                select: { id: true, username: true } 
              }
            }
          });
          console.log(`🔔 Total venue members (any role): ${allMembers.length}`);
          allMembers.forEach(member => {
            console.log(`🔔 Member: ${member.user.username} (${member.role})`);
          });
        }

        // Notify each venue owner/admin
        for (const member of venueMembers) {
          const showDate = new Date(body.requestedDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
          
          // Use venue name for clearer notification
          const venueName = newShowRequest.venue?.name || 'your venue';
          
          await ActivityNotificationService.createNotification({
            userId: member.user.id,
            type: 'SHOW_REQUEST',
            title: 'New Show Request',
            summary: `${artist.name} wants to play at ${venueName} on ${showDate}`,
            entityType: 'SHOW_REQUEST',
            entityId: newShowRequest.id,
            actionUrl: `/show-requests/${newShowRequest.id}`,
            metadata: { 
              artistName: artist.name, 
              venueName: venueName,
              showTitle: newShowRequest.title,
              requestedDate: showDate 
            }
          });
        }
        
        console.log(`📢 Notified ${venueMembers.length} venue members about new show request`);
      } catch (notificationError) {
        // Don't fail the request if notification fails
        console.error('Error sending show request notification:', notificationError);
      }
    }

    // 🎯 NEW: Notify venues in target locations when artists post general location requests
    if (!parsedVenueId && body.initiatedBy === 'ARTIST' && cleanTargetLocations.length > 0) {
      console.log(`🔔 Location-based notification: Notifying venues in ${cleanTargetLocations.join(', ')}`);
      try {
        // Parse location strings to find matching venues
        // Format could be "City, State" or just "City" or "State"
        const locationConditions = cleanTargetLocations.map((loc: string) => {
          const parts = loc.split(',').map((p: string) => p.trim().toLowerCase());
          if (parts.length >= 2) {
            // City, State format
            return {
              location: {
                OR: [
                  { city: { contains: parts[0], mode: 'insensitive' as const } },
                  { stateProvince: { contains: parts[1], mode: 'insensitive' as const } }
                ]
              }
            };
          } else {
            // Just city or state
            return {
              location: {
                OR: [
                  { city: { contains: parts[0], mode: 'insensitive' as const } },
                  { stateProvince: { contains: parts[0], mode: 'insensitive' as const } }
                ]
              }
            };
          }
        });

        // Find venues in target locations
        const matchingVenues = await prisma.venue.findMany({
          where: {
            OR: locationConditions
          },
          select: {
            id: true,
            name: true,
            location: {
              select: { city: true, stateProvince: true }
            }
          },
          take: 50 // Limit to prevent overwhelming notifications
        });

        console.log(`🔔 Found ${matchingVenues.length} venues in target locations`);

        // Get members of these venues
        if (matchingVenues.length > 0) {
          const venueIds = matchingVenues.map(v => v.id);
          const venueMembers = await prisma.membership.findMany({
            where: {
              entityType: 'VENUE',
              entityId: { in: venueIds },
              status: 'ACTIVE'
            },
            include: {
              user: { select: { id: true, username: true } }
            }
          });

          // Create a map of venue ID to venue name
          const venueNameMap = new Map(matchingVenues.map(v => [v.id, v.name]));

          const showDate = new Date(body.requestedDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });

          // Notify each venue owner (dedupe by user)
          const notifiedUsers = new Set<string>();
          for (const member of venueMembers) {
            if (notifiedUsers.has(member.user.id)) continue;
            notifiedUsers.add(member.user.id);

            const venueName = venueNameMap.get(member.entityId) || 'your venue';
            
            await ActivityNotificationService.createNotification({
              userId: member.user.id,
              type: 'TOURING_ARTIST',
              title: '🎸 Touring Artist Seeking Shows',
              summary: `${artist.name} is looking for shows in your area on ${showDate}`,
              entityType: 'SHOW_REQUEST',
              entityId: newShowRequest.id,
              actionUrl: `/show-requests/${newShowRequest.id}`,
              metadata: { 
                artistName: artist.name, 
                venueName: venueName,
                targetLocations: cleanTargetLocations,
                requestedDate: showDate 
              }
            });
          }
          
          console.log(`📢 Notified ${notifiedUsers.size} venue owners about touring artist in their area`);
        }
      } catch (notificationError) {
        // Don't fail the request if notification fails
        console.error('Error sending location-based notifications:', notificationError);
      }
    }

    return NextResponse.json(newShowRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating show request:', error);
    return NextResponse.json(
      { error: 'Failed to create show request' },
      { status: 500 }
    );
  }
} 
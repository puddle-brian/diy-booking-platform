import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';
import { ActivityNotificationService } from '../../../services/ActivityNotificationService';

const JWT_SECRET = process.env.JWT_SECRET || 'book-yr-life-secret-key-change-in-production';

// Helper function to authenticate user
async function authenticateUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return { success: false, error: 'No authentication token found' };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Invalid or expired token' };
  }
}

// POST /api/hold-requests - Create a new hold request
export async function POST(request: NextRequest) {
  try {
    console.log('🔒 HoldRequest API: POST request received');
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      console.log('🔒 HoldRequest API: Authentication failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const {
      showId,
      showRequestId,
      duration,
      reason,
      customMessage
    } = body;
    
    // Parse venue offer IDs from the timeline format
    let venueOfferId = null;
    let actualShowRequestId = showRequestId;
    
    if (showRequestId && showRequestId.startsWith('venue-offer-')) {
      // Extract the actual venue offer ID from the prefixed format
      venueOfferId = showRequestId.replace('venue-offer-', '');
      actualShowRequestId = null; // Clear showRequestId since this is a venue offer
    }
    
    console.log('🔒 HoldRequest API: Request body:', { showId, showRequestId, venueOfferId, actualShowRequestId, duration, reason, userId: authResult.user!.id });

    // Validation: Exactly one document type must be specified
    const documentCount = [showId, actualShowRequestId, venueOfferId].filter(Boolean).length;
    if (documentCount !== 1) {
      return NextResponse.json(
        { error: 'Must specify exactly one of showId, showRequestId, or venueOfferId' },
        { status: 400 }
      );
    }

    // Validation: Required fields
    if (!duration || !reason) {
      return NextResponse.json(
        { error: 'Duration and reason are required' },
        { status: 400 }
      );
    }

    // Validation: Duration must be reasonable (1 hour to 7 days)
    if (duration < 1 || duration > 168) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 168 hours (1 week)' },
        { status: 400 }
      );
    }

    // Check if document exists and user has permission
    let canRequestHold = false;

    // TEMPORARY: Debug users can request holds on anything
    if (authResult.user!.id.startsWith('debug-')) {
      console.log('🔒 HoldRequest API: Debug user access granted for:', authResult.user!.id);
      canRequestHold = true;
    } else {
      if (showId) {
        const show = await prisma.show.findUnique({
          where: { id: showId },
          include: { venue: true }
        });

        if (!show) {
          console.log('🔒 HoldRequest API: Show not found:', showId);
          return NextResponse.json({ error: 'Show not found' }, { status: 404 });
        }

        // User can request hold if they're the artist or venue owner
        canRequestHold = show.artistId === authResult.user!.id || 
                        show.venue?.submittedById === authResult.user!.id;
        
        console.log('🔒 HoldRequest API: Show permission check:', { 
          canRequestHold, 
          showArtistId: show.artistId, 
          venueOwnerId: show.venue?.submittedById,
          userId: authResult.user!.id 
        });
      }

      if (actualShowRequestId) {
        const showRequest = await prisma.showRequest.findUnique({
          where: { id: actualShowRequestId },
          include: { venue: true }
        });

        if (!showRequest) {
          console.log('🔒 HoldRequest API: Show request not found:', actualShowRequestId);
          return NextResponse.json({ error: 'Show request not found' }, { status: 404 });
        }

        // User can request hold if they're the artist or venue owner
        canRequestHold = showRequest.artistId === authResult.user!.id || 
                        (showRequest.venue?.submittedById === authResult.user!.id);
        
        console.log('🔒 HoldRequest API: ShowRequest permission check:', { 
          canRequestHold, 
          requestArtistId: showRequest.artistId, 
          venueOwnerId: showRequest.venue?.submittedById,
          userId: authResult.user!.id 
        });
      }

      if (venueOfferId) {
        // 🎯 NEW UNIFIED SYSTEM: Check both VenueOffer (old) and ShowRequest (new) tables
        let venueOffer = await prisma.venueOffer.findUnique({
          where: { id: venueOfferId },
          include: { venue: true }
        });

        // If not found in VenueOffer table, check ShowRequest table (new unified system)
        let showRequestOffer = null;
        if (!venueOffer) {
          showRequestOffer = await prisma.showRequest.findUnique({
            where: { id: venueOfferId },
            include: { venue: true, artist: true }
          });
        }

        if (!venueOffer && !showRequestOffer) {
          console.log('🔒 HoldRequest API: Venue offer not found in either table:', venueOfferId);
          console.log('🔒 HoldRequest API: This may be a stale reference from timeline data');
          return NextResponse.json({ error: 'Venue offer not found' }, { status: 404 });
        }

        if (venueOffer) {
          // Traditional VenueOffer
          canRequestHold = venueOffer.artistId === authResult.user!.id || 
                          venueOffer.createdById === authResult.user!.id;
          
          console.log('🔒 HoldRequest API: VenueOffer permission check:', { 
            canRequestHold, 
            offerArtistId: venueOffer.artistId, 
            offerCreatedById: venueOffer.createdById,
            userId: authResult.user!.id 
          });
        } else if (showRequestOffer) {
          // New unified ShowRequest (venue-initiated)
          canRequestHold = showRequestOffer.artistId === authResult.user!.id || 
                          showRequestOffer.createdById === authResult.user!.id;
          
          console.log('🔒 HoldRequest API: ShowRequest (venue offer) permission check:', { 
            canRequestHold, 
            offerArtistId: showRequestOffer.artistId, 
            offerCreatedById: showRequestOffer.createdById,
            userId: authResult.user!.id 
          });
        }
      }

      if (!canRequestHold) {
        console.log('🔒 HoldRequest API: Permission denied for user:', authResult.user!.id);
        return NextResponse.json(
          { error: 'You can only request holds on your own shows, requests, or offers' },
          { status: 403 }
        );
      }
    }

    // Check for existing active hold using safer raw query
    let existingHolds: any[] = [];
    
    if (showId) {
      existingHolds = await prisma.$queryRaw`
        SELECT id FROM "hold_requests" 
        WHERE "showId" = ${showId}
        AND status IN ('PENDING', 'ACTIVE')
      ` as any[];
    } else if (actualShowRequestId) {
      existingHolds = await prisma.$queryRaw`
        SELECT id FROM "hold_requests" 
        WHERE "showRequestId" = ${actualShowRequestId}
        AND status IN ('PENDING', 'ACTIVE')
      ` as any[];
    } else if (venueOfferId) {
      // 🎯 NEW: Check both venueOfferId (old system) and showRequestId (new system) for venue offers
      const traditionalOfferHolds = await prisma.$queryRaw`
        SELECT id FROM "hold_requests" 
        WHERE "venueOfferId" = ${venueOfferId}
        AND status IN ('PENDING', 'ACTIVE')
      ` as any[];
      
      const unifiedOfferHolds = await prisma.$queryRaw`
        SELECT id FROM "hold_requests" 
        WHERE "showRequestId" = ${venueOfferId}
        AND status IN ('PENDING', 'ACTIVE')
      ` as any[];
      
      existingHolds = [...traditionalOfferHolds, ...unifiedOfferHolds];
    }

    console.log('🔒 HoldRequest API: Existing holds check:', { existingCount: existingHolds.length });

    if (existingHolds.length > 0) {
      console.log('🔒 HoldRequest API: Active hold already exists');
      return NextResponse.json(
        { error: 'An active hold already exists for this document' },
        { status: 409 }
      );
    }
    
    // 🔒 NEW: Check for existing accepted bids (prevent holds on decided requests)
    if (actualShowRequestId) {
      const acceptedBids = await prisma.showRequestBid.findMany({
        where: {
          showRequestId: actualShowRequestId,
          status: 'ACCEPTED'
        },
        include: {
          venue: { select: { name: true } }
        }
      });
      
      if (acceptedBids.length > 0) {
        const acceptedVenue = acceptedBids[0].venue?.name || 'Unknown Venue';
        console.log('🔒 HoldRequest API: Cannot create hold - bid already accepted by:', acceptedVenue);
        return NextResponse.json(
          { error: `Cannot create hold - ${acceptedVenue} has already been accepted for this show` },
          { status: 409 }
        );
      }
    }

    // Create the hold request using raw query
    const holdId = crypto.randomUUID();
    const now = new Date();

    console.log('🔒 HoldRequest API: Creating hold with ID:', holdId);

    // 🎯 DECISION: Store venue offer holds as showRequestId for new unified system
    // This allows the hold to work with both old VenueOffer and new ShowRequest venue offers
    let finalShowRequestId = actualShowRequestId;
    let finalVenueOfferId = null;
    
    if (venueOfferId) {
      // Check if this is a ShowRequest (new system) or VenueOffer (old system)
      const isShowRequest = await prisma.showRequest.findUnique({
        where: { id: venueOfferId },
        select: { id: true }
      });
      
      if (isShowRequest) {
        // Store as showRequestId for new unified system
        finalShowRequestId = venueOfferId;
        finalVenueOfferId = null;
      } else {
        // Store as venueOfferId for old system
        finalShowRequestId = null;
        finalVenueOfferId = venueOfferId;
      }
    }

    // 🧪 TESTING: For standalone testing, verify foreign key relationships exist
    // If testing with fake IDs, set to null to avoid constraint violations
    if (finalShowRequestId && !showId) {
      const showRequestExists = await prisma.showRequest.findUnique({
        where: { id: finalShowRequestId },
        select: { id: true }
      });
      
      if (!showRequestExists) {
        console.log('🧪 HoldRequest API: ShowRequest ID not found, setting to null for testing:', finalShowRequestId);
        finalShowRequestId = null;
      }
    }

    let finalShowId = showId;
    if (showId) {
      const showExists = await prisma.show.findUnique({
        where: { id: showId },
        select: { id: true }
      });
      
      if (!showExists) {
        console.log('🧪 HoldRequest API: Show ID not found, setting to null for testing:', showId);
        finalShowId = null;
      }
    }

    await prisma.$executeRaw`
      INSERT INTO "hold_requests" (
        id, 
        "showId", 
        "showRequestId", 
        "venueOfferId",
        "requestedById", 
        duration, 
        reason, 
        "customMessage",
        status,
        "requestedAt",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${holdId},
        ${finalShowId || null},
        ${finalShowRequestId || null},
        ${finalVenueOfferId || null},
        ${authResult.user!.id},
        ${duration},
        ${reason},
        ${customMessage || null},
        'PENDING',
        ${now},
        ${now},
        ${now}
      )
    `;

    console.log('🔒 HoldRequest API: Hold created successfully, fetching details...');

    // Fetch the created hold request with related data using correct table name
    const createdHold = await prisma.$queryRaw`
      SELECT hr.*, 
             u.username as requester_name,
             s.title as show_title,
             s.date as show_date,
             sr.title as show_request_title,
             sr."requestedDate" as show_request_date,
             vo.title as venue_offer_title,
             vo."proposedDate" as venue_offer_date
      FROM "hold_requests" hr
      LEFT JOIN "User" u ON hr."requestedById" = u.id
      LEFT JOIN shows s ON hr."showId" = s.id
      LEFT JOIN "show_requests" sr ON hr."showRequestId" = sr.id
      LEFT JOIN "venue_offers" vo ON hr."venueOfferId" = vo.id
      WHERE hr.id = ${holdId}
    ` as any[];

    const holdData = createdHold[0] as any;

    // 📢 NEW: Create activity notification for the hold request
    try {
      // Determine who should receive the notification (the other party)
      let recipientId = '';
      let requesterName = holdData.requester_name || 'Someone';
      let showDate = '';

      // Determine recipient and show details based on what type of hold this is
      if (finalShowId) {
        // Show-based hold - notify the other party involved in the show
        const show = await prisma.show.findUnique({
          where: { id: finalShowId },
          include: { 
            venue: { select: { submittedById: true } },
            artist: { select: { submittedById: true } }
          }
        });
        
        if (show) {
          recipientId = show.venue?.submittedById === authResult.user!.id 
            ? (show.artist?.submittedById || '') 
            : (show.venue?.submittedById || '');
          showDate = show.date ? new Date(show.date).toLocaleDateString() : '';
        }
      } else if (finalShowRequestId) {
        // Show request-based hold - notify the venue owner
        const showRequest = await prisma.showRequest.findUnique({
          where: { id: finalShowRequestId },
          include: { 
            venue: { select: { submittedById: true } },
            artist: { select: { submittedById: true } }
          }
        });
        
        if (showRequest) {
          recipientId = showRequest.venue?.submittedById === authResult.user!.id
            ? (showRequest.artist?.submittedById || '')
            : (showRequest.venue?.submittedById || '');
          showDate = showRequest.requestedDate 
            ? new Date(showRequest.requestedDate).toLocaleDateString() 
            : '';
        }
      }

      // Create the notification if we found a recipient
      if (recipientId && recipientId !== authResult.user!.id) {
        await ActivityNotificationService.notifyHoldRequest(
          holdId,
          requesterName,
          recipientId,
          showDate
        );
        console.log('📢 Activity notification created for hold request:', holdId);
      }
    } catch (error) {
      console.error('📢 Error creating hold request notification:', error);
      // Don't fail the whole request if notification fails
    }

    console.log('🔒 HoldRequest API: Returning created hold:', holdData);
    return NextResponse.json(holdData, { status: 201 });

  } catch (error) {
    console.error('🔒 HoldRequest API: Error creating hold request:', error);
    console.error('🔒 HoldRequest API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/hold-requests - Get hold requests for the current user
export async function GET(request: NextRequest) {
  try {
    console.log('🔒 HoldRequest API: GET request received');
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      console.log('🔒 HoldRequest API: Authentication failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showId = searchParams.get('showId');
    const showRequestId = searchParams.get('showRequestId');
    const status = searchParams.get('status');
    const targetVenueId = searchParams.get('targetVenueId'); // NEW: For venue notifications
    
    // Parse venue offer IDs from the timeline format for GET requests too
    let venueOfferId = null;
    let actualShowRequestId = showRequestId;
    
    if (showRequestId && showRequestId.startsWith('venue-offer-')) {
      venueOfferId = showRequestId.replace('venue-offer-', '');
      actualShowRequestId = null;
    }
    
    console.log('🔒 HoldRequest API: Query params:', { showId, showRequestId, venueOfferId, actualShowRequestId, status, targetVenueId });

    // Build the query with proper parameter substitution using correct table name
    let query = `
      SELECT DISTINCT hr.*, 
             u1.username as requester_name,
             u2.username as responder_name,
             s.title as show_title,
             s.date as show_date,
             sr.title as show_request_title,
             sr."requestedDate" as show_request_date,
             vo.title as venue_offer_title,
             vo."proposedDate" as venue_offer_date,
             a.name as artist_name
      FROM "hold_requests" hr
      LEFT JOIN "User" u1 ON hr."requestedById" = u1.id
      LEFT JOIN "User" u2 ON hr."respondedById" = u2.id
      LEFT JOIN shows s ON hr."showId" = s.id
      LEFT JOIN venues v ON s."venueId" = v.id
      LEFT JOIN "show_requests" sr ON hr."showRequestId" = sr.id
      LEFT JOIN venues srv ON sr."venueId" = srv.id
      LEFT JOIN artists a ON sr."artistId" = a.id
      LEFT JOIN "venue_offers" vo ON hr."venueOfferId" = vo.id
      LEFT JOIN venues vov ON vo."venueId" = vov.id
      -- 🎯 FIXED: For targetVenueId, also check bids on artist-initiated requests (with DISTINCT to avoid duplicates)
      ${targetVenueId ? 
        `LEFT JOIN "show_request_bids" srb ON hr."showRequestId" = srb."showRequestId" AND srb."venueId" = $1` : 
        ''
      }
      -- 🚀 AUTO-HOLD FIX: Include bids for general permission checking too
      LEFT JOIN "show_request_bids" srb_general ON hr."showRequestId" = srb_general."showRequestId"
      LEFT JOIN venues bid_venue ON srb_general."venueId" = bid_venue.id
      WHERE (${targetVenueId ? 
        // FIXED: If targeting specific venue, find holds where that venue is the target
        // DISTINCT ensures no duplicates from multiple bids
        `(srv.id = $1 OR v.id = $1 OR vov.id = $1 OR srb."venueId" = $1)` :
        // EXISTING: General user permission check
        `hr."requestedById" = $1 OR 
        hr."respondedById" = $1 OR
        s."createdById" = $1 OR
        v."submittedById" = $1 OR
        sr."artistId" = $1 OR
        srv."submittedById" = $1 OR
        vo."artistId" = $1 OR
        vo."createdById" = $1 OR
        bid_venue."submittedById" = $1`
      })
    `;

    const params = [targetVenueId || authResult.user!.id];

    if (showId) {
      query += ` AND hr."showId" = $${params.length + 1}`;
      params.push(showId);
    }

    if (actualShowRequestId) {
      query += ` AND hr."showRequestId" = $${params.length + 1}`;
      params.push(actualShowRequestId);
    }

    if (venueOfferId) {
      // 🎯 NEW: For venue offers, check both venueOfferId and showRequestId fields 
      // because venue offers might be stored as either (old vs new system)
      query += ` AND (hr."venueOfferId" = $${params.length + 1} OR hr."showRequestId" = $${params.length + 1})`;
      params.push(venueOfferId);
    }

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      // ✅ ROBUST: Cast enum column to text for comparison
      const statusPlaceholders = statuses.map((_, index) => `$${params.length + index + 1}`).join(',');
      query += ` AND hr.status::text IN (${statusPlaceholders})`;
      params.push(...statuses);
    }

    query += ` ORDER BY hr."createdAt" DESC`;

    console.log('🔒 HoldRequest API: Executing query with params:', { query: query.substring(0, 200) + '...', paramsLength: params.length });
    
    const holdRequests = await prisma.$queryRawUnsafe(query, ...params) as any[];

    console.log('🔒 HoldRequest API: Found', holdRequests.length, 'hold requests');
    return NextResponse.json(holdRequests);

  } catch (error) {
    console.error('🔒 HoldRequest API: Error fetching hold requests:', error);
    console.error('🔒 HoldRequest API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
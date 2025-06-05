import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';

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
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
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

    // Validation: Exactly one document type must be specified
    if ((!showId && !showRequestId) || (showId && showRequestId)) {
      return NextResponse.json(
        { error: 'Must specify exactly one of showId or showRequestId' },
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

    if (showId) {
      const show = await prisma.show.findUnique({
        where: { id: showId },
        include: { venue: true }
      });

      if (!show) {
        return NextResponse.json({ error: 'Show not found' }, { status: 404 });
      }

      // User can request hold if they're the artist or venue owner
      canRequestHold = show.artistId === authResult.user!.id || 
                      show.venue?.submittedById === authResult.user!.id;
    }

    if (showRequestId) {
      const showRequest = await prisma.showRequest.findUnique({
        where: { id: showRequestId },
        include: { venue: true }
      });

      if (!showRequest) {
        return NextResponse.json({ error: 'Show request not found' }, { status: 404 });
      }

      // User can request hold if they're the artist or venue owner
      canRequestHold = showRequest.artistId === authResult.user!.id || 
                      (showRequest.venue?.submittedById === authResult.user!.id);
    }

    if (!canRequestHold) {
      return NextResponse.json(
        { error: 'You can only request holds on your own shows or requests' },
        { status: 403 }
      );
    }

    // Check for existing active hold using raw query
    const existingHolds = await prisma.$queryRaw`
      SELECT id FROM "hold_requests" 
      WHERE (
        ${showId ? `"showId" = ${showId}` : 'FALSE'} OR 
        ${showRequestId ? `"showRequestId" = ${showRequestId}` : 'FALSE'}
      )
      AND status IN ('PENDING', 'ACTIVE')
    ` as any[];

    if (existingHolds.length > 0) {
      return NextResponse.json(
        { error: 'An active hold already exists for this document' },
        { status: 409 }
      );
    }

    // Create the hold request using raw query
    const holdId = crypto.randomUUID();
    const now = new Date();

    await prisma.$executeRaw`
      INSERT INTO "hold_requests" (
        id, 
        "showId", 
        "showRequestId", 
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
        ${showId || null},
        ${showRequestId || null},
        ${authResult.user!.id},
        ${duration},
        ${reason},
        ${customMessage || null},
        'PENDING'::hold_status,
        ${now},
        ${now},
        ${now}
      )
    `;

    // Fetch the created hold request with related data
    const createdHold = await prisma.$queryRaw`
      SELECT hr.*, 
             u.username as requester_name,
             s.title as show_title,
             s.date as show_date,
             sr.title as show_request_title,
             sr."requestedDate" as show_request_date
      FROM "hold_requests" hr
      LEFT JOIN users u ON hr."requestedById" = u.id
      LEFT JOIN shows s ON hr."showId" = s.id
      LEFT JOIN "show_requests" sr ON hr."showRequestId" = sr.id
      WHERE hr.id = ${holdId}
    ` as any[];

    return NextResponse.json(createdHold[0], { status: 201 });

  } catch (error) {
    console.error('Error creating hold request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    
    console.log('🔒 HoldRequest API: Query params:', { showId, showRequestId, status });

    // Build the query with proper parameter substitution
    let query = `
      SELECT hr.*, 
             u1.username as requester_name,
             u2.username as responder_name,
             s.title as show_title,
             s.date as show_date,
             sr.title as show_request_title,
             sr."requestedDate" as show_request_date
      FROM "hold_requests" hr
      LEFT JOIN users u1 ON hr."requestedById" = u1.id
      LEFT JOIN users u2 ON hr."respondedById" = u2.id
      LEFT JOIN shows s ON hr."showId" = s.id
      LEFT JOIN venues v ON s."venueId" = v.id
      LEFT JOIN "show_requests" sr ON hr."showRequestId" = sr.id
      LEFT JOIN venues srv ON sr."venueId" = srv.id
      WHERE (
        hr."requestedById" = $1 OR 
        hr."respondedById" = $1 OR
        s."artistId" = $1 OR
        v."submittedById" = $1 OR
        sr."artistId" = $1 OR
        srv."submittedById" = $1
      )
    `;

    const params = [authResult.user!.id];

    if (showId) {
      query += ` AND hr."showId" = $${params.length + 1}`;
      params.push(showId);
    }

    if (showRequestId) {
      query += ` AND hr."showRequestId" = $${params.length + 1}`;
      params.push(showRequestId);
    }

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      const statusPlaceholders = statuses.map((_, index) => `$${params.length + index + 1}`).join(',');
      query += ` AND hr.status IN (${statusPlaceholders})`;
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
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../../lib/prisma';

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

// PUT /api/hold-requests/[id] - Respond to a hold request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { action, message } = await request.json();
    const { id: holdId } = await params;

    // Validate action
    if (!['approve', 'decline', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be approve, decline, or cancel' },
        { status: 400 }
      );
    }

    // Get the hold request (using raw query until Prisma types are updated)
    const holdRequest = await prisma.$queryRaw`
      SELECT * FROM "hold_requests" WHERE id = ${holdId}
    ` as any[];

    if (!holdRequest || holdRequest.length === 0) {
      return NextResponse.json({ error: 'Hold request not found' }, { status: 404 });
    }

    const hold = holdRequest[0];

    // Check permissions
    let canRespond = false;
    
    // 🧪 TESTING: Allow debug user to operate on any hold for testing
    if (authResult.user!.id === 'debug-lidz-bierenday') {
      canRespond = true;
      console.log('🧪 Debug user access granted for hold management');
    }
    
    if (hold.showId) {
      const show = await prisma.show.findUnique({
        where: { id: hold.showId },
        include: { venue: true }
      });
      canRespond = show?.artistId === authResult.user!.id || 
                   show?.venue?.submittedById === authResult.user!.id;
    }

    if (hold.showRequestId) {
      const showRequest = await prisma.showRequest.findUnique({
        where: { id: hold.showRequestId },
        include: { venue: true }
      });
      canRespond = showRequest?.artistId === authResult.user!.id || 
                   showRequest?.venue?.submittedById === authResult.user!.id;
    }

    // Can't respond to your own hold request (unless debug user testing)
    if (hold.requestedById === authResult.user!.id && authResult.user!.id !== 'debug-lidz-bierenday') {
      canRespond = action === 'cancel';
    }

    if (!canRespond) {
      return NextResponse.json(
        { error: 'You can only respond to hold requests on your documents' },
        { status: 403 }
      );
    }

    // Update the hold request
    let newStatus: string;
    let updateData: any = {
      respondedById: authResult.user!.id,
      respondedAt: new Date(),
      updatedAt: new Date()
    };

    switch (action) {
      case 'approve':
        newStatus = 'ACTIVE';
        const now = new Date();
        const expiresAt = new Date(now.getTime() + hold.duration * 60 * 60 * 1000);
        updateData.status = newStatus;
        updateData.startsAt = now;
        updateData.expiresAt = expiresAt;
        break;
      case 'decline':
        newStatus = 'DECLINED';
        updateData.status = newStatus;
        break;
      case 'cancel':
        newStatus = 'CANCELLED';
        updateData.status = newStatus;
        updateData.respondedById = hold.requestedById; // Cancelled by requester
        break;
      default:
        newStatus = 'PENDING';
        break;
    }

    // Use raw query to update until Prisma types are ready
    await prisma.$executeRaw`
      UPDATE "hold_requests" 
      SET 
        status = CAST(${newStatus} AS "HoldStatus"),
        "respondedById" = ${updateData.respondedById},
        "respondedAt" = ${updateData.respondedAt},
        "startsAt" = ${updateData.startsAt || null},
        "expiresAt" = ${updateData.expiresAt || null},
        "updatedAt" = ${updateData.updatedAt}
      WHERE id = ${holdId}
    `;

    // Get updated hold request
    const updatedHold = await prisma.$queryRaw`
      SELECT hr.*, 
             u1.username as requester_name,
             u2.username as responder_name
      FROM "hold_requests" hr
      LEFT JOIN "User" u1 ON hr."requestedById" = u1.id
      LEFT JOIN "User" u2 ON hr."respondedById" = u2.id
      WHERE hr.id = ${holdId}
    ` as any[];

    return NextResponse.json(updatedHold[0]);

  } catch (error) {
    console.error('Error updating hold request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/hold-requests/[id] - Get a specific hold request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { id: holdId } = await params;

    // Get hold request with related data
    const holdRequest = await prisma.$queryRaw`
      SELECT hr.*, 
             u1.username as requester_name,
             u2.username as responder_name,
             s.title as show_title,
             s.date as show_date,
             sr.title as show_request_title,
             sr."requestedDate" as show_request_date
      FROM "hold_requests" hr
      LEFT JOIN "User" u1 ON hr."requestedById" = u1.id
      LEFT JOIN "User" u2 ON hr."respondedById" = u2.id
      LEFT JOIN shows s ON hr."showId" = s.id
      LEFT JOIN "show_requests" sr ON hr."showRequestId" = sr.id
      WHERE hr.id = ${holdId}
    ` as any[];

    if (!holdRequest || holdRequest.length === 0) {
      return NextResponse.json({ error: 'Hold request not found' }, { status: 404 });
    }

    const hold = holdRequest[0];

    // Check if user has permission to view this hold
    let canView = false;
    
    // 🧪 TESTING: Allow debug user to view any hold
    if (authResult.user!.id === 'debug-lidz-bierenday') {
      canView = true;
    } else if (hold.requestedById === authResult.user!.id || hold.respondedById === authResult.user!.id) {
      canView = true;
    }

    // Also check if user is involved in the document (skip for debug user)
    if (!canView && authResult.user!.id !== 'debug-lidz-bierenday') {
      if (hold.showId) {
        const show = await prisma.show.findUnique({
          where: { id: hold.showId },
          include: { venue: true }
        });
        canView = canView || show?.artistId === authResult.user!.id || 
                  show?.venue?.submittedById === authResult.user!.id;
      }

      if (hold.showRequestId) {
        const showRequest = await prisma.showRequest.findUnique({
          where: { id: hold.showRequestId },
          include: { venue: true }
        });
        canView = canView || showRequest?.artistId === authResult.user!.id || 
                  showRequest?.venue?.submittedById === authResult.user!.id;
      }
    }

    if (!canView) {
      return NextResponse.json(
        { error: 'You can only view hold requests you are involved in' },
        { status: 403 }
      );
    }

    return NextResponse.json(hold);

  } catch (error) {
    console.error('Error fetching hold request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
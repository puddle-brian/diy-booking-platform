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
    if (authResult.user!.id.startsWith('debug-')) {
      canRespond = true;
      console.log('🧪 Debug user access granted for hold management:', authResult.user!.id);
    } else {
      // Regular permission checks (only if not debug user)
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

      // Can't respond to your own hold request (only allow cancel)
      if (hold.requestedById === authResult.user!.id) {
        canRespond = action === 'cancel';
      }
    }

    if (!canRespond) {
      return NextResponse.json(
        { error: 'You can only respond to hold requests on your documents' },
        { status: 403 }
      );
    }

    // Update the hold request and bid states in a transaction
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

    // Execute the update in a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // 1. Update the hold request
      await tx.$executeRaw`
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

      // 2. If approving, update bid states
      if (action === 'approve' && hold.showRequestId) {
        console.log('🔒 Hold approved - updating bid states for show request:', hold.showRequestId);
        
        // Find the bid from the requester (the one that should be held)
        // The requester is the artist, so find their venue's bid
        const requesterBid = await tx.showRequestBid.findFirst({
          where: {
            showRequestId: hold.showRequestId,
            // For artist-initiated requests, we need to find which venue the artist wants to hold
            // This is tricky - we need to determine which venue the hold is for
            // For now, let's find the venue that the requesting user has access to
          },
          include: {
            venue: true,
            bidder: true
          }
        });

        // Actually, let's find the venue that the responding user (venue owner) owns
        const venueOwnedByResponder = await tx.venue.findFirst({
          where: {
            submittedById: authResult.user!.id
          }
        });

        if (venueOwnedByResponder) {
          // Find the bid from this venue
          const targetBid = await tx.showRequestBid.findFirst({
            where: {
              showRequestId: hold.showRequestId,
              venueId: venueOwnedByResponder.id
            }
          });

          if (targetBid) {
            console.log('🔒 Setting bid to HELD state:', targetBid.id, 'for venue:', venueOwnedByResponder.name);
            
            // Set this bid to HELD
            await tx.showRequestBid.update({
              where: { id: targetBid.id },
              data: {
                holdState: 'HELD',
                frozenByHoldId: holdId,
                frozenAt: new Date()
              }
            });

            // Freeze all competing bids
            const frozenResult = await tx.showRequestBid.updateMany({
              where: {
                showRequestId: hold.showRequestId,
                id: { not: targetBid.id }, // Don't freeze the held bid
                status: { 
                  notIn: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'] // Don't freeze already decided bids
                }
              },
              data: {
                holdState: 'FROZEN',
                frozenByHoldId: holdId,
                frozenAt: new Date()
              }
            });

            console.log(`✅ Hold activated: ${venueOwnedByResponder.name} bid HELD, ${frozenResult.count} competing bids FROZEN`);
          } else {
            console.log('⚠️ No bid found for responding venue:', venueOwnedByResponder.name);
          }
        } else {
          console.log('⚠️ No venue found for responding user:', authResult.user!.id);
        }
      }

      // 3. If declining or cancelling, unfreeze any frozen bids
      if ((action === 'decline' || action === 'cancel') && hold.showRequestId) {
        console.log('🔓 Hold declined/cancelled - unfreezing bids for show request:', hold.showRequestId);
        
        const unfrozenResult = await tx.showRequestBid.updateMany({
          where: {
            showRequestId: hold.showRequestId,
            frozenByHoldId: holdId
          },
          data: {
            holdState: 'AVAILABLE',
            frozenByHoldId: null,
            frozenAt: null,
            unfrozenAt: new Date()
          }
        });

        console.log(`✅ Unfroze ${unfrozenResult.count} bids`);
      }
    });

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
    
    // TEMPORARY: Debug user can always view holds
    if (authResult.user!.id.startsWith('debug-')) {
      console.log('🔒 HoldRequest API: Debug user access granted for view:', authResult.user!.id);
      canView = true;
    } else if (hold.requestedById === authResult.user!.id || hold.respondedById === authResult.user!.id) {
      canView = true;
    }

    // Also check if user is involved in the document (skip for debug users)
    if (!canView && !authResult.user!.id.startsWith('debug-')) {
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
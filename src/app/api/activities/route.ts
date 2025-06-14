import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'book-yr-life-secret-key-change-in-production';

// Helper function to authenticate user (copied from hold-requests/route.ts)
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

// GET /api/activities - Fetch activity notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');
    const venueId = searchParams.get('venueId');

    console.log('🎯 Activities API: Fetching for user:', authResult.user!.id, { limit, unreadOnly, type, venueId });
        console.log('🎯 Activities API: User details:', {
      userId: authResult.user!.id, 
      username: authResult.user!.username,
      name: undefined
    });

    // Build the where clause
    const where: any = {
      userId: authResult.user!.id,
      // Filter out expired notifications
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type) {
      where.type = type;
    }

    // If venueId is provided, filter activities related to that venue
    // This is tricky since we need to check metadata for venue-related activities
    if (venueId) {
      // For now, just include all activities for the user when venueId is specified
      // TODO: Implement proper venue-specific filtering
      console.log('🎯 Activities API: VenueId specified, including all user activities for now');
    }

    console.log('🎯 Activities API: Final query where clause:', JSON.stringify(where, null, 2));

    // Fetch activity notifications from database
    const activities = await prisma.activityNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        // Don't include user relation to avoid circular reference
      }
    });

    console.log(`🎯 Activities API: Found ${activities.length} activities`);

    // Transform the data to match our ActivityItem interface
    const activityItems = activities.map((activity: any) => ({
      id: activity.id,
      type: activity.type.toLowerCase().replace('_', '_'), // Convert enum to string
      title: activity.title,
      summary: activity.summary,
      fullContent: activity.fullContent,
      actionText: getActionTextForType(activity.type),
      actionUrl: activity.actionUrl,
      timestamp: activity.createdAt.toISOString(),
      isRead: activity.isRead,
      metadata: activity.metadata || {}
    }));

    console.log('🎯 Activities API: Returning activity items:', activityItems.map(a => ({ id: a.id, type: a.type, summary: a.summary })));

    return NextResponse.json(activityItems);

  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// POST /api/activities - Create a new activity notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      type,
      title,
      summary,
      fullContent,
      entityType,
      entityId,
      actionUrl,
      metadata,
      expiresAt
    } = body;

    // Create the activity notification
    const activity = await prisma.activityNotification.create({
      data: {
        userId,
        type: type as any, // Cast to ActivityType enum
        title,
        summary,
        fullContent,
        entityType: entityType as any,
        entityId,
        actionUrl,
        metadata,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    return NextResponse.json(activity, { status: 201 });

  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}

// Helper function to determine action text based on activity type
function getActionTextForType(type: string): string {
  switch (type) {
    case 'HOLD_REQUEST':
      return 'Approve/Decline';
    case 'MESSAGE':
      return 'Read Message';
    case 'BID_UPDATE':
    case 'BID_RECEIVED':
      return 'View Show';
    case 'SHOW_EDIT':
      return 'Review Changes';
    case 'SHOW_CONFIRMED':
      return 'View Show';
    case 'SHOW_REQUEST':
      return 'View Request';
    case 'TOUR_REQUEST':
      return 'View Applications';
    case 'MEMBER_INVITE':
      return 'Accept/Decline';
    case 'REVIEW_RECEIVED':
      return 'View Review';
    case 'VENUE_OFFER':
      return 'View Offer';
    default:
      return 'View';
  }
} 
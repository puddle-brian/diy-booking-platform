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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const venueId = searchParams.get('venueId');
    
    console.log('🎯 Activities API: Fetching activities', { limit, venueId });
    
    // Try to authenticate user, but fall back to empty array if no auth (for now)
    const authResult = await authenticateUser(request);
    
    let activities: any[] = [];
    
    if (authResult.success && authResult.user) {
      console.log(`🎯 Activities API: Fetching for user ${authResult.user.id}`);
      
      // Fetch real activity notifications from database
      const dbActivities = await prisma.activityNotification.findMany({
        where: {
          userId: authResult.user.id,
          // Only show non-expired notifications
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      console.log(`🎯 Activities API: Found ${dbActivities.length} notifications in database`);

      // Transform database activities to ActivityFeed format
      activities = dbActivities.map(activity => ({
        id: activity.id,
        type: activity.type.toLowerCase().replace('_', '-'), // Convert HOLD_REQUEST to hold-request
        title: activity.title,
        summary: activity.summary,
        fullContent: activity.fullContent,
        actionText: getActionTextForType(activity.type),
        actionUrl: activity.actionUrl,
        timestamp: activity.createdAt.toISOString(),
        isRead: activity.isRead,
        metadata: activity.metadata || {}
      }));

      console.log(`🎯 Activities API: Transformed ${activities.length} activities`);
    } else {
      console.log('🎯 Activities API: No authentication, returning empty activities');
    }
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error('🎯 Activities API: Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
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

    console.log('🎯 Activities API: Creating activity notification', { type, title, userId });

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

    console.log('✅ Activities API: Created activity notification', activity.id);

    return NextResponse.json(activity, { status: 201 });

  } catch (error) {
    console.error('❌ Activities API: Error creating activity:', error);
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
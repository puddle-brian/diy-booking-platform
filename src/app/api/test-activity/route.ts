import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';
import { ActivityNotificationService } from '../../../services/ActivityNotificationService';

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

// POST /api/test-activity - Create test activity notifications
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user!.id;

    console.log('🧪 Creating simple test notification to verify Prisma client...');

    // Create a simple test notification first
    try {
      await ActivityNotificationService.createNotification({
        userId,
        type: 'BID_UPDATE',
        title: 'Test Notification',
        summary: 'Testing if notifications work after Prisma regeneration',
        entityType: 'BID',
        entityId: 'test-123',
        actionUrl: '/test',
        metadata: { test: true }
      });
      console.log('✅ Simple test notification created successfully!');
    } catch (error) {
      console.error('❌ Simple test notification failed:', error);
            return NextResponse.json({ 
        error: 'Notification creation still failing',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

    // Create various test notifications
    const testNotifications = [
      // 1. Incoming hold request
      {
        userId,
        type: 'HOLD_REQUEST',
        title: 'Hold Request',
        summary: 'Fugazi requested a 12-hour hold for "June 15 - Chicago" show',
        fullContent: 'Fugazi has requested a 12-hour hold on your show request for June 15 in Chicago. They need time to coordinate with their booking team before committing.',
        entityType: 'HOLD_REQUEST',
        entityId: 'test-hold-123',
        actionUrl: '/itinerary#hold-test-hold-123',
        metadata: {
          artistName: 'Fugazi',
          showDate: 'June 15, 2024',
          duration: 12,
          reason: 'Need to coordinate with booking team'
        }
      },
      // 2. Incoming message
      {
        userId,
        type: 'MESSAGE',
        title: 'New Message',
        summary: 'Black Flag sent a message about the July 4th show',
        fullContent: 'Hey! Just wanted to confirm - can you provide backline for our July 4th show? We\'re traveling light on this tour. Thanks!',
        entityType: 'MESSAGE',
        entityId: 'test-msg-456',
        actionUrl: '/messages/test-msg-456',
        metadata: {
          artistName: 'Black Flag',
          showDate: 'July 4, 2024',
          senderName: 'Henry Rollins'
        }
      },
      // 3. New bid received (incoming for venue owner)
      {
        userId,
        type: 'BID_RECEIVED',
        title: 'New Bid',
        summary: 'Minor Threat submitted a bid for your Aug 12 show',
        entityType: 'BID',
        entityId: 'test-bid-789',
        actionUrl: '/itinerary#bid-test-bid-789',
        metadata: {
          artistName: 'Minor Threat',
          showDate: 'August 12, 2024',
          bidAmount: '$350'
        }
      },
      // 4. USEFUL self-activity: Show confirmation (good record)
      {
        userId,
        type: 'SHOW_CONFIRMED',
        title: 'Show Confirmed',
        summary: 'You confirmed show with Dead Kennedys for Sept 3',
        entityType: 'SHOW',
        entityId: 'test-show-101',
        actionUrl: '/shows/test-show-101',
        metadata: {
          partnerName: 'Dead Kennedys',
          showDate: 'September 3, 2024',
          actionType: 'self_confirmation'
        }
      },
      // 5. USEFUL self-activity: Bid accepted (good record for venue)
      {
        userId,
        type: 'BID_UPDATE',
        title: 'Bid Accepted',
        summary: 'You accepted Bad Brains\' bid for Oct 15',
        entityType: 'BID',
        entityId: 'test-bid-202',
        actionUrl: '/itinerary#bid-test-bid-202',
        metadata: {
          artistName: 'Bad Brains',
          showDate: 'October 15, 2024',
          actionType: 'self_confirmation'
        }
      },
      // 6. Show document updated
      {
        userId,
        type: 'SHOW_EDIT',
        title: 'Show Updated',
        summary: 'X updated details for the Nov 20 show',
        entityType: 'SHOW',
        entityId: 'test-show-303',
        actionUrl: '/shows/test-show-303',
        metadata: {
          updatedBy: 'X',
          showDate: 'November 20, 2024',
          changes: ['door time', 'load-in instructions']
        }
      }
    ];

    // Create all test notifications
    for (const notification of testNotifications) {
      await ActivityNotificationService.createNotification(notification);
    }

    return NextResponse.json({ 
      message: 'Created comprehensive test notifications including selective self-activity',
      count: testNotifications.length 
    });

  } catch (error) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json({ error: 'Failed to create test notifications' }, { status: 500 });
  }
}

// GET /api/test-activity - Debug: Show all activities in database
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    console.log('🧪 DEBUG: Fetching all activities from database...');

    // Get all activities for this user
    const allActivities = await prisma.activityNotification.findMany({
      where: {
        userId: authResult.user!.id
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`🧪 DEBUG: Found ${allActivities.length} total activities in database`);
    
    const debugInfo = allActivities.map(activity => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      summary: activity.summary,
      createdAt: activity.createdAt,
      isRead: activity.isRead,
      expiresAt: activity.expiresAt,
      metadata: activity.metadata
    }));

    return NextResponse.json({
      totalCount: allActivities.length,
      activities: debugInfo
    });

  } catch (error) {
    console.error('🧪 DEBUG: Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug activities' },
      { status: 500 }
    );
  }
} 
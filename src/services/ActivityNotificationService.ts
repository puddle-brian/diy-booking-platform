import { prisma } from '../../lib/prisma';

interface CreateNotificationData {
  userId: string;
  type: string; // Will be ActivityType enum value
  title: string;
  summary: string;
  fullContent?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: any;
  expiresAt?: Date;
}

export class ActivityNotificationService {
  
  /**
   * Create a new activity notification
   */
  static async createNotification(data: CreateNotificationData): Promise<void> {
    try {
      await prisma.activityNotification.create({
        data: {
          userId: data.userId,
          type: data.type as any, // Cast to ActivityType enum
          title: data.title,
          summary: data.summary,
          fullContent: data.fullContent,
          entityType: data.entityType as any,
          entityId: data.entityId,
          actionUrl: data.actionUrl,
          metadata: data.metadata,
          expiresAt: data.expiresAt
        }
      });

      console.log('📢 Activity notification created:', data.title);
    } catch (error) {
      console.error('Error creating activity notification:', error);
    }
  }

  /**
   * Notify about a new hold request
   */
  static async notifyHoldRequest(holdRequestId: string, requesterName: string, responderId: string, showDate?: string): Promise<void> {
    await this.createNotification({
      userId: responderId,
      type: 'HOLD_REQUEST',
      title: 'Hold Request',
      summary: `${requesterName} wants to hold ${showDate ? `your ${showDate} date` : 'a date'} for negotiation`,
      entityType: 'HOLD_REQUEST',
      entityId: holdRequestId,
      actionUrl: `/itinerary#hold-${holdRequestId}`,
      metadata: { requesterName, showDate },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }

  /**
   * Notify about a bid status change
   */
  static async notifyBidUpdate(bidId: string, artistName: string, venueOwnerId: string, status: string, showDate?: string): Promise<void> {
    const statusMap: Record<string, string> = {
      'accepted': 'accepted your offer',
      'declined': 'declined your offer',
      'cancelled': 'cancelled their bid'
    };

    await this.createNotification({
      userId: venueOwnerId,
      type: 'BID_UPDATE',
      title: 'Bid Update',
      summary: `${artistName} ${statusMap[status] || `updated their bid status to ${status}`}${showDate ? ` for ${showDate}` : ''}`,
      entityType: 'BID',
      entityId: bidId,
      actionUrl: `/itinerary#bid-${bidId}`,
      metadata: { artistName, status, showDate }
    });
  }

  /**
   * Notify about a new message in show document
   */
  static async notifyShowMessage(messageId: string, senderName: string, recipientId: string, preview: string, showId: string): Promise<void> {
    await this.createNotification({
      userId: recipientId,
      type: 'MESSAGE',
      title: 'New Message',
      summary: `${senderName} about show: ${preview.substring(0, 60)}...`,
      fullContent: preview,
      entityType: 'SHOW',
      entityId: showId,
      actionUrl: `/shows/${showId}#messages`,
      metadata: { senderName, messageId }
    });
  }

  /**
   * Notify about show document edits
   */
  static async notifyShowEdit(showId: string, editorName: string, recipientId: string, changes: string): Promise<void> {
    await this.createNotification({
      userId: recipientId,
      type: 'SHOW_EDIT',
      title: 'Show Document Updated',
      summary: `${editorName} updated ${changes}`,
      entityType: 'SHOW',
      entityId: showId,
      actionUrl: `/shows/${showId}#changes`,
      metadata: { editorName, changes }
    });
  }

  /**
   * Notify about new tour request applications
   */
  static async notifyTourRequest(tourRequestId: string, artistName: string, venueOwnerId: string, dates: string): Promise<void> {
    await this.createNotification({
      userId: venueOwnerId,
      type: 'TOUR_REQUEST',
      title: 'Tour Request',
      summary: `${artistName} applied for ${dates} dates`,
      entityType: 'TOUR_REQUEST',
      entityId: tourRequestId,
      actionUrl: `/tour-requests/${tourRequestId}`,
      metadata: { artistName, dates }
    });
  }

  /**
   * Notify about venue offers
   */
  static async notifyVenueOffer(offerId: string, venueName: string, artistId: string, showDate: string): Promise<void> {
    await this.createNotification({
      userId: artistId,
      type: 'VENUE_OFFER',
      title: 'Venue Offer',
      summary: `${venueName} wants to book you for ${showDate}`,
      entityType: 'VENUE_OFFER',
      entityId: offerId,
      actionUrl: `/itinerary#offer-${offerId}`,
      metadata: { venueName, showDate }
    });
  }

  /**
   * Notify about new bid received (for venue owners)
   */
  static async notifyBidReceived(bidId: string, artistName: string, venueOwnerId: string, showDate?: string): Promise<void> {
    await this.createNotification({
      userId: venueOwnerId,
      type: 'BID_RECEIVED',
      title: 'New Bid',
      summary: `${artistName} submitted a bid${showDate ? ` for ${showDate}` : ''}`,
      entityType: 'BID',
      entityId: bidId,
      actionUrl: `/itinerary#bid-${bidId}`,
      metadata: { artistName, showDate }
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await prisma.activityNotification.update({
        where: { id: notificationId },
        data: { 
          isRead: true, 
          readAt: new Date() 
        }
      });

      console.log('📖 Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Notify when show is confirmed (useful self-activity record)
   */
  static async notifyShowConfirmed(showId: string, userId: string, partnerName: string, showDate: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'SHOW_CONFIRMED',
      title: 'Show Confirmed',
      summary: `You confirmed show with ${partnerName} for ${showDate}`,
      entityType: 'SHOW',
      entityId: showId,
      actionUrl: `/shows/${showId}`,
      metadata: { partnerName, showDate, actionType: 'self_confirmation' }
    });
  }

  /**
   * Notify when bid is accepted (useful record for venue)
   */
  static async notifyBidAcceptedByYou(bidId: string, venueOwnerId: string, artistName: string, showDate: string): Promise<void> {
    await this.createNotification({
      userId: venueOwnerId,
      type: 'BID_UPDATE',
      title: 'Bid Accepted',
      summary: `You accepted ${artistName}'s bid for ${showDate}`,
      entityType: 'BID',
      entityId: bidId,
      actionUrl: `/itinerary#bid-${bidId}`,
      metadata: { artistName, showDate, actionType: 'self_confirmation' }
    });
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      const result = await prisma.activityNotification.deleteMany({
        where: {
          expiresAt: {
            lte: new Date()
          }
        }
      });

      console.log(`🧹 Cleaned up ${result.count} expired notifications`);
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'book-yr-life-secret-key-change-in-production';

// Helper function to get user from request (JWT only)
async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('💬 API: Using JWT user:', decoded.userId);
    return { userId: decoded.userId, source: 'jwt' };
  } catch (error) {
    console.error('💬 API: JWT verification failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userAuth = await getUserFromRequest(request);
    if (!userAuth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('💬 API: Fetching conversations for user:', userAuth.userId, `(${userAuth.source})`);

    // Get conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userAuth.userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Format conversations for frontend
    const formattedConversations = await Promise.all(conversations.map(async conv => {
      const otherParticipant = conv.participants.find(p => p.userId !== userAuth.userId);
      const lastMessage = conv.messages[0];

      // Calculate unread messages for this conversation
      // TODO: Implement proper unread count when readAt field is working
      const unreadCount = 0; // Temporarily disabled due to Prisma type issues

      return {
        id: conv.id,
        recipientId: otherParticipant?.userId,
        recipientName: otherParticipant?.user.username,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          timestamp: lastMessage.createdAt,
          senderName: lastMessage.sender.username,
          isFromMe: lastMessage.senderId === userAuth.userId
        } : null,
        unreadCount: unreadCount,
        updatedAt: conv.updatedAt
      };
    }));

    return NextResponse.json(formattedConversations);

  } catch (error) {
    console.error('💬 API Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userAuth = await getUserFromRequest(request);
    if (!userAuth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { recipientId, recipientName, recipientType } = await request.json();

    console.log('💬 API: Creating conversation between', userAuth.userId, 'and', recipientId, `(${recipientType})`);

    // Resolve recipient ID to actual user ID
    let actualRecipientId = recipientId;
    
    if (recipientType === 'artist') {
      // Find the user who owns this artist
      const artist = await prisma.artist.findUnique({
        where: { id: recipientId },
        select: { submittedById: true }
      });
      
      if (!artist?.submittedById) {
        return NextResponse.json({ error: 'Artist owner not found' }, { status: 404 });
      }
      
      actualRecipientId = artist.submittedById;
      console.log('💬 API: Resolved artist owner:', actualRecipientId);
      
    } else if (recipientType === 'venue') {
      // Find the user who owns this venue
      const venue = await prisma.venue.findUnique({
        where: { id: recipientId },
        select: { submittedById: true }
      });
      
      if (!venue?.submittedById) {
        return NextResponse.json({ error: 'Venue owner not found' }, { status: 404 });
      }
      
      actualRecipientId = venue.submittedById;
      console.log('💬 API: Resolved venue owner:', actualRecipientId);
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: { userId: userAuth.userId }
            }
          },
          {
            participants: {
              some: { userId: actualRecipientId }
            }
          }
        ]
      }
    });

    if (!conversation) {
      // Create new conversation
      console.log('💬 API: Creating conversation participants with user IDs:', userAuth.userId, 'and', actualRecipientId);
      
      // Verify both users exist before creating conversation
      const [senderExists, recipientExists] = await Promise.all([
        prisma.user.findUnique({ where: { id: userAuth.userId }, select: { id: true, username: true } }),
        prisma.user.findUnique({ where: { id: actualRecipientId }, select: { id: true, username: true } })
      ]);
      
      if (!senderExists) {
        console.error('💬 API: Sender user not found:', userAuth.userId);
        return NextResponse.json({ error: 'Sender user not found' }, { status: 404 });
      }
      
      if (!recipientExists) {
        console.error('💬 API: Recipient user not found:', actualRecipientId);
        return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 });
      }
      
      console.log('💬 API: Both users verified - Sender:', senderExists, 'Recipient:', recipientExists);
      
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: userAuth.userId },
              { userId: actualRecipientId }
            ]
          }
        }
      });

      console.log('💬 API: Created new conversation:', conversation.id);
    } else {
      console.log('💬 API: Found existing conversation:', conversation.id);
    }

    return NextResponse.json({ conversationId: conversation.id });

  } catch (error) {
    console.error('💬 API Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'book-yr-life-secret-key-change-in-production';

// Helper function to get user from request (supports both JWT and debug users)
async function getUserFromRequest(request: NextRequest) {
  // First try JWT token from cookie
  const token = request.cookies.get('auth-token')?.value;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return { userId: decoded.userId, source: 'jwt' };
    } catch (error) {
      // JWT invalid, continue to check debug user
    }
  }

  // Check for debug user in request headers (sent from frontend)
  const debugUserHeader = request.headers.get('x-debug-user');
  if (debugUserHeader) {
    try {
      const debugUser = JSON.parse(debugUserHeader);
      console.log('💬 API: Using debug user:', debugUser.name);
      return { userId: debugUser.id, source: 'debug' };
    } catch (error) {
      console.error('Failed to parse debug user header:', error);
    }
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const userAuth = await getUserFromRequest(request);
    if (!userAuth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { threadId } = await params;
    
    console.log('💬 API: Fetching messages for conversation:', threadId, `(user: ${userAuth.userId})`);

    // Verify user is participant in this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: threadId,
        participants: {
          some: { userId: userAuth.userId }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Get messages for this conversation
    const messages = await prisma.message.findMany({
      where: { conversationId: threadId },
      include: {
        sender: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      threadId: msg.conversationId,
      senderId: msg.senderId,
      senderName: msg.sender.username,
      senderType: 'user' as const, // TODO: Determine actual type
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      read: true // TODO: Implement proper read status
    }));

    return NextResponse.json(formattedMessages);

  } catch (error) {
    console.error('💬 API Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const userAuth = await getUserFromRequest(request);
    if (!userAuth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { threadId } = await params;
    const { content, senderId, senderName, senderType } = await request.json();

    console.log('💬 API: Sending message to conversation:', threadId, `(from: ${userAuth.userId})`);

    // Verify user is participant in this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: threadId,
        participants: {
          some: { userId: userAuth.userId }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: threadId,
        senderId: userAuth.userId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: threadId },
      data: { updatedAt: new Date() }
    });

    // Format message for frontend
    const formattedMessage = {
      id: message.id,
      threadId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender.username,
      senderType: 'user' as const,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
      read: true
    };

    console.log('💬 API: Message sent successfully:', message.id);
    return NextResponse.json(formattedMessage);

  } catch (error) {
    console.error('💬 API Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
} 
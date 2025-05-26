import { NextRequest, NextResponse } from 'next/server';

interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderType: 'artist' | 'venue' | 'user';
  content: string;
  timestamp: string;
  read: boolean;
}

// Mock messages data
const mockMessages: Message[] = [
  {
    id: 'msg-1',
    threadId: 'conv-1',
    senderId: 'artist-1',
    senderName: 'The Midnight Echoes',
    senderType: 'artist',
    content: 'Hey, we\'d love to play at your venue!',
    timestamp: '2024-01-15T10:30:00Z',
    read: false
  },
  {
    id: 'msg-2',
    threadId: 'conv-1',
    senderId: 'user-1',
    senderName: 'John Venue Owner',
    senderType: 'user',
    content: 'That sounds great! What dates are you looking at?',
    timestamp: '2024-01-15T11:00:00Z',
    read: true
  },
  {
    id: 'msg-3',
    threadId: 'conv-2',
    senderId: 'venue-1',
    senderName: 'The Underground',
    senderType: 'venue',
    content: 'Thanks for your interest! Let\'s discuss dates.',
    timestamp: '2024-01-14T15:45:00Z',
    read: true
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    
    // Filter messages for this thread
    const threadMessages = mockMessages.filter(msg => msg.threadId === threadId);
    
    return NextResponse.json(threadMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const { content, senderId, senderName, senderType } = await request.json();

    if (!content || !senderId || !senderName || !senderType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new message
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      threadId,
      senderId,
      senderName,
      senderType,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Add to mock data
    mockMessages.push(newMessage);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 
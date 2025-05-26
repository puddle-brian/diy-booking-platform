import { NextRequest, NextResponse } from 'next/server';

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantType: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: string;
}

// Mock data for development
const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participantId: 'artist-1',
    participantName: 'The Midnight Echoes',
    participantType: 'artist',
    lastMessage: {
      content: 'Hey, we\'d love to play at your venue!',
      timestamp: '2024-01-15T10:30:00Z',
      senderId: 'artist-1'
    },
    unreadCount: 2,
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'conv-2',
    participantId: 'venue-1',
    participantName: 'The Underground',
    participantType: 'venue',
    lastMessage: {
      content: 'Thanks for your interest! Let\'s discuss dates.',
      timestamp: '2024-01-14T15:45:00Z',
      senderId: 'venue-1'
    },
    unreadCount: 0,
    updatedAt: '2024-01-14T15:45:00Z'
  }
];

const mockMessages = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'artist-1',
    senderName: 'The Midnight Echoes',
    senderType: 'artist',
    content: 'Hey, we\'d love to play at your venue!',
    timestamp: '2024-01-15T10:30:00Z',
    read: false
  },
  {
    id: 'msg-2',
    conversationId: 'conv-2',
    senderId: 'venue-1',
    senderName: 'The Underground',
    senderType: 'venue',
    content: 'Thanks for your interest! Let\'s discuss dates.',
    timestamp: '2024-01-14T15:45:00Z',
    read: true
  }
];

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get the user ID from authentication
    // For now, return mock conversations
    return NextResponse.json(mockConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recipientId, recipientName, recipientType } = await request.json();

    if (!recipientId || !recipientName || !recipientType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existingConversation = mockConversations.find(
      conv => conv.participantId === recipientId
    );

    if (existingConversation) {
      return NextResponse.json({ conversationId: existingConversation.id });
    }

    // Create new conversation
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      participantId: recipientId,
      participantName: recipientName,
      participantType: recipientType,
      unreadCount: 0,
      updatedAt: new Date().toISOString()
    };

    mockConversations.push(newConversation);

    return NextResponse.json({ conversationId: newConversation.id });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
} 
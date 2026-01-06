import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

/**
 * Agent Conversation API
 * 
 * Persistent conversation history per artist/venue.
 * GET: Load conversation history
 * POST: Save new message to history
 * DELETE: Clear conversation history
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// GET: Load conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const venueId = searchParams.get('venueId');

    if (!artistId && !venueId) {
      return NextResponse.json({ error: 'Must specify artistId or venueId' }, { status: 400 });
    }

    const conversation = await prisma.agentConversation.findFirst({
      where: artistId ? { artistId } : { venueId },
    });

    if (!conversation) {
      return NextResponse.json({ messages: [], isNew: true });
    }

    const messages = conversation.messages as Message[];
    
    return NextResponse.json({ 
      messages,
      conversationId: conversation.id,
      updatedAt: conversation.updatedAt,
    });

  } catch (error) {
    console.error('Error loading conversation:', error);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}

// POST: Add messages to conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId, venueId, userMessage, assistantMessage } = body;

    if (!artistId && !venueId) {
      return NextResponse.json({ error: 'Must specify artistId or venueId' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const newMessages: Message[] = [];
    
    if (userMessage) {
      newMessages.push({ role: 'user', content: userMessage, timestamp });
    }
    if (assistantMessage) {
      newMessages.push({ role: 'assistant', content: assistantMessage, timestamp });
    }

    // Find or create conversation
    let conversation = await prisma.agentConversation.findFirst({
      where: artistId ? { artistId } : { venueId },
    });

    if (conversation) {
      // Append to existing
      const existingMessages = conversation.messages as Message[];
      await prisma.agentConversation.update({
        where: { id: conversation.id },
        data: {
          messages: [...existingMessages, ...newMessages],
        }
      });
    } else {
      // Create new
      conversation = await prisma.agentConversation.create({
        data: {
          artistId: artistId || null,
          venueId: venueId || null,
          messages: newMessages,
        }
      });
    }

    return NextResponse.json({ success: true, conversationId: conversation.id });

  } catch (error) {
    console.error('Error saving conversation:', error);
    return NextResponse.json({ error: 'Failed to save conversation' }, { status: 500 });
  }
}

// DELETE: Clear conversation history
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const venueId = searchParams.get('venueId');

    if (!artistId && !venueId) {
      return NextResponse.json({ error: 'Must specify artistId or venueId' }, { status: 400 });
    }

    await prisma.agentConversation.deleteMany({
      where: artistId ? { artistId } : { venueId },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error clearing conversation:', error);
    return NextResponse.json({ error: 'Failed to clear conversation' }, { status: 500 });
  }
}





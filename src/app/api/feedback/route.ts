import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, priority, title, description, context } = body;

    // Validate required fields
    if (!type || !priority || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create feedback entry
    const feedback = await prisma.feedback.create({
      data: {
        type: type.toUpperCase(),
        priority: priority.toUpperCase(),
        title,
        description,
        context: JSON.stringify(context),
        status: 'NEW',
        createdAt: new Date(),
      },
    });

    console.log('📝 New feedback submitted:', {
      id: feedback.id,
      type: feedback.type,
      priority: feedback.priority,
      title: feedback.title,
      url: context.url
    });

    return NextResponse.json({ 
      success: true, 
      id: feedback.id 
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');

    // Build filter conditions
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const feedback = await prisma.feedback.findMany({
      where,
      orderBy: [
        { priority: 'desc' }, // Critical first
        { createdAt: 'desc' }  // Newest first
      ],
    });

    // Parse context for each feedback item
    const feedbackWithParsedContext = feedback.map((item: any) => ({
      ...item,
      context: JSON.parse(item.context || '{}')
    }));

    console.log('📋 Fetching feedback:', {
      total: feedback.length,
      filters: { status, type, priority }
    });

    return NextResponse.json(feedbackWithParsedContext);

  } catch (error) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
        updatedAt: new Date(),
      },
    });

    console.log('📝 Feedback updated:', {
      id: updatedFeedback.id,
      status: updatedFeedback.status
    });

    return NextResponse.json(updatedFeedback);

  } catch (error) {
    console.error('Feedback update error:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
} 
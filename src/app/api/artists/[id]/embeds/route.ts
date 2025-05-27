import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client properly
const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const artistId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';

    if (featured) {
      const featuredEmbed = await prisma.mediaEmbed.findFirst({
        where: {
          entityType: 'ARTIST',
          entityId: artistId,
          isFeatured: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(featuredEmbed);
    }

    // Get all embeds for the artist
    const embeds = await prisma.mediaEmbed.findMany({
      where: {
        entityType: 'ARTIST',
        entityId: artistId,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(embeds);
  } catch (error) {
    console.error('Error fetching artist embeds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch embeds' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const artistId = resolvedParams.id;
    const body = await request.json();
    const { url, title, description, isFeatured = false } = body;

    // If this is being set as featured, unfeatured any existing featured embed
    if (isFeatured) {
      await prisma.mediaEmbed.updateMany({
        where: {
          entityType: 'ARTIST',
          entityId: artistId,
          isFeatured: true,
        },
        data: { isFeatured: false }
      });
    }

    // Get the next order number
    const lastEmbed = await prisma.mediaEmbed.findFirst({
      where: {
        entityType: 'ARTIST',
        entityId: artistId,
      },
      orderBy: { order: 'desc' }
    });

    const nextOrder = (lastEmbed?.order || 0) + 1;

    const newEmbed = await prisma.mediaEmbed.create({
      data: {
        entityType: 'ARTIST',
        entityId: artistId,
        url,
        title,
        description,
        isFeatured,
        order: nextOrder,
      }
    });

    return NextResponse.json(newEmbed, { status: 201 });
  } catch (error) {
    console.error('Error creating artist embed:', error);
    return NextResponse.json(
      { error: 'Failed to create embed' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const artistId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const embedId = searchParams.get('embedId');
    
    if (!embedId) {
      return NextResponse.json(
        { error: 'Embed ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { url, title, description, isFeatured, order } = body;

    // If this is being set as featured, unfeatured any existing featured embed
    if (isFeatured) {
      await prisma.mediaEmbed.updateMany({
        where: {
          entityType: 'ARTIST',
          entityId: artistId,
          isFeatured: true,
          id: { not: embedId }
        },
        data: { isFeatured: false }
      });
    }

    const updatedEmbed = await prisma.mediaEmbed.update({
      where: { id: embedId },
      data: {
        url,
        title,
        description,
        isFeatured,
        order,
      }
    });

    return NextResponse.json(updatedEmbed);
  } catch (error) {
    console.error('Error updating artist embed:', error);
    return NextResponse.json(
      { error: 'Failed to update embed' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const artistId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const embedId = searchParams.get('embedId');
    
    if (!embedId) {
      return NextResponse.json(
        { error: 'Embed ID is required' },
        { status: 400 }
      );
    }

    await prisma.mediaEmbed.delete({
      where: { id: embedId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting artist embed:', error);
    return NextResponse.json(
      { error: 'Failed to delete embed' },
      { status: 500 }
    );
  }
}

// Clean up on module unload
process.on('beforeExit', async () => {
  await prisma.$disconnect();
}); 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'book-yr-life-secret-key-change-in-production';

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}

// GET /api/favorites - Get user's favorites (optimized)
export async function GET(request: NextRequest) {
  try {
    const userAuth = await getUserFromRequest(request);
    if (!userAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as 'VENUE' | 'ARTIST' | null;

    const whereClause: any = {
      userId: userAuth.userId
    };

    if (entityType) {
      whereClause.entityType = entityType;
    }

    // Just return the favorites without fetching full entity data
    // The frontend should already have this data from other API calls
    const favorites = await prisma.favorite.findMany({
      where: whereClause,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add caching headers to reduce requests
    const response = NextResponse.json({ favorites });
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a favorite
export async function POST(request: NextRequest) {
  try {
    const userAuth = await getUserFromRequest(request);
    if (!userAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, entityId } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_entityType_entityId: {
          userId: userAuth.userId,
          entityType,
          entityId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already favorited' },
        { status: 400 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: userAuth.userId,
        entityType,
        entityId
      }
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Error creating favorite:', error);
    return NextResponse.json(
      { error: 'Failed to create favorite' },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const userAuth = await getUserFromRequest(request);
    if (!userAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: userAuth.userId,
        entityType: entityType as 'VENUE' | 'ARTIST',
        entityId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json(
      { error: 'Failed to delete favorite' },
      { status: 500 }
    );
  }
} 
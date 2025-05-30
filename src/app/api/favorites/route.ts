import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
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
    return { userId: decoded.userId, source: 'jwt' };
  } catch (error) {
    console.error('Favorites API: JWT verification failed:', error);
    return null;
  }
}

// GET /api/favorites - Get user's favorites
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

    const favorites = await prisma.favorite.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch the actual venue/artist data for each favorite
    const favoritesWithData = await Promise.all(
      favorites.map(async (favorite) => {
        if (favorite.entityType === 'VENUE') {
          const venue = await prisma.venue.findUnique({
            where: { id: favorite.entityId },
            include: {
              location: true
            }
          });
          return {
            ...favorite,
            entity: venue
          };
        } else {
          const artist = await prisma.artist.findUnique({
            where: { id: favorite.entityId },
            include: {
              location: true
            }
          });
          return {
            ...favorite,
            entity: artist
          };
        }
      })
    );

    // Filter out any favorites where the entity no longer exists
    const validFavorites = favoritesWithData.filter(fav => fav.entity !== null);

    return NextResponse.json(validFavorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    if (!['VENUE', 'ARTIST'].includes(entityType)) {
      return NextResponse.json({ error: 'entityType must be VENUE or ARTIST' }, { status: 400 });
    }

    // Verify the entity exists
    if (entityType === 'VENUE') {
      const venue = await prisma.venue.findUnique({ where: { id: entityId } });
      if (!venue) {
        return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
      }
    } else {
      const artist = await prisma.artist.findUnique({ where: { id: entityId } });
      if (!artist) {
        return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
      }
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_entityType_entityId: {
          userId: userAuth.userId,
          entityType,
          entityId
        }
      }
    });

    if (existingFavorite) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 409 });
    }

    // Create the favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: userAuth.userId,
        entityType,
        entityId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    // Find and delete the favorite
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_entityType_entityId: {
          userId: userAuth.userId,
          entityType: entityType as 'VENUE' | 'ARTIST',
          entityId
        }
      }
    });

    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    await prisma.favorite.delete({
      where: { id: favorite.id }
    });

    return NextResponse.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
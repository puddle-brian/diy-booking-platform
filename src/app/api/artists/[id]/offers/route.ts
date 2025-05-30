import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

// GET /api/artists/[id]/offers - Get all offers made to this artist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: artistId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    console.log(`🎵 API: Fetching offers for artist ${artistId}`);

    // Build where clause
    const where: any = {
      artistId: artistId
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    const offers = await prisma.venueOffer.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            venueType: true,
            capacity: true,
            location: {
              select: {
                city: true,
                stateProvince: true,
                country: true
              }
            }
          }
        },
        artist: {
          select: {
            id: true,
            name: true,
            genres: true
          }
        },
        createdBy: {
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

    console.log(`🎵 API: Found ${offers.length} offers for artist ${artistId}`);

    return NextResponse.json(offers);
  } catch (error) {
    console.error('Error fetching artist offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist offers' },
      { status: 500 }
    );
  }
} 
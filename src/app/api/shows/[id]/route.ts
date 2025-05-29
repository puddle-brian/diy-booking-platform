import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { ShowStatus, AgeRestriction } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const show = await prisma.show.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            genres: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            location: {
              select: {
                city: true,
                stateProvince: true,
                country: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!show) {
      return NextResponse.json(
        { error: 'Show not found' },
        { status: 404 }
      );
    }

    // Transform to match expected format
    const transformedShow = {
      id: show.id,
      artistId: show.artistId,
      venueId: show.venueId,
      date: show.date.toISOString().split('T')[0],
      city: show.venue.location.city,
      state: show.venue.location.stateProvince || '',
      country: show.venue.location.country,
      venueName: show.venue.name,
      artistName: show.artist.name,
      title: show.title,
      status: show.status.toLowerCase(),
      ticketPrice: show.ticketPrice,
      ageRestriction: (() => {
        if (!show.ageRestriction) return 'all-ages';
        const ageStr = show.ageRestriction.toLowerCase();
        if (ageStr.includes('eighteen') || ageStr.includes('18')) return '18+';
        if (ageStr.includes('twenty') || ageStr.includes('21')) return '21+';
        return 'all-ages';
      })(),
      description: show.description,
      createdAt: show.createdAt.toISOString(),
      updatedAt: show.updatedAt.toISOString(),
      createdBy: show.createdBy.username
    };

    return NextResponse.json(transformedShow);
  } catch (error) {
    console.error('Error in GET /api/shows/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch show' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if show exists
    const existingShow = await prisma.show.findUnique({
      where: { id }
    });

    if (!existingShow) {
      return NextResponse.json(
        { error: 'Show not found' },
        { status: 404 }
      );
    }

    // Update show
    const updatedShow = await prisma.show.update({
      where: { id },
      data: {
        title: body.title,
        date: body.date ? new Date(body.date) : undefined,
        description: body.description || body.notes,
        ticketPrice: body.ticketPrice ? parseFloat(body.ticketPrice) : null,
        ageRestriction: body.ageRestriction ? 
          body.ageRestriction.toUpperCase().replace('-', '_') as AgeRestriction : 
          undefined,
        status: body.status ? body.status.toUpperCase() as ShowStatus : undefined,
        updatedAt: new Date()
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            genres: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            location: {
              select: {
                city: true,
                stateProvince: true,
                country: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Transform to match expected format
    const transformedShow = {
      id: updatedShow.id,
      artistId: updatedShow.artistId,
      venueId: updatedShow.venueId,
      date: updatedShow.date.toISOString().split('T')[0],
      city: updatedShow.venue.location.city,
      state: updatedShow.venue.location.stateProvince || '',
      country: updatedShow.venue.location.country,
      venueName: updatedShow.venue.name,
      artistName: updatedShow.artist.name,
      title: updatedShow.title,
      status: updatedShow.status.toLowerCase(),
      ticketPrice: updatedShow.ticketPrice,
      ageRestriction: (() => {
        if (!updatedShow.ageRestriction) return 'all-ages';
        const ageStr = updatedShow.ageRestriction.toLowerCase();
        if (ageStr.includes('eighteen') || ageStr.includes('18')) return '18+';
        if (ageStr.includes('twenty') || ageStr.includes('21')) return '21+';
        return 'all-ages';
      })(),
      description: updatedShow.description,
      createdAt: updatedShow.createdAt.toISOString(),
      updatedAt: updatedShow.updatedAt.toISOString(),
      createdBy: updatedShow.createdBy.username
    };

    return NextResponse.json(transformedShow);
  } catch (error) {
    console.error('Error in PUT /api/shows/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update show' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if show exists
    const existingShow = await prisma.show.findUnique({
      where: { id }
    });

    if (!existingShow) {
      return NextResponse.json(
        { error: 'Show not found' },
        { status: 404 }
      );
    }

    // Delete show
    await prisma.show.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Show deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/shows/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete show' },
      { status: 500 }
    );
  }
} 
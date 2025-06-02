import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// GET /api/show-requests/[id] - Get a specific show request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const showRequestId = params.id;
    
    const showRequest = await prisma.showRequest.findUnique({
      where: { id: showRequestId },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            genres: true,
            location: {
              select: {
                city: true,
                stateProvince: true,
                country: true
              }
            }
          }
        },
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
        createdBy: {
          select: {
            id: true,
            username: true
          }
        },
        bids: {
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
            bidder: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!showRequest) {
      return NextResponse.json(
        { error: 'Show request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(showRequest);
  } catch (error) {
    console.error('Error fetching show request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch show request' },
      { status: 500 }
    );
  }
}

// PUT /api/show-requests/[id] - Update a show request
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const showRequestId = params.id;
    const body = await request.json();
    
    console.log('🎯 API: Updating show request:', showRequestId, body);
    
    // Handle offer actions (accept, decline)
    if (body.action) {
      const showRequest = await prisma.showRequest.findUnique({
        where: { id: showRequestId },
        include: { artist: true, venue: true }
      });

      if (!showRequest) {
        return NextResponse.json(
          { error: 'Show request not found' },
          { status: 404 }
        );
      }

      let updateData: any = {};
      
      switch (body.action.toLowerCase()) {
        case 'accept':
          updateData = {
            status: 'ACCEPTED'
          };
          break;
        case 'decline':
          updateData = {
            status: 'DECLINED'
          };
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid action. Must be accept or decline' },
            { status: 400 }
          );
      }

      const updatedShowRequest = await prisma.showRequest.update({
        where: { id: showRequestId },
        data: updateData,
        include: {
          artist: true,
          venue: true,
          bids: { include: { venue: true } }
        }
      });

      console.log(`✅ Show request ${body.action}ed: ${showRequest.title}`);
      return NextResponse.json(updatedShowRequest);
    }

    // Handle regular updates
    const updateData: any = {};
    
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.requestedDate) updateData.requestedDate = new Date(body.requestedDate);
    if (body.status) updateData.status = body.status.toUpperCase();
    if (body.targetLocations) updateData.targetLocations = body.targetLocations;
    if (body.genres) updateData.genres = body.genres;

    const updatedShowRequest = await prisma.showRequest.update({
      where: { id: showRequestId },
      data: updateData,
      include: {
        artist: true,
        venue: true,
        bids: { include: { venue: true } }
      }
    });

    console.log(`✅ Show request updated: ${updatedShowRequest.title}`);
    return NextResponse.json(updatedShowRequest);
  } catch (error) {
    console.error('Error updating show request:', error);
    return NextResponse.json(
      { error: 'Failed to update show request' },
      { status: 500 }
    );
  }
}

// DELETE /api/show-requests/[id] - Delete a show request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const showRequestId = params.id;
    
    console.log('🎯 API: Deleting show request:', showRequestId);
    
    // Check if show request exists
    const showRequest = await prisma.showRequest.findUnique({
      where: { id: showRequestId },
      include: { artist: true, bids: true }
    });

    if (!showRequest) {
      return NextResponse.json(
        { error: 'Show request not found' },
        { status: 404 }
      );
    }

    // Delete all associated bids first
    await prisma.showRequestBid.deleteMany({
      where: { showRequestId }
    });

    // Delete the show request
    await prisma.showRequest.delete({
      where: { id: showRequestId }
    });

    console.log(`✅ Show request deleted: ${showRequest.title} (${showRequest.bids.length} bids also deleted)`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting show request:', error);
    return NextResponse.json(
      { error: 'Failed to delete show request' },
      { status: 500 }
    );
  }
} 
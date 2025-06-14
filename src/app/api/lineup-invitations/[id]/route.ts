import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { action, reason } = body; // action: 'accept' | 'decline'

    console.log(`🎵 API: ${action}ing lineup invitation ${resolvedParams.id}`);

    // Validate action
    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action. Must be "accept" or "decline"' },
        { status: 400 }
      );
    }

    // Find the lineup bid
    const lineupBid = await prisma.bid.findUnique({
      where: { 
        id: resolvedParams.id,
      },
      include: {
        tourRequest: {
          include: {
            artist: true
          }
        }
      }
    });

    if (!lineupBid) {
      return NextResponse.json(
        { message: 'Lineup invitation not found' },
        { status: 404 }
      );
    }

    // Verify this is actually a lineup bid
    if (!lineupBid.isLineupSlot) {
      return NextResponse.json(
        { message: 'This is not a lineup invitation' },
        { status: 400 }
      );
    }

    // Check if already responded
    if (lineupBid.status !== 'PENDING') {
      return NextResponse.json(
        { message: `Invitation already ${lineupBid.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Update the bid based on action
    const updateData: any = {
      status: action === 'accept' ? 'ACCEPTED' : 'REJECTED',
      updatedAt: new Date()
    };

    if (action === 'accept') {
      updateData.acceptedAt = new Date();
    } else {
      updateData.declinedAt = new Date();
      if (reason) {
        updateData.declinedReason = reason;
      }
    }

    const updatedBid = await prisma.bid.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        tourRequest: {
          include: {
            artist: true
          }
        }
      }
    });

    console.log(`✅ Lineup invitation ${action}ed:`, updatedBid.id);

    // Transform response
    const response = {
      id: updatedBid.id,
      status: updatedBid.status.toLowerCase(),
      artistName: updatedBid.tourRequest.artist.name,
      lineupRole: updatedBid.lineupRole,
      billingOrder: updatedBid.billingOrder,
      acceptedAt: updatedBid.acceptedAt?.toISOString(),
      declinedAt: updatedBid.declinedAt?.toISOString(),
      declinedReason: updatedBid.declinedReason,
      updatedAt: updatedBid.updatedAt.toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating lineup invitation:', error);
    return NextResponse.json(
      { message: 'Failed to update lineup invitation' },
      { status: 500 }
    );
  }
} 
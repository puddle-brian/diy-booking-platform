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
      
      // 🎯 FIX: Create Show record for accepted lineup invitation
      // First get the parent show and venue info
      const parentShow = await prisma.show.findUnique({
        where: { id: lineupBid.parentShowId! },
        include: {
          venue: {
            include: {
              location: true
            }
          }
        }
      });

      if (parentShow) {
        // Create a Show record for the support act
        const supportShow = await prisma.show.create({
          data: {
            title: `${lineupBid.tourRequest.artist.name} (${lineupBid.lineupRole?.toLowerCase().replace('_', ' ')})`,
            date: parentShow.date,
            artistId: lineupBid.tourRequest.artist.id,
            artistName: lineupBid.tourRequest.artist.name,
            venueId: parentShow.venueId,
            venueName: parentShow.venueName,
            city: parentShow.city,
            state: parentShow.state,
            country: parentShow.country,
            guarantee: lineupBid.amount || null,
            capacity: parentShow.capacity,
            ageRestriction: parentShow.ageRestriction,
            // Link to parent show for lineup context
            parentShowId: parentShow.id,
            isLineupSlot: true,
            lineupRole: lineupBid.lineupRole,
            billingOrder: lineupBid.billingOrder,
            status: 'CONFIRMED'
          }
        });

        console.log(`✅ Created Show record for support act: ${supportShow.id}`);
      }
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
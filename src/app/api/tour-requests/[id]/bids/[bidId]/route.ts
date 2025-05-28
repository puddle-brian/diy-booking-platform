import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../../lib/prisma';
import { BidStatus, ShowStatus } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const { action, reason, notes } = body;

    // Find the bid to update
    const bid = await prisma.bid.findUnique({
      where: { id: resolvedParams.bidId },
      include: {
        tourRequest: {
          include: {
            artist: true
          }
        },
        venue: true
      }
    });
    
    if (!bid) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      );
    }

    let updatedBid;
    let createdShow = null;

    switch (action) {
      case 'hold':
        // ARTIST ACTION: Place bid on hold
        const existingHolds = await prisma.bid.findMany({
          where: {
            tourRequestId: bid.tourRequestId,
            status: BidStatus.HOLD
          },
          orderBy: { holdPosition: 'asc' }
        });
        
        const nextHoldPosition = Math.min(existingHolds.length + 1, 3);
        
        updatedBid = await prisma.bid.update({
          where: { id: resolvedParams.bidId },
          data: {
            status: BidStatus.HOLD,
            holdPosition: nextHoldPosition,
            heldAt: new Date(),
            heldUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            updatedAt: new Date()
          },
          include: {
            tourRequest: { include: { artist: true } },
            venue: true
          }
        });
        
        console.log(`🤝 Bid placed on hold: ${bid.venue.name} - Position ${nextHoldPosition}`);
        break;

      case 'accept':
        // ARTIST ACTION: Accept bid (creates show, cancels other bids for this date)
        updatedBid = await prisma.bid.update({
          where: { id: resolvedParams.bidId },
          data: {
            status: BidStatus.ACCEPTED,
            acceptedAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            tourRequest: { include: { artist: true } },
            venue: true
          }
        });

        // Create confirmed show
        if (bid.proposedDate) {
          createdShow = await prisma.show.create({
            data: {
              title: `${bid.tourRequest.artist.name} at ${bid.venue.name}`,
              date: bid.proposedDate,
              venueId: bid.venueId,
              artistId: bid.tourRequest.artistId,
              description: `Show created from accepted bid`,
              ticketPrice: bid.amount || 15,
              ageRestriction: 'ALL_AGES', // Default, could be enhanced
              status: ShowStatus.CONFIRMED,
              createdById: bid.bidderId // Use the bidder as creator for now
            }
          });
        }

        // Cancel all other bids for this tour request
        await prisma.bid.updateMany({
          where: {
            tourRequestId: bid.tourRequestId,
            id: { not: resolvedParams.bidId }
          },
          data: {
            status: BidStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledReason: 'Another venue was selected for this date',
            updatedAt: new Date()
          }
        });

        console.log(`✅ Bid accepted: ${bid.venue.name} for ${bid.proposedDate}`);
        break;

      case 'decline':
        // ARTIST ACTION: Decline bid
        updatedBid = await prisma.bid.update({
          where: { id: resolvedParams.bidId },
          data: {
            status: BidStatus.REJECTED,
            declinedAt: new Date(),
            declinedReason: reason || 'Not selected',
            updatedAt: new Date()
          },
          include: {
            tourRequest: { include: { artist: true } },
            venue: true
          }
        });
        
        // Promote other holds if this was a hold
        if (bid.status === BidStatus.HOLD && bid.holdPosition) {
          const holdsToPromote = await prisma.bid.findMany({
            where: {
              tourRequestId: bid.tourRequestId,
              status: BidStatus.HOLD,
              holdPosition: { gt: bid.holdPosition }
            }
          });

          for (const holdBid of holdsToPromote) {
            await prisma.bid.update({
              where: { id: holdBid.id },
              data: {
                holdPosition: holdBid.holdPosition! - 1,
                updatedAt: new Date()
              }
            });
          }
        }

        console.log(`❌ Bid declined: ${bid.venue.name} - ${reason || 'Not selected'}`);
        break;

      case 'cancel':
        // VENUE ACTION: Cancel their own bid
        updatedBid = await prisma.bid.update({
          where: { id: resolvedParams.bidId },
          data: {
            status: BidStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledReason: reason || 'Venue cancelled bid',
            updatedAt: new Date()
          },
          include: {
            tourRequest: { include: { artist: true } },
            venue: true
          }
        });

        console.log(`🚫 Bid cancelled by venue: ${bid.venue.name}`);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      bid: {
        id: updatedBid.id,
        status: updatedBid.status.toLowerCase(),
        holdPosition: updatedBid.holdPosition,
        acceptedAt: updatedBid.acceptedAt?.toISOString(),
        declinedAt: updatedBid.declinedAt?.toISOString(),
        declinedReason: updatedBid.declinedReason,
        cancelledAt: updatedBid.cancelledAt?.toISOString(),
        cancelledReason: updatedBid.cancelledReason,
        updatedAt: updatedBid.updatedAt.toISOString()
      },
      show: createdShow ? {
        id: createdShow.id,
        title: createdShow.title,
        date: createdShow.date.toISOString(),
        status: createdShow.status.toLowerCase()
      } : null
    });

  } catch (error) {
    console.error('Error updating bid:', error);
    return NextResponse.json(
      { error: 'Failed to update bid' },
      { status: 500 }
    );
  }
} 
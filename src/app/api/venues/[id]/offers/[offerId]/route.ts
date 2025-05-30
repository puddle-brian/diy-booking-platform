import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../../lib/prisma';
import { OfferStatus, ShowStatus, AgeRestriction } from '@prisma/client';

// GET /api/venues/[id]/offers/[offerId] - Get specific offer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  try {
    const { offerId } = await params;

    const offer = await prisma.venueOffer.findUnique({
      where: { id: offerId },
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

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error fetching venue offer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue offer' },
      { status: 500 }
    );
  }
}

// PUT /api/venues/[id]/offers/[offerId] - Update offer status (accept/decline)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  try {
    const { offerId } = await params;
    const body = await request.json();
    
    console.log(`🎯 Venue Offer Action: ${body.action} for offer ${offerId}`);

    // Get the offer with related data
    const offer = await prisma.venueOffer.findUnique({
      where: { id: offerId },
      include: {
        artist: true,
        venue: true
      }
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    let updatedOffer;
    let createdShow = null;

    switch (body.action) {
      case 'accept':
        // ARTIST ACTION: Accept venue offer (creates show)
        updatedOffer = await prisma.venueOffer.update({
          where: { id: offerId },
          data: {
            status: OfferStatus.ACCEPTED,
            acceptedAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            artist: true,
            venue: true
          }
        });

        // Create confirmed show from accepted offer
        createdShow = await prisma.show.create({
          data: {
            title: offer.title || `${offer.artist.name} at ${offer.venue.name}`,
            date: offer.proposedDate,
            venueId: offer.venueId,
            artistId: offer.artistId,
            description: offer.description || `Show created from accepted venue offer`,
            ticketPrice: offer.ticketPrice ? (offer.ticketPrice as any).advance || (offer.ticketPrice as any).door : null,
            ageRestriction: offer.ageRestriction ? 
              offer.ageRestriction.toUpperCase().replace('-', '_') as AgeRestriction : 
              'ALL_AGES',
            status: ShowStatus.CONFIRMED,
            createdById: offer.createdById,
            
            // Transfer offer details to show
            capacity: offer.capacity,
            guarantee: offer.amount,
            doorDeal: offer.doorDeal,
            loadIn: offer.loadIn,
            soundcheck: offer.soundcheck,
            doorsOpen: offer.doorsOpen,
            showTime: offer.showTime,
            curfew: offer.curfew,
            notes: offer.message,
            billingOrder: offer.billingPosition ? {
              position: offer.billingPosition,
              lineupPosition: offer.lineupPosition,
              setLength: offer.setLength,
              otherActs: offer.otherActs ? offer.otherActs.split(',').map(act => act.trim()).filter(act => act) : [],
              notes: offer.billingNotes
            } : undefined
          }
        });

        console.log(`✅ Venue offer accepted: ${offer.venue.name} → ${offer.artist.name} for ${offer.proposedDate}`);
        break;

      case 'decline':
        // ARTIST ACTION: Decline venue offer
        updatedOffer = await prisma.venueOffer.update({
          where: { id: offerId },
          data: {
            status: OfferStatus.DECLINED,
            declinedAt: new Date(),
            declinedReason: body.reason || 'Artist declined the offer',
            updatedAt: new Date()
          },
          include: {
            artist: true,
            venue: true
          }
        });

        console.log(`❌ Venue offer declined: ${offer.venue.name} → ${offer.artist.name} for ${offer.proposedDate}`);
        break;

      case 'cancel':
        // VENUE ACTION: Cancel/withdraw offer
        updatedOffer = await prisma.venueOffer.update({
          where: { id: offerId },
          data: {
            status: OfferStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledReason: body.reason || 'Venue cancelled the offer',
            updatedAt: new Date()
          },
          include: {
            artist: true,
            venue: true
          }
        });

        console.log(`🚫 Venue offer cancelled: ${offer.venue.name} → ${offer.artist.name} for ${offer.proposedDate}`);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be accept, decline, or cancel' },
          { status: 400 }
        );
    }

    const response: any = { offer: updatedOffer };
    if (createdShow) {
      response.show = createdShow;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating venue offer:', error);
    return NextResponse.json(
      { error: 'Failed to update venue offer' },
      { status: 500 }
    );
  }
}

// DELETE /api/venues/[id]/offers/[offerId] - Delete offer (venue only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  try {
    const { offerId } = await params;

    // Check if offer exists and is deletable
    const offer = await prisma.venueOffer.findUnique({
      where: { id: offerId }
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending offers
    if (offer.status !== OfferStatus.PENDING) {
      return NextResponse.json(
        { error: 'Can only delete pending offers' },
        { status: 400 }
      );
    }

    await prisma.venueOffer.delete({
      where: { id: offerId }
    });

    console.log(`🗑️ Venue offer deleted: ${offerId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting venue offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete venue offer' },
      { status: 500 }
    );
  }
} 
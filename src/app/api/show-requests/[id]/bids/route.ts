import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { BidStatus } from '@prisma/client';

// GET /api/show-requests/[id]/bids - Get bids for a show request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showRequestId } = await params;
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');

    console.log(`🎯 API: Fetching bids for show request ${showRequestId}${venueId ? ` (venue: ${venueId})` : ''}`);

    // Build the where clause
    const whereClause: any = { showRequestId };
    if (venueId) {
      whereClause.venueId = venueId;
    }

    const bids = await prisma.showRequestBid.findMany({
      where: whereClause,
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
        },
        showRequest: {
          select: {
            id: true,
            title: true,
            requestedDate: true,
            artist: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { holdPosition: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`🎯 API: Found ${bids.length} bids for show request${venueId ? ` from venue ${venueId}` : ''}`);

    // Transform bids to include hold state information
    const transformedBids = bids.map(bid => ({
      ...bid,
      // Add frozen state information for UI
      holdState: bid.holdState || 'AVAILABLE',
      frozenByHoldId: bid.frozenByHoldId || null,
      frozenAt: bid.frozenAt?.toISOString() || null,
      unfrozenAt: bid.unfrozenAt?.toISOString() || null,
      isFrozen: bid.holdState === 'FROZEN'
    }));

    return NextResponse.json(transformedBids);
  } catch (error) {
    console.error('Error fetching show request bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}

// POST /api/show-requests/[id]/bids - Create a new bid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showRequestId } = await params;
    const body = await request.json();
    
    console.log('🎯 API: Creating/updating bid for show request:', showRequestId);
    
    // Validate required fields
    const requiredFields = ['venueId', 'bidderId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if show request exists
    const showRequest = await prisma.showRequest.findUnique({
      where: { id: showRequestId },
      include: { artist: true }
    });

    if (!showRequest) {
      return NextResponse.json(
        { error: 'Show request not found' },
        { status: 404 }
      );
    }

    // Check if venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: body.venueId },
      select: { id: true, name: true }
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // 🎯 CHECK FOR EXISTING BID: Look for existing bid from this venue for this show request
    const existingBid = await prisma.showRequestBid.findFirst({
      where: {
        showRequestId: showRequestId,
        venueId: body.venueId
      },
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
      }
    });

    // Prepare the bid data
    const bidData = {
      proposedDate: body.proposedDate ? (() => {
        // 🎯 FIX: Parse date string properly to avoid timezone issues
        // If it's a date-only string like "2024-07-10", parse it as local date
        if (typeof body.proposedDate === 'string' && body.proposedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = body.proposedDate.split('-').map(Number);
          return new Date(year, month - 1, day); // month is 0-indexed
        }
        return new Date(body.proposedDate);
      })() : showRequest.requestedDate,
      message: body.message || null,
      amount: body.amount ? parseFloat(body.amount) : null,
      billingPosition: body.billingPosition || null,
      lineupPosition: body.lineupPosition ? parseInt(body.lineupPosition) : null,
      setLength: body.setLength ? parseInt(body.setLength) : null,
      otherActs: body.otherActs || null,
      status: BidStatus.PENDING
    };

    let result;
    let isUpdate = false;

    if (existingBid) {
      // 🎯 UPDATE EXISTING BID: Update the existing bid instead of creating a duplicate
      console.log(`🔄 Updating existing bid from ${venue.name} → ${showRequest.artist.name}`);
      
      result = await prisma.showRequestBid.update({
        where: { id: existingBid.id },
        data: bidData,
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
        }
      });
      
      isUpdate = true;
      console.log(`✅ Bid updated: ${venue.name} → ${showRequest.artist.name}`);
    } else {
      // 🎯 CREATE NEW BID: No existing bid found, create a new one
      console.log(`🆕 Creating new bid from ${venue.name} → ${showRequest.artist.name}`);
      
      result = await prisma.showRequestBid.create({
        data: {
          showRequestId: showRequestId,
          venueId: body.venueId,
          bidderId: body.bidderId,
          ...bidData
        },
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
        }
      });
      
      console.log(`✅ Bid created: ${venue.name} → ${showRequest.artist.name}`);
    }

    // Return the result with additional metadata about the operation
    return NextResponse.json({
      ...result,
      isUpdate // Let the frontend know if this was an update vs create
    }, { status: isUpdate ? 200 : 201 });
  } catch (error) {
    console.error('Error creating/updating bid:', error);
    return NextResponse.json(
      { error: 'Failed to create/update bid' },
      { status: 500 }
    );
  }
}

// PUT /api/show-requests/[id]/bids - Update bid status (accept, hold, decline)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showRequestId } = await params;
    const body = await request.json();
    
    console.log('🎯 API: Updating bid status:', body);
    
    if (!body.bidId || !body.action) {
      return NextResponse.json(
        { error: 'Missing bidId or action' },
        { status: 400 }
      );
    }

    // Find the bid
    const bid = await prisma.showRequestBid.findUnique({
      where: { id: body.bidId },
      include: { venue: true, showRequest: { include: { artist: true } } }
    });

    if (!bid) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      );
    }

    // Update based on action
    let updateData: any = {};
    
    switch (body.action.toLowerCase()) {
      case 'accept':
        updateData = {
          status: BidStatus.ACCEPTED,
          acceptedAt: new Date()
        };
        break;
      case 'undo-accept':
        updateData = {
          status: BidStatus.PENDING,
          acceptedAt: null,
          declinedAt: null,
          declinedReason: body.reason || null
        };
        break;
      case 'hold':
        updateData = {
          status: BidStatus.HOLD,
          heldAt: new Date()
        };
        if (body.notes) {
          updateData.message = body.notes;
        }
        break;
      case 'decline':
        updateData = {
          status: BidStatus.REJECTED,
          declinedAt: new Date(),
          declinedReason: body.reason || 'No reason provided'
        };
        break;
      
      // 🔒 NEW HOLD-SPECIFIC ACTIONS
      case 'accept-held':
        // Accept a held bid - normal acceptance but also releases hold and cancels competing bids
        console.log('🔒 Accepting held bid (normal workflow)');
        
        updateData = {
          status: BidStatus.ACCEPTED,
          acceptedAt: new Date(),
          holdState: 'AVAILABLE', // Clear hold state
          frozenByHoldId: null,
          frozenAt: null,
          unfrozenAt: new Date()
        };
        
        // Find and release the associated hold
        const activeHold = await prisma.holdRequest.findFirst({
          where: {
            showRequestId: showRequestId,
            status: 'ACTIVE'
          }
        });
        
        if (activeHold) {
          // Release the hold 
          await prisma.holdRequest.update({
            where: { id: activeHold.id },
            data: {
              status: 'CANCELLED',
              respondedAt: new Date()
            }
          });
          
          // Cancel all competing bids (they lost the competition)
          await prisma.showRequestBid.updateMany({
            where: {
              showRequestId: showRequestId,
              holdState: 'FROZEN',
              frozenByHoldId: activeHold.id
            },
            data: {
              status: BidStatus.REJECTED, // Cancel competing bids
              holdState: 'AVAILABLE',
              frozenByHoldId: null,
              unfrozenAt: new Date(),
              declinedAt: new Date(),
              declinedReason: 'Artist accepted competing bid'
            }
          });
        }
        break;
        
      case 'decline-held':
        // Decline a held bid - normal decline but also releases hold and unfreezes competing bids
        console.log('🔒 Declining held bid - releasing hold and unfreezing competitors');
        
        updateData = {
          status: BidStatus.REJECTED,
          declinedAt: new Date(),
          declinedReason: body.reason || 'Artist declined held bid',
          holdState: 'AVAILABLE',
          frozenByHoldId: null,
          frozenAt: null,
          unfrozenAt: new Date()
        };
        
        // Find and release the associated hold
        const holdToRelease = await prisma.holdRequest.findFirst({
          where: {
            showRequestId: showRequestId,
            status: 'ACTIVE'
          }
        });
        
        if (holdToRelease) {
          // Release the hold
          await prisma.holdRequest.update({
            where: { id: holdToRelease.id },
            data: {
              status: 'DECLINED',
              respondedAt: new Date()
            }
          });
          
          // Unfreeze all competing bids (they can compete again)
          await prisma.showRequestBid.updateMany({
            where: {
              showRequestId: showRequestId,
              holdState: 'FROZEN',
              frozenByHoldId: holdToRelease.id
            },
            data: {
              holdState: 'AVAILABLE',
              frozenByHoldId: null,
              unfrozenAt: new Date()
            }
          });
        }
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be accept, undo-accept, hold, decline, accept-held, or decline-held' },
          { status: 400 }
        );
    }

    const updatedBid = await prisma.showRequestBid.update({
      where: { id: body.bidId },
      data: updateData,
      include: {
        venue: true,
        showRequest: { include: { artist: true } }
      }
    });

    console.log(`✅ Bid ${body.action}ed: ${bid.venue.name} → ${bid.showRequest.artist.name}`);

    return NextResponse.json(updatedBid);
  } catch (error) {
    console.error('Error updating bid:', error);
    return NextResponse.json(
      { error: 'Failed to update bid' },
      { status: 500 }
    );
  }
}

// DELETE /api/show-requests/[id]/bids - Cancel/delete a bid
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showRequestId } = await params;
    const body = await request.json();
    
    console.log('🎯 API: Cancelling bid:', body.bidId);
    
    if (!body.bidId) {
      return NextResponse.json(
        { error: 'Missing bidId' },
        { status: 400 }
      );
    }

    // Find and delete the bid
    const bid = await prisma.showRequestBid.findUnique({
      where: { id: body.bidId },
      include: { venue: true, showRequest: { include: { artist: true } } }
    });

    if (!bid) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      );
    }

    await prisma.showRequestBid.delete({
      where: { id: body.bidId }
    });

    console.log(`✅ Bid cancelled: ${bid.venue.name} → ${bid.showRequest.artist.name}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling bid:', error);
    return NextResponse.json(
      { error: 'Failed to cancel bid' },
      { status: 500 }
    );
  }
} 
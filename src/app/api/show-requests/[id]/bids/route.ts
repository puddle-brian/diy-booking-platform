import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { BidStatus, BidHoldState } from '@prisma/client';

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
        // 🔒 ENHANCED: Regular accept now properly handles competing bids
        console.log('🔒 Accepting bid - rejecting all competitors (instant decision)');
        
        updateData = {
          status: BidStatus.ACCEPTED,
          acceptedAt: new Date(),
          holdState: 'AVAILABLE' // Clear any hold state
        };
        
        // First, check if there are any active holds on this show request
        const activeHoldsOnRequest = await prisma.holdRequest.findMany({
          where: {
            showRequestId: showRequestId,
            status: 'ACTIVE'
          }
        });
        
        // Cancel any active holds (this bid wins definitively)
        if (activeHoldsOnRequest.length > 0) {
          console.log(`🔒 Cancelling ${activeHoldsOnRequest.length} active holds due to bid acceptance`);
          await prisma.holdRequest.updateMany({
            where: {
              showRequestId: showRequestId,
              status: 'ACTIVE'
            },
            data: {
              status: 'CANCELLED',
              respondedAt: new Date()
            }
          });
        }
        
        // After updating this bid, reject all competing bids immediately
        // (This is a transaction that will happen after the main bid update)
        break;
      case 'undo-accept':
        // 🔒 ENHANCED: Undo-accept now unfreezes competing bids
        console.log('🔒 Undo-accept: Unfreezing competing bids');
        
        updateData = {
          status: BidStatus.PENDING,
          acceptedAt: null,
          declinedAt: null,
          declinedReason: body.reason || null,
          holdState: 'AVAILABLE' // Clear any hold state
        };
        
        // After the main update, unfreeze competitors that were frozen by this acceptance
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
        // Accept a held bid - artist chooses this venue but competitors stay frozen until confirmation
        console.log('🔒 Accepting held bid (competitors stay frozen until confirmation)');
        console.log('🔒 Setting holdState to: ACCEPTED_HELD');
        
        updateData = {
          status: BidStatus.ACCEPTED,
          acceptedAt: new Date(),
          holdState: 'ACCEPTED_HELD', // ✅ Move to ACCEPTED_HELD state - waiting for final confirmation
          // Keep frozenByHoldId and frozenAt - competitors still frozen
        };
        
        console.log('🔒 Update data:', updateData);
        
        // Find the associated hold but keep it ACTIVE
        const activeHold = await prisma.holdRequest.findFirst({
          where: {
            showRequestId: showRequestId,
            status: 'ACTIVE'
          }
        });
        
        if (activeHold) {
          // Update hold to show it's been responded to but keep active
          await prisma.holdRequest.update({
            where: { id: activeHold.id },
            data: {
              status: 'ACTIVE', // Keep active until confirmed
              respondedAt: new Date()
            }
          });
          
          // Keep competitors FROZEN - they're not rejected until show is confirmed
          // This allows artist to change their mind before final confirmation
        }
        break;
        
      case 'confirm-accepted':
        // NEW: Confirm an accepted bid - this creates a Show and rejects competitors
        console.log('🔒 Confirming accepted bid - creating show and rejecting competitors');
        
        updateData = {
          status: BidStatus.CANCELLED, // Mark as cancelled since it's now a confirmed show
          cancelledAt: new Date(),
          cancelledReason: 'Converted to confirmed show',
          holdState: 'AVAILABLE', // Now available for scheduling
          frozenByHoldId: null,
          frozenAt: null,
          unfrozenAt: new Date()
        };
        
        // 🎯 CREATE CONFIRMED SHOW - This is what was missing!
        const showRequest = await prisma.showRequest.findUnique({
          where: { id: showRequestId },
          include: { artist: true }
        });
        
        if (showRequest && bid.proposedDate) {
          const createdShow = await prisma.show.create({
            data: {
              title: `${showRequest.artist.name} at ${bid.venue.name}`,
              date: bid.proposedDate,
              venueId: bid.venueId,
              artistId: showRequest.artistId,
              description: `Show created from confirmed bid: ${showRequest.title}`,
              ticketPrice: bid.amount || 15,
              ageRestriction: 'ALL_AGES', // Default, could be enhanced
              status: 'CONFIRMED', // This is the key - Show is CONFIRMED
              createdById: bid.bidderId,
              // Add detailed schedule if available
              guarantee: bid.amount,
              billingOrder: bid.billingPosition ? { lineup: [{ position: bid.billingPosition, artist: showRequest.artist.name }] } : undefined,
              notes: `Confirmed show from accepted bid. ${bid.billingPosition || 'performer'} slot.`
            }
          });
          
          console.log(`✅ Created confirmed show: ${createdShow.id} - ${createdShow.title}`);
        }
        
        // 🎯 UPDATE SHOWREQUEST STATUS - This prevents duplicate display
        await prisma.showRequest.update({
          where: { id: showRequestId },
          data: {
            status: 'CONFIRMED' // Mark the original request as confirmed
          }
        });
        console.log(`✅ Updated ShowRequest ${showRequestId} status to CONFIRMED`);
        
        // Find the active hold (after artist accepted)
        const confirmHold = await prisma.holdRequest.findFirst({
          where: {
            showRequestId: showRequestId,
            status: 'ACTIVE'
          }
        });
        
        if (confirmHold) {
          // Mark hold as cancelled (confirmed the choice)
          await prisma.holdRequest.update({
            where: { id: confirmHold.id },
            data: {
              status: 'CANCELLED'
            }
          });
          
          // NOW reject all competing bids (they definitively lost)
          await prisma.showRequestBid.updateMany({
            where: {
              showRequestId: showRequestId,
              holdState: 'FROZEN',
              frozenByHoldId: confirmHold.id
            },
            data: {
              status: BidStatus.REJECTED,
              holdState: 'AVAILABLE',
              frozenByHoldId: null,
              unfrozenAt: new Date(),
              declinedAt: new Date(),
              declinedReason: 'Artist confirmed competing venue'
            }
          });
        }
        break;
        
      case 'release-held':
        // NEW: Release a held bid - removes hold but keeps bid pending for normal accept/decline
        console.log('🔓 Releasing held bid - returning to normal bidding, unfreezing competitors');
        
        updateData = {
          status: BidStatus.PENDING, // ✅ Keep as pending! This is the key fix
          holdState: 'AVAILABLE',
          frozenByHoldId: null,
          frozenAt: null,
          unfrozenAt: new Date()
        };
        
        // Find and release the associated hold
        const activeHoldToRelease = await prisma.holdRequest.findFirst({
          where: {
            showRequestId: showRequestId,
            status: 'ACTIVE'
          }
        });
        
        if (activeHoldToRelease) {
          // Release the hold
          await prisma.holdRequest.update({
            where: { id: activeHoldToRelease.id },
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
              frozenByHoldId: activeHoldToRelease.id
            },
            data: {
              holdState: 'AVAILABLE',
              frozenByHoldId: null,
              unfrozenAt: new Date()
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
        const heldBidHoldToRelease = await prisma.holdRequest.findFirst({
          where: {
            showRequestId: showRequestId,
            status: 'ACTIVE'
          }
        });
        
        if (heldBidHoldToRelease) {
          // Release the hold
          await prisma.holdRequest.update({
            where: { id: heldBidHoldToRelease.id },
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
              frozenByHoldId: heldBidHoldToRelease.id
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
          { error: 'Invalid action. Must be accept, undo-accept, hold, decline, accept-held, confirm-accepted, release-held, or decline-held' },
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

    // 🔒 POST-UPDATE: Handle competing bids for regular accept action
    if (body.action.toLowerCase() === 'accept') {
      console.log('🔒 Post-accept: Freezing all competing bids (artist can still change mind)');
      
      // Freeze all other bids on this show request (don't reject yet - artist might change mind)
      const frozenCompetitors = await prisma.showRequestBid.updateMany({
        where: {
          showRequestId: showRequestId,
          id: { not: body.bidId }, // Don't freeze the accepted bid
          status: { 
            notIn: ['ACCEPTED', 'REJECTED'] // Don't freeze already decided bids
          }
        },
        data: {
          holdState: 'FROZEN', // Freeze instead of reject
          frozenByHoldId: 'accept-' + body.bidId, // Track what froze them
          frozenAt: new Date()
          // Keep original status - they're not rejected yet
        }
      });
      
      console.log(`✅ Regular accept completed: ${frozenCompetitors.count} competing bids frozen (not rejected)`);
    }
    
    // 🔒 POST-UPDATE: Handle competing bids for undo-accept action
    if (body.action.toLowerCase() === 'undo-accept') {
      console.log('🔒 Post-undo-accept: Unfreezing competing bids');
      
      // Unfreeze all bids that were frozen by this bid's acceptance
      const unfrozenCompetitors = await prisma.showRequestBid.updateMany({
        where: {
          showRequestId: showRequestId,
          frozenByHoldId: 'accept-' + body.bidId, // Only unfreeze bids frozen by this specific acceptance
          holdState: 'FROZEN'
        },
        data: {
          holdState: 'AVAILABLE',
          frozenByHoldId: null,
          frozenAt: null,
          unfrozenAt: new Date()
        }
      });
      
      console.log(`✅ Undo-accept completed: ${unfrozenCompetitors.count} competing bids unfrozen`);
    }

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
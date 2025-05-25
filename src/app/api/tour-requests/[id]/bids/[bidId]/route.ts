import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { VenueBid, TourRequest, Show } from '../../../../../../../types';

const bidsFilePath = path.join(process.cwd(), 'data', 'bids.json');
const tourRequestsFilePath = path.join(process.cwd(), 'data', 'tour-requests.json');
const showsFilePath = path.join(process.cwd(), 'data', 'shows.json');

function readBids(): VenueBid[] {
  try {
    if (!fs.existsSync(bidsFilePath)) {
      return [];
    }
    const data = fs.readFileSync(bidsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading bids file:', error);
    return [];
  }
}

function writeBids(bids: VenueBid[]): void {
  try {
    const dir = path.dirname(bidsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(bidsFilePath, JSON.stringify(bids, null, 2));
  } catch (error) {
    console.error('Error writing bids file:', error);
    throw error;
  }
}

function readShows(): Show[] {
  try {
    if (!fs.existsSync(showsFilePath)) {
      return [];
    }
    const data = fs.readFileSync(showsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading shows file:', error);
    return [];
  }
}

function writeShows(shows: Show[]): void {
  try {
    const dir = path.dirname(showsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(showsFilePath, JSON.stringify(shows, null, 2));
  } catch (error) {
    console.error('Error writing shows file:', error);
    throw error;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const { action, declineReason } = body;

    const bids = readBids();
    const bidIndex = bids.findIndex(bid => bid.id === resolvedParams.bidId);
    
    if (bidIndex === -1) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      );
    }

    const bid = bids[bidIndex];
    let updatedBid = { ...bid };
    let showToCreate: Show | null = null;

    switch (action) {
      case 'hold':
        // ARTIST ACTION: Place bid on hold
        const existingHolds = bids.filter(b => 
          b.tourRequestId === bid.tourRequestId && 
          b.status === 'hold'
        );
        
        const nextHoldPosition = Math.min(existingHolds.length + 1, 3) as 1 | 2 | 3;
        
        updatedBid = {
          ...bid,
          status: 'hold',
          holdPosition: nextHoldPosition,
          heldAt: new Date().toISOString(),
          heldUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
          readByArtist: true,
          updatedAt: new Date().toISOString()
        };
        
        console.log(`🤝 Bid placed on hold: ${bid.venueName} - Position ${nextHoldPosition}`);
        break;

      case 'accept':
        // ARTIST ACTION: Accept bid (creates show, cancels other bids for this date)
        updatedBid = {
          ...bid,
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
          readByArtist: true,
          updatedAt: new Date().toISOString()
        };

        // Create confirmed show
        const shows = readShows();
        showToCreate = {
          id: `show-${Date.now()}`,
          artistId: bid.tourRequestId.includes('tour-req-001') ? '1748101913848' : 
                   bid.tourRequestId.includes('tour-req-003') ? '1' :
                   bid.tourRequestId.includes('tour-req-004') ? '2' : '1',
          artistName: bid.tourRequestId.includes('tour-req-001') ? 'Lightning Bolt' : 
                     bid.tourRequestId.includes('tour-req-003') ? 'Against Me!' :
                     bid.tourRequestId.includes('tour-req-004') ? 'Fugazi' : 'Unknown Artist',
          venueId: bid.venueId,
          venueName: bid.venueName,
          date: bid.proposedDate,
          city: bid.proposedDate.includes('seattle') ? 'Seattle' :
                bid.proposedDate.includes('portland') ? 'Portland' :
                bid.proposedDate.includes('vancouver') ? 'Vancouver' : 'Unknown',
          state: 'WA',
          status: 'confirmed',
          guarantee: bid.guarantee || 0,
          doorDeal: bid.doorDeal || { split: '70/30', minimumGuarantee: bid.guarantee || 0 },
          ticketPrice: bid.ticketPrice || { advance: 15, door: 18 },
          capacity: bid.capacity || 150,
          ageRestriction: bid.ageRestriction || 'all-ages',
          originalBidId: bid.id,
          createdBy: 'artist-acceptance',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Cancel all other bids for this tour request
        bids.forEach((otherBid, index) => {
          if (otherBid.tourRequestId === bid.tourRequestId && otherBid.id !== bid.id) {
            bids[index] = {
              ...otherBid,
              status: 'cancelled',
              cancelledAt: new Date().toISOString(),
              cancelledReason: `Another venue was selected for this date`,
              updatedAt: new Date().toISOString()
            };
          }
        });

        console.log(`✅ Bid accepted: ${bid.venueName} for ${bid.proposedDate}`);
        break;

      case 'decline':
        // ARTIST ACTION: Decline bid
        updatedBid = {
          ...bid,
          status: 'declined',
          declinedAt: new Date().toISOString(),
          declinedReason: declineReason || 'Not selected',
          readByArtist: true,
          updatedAt: new Date().toISOString()
        };
        
        // Promote other holds if this was a hold
        if (bid.status === 'hold' && bid.holdPosition) {
          bids.forEach((otherBid, index) => {
            if (otherBid.tourRequestId === bid.tourRequestId && 
                otherBid.status === 'hold' && 
                otherBid.holdPosition && 
                otherBid.holdPosition > bid.holdPosition!) {
              bids[index] = {
                ...otherBid,
                holdPosition: (otherBid.holdPosition - 1) as 1 | 2 | 3,
                updatedAt: new Date().toISOString()
              };
            }
          });
        }

        console.log(`❌ Bid declined: ${bid.venueName} - ${declineReason || 'Not selected'}`);
        break;

      case 'cancel':
        // VENUE ACTION: Cancel their own bid
        updatedBid = {
          ...bid,
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelledReason: 'Venue cancelled bid',
          updatedAt: new Date().toISOString()
        };

        console.log(`🚫 Bid cancelled by venue: ${bid.venueName}`);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update the bid
    bids[bidIndex] = updatedBid;
    writeBids(bids);

    // Create show if needed
    if (showToCreate) {
      const shows = readShows();
      shows.push(showToCreate);
      writeShows(shows);
    }

    return NextResponse.json({ 
      success: true, 
      bid: updatedBid,
      show: showToCreate 
    });

  } catch (error) {
    console.error('Error updating bid:', error);
    return NextResponse.json(
      { error: 'Failed to update bid' },
      { status: 500 }
    );
  }
} 
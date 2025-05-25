import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dataDir = path.join(process.cwd(), 'data');
    const tourRequestsPath = path.join(dataDir, 'tour-requests.json');
    const venueBidsPath = path.join(dataDir, 'venue-bids.json');
    
    // Read current tour requests
    const tourRequestsData = fs.readFileSync(tourRequestsPath, 'utf8');
    const tourRequests = JSON.parse(tourRequestsData);
    
    // Find the tour request to delete
    const requestIndex = tourRequests.findIndex((req: any) => req.id === id);
    
    if (requestIndex === -1) {
      return NextResponse.json({ error: 'Tour request not found' }, { status: 404 });
    }
    
    const deletedRequest = tourRequests[requestIndex];
    
    // Read venue bids to find and notify affected venues
    const venueBidsData = fs.readFileSync(venueBidsPath, 'utf8');
    const venueBids = JSON.parse(venueBidsData);
    
    // Find bids for this tour request and mark them as cancelled
    const affectedBids = venueBids.filter((bid: any) => bid.tourRequestId === id);
    const updatedBids = venueBids.map((bid: any) => {
      if (bid.tourRequestId === id) {
        return {
          ...bid,
          status: 'cancelled',
          cancelledReason: 'Tour request deleted by artist',
          cancelledAt: new Date().toISOString(),
          notifyVenue: true // Flag for venue notification system
        };
      }
      return bid;
    });
    
    // Remove the tour request
    tourRequests.splice(requestIndex, 1);
    
    // Write updated data back to files
    fs.writeFileSync(tourRequestsPath, JSON.stringify(tourRequests, null, 2));
    fs.writeFileSync(venueBidsPath, JSON.stringify(updatedBids, null, 2));
    
    console.log(`🗑️ Tour request deleted: ${deletedRequest.title} - ${affectedBids.length} bids cancelled`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Tour request "${deletedRequest.title}" deleted successfully`,
      cancelledBids: affectedBids.length,
      deletedRequest 
    });
  } catch (error) {
    console.error('Error deleting tour request:', error);
    return NextResponse.json({ error: 'Failed to delete tour request' }, { status: 500 });
  }
} 
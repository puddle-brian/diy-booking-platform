import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { BidStatus } from '@prisma/client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find the tour request to delete
    const tourRequest = await prisma.tourRequest.findUnique({
      where: { id },
      include: {
        artist: true,
        bids: true
      }
    });
    
    if (!tourRequest) {
      return NextResponse.json({ error: 'Tour request not found' }, { status: 404 });
    }
    
    // Cancel all associated bids
    const affectedBids = await prisma.bid.updateMany({
      where: { tourRequestId: id },
      data: {
        status: BidStatus.CANCELLED,
        cancelledReason: 'Tour request deleted by artist',
        cancelledAt: new Date()
      }
    });
    
    // Delete the tour request (this will cascade delete bids if configured)
    await prisma.tourRequest.delete({
      where: { id }
    });
    
    console.log(`🗑️ Tour request deleted: ${tourRequest.title} - ${affectedBids.count} bids cancelled`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Tour request "${tourRequest.title}" deleted successfully`,
      cancelledBids: affectedBids.count,
      deletedRequest: {
        id: tourRequest.id,
        title: tourRequest.title,
        artistName: tourRequest.artist.name
      }
    });
  } catch (error) {
    console.error('Error deleting tour request:', error);
    return NextResponse.json({ error: 'Failed to delete tour request' }, { status: 500 });
  }
} 
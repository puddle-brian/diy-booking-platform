import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: holdId } = await params;

    // Find the hold request
    const holdRequest = await prisma.holdRequest.findUnique({
      where: { id: holdId },
      include: {
        showRequest: {
          include: {
            artist: { select: { name: true } }
          }
        }
      }
    });

    if (!holdRequest) {
      return NextResponse.json({ error: 'Hold request not found' }, { status: 404 });
    }

    if (holdRequest.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Hold is not active' }, { status: 400 });
    }

    // Get counts before releasing for summary
    const heldBidsCount = await prisma.bid.count({
      where: { 
        frozenByHoldId: holdId,
        holdState: 'HELD'
      }
    });
    
    const frozenBidsCount = await prisma.bid.count({
      where: { 
        frozenByHoldId: holdId,
        holdState: 'FROZEN'
      }
    });

    // Release the hold in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Set hold to CANCELLED
      await tx.holdRequest.update({
        where: { id: holdId },
        data: {
          status: 'CANCELLED',
          respondedAt: new Date()
        }
      });

      // 2. Reset all bids affected by this hold to AVAILABLE
      await tx.bid.updateMany({
        where: { frozenByHoldId: holdId },
        data: {
          holdState: 'AVAILABLE',
          frozenByHoldId: null,
          frozenAt: null,
          unfrozenAt: new Date()
        }
      });
    });

    const artistName = holdRequest.showRequest?.artist?.name || 'Unknown Artist';
    const summary = `Released hold for ${artistName} - ${heldBidsCount} held bid and ${frozenBidsCount} frozen bids returned to AVAILABLE`;

    return NextResponse.json({
      success: true,
      summary,
      details: {
        holdId,
        artistName,
        heldBidsReleased: heldBidsCount,
        frozenBidsReleased: frozenBidsCount,
        totalBidsReleased: heldBidsCount + frozenBidsCount
      }
    });

  } catch (error) {
    console.error('Error releasing hold:', error);
    return NextResponse.json({ 
      error: `Failed to release hold: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 
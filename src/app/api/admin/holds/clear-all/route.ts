import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get counts before clearing for summary
    const heldBidsCount = await prisma.bid.count({
      where: { holdState: 'HELD' }
    });
    
    const frozenBidsCount = await prisma.bid.count({
      where: { holdState: 'FROZEN' }
    });

    const activeHoldsCount = await prisma.holdRequest.count({
      where: { status: 'ACTIVE' }
    });

    // Clear all hold states in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Reset all bids to AVAILABLE state
      await tx.bid.updateMany({
        where: {
          holdState: { in: ['HELD', 'FROZEN'] }
        },
        data: {
          holdState: 'AVAILABLE',
          frozenByHoldId: null,
          frozenAt: null,
          unfrozenAt: new Date() // Mark when they were unfrozen
        }
      });

      // 2. Set all active holds to CANCELLED
      await tx.holdRequest.updateMany({
        where: { status: 'ACTIVE' },
        data: {
          status: 'CANCELLED',
          respondedAt: new Date()
        }
      });
    });

    const summary = `Cleared ${activeHoldsCount} active holds, reset ${heldBidsCount} held bids and ${frozenBidsCount} frozen bids to AVAILABLE`;

    return NextResponse.json({
      success: true,
      summary,
      details: {
        activeHoldsCleared: activeHoldsCount,
        heldBidsCleared: heldBidsCount,
        frozenBidsCleared: frozenBidsCount,
        totalBidsReset: heldBidsCount + frozenBidsCount
      }
    });

  } catch (error) {
    console.error('Error clearing holds:', error);
    return NextResponse.json({ 
      error: `Failed to clear holds: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 
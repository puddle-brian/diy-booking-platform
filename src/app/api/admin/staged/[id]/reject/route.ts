import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../../lib/prisma';

/**
 * POST /api/admin/staged/[id]/reject - Reject a staged entity
 * Body:
 *   - reason: Why this entity was rejected (required)
 *   - reviewedBy?: User ID of reviewer
 *   - reviewNotes?: Additional notes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get the staged entity
    const staged = await prisma.stagedEntity.findUnique({
      where: { id }
    });

    if (!staged) {
      return NextResponse.json(
        { error: 'Staged entity not found' },
        { status: 404 }
      );
    }

    if (staged.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot reject an already approved entity' },
        { status: 400 }
      );
    }

    if (staged.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Entity has already been rejected' },
        { status: 400 }
      );
    }

    // Update staged entity status
    const updatedStaged = await prisma.stagedEntity.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: body.reviewedBy || null,
        reviewNotes: body.reviewNotes || null,
        rejectionReason: body.reason
      }
    });

    return NextResponse.json({
      success: true,
      staged: updatedStaged
    });
  } catch (error) {
    console.error('Error rejecting staged entity:', error);
    return NextResponse.json(
      { error: 'Failed to reject staged entity' },
      { status: 500 }
    );
  }
}

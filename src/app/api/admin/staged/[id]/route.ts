import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { StagedStatus } from '@prisma/client';

/**
 * GET /api/admin/staged/[id] - Get a single staged entity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const entity = await prisma.stagedEntity.findUnique({
      where: { id }
    });

    if (!entity) {
      return NextResponse.json(
        { error: 'Staged entity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error fetching staged entity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staged entity' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/staged/[id] - Update a staged entity
 * Body can include:
 *   - data: Updated entity data
 *   - status: New status (for changing to NEEDS_INFO, etc.)
 *   - confidence: Updated confidence score
 *   - aiNotes: Updated AI notes
 *   - reviewNotes: Admin notes
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify entity exists
    const existing = await prisma.stagedEntity.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Staged entity not found' },
        { status: 404 }
      );
    }

    // Don't allow editing approved/rejected entities
    if (existing.status === 'APPROVED' || existing.status === 'REJECTED') {
      return NextResponse.json(
        { error: `Cannot edit entity with status ${existing.status}` },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: {
      data?: object;
      status?: StagedStatus;
      confidence?: number;
      aiNotes?: string;
      reviewNotes?: string;
    } = {};

    if (body.data) {
      // Merge with existing data
      updateData.data = { ...(existing.data as object), ...body.data };
    }
    if (body.status && ['PENDING', 'NEEDS_INFO'].includes(body.status)) {
      updateData.status = body.status;
    }
    if (body.confidence !== undefined) {
      updateData.confidence = Math.max(0, Math.min(100, body.confidence));
    }
    if (body.aiNotes !== undefined) {
      updateData.aiNotes = body.aiNotes;
    }
    if (body.reviewNotes !== undefined) {
      updateData.reviewNotes = body.reviewNotes;
    }

    const updated = await prisma.stagedEntity.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating staged entity:', error);
    return NextResponse.json(
      { error: 'Failed to update staged entity' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/staged/[id] - Delete a staged entity
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify entity exists
    const existing = await prisma.stagedEntity.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Staged entity not found' },
        { status: 404 }
      );
    }

    await prisma.stagedEntity.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error('Error deleting staged entity:', error);
    return NextResponse.json(
      { error: 'Failed to delete staged entity' },
      { status: 500 }
    );
  }
}

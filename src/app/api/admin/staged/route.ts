import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { StagedStatus, StagedEntityType } from '@prisma/client';

/**
 * GET /api/admin/staged - List staged entities for review
 * Query params:
 *   - status: Filter by status (PENDING, APPROVED, REJECTED, DUPLICATE, NEEDS_INFO)
 *   - entityType: Filter by type (VENUE, ARTIST, SCENE_INFRASTRUCTURE)
 *   - limit: Max results (default 50)
 *   - offset: Pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as StagedStatus | null;
    const entityType = searchParams.get('entityType') as StagedEntityType | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: {
      status?: StagedStatus;
      entityType?: StagedEntityType;
    } = {};

    if (status) {
      where.status = status;
    }
    if (entityType) {
      where.entityType = entityType;
    }

    // Get total count
    const total = await prisma.stagedEntity.count({ where });

    // Get staged entities
    const stagedEntities = await prisma.stagedEntity.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // PENDING first
        { confidence: 'desc' }, // Higher confidence first
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    // Get counts by status for dashboard
    const statusCounts = await prisma.stagedEntity.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const counts = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      entities: stagedEntities,
      total,
      limit,
      offset,
      counts: {
        PENDING: counts.PENDING || 0,
        APPROVED: counts.APPROVED || 0,
        REJECTED: counts.REJECTED || 0,
        DUPLICATE: counts.DUPLICATE || 0,
        NEEDS_INFO: counts.NEEDS_INFO || 0
      }
    });
  } catch (error) {
    console.error('Error fetching staged entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staged entities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/staged - Create a new staged entity
 * Body:
 *   - entityType: VENUE | ARTIST | SCENE_INFRASTRUCTURE
 *   - data: The entity data (name, city, state, etc.)
 *   - sourceUrl?: Where this was discovered
 *   - sourceType?: "manual" | "web_search" | "bandcamp" | etc.
 *   - searchQuery?: The search that found this
 *   - confidence?: 0-100 confidence score
 *   - aiNotes?: AI notes about the discovery
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.entityType || !body.data) {
      return NextResponse.json(
        { error: 'entityType and data are required' },
        { status: 400 }
      );
    }

    // Validate entityType
    if (!['VENUE', 'ARTIST', 'SCENE_INFRASTRUCTURE'].includes(body.entityType)) {
      return NextResponse.json(
        { error: 'entityType must be VENUE, ARTIST, or SCENE_INFRASTRUCTURE' },
        { status: 400 }
      );
    }

    // Validate data has at least a name
    if (!body.data.name) {
      return NextResponse.json(
        { error: 'data.name is required' },
        { status: 400 }
      );
    }

    // Check for duplicates in staging
    const existingStaged = await prisma.stagedEntity.findFirst({
      where: {
        entityType: body.entityType,
        status: { in: ['PENDING', 'NEEDS_INFO'] },
        data: {
          path: ['name'],
          equals: body.data.name
        }
      }
    });

    if (existingStaged) {
      return NextResponse.json(
        { 
          error: 'This entity is already staged for review',
          existingId: existingStaged.id
        },
        { status: 409 }
      );
    }

    // Check for duplicates in live database
    let existingLive = null;
    if (body.entityType === 'VENUE') {
      existingLive = await prisma.venue.findFirst({
        where: {
          name: { equals: body.data.name, mode: 'insensitive' }
        }
      });
    } else if (body.entityType === 'ARTIST') {
      existingLive = await prisma.artist.findFirst({
        where: {
          name: { equals: body.data.name, mode: 'insensitive' }
        }
      });
    }

    // Create staged entity
    const stagedEntity = await prisma.stagedEntity.create({
      data: {
        entityType: body.entityType,
        data: body.data,
        sourceUrl: body.sourceUrl || null,
        sourceType: body.sourceType || 'manual',
        searchQuery: body.searchQuery || null,
        confidence: body.confidence || 50,
        aiNotes: body.aiNotes || null,
        // If already exists in live DB, mark as duplicate
        status: existingLive ? 'DUPLICATE' : 'PENDING'
      }
    });

    return NextResponse.json({
      entity: stagedEntity,
      isDuplicate: !!existingLive,
      existingEntity: existingLive ? {
        id: existingLive.id,
        name: existingLive.name
      } : null
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating staged entity:', error);
    return NextResponse.json(
      { error: 'Failed to create staged entity' },
      { status: 500 }
    );
  }
}

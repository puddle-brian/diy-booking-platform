import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * 🎯 V02 DATES API
 * 
 * Simple CRUD for DateEntry - the unified booking model.
 * One endpoint, simple data, agent-friendly.
 */

// GET: Fetch date entries for an artist or venue
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const venueId = searchParams.get('venueId');
    const status = searchParams.get('status');
    
    if (!artistId && !venueId) {
      return NextResponse.json({ error: 'Must specify artistId or venueId' }, { status: 400 });
    }

    const where: any = {};
    if (artistId) where.artistId = artistId;
    if (venueId) where.venueId = venueId;
    if (status) {
      const statusList = status.split(',').map(s => s.trim().toUpperCase());
      where.status = { in: statusList };
    }

    const entries = await prisma.dateEntry.findMany({
      where,
      include: {
        artist: { 
          select: { 
            id: true, 
            name: true 
          } 
        },
        venue: { 
          select: { 
            id: true, 
            name: true,
            location: {
              select: {
                city: true,
                stateProvince: true
              }
            }
          } 
        },
      },
      orderBy: { date: 'asc' },
    });

    // Transform to simple format
    const dates = entries.map(e => ({
      id: e.id,
      date: e.date.toISOString().split('T')[0],
      artistId: e.artistId,
      artistName: e.artist.name,
      venueId: e.venueId,
      venueName: e.venue.name,
      city: e.venue.location?.city || null,
      state: e.venue.location?.stateProvince || null,
      status: e.status.toLowerCase(),
      billing: e.billing,
      setLength: e.setLength,
      // Financial deal (new structured format)
      deal: e.deal || null,
      // Legacy fields (for backwards compat)
      guarantee: e.guarantee,
      door: e.door,
      // Show details & rider
      details: e.details || null,
      // Hold info
      holdUntil: e.holdUntil?.toISOString().split('T')[0] || null,
      holdReason: e.holdReason,
      // Notes (negotiation history)
      notes: e.notes,
    }));

    return NextResponse.json({ 
      dates,
      count: dates.length,
      perspective: artistId ? 'artist' : 'venue',
    });

  } catch (error) {
    console.error('Error fetching dates:', error);
    return NextResponse.json({ error: 'Failed to fetch dates' }, { status: 500 });
  }
}

// POST: Create a new date entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { date, artistId, venueId, status, guarantee, door, billing, setLength, notes } = body;

    if (!date || !artistId || !venueId) {
      return NextResponse.json({ error: 'date, artistId, and venueId are required' }, { status: 400 });
    }

    const entry = await prisma.dateEntry.create({
      data: {
        date: new Date(date),
        artistId,
        venueId,
        status: (status || 'INQUIRY').toUpperCase(),
        guarantee: guarantee ? parseFloat(guarantee) : null,
        door,
        billing,
        setLength: setLength ? parseInt(setLength) : null,
        notes,
      },
      include: {
        artist: { select: { name: true } },
        venue: { select: { name: true } },
      }
    });

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        date: entry.date.toISOString().split('T')[0],
        artistName: entry.artist.name,
        venueName: entry.venue.name,
        status: entry.status.toLowerCase(),
      }
    });

  } catch (error: any) {
    console.error('Error creating date:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Entry already exists for this artist/venue/date' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to create date entry' }, { status: 500 });
  }
}

// PATCH: Update an existing date entry
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Build update data
    const data: any = {};
    if (updates.status) data.status = updates.status.toUpperCase();
    if (updates.billing !== undefined) data.billing = updates.billing;
    if (updates.setLength !== undefined) data.setLength = updates.setLength ? parseInt(updates.setLength) : null;
    // New structured deal field
    if (updates.deal !== undefined) data.deal = updates.deal;
    // Legacy fields
    if (updates.guarantee !== undefined) data.guarantee = updates.guarantee ? parseFloat(updates.guarantee) : null;
    if (updates.door !== undefined) data.door = updates.door;
    // Show details & rider
    if (updates.details !== undefined) data.details = updates.details;
    // Hold info
    if (updates.holdUntil !== undefined) data.holdUntil = updates.holdUntil ? new Date(updates.holdUntil) : null;
    if (updates.holdReason !== undefined) data.holdReason = updates.holdReason;
    // Notes
    if (updates.notes !== undefined) data.notes = updates.notes;

    const entry = await prisma.dateEntry.update({
      where: { id },
      data,
      include: {
        artist: { select: { name: true } },
        venue: { select: { name: true } },
      }
    });

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        date: entry.date.toISOString().split('T')[0],
        artistName: entry.artist.name,
        venueName: entry.venue.name,
        status: entry.status.toLowerCase(),
      }
    });

  } catch (error) {
    console.error('Error updating date:', error);
    return NextResponse.json({ error: 'Failed to update date entry' }, { status: 500 });
  }
}

// DELETE: Remove a date entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.dateEntry.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting date:', error);
    return NextResponse.json({ error: 'Failed to delete date entry' }, { status: 500 });
  }
}


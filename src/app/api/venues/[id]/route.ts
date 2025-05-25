import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'venues.json');

function readVenues() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading venues:', error);
    return [];
  }
}

function writeVenues(venues: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(venues, null, 2));
  } catch (error) {
    console.error('Error writing venues:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const venues = readVenues();
    const venue = venues.find((v: any) => v.id === id || v.id === parseInt(id));
    
    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }
    
    return NextResponse.json(venue);
  } catch (error) {
    console.error('Error fetching venue:', error);
    return NextResponse.json({ error: 'Failed to fetch venue' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updatedData = await request.json();
    const venues = readVenues();
    const index = venues.findIndex((v: any) => v.id === id || v.id === parseInt(id));
    
    if (index === -1) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }
    
    venues[index] = {
      ...venues[index],
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };
    
    writeVenues(venues);
    return NextResponse.json(venues[index]);
    
  } catch (error) {
    console.error('Error updating venue:', error);
    return NextResponse.json({ error: 'Failed to update venue' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const venues = readVenues();
    const venueIndex = venues.findIndex((v: any) => v.id === id || v.id === parseInt(id));
    
    if (venueIndex === -1) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }
    
    const deletedVenue = venues[venueIndex];
    venues.splice(venueIndex, 1);
    
    writeVenues(venues);
    
    return NextResponse.json({ 
      success: true, 
      message: `Venue "${deletedVenue.name}" deleted successfully`,
      deletedVenue 
    });
  } catch (error) {
    console.error('Error deleting venue:', error);
    return NextResponse.json({ error: 'Failed to delete venue' }, { status: 500 });
  }
} 
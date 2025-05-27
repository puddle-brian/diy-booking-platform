import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Show } from '../../../../../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SHOWS_FILE = path.join(DATA_DIR, 'shows.json');

function readShows(): Show[] {
  try {
    if (fs.existsSync(SHOWS_FILE)) {
      const data = fs.readFileSync(SHOWS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading shows:', error);
    return [];
  }
}

function writeShows(shows: Show[]): void {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    fs.writeFileSync(SHOWS_FILE, JSON.stringify(shows, null, 2));
  } catch (error) {
    console.error('Error writing shows:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shows = readShows();
    const show = shows.find(s => s.id === id);
    
    if (!show) {
      return NextResponse.json(
        { error: 'Show not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(show);
  } catch (error) {
    console.error('Error fetching show:', error);
    return NextResponse.json(
      { error: 'Failed to fetch show' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shows = readShows();
    const showIndex = shows.findIndex(s => s.id === id);
    
    if (showIndex === -1) {
      return NextResponse.json(
        { error: 'Show not found' },
        { status: 404 }
      );
    }
    
    const deletedShow = shows[showIndex];
    
    // Remove the show
    shows.splice(showIndex, 1);
    writeShows(shows);
    
    console.log(`🗑️ Show deleted: ${deletedShow.artistName} at ${deletedShow.venueName} on ${deletedShow.date}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Show "${deletedShow.artistName} at ${deletedShow.venueName}" deleted successfully`,
      deletedShow 
    });
  } catch (error) {
    console.error('Error deleting show:', error);
    return NextResponse.json(
      { error: 'Failed to delete show' },
      { status: 500 }
    );
  }
} 
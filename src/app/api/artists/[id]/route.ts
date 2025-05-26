import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Artist } from '../../../../../types/index';

const artistsFilePath = path.join(process.cwd(), 'data', 'artists.json');

function readArtists(): Artist[] {
  try {
    if (!fs.existsSync(artistsFilePath)) {
      return [];
    }
    const data = fs.readFileSync(artistsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading artists file:', error);
    return [];
  }
}

function writeArtists(artists: Artist[]): void {
  try {
    const dir = path.dirname(artistsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(artistsFilePath, JSON.stringify(artists, null, 2));
  } catch (error) {
    console.error('Error writing artists file:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const artists = readArtists();
    const artist = artists.find(a => a.id === resolvedParams.id);
    
    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error('Error in GET /api/artists/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    const artists = readArtists();
    
    const artistIndex = artists.findIndex(a => a.id === resolvedParams.id);
    
    if (artistIndex === -1) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Validate email if provided
    if (body.contact?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.contact.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Update artist with provided fields
    const updatedArtist: Artist = {
      ...artists[artistIndex],
      ...body,
      id: resolvedParams.id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    artists[artistIndex] = updatedArtist;
    writeArtists(artists);

    return NextResponse.json(updatedArtist);
  } catch (error) {
    console.error('Error in PUT /api/artists/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update artist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const artists = readArtists();
    
    const artistIndex = artists.findIndex(a => a.id === resolvedParams.id);
    
    if (artistIndex === -1) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Remove artist from array
    artists.splice(artistIndex, 1);
    writeArtists(artists);

    return NextResponse.json({ message: 'Artist deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/artists/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete artist' },
      { status: 500 }
    );
  }
} 
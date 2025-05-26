import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ARTIST_MEMBERSHIPS_FILE = path.join(DATA_DIR, 'artist-memberships.json');

interface ArtistMembership {
  id: string;
  userId: string;
  artistId: string;
  role: string;
  permissions: string[];
  joinedAt: string;
  invitedBy: string;
  status: string;
}

const loadArtistMemberships = (): ArtistMembership[] => {
  try {
    if (!fs.existsSync(ARTIST_MEMBERSHIPS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ARTIST_MEMBERSHIPS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const saveArtistMemberships = (memberships: ArtistMembership[]) => {
  fs.writeFileSync(ARTIST_MEMBERSHIPS_FILE, JSON.stringify(memberships, null, 2));
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const artistId = resolvedParams.id;
    const body = await request.json();
    const { role } = body;

    // TODO: Get current user from session/auth
    // For now, using a placeholder user ID
    const currentUserId = 'current-user-id';

    // Check if artist already has members
    const memberships = loadArtistMemberships();
    const existingMembers = memberships.filter(m => m.artistId === artistId && m.status === 'active');
    
    if (existingMembers.length > 0) {
      return NextResponse.json(
        { error: 'This artist already has members. You cannot claim it.' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMembership = memberships.find(
      m => m.artistId === artistId && m.userId === currentUserId
    );
    
    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already associated with this artist.' },
        { status: 400 }
      );
    }

    // Create new membership
    const newMembership: ArtistMembership = {
      id: `artist-member-${Date.now()}`,
      userId: currentUserId,
      artistId: artistId,
      role: role || 'member',
      permissions: ['edit_profile', 'manage_bookings', 'invite_members'],
      joinedAt: new Date().toISOString(),
      invitedBy: 'self-claimed',
      status: 'active'
    };

    memberships.push(newMembership);
    saveArtistMemberships(memberships);

    return NextResponse.json(
      { 
        message: 'Artist claimed successfully!',
        membership: newMembership
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error claiming artist:', error);
    return NextResponse.json(
      { error: 'Failed to claim artist' },
      { status: 500 }
    );
  }
} 
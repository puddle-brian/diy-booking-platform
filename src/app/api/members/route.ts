import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ARTIST_MEMBERSHIPS_FILE = path.join(DATA_DIR, 'artist-memberships.json');
const VENUE_MEMBERSHIPS_FILE = path.join(DATA_DIR, 'venue-memberships.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

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

interface VenueMembership {
  id: string;
  userId: string;
  venueId: string;
  role: string;
  permissions: string[];
  joinedAt: string;
  invitedBy: string;
  status: string;
}

const loadUsers = (): User[] => {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const loadArtistMemberships = (): ArtistMembership[] => {
  try {
    if (!fs.existsSync(ARTIST_MEMBERSHIPS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ARTIST_MEMBERSHIPS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const loadVenueMemberships = (): VenueMembership[] => {
  try {
    if (!fs.existsSync(VENUE_MEMBERSHIPS_FILE)) return [];
    return JSON.parse(fs.readFileSync(VENUE_MEMBERSHIPS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType'); // 'artist' or 'venue'
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    const users = loadUsers();
    let memberships: (ArtistMembership | VenueMembership)[] = [];

    if (entityType === 'artist') {
      const artistMemberships = loadArtistMemberships();
      memberships = artistMemberships.filter(m => m.artistId === entityId && m.status === 'active');
    } else if (entityType === 'venue') {
      const venueMemberships = loadVenueMemberships();
      memberships = venueMemberships.filter(m => m.venueId === entityId && m.status === 'active');
    }

    // Join with user data
    const membersWithUserData = memberships.map(membership => {
      const user = users.find(u => u.id === membership.userId);
      return {
        id: membership.userId, // Use the actual user ID for profile navigation
        membershipId: membership.id, // Keep the membership ID for reference
        name: user?.name || 'Unknown User',
        role: membership.role,
        email: user?.email,
        avatar: null, // We can add avatar support later
        profileUrl: `/profile/${membership.userId}`, // Generate profile URL using user ID
        joinedAt: membership.joinedAt
      };
    });

    return NextResponse.json(membersWithUserData);
  } catch (error) {
    console.error('Failed to load members:', error);
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }
} 
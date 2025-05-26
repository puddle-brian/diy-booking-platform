import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const VENUE_MEMBERSHIPS_FILE = path.join(DATA_DIR, 'venue-memberships.json');

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

const loadVenueMemberships = (): VenueMembership[] => {
  try {
    if (!fs.existsSync(VENUE_MEMBERSHIPS_FILE)) return [];
    return JSON.parse(fs.readFileSync(VENUE_MEMBERSHIPS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const saveVenueMemberships = (memberships: VenueMembership[]) => {
  fs.writeFileSync(VENUE_MEMBERSHIPS_FILE, JSON.stringify(memberships, null, 2));
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const venueId = resolvedParams.id;
    const body = await request.json();
    const { role } = body;

    // TODO: Get current user from session/auth
    // For now, using a placeholder user ID
    const currentUserId = 'current-user-id';

    // Check if venue already has members
    const memberships = loadVenueMemberships();
    const existingMembers = memberships.filter(m => m.venueId === venueId && m.status === 'active');
    
    if (existingMembers.length > 0) {
      return NextResponse.json(
        { error: 'This venue already has members. You cannot claim it.' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMembership = memberships.find(
      m => m.venueId === venueId && m.userId === currentUserId
    );
    
    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already associated with this venue.' },
        { status: 400 }
      );
    }

    // Create new membership
    const newMembership: VenueMembership = {
      id: `venue-member-${Date.now()}`,
      userId: currentUserId,
      venueId: venueId,
      role: role || 'staff',
      permissions: ['edit_profile', 'manage_bookings', 'invite_members'],
      joinedAt: new Date().toISOString(),
      invitedBy: 'self-claimed',
      status: 'active'
    };

    memberships.push(newMembership);
    saveVenueMemberships(memberships);

    return NextResponse.json(
      { 
        message: 'Venue claimed successfully!',
        membership: newMembership
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error claiming venue:', error);
    return NextResponse.json(
      { error: 'Failed to claim venue' },
      { status: 500 }
    );
  }
} 
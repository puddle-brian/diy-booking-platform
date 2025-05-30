import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { VenueMembership, MemberInvitation, DEFAULT_ROLE_PERMISSIONS } from '../../../../../../types/index';
import crypto from 'crypto';

const MEMBERSHIPS_FILE = path.join(process.cwd(), 'data', 'venue-memberships.json');
const INVITATIONS_FILE = path.join(process.cwd(), 'data', 'member-invitations.json');

// Utility functions
const ensureDataDir = () => {
  const dataDir = path.dirname(MEMBERSHIPS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const loadMemberships = (): VenueMembership[] => {
  try {
    if (!fs.existsSync(MEMBERSHIPS_FILE)) return [];
    return JSON.parse(fs.readFileSync(MEMBERSHIPS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const saveMemberships = (memberships: VenueMembership[]) => {
  ensureDataDir();
  fs.writeFileSync(MEMBERSHIPS_FILE, JSON.stringify(memberships, null, 2));
};

const loadInvitations = (): MemberInvitation[] => {
  try {
    if (!fs.existsSync(INVITATIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(INVITATIONS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const saveInvitations = (invitations: MemberInvitation[]) => {
  ensureDataDir();
  fs.writeFileSync(INVITATIONS_FILE, JSON.stringify(invitations, null, 2));
};

// GET: List all members for a venue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const venueId = resolvedParams.id;
    
    const memberships = loadMemberships();
    const venueMembers = memberships.filter(m => m.venueId === venueId && m.status === 'active');
    
    return NextResponse.json(venueMembers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }
}

// POST: Invite a new member to the venue
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const venueId = resolvedParams.id;
    const body = await request.json();
    
    const { inviteeEmail, role = 'staff', customPermissions } = body;
    
    // TODO: Verify current user has permission to invite staff
    // const currentUser = await getCurrentUser(request);
    // if (!hasPermission(currentUser, venueId, 'invite_staff')) {
    //   return NextResponse.json({ error: 'No permission to invite staff' }, { status: 403 });
    // }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteeEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Check if already a member
    const memberships = loadMemberships();
    const existingMember = memberships.find(
      m => m.venueId === venueId && 
           m.status === 'active' && 
           m.userId === inviteeEmail // TODO: lookup by email when we have user management
    );
    
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }
    
    // Generate invitation
    const invitations = loadInvitations();
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to accept
    
    const invitation: MemberInvitation = {
      id: Date.now().toString(),
      entityType: 'venue',
      entityId: venueId,
      entityName: body.venueName || 'Unknown Venue', // TODO: lookup from venue data
      inviterName: 'Current User', // TODO: get from auth
      inviterEmail: 'user@example.com', // TODO: get from auth
      inviteeEmail,
      role,
      permissions: customPermissions || DEFAULT_ROLE_PERMISSIONS.venue[role as keyof typeof DEFAULT_ROLE_PERMISSIONS.venue] || [],
      token: inviteToken,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    invitations.push(invitation);
    saveInvitations(invitations);
    
    // TODO: Send invitation email
    console.log(`📧 Send invitation to ${inviteeEmail} for venue ${venueId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitationId: invitation.id
    });
    
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}

// PATCH: Update member role/permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const venueId = resolvedParams.id;
    const body = await request.json();
    
    const { memberId, role, permissions } = body;
    
    // TODO: Verify current user has permission to manage staff
    
    const memberships = loadMemberships();
    const memberIndex = memberships.findIndex(
      m => m.id === memberId && m.venueId === venueId
    );
    
    if (memberIndex === -1) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    
    // Update membership
    if (role) memberships[memberIndex].role = role;
    if (permissions) memberships[memberIndex].permissions = permissions;
    
    saveMemberships(memberships);
    
    return NextResponse.json({
      success: true,
      member: memberships[memberIndex]
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE: Remove a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const venueId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }
    
    // TODO: Verify current user has permission to manage staff
    
    const memberships = loadMemberships();
    const memberIndex = memberships.findIndex(
      m => m.id === memberId && m.venueId === venueId
    );
    
    if (memberIndex === -1) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    
    // Don't allow removing the last owner
    const owners = memberships.filter(
      m => m.venueId === venueId && m.role === 'owner' && m.status === 'active'
    );
    
    if (owners.length === 1 && memberships[memberIndex].role === 'owner') {
      return NextResponse.json({ 
        error: 'Cannot remove the last owner. Transfer ownership first.' 
      }, { status: 400 });
    }
    
    // Mark as inactive instead of deleting
    memberships[memberIndex].status = 'inactive';
    saveMemberships(memberships);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
} 
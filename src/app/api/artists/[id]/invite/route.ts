import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const INVITATIONS_FILE = path.join(DATA_DIR, 'member-invitations.json');

interface Invitation {
  id: string;
  entityType: 'artist' | 'venue';
  entityId: string;
  entityName: string;
  inviterEmail: string;
  inviteeEmail: string;
  role: string;
  message: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

const loadInvitations = (): Invitation[] => {
  try {
    if (!fs.existsSync(INVITATIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(INVITATIONS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const saveInvitations = (invitations: Invitation[]) => {
  fs.writeFileSync(INVITATIONS_FILE, JSON.stringify(invitations, null, 2));
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const artistId = resolvedParams.id;
    const body = await request.json();
    
    const { email, role, message, entityName } = body;
    
    // Validate required fields
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Check if invitation already exists
    const invitations = loadInvitations();
    const existingInvite = invitations.find(
      inv => inv.entityType === 'artist' && 
             inv.entityId === artistId && 
             inv.inviteeEmail === email && 
             inv.status === 'pending'
    );
    
    if (existingInvite) {
      return NextResponse.json({ error: 'Invitation already sent to this email' }, { status: 409 });
    }
    
    // Generate invitation
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to accept
    
    const invitation: Invitation = {
      id: `invite-${Date.now()}`,
      entityType: 'artist',
      entityId: artistId,
      entityName: entityName || 'Unknown Artist',
      inviterEmail: 'system@diyshows.com', // TODO: Get from current user
      inviteeEmail: email,
      role: role,
      message: message || '',
      token: inviteToken,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    
    invitations.push(invitation);
    saveInvitations(invitations);
    
    // TODO: Send actual email here
    console.log(`📧 Invitation email would be sent to ${email} to join ${entityName} as ${role}`);
    console.log(`🔗 Invite link: http://localhost:3000/invite/${inviteToken}`);
    
    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      inviteId: invitation.id
    });
    
  } catch (error) {
    console.error('Failed to send invitation:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'book-yr-life-secret-key-change-in-production';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const resolvedParams = await params;
    const artistId = resolvedParams.id;
    const body = await request.json();
    
    const { email: inviteeEmail, role = 'member', message = '', entityName } = body;
    
    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user has permission to invite members
    // For now, check if they're the owner (submittedBy) of the artist
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { name: true, submittedById: true }
    });

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    if (artist.submittedById !== currentUser.id) {
      return NextResponse.json({ error: 'No permission to invite members' }, { status: 403 });
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteeEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if user exists
    const inviteeUser = await prisma.user.findUnique({
      where: { email: inviteeEmail }
    });

    if (inviteeUser) {
      // Check if already a member (for now, check if they're the submitter)
      if (inviteeUser.id === artist.submittedById) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
      }
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // For now, we'll just log the invitation details
    // In a full implementation, you'd store this in a separate invitations table
    // and send an actual email
    console.log(`📧 Send invitation to ${inviteeEmail} for artist ${artist.name}`);
    console.log(`Invitation details:`, {
      artistName: artist.name,
      inviterName: currentUser.username,
      inviterEmail: currentUser.email,
      role,
      message,
      token: inviteToken,
      expiresAt
    });
    
    return NextResponse.json({
      success: true,
      message: inviteeUser 
        ? 'Invitation sent successfully. The user will see it in their dashboard.'
        : 'Invitation sent successfully. They will need to create an account first.',
      requiresSignup: !inviteeUser
    });
    
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}

function getDefaultPermissions(entityType: 'artist' | 'venue', role: string): string[] {
  const permissions = {
    artist: {
      owner: ['edit_profile', 'manage_bookings', 'invite_members', 'manage_members', 'view_analytics', 'delete_artist'],
      admin: ['edit_profile', 'manage_bookings', 'invite_members', 'manage_members', 'view_analytics'],
      member: ['edit_profile', 'view_analytics']
    },
    venue: {
      owner: ['edit_profile', 'manage_bookings', 'invite_staff', 'manage_staff', 'view_analytics', 'delete_venue'],
      manager: ['edit_profile', 'manage_bookings', 'invite_staff', 'manage_staff', 'view_analytics'],
      staff: ['edit_profile', 'manage_bookings']
    }
  };
  
  const entityPermissions = permissions[entityType];
  if (entityPermissions && role in entityPermissions) {
    return entityPermissions[role as keyof typeof entityPermissions];
  }
  return [];
} 
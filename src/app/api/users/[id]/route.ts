import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: string;
  profileType?: 'artist' | 'venue';
  profileId?: string;
  joinedAt: string;
  memberships: {
    entityType: 'artist' | 'venue';
    entityId: string;
    entityName: string;
    role: string;
    joinedAt: string;
  }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        submittedArtists: true,
        submittedVenues: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Build memberships array based on what the user owns
    const memberships: UserProfile['memberships'] = [];
    
    // Add artist memberships (where user is the owner)
    for (const artist of user.submittedArtists) {
      memberships.push({
        entityType: 'artist',
        entityId: artist.id,
        entityName: artist.name,
        role: 'owner',
        joinedAt: artist.createdAt.toISOString()
      });
    }
    
    // Add venue memberships (where user is the owner)
    for (const venue of user.submittedVenues) {
      memberships.push({
        entityType: 'venue',
        entityId: venue.id,
        entityName: venue.name,
        role: 'owner',
        joinedAt: venue.createdAt.toISOString()
      });
    }
    
    // Determine profile type and ID based on memberships
    let profileType: 'artist' | 'venue' | undefined;
    let profileId: string | undefined;
    
    if (user.submittedArtists.length > 0) {
      profileType = 'artist';
      profileId = user.submittedArtists[0].id; // Use first artist as primary profile
    } else if (user.submittedVenues.length > 0) {
      profileType = 'venue';
      profileId = user.submittedVenues[0].id; // Use first venue as primary profile
    }
    
    const userProfile: UserProfile = {
      id: user.id,
      name: user.username,
      email: user.email,
      bio: undefined, // Could add bio field to User model later
      role: user.role.toLowerCase(),
      profileType,
      profileId,
      joinedAt: user.createdAt.toISOString(),
      memberships
    };
    
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 
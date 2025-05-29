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
    
    console.log(`👤 API: Fetching profile for user ID: ${id}`);
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        submittedArtists: true,
        submittedVenues: true
      }
    });
    
    if (!user) {
      console.log(`👤 API: User ${id} not found in database`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(`👤 API: Found database user: ${user.username}`);
    
    // Build memberships array from database relationships
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
    
    // ALSO check the Membership table for additional memberships
    try {
      const membershipRecords = await (prisma as any).membership.findMany({
        where: {
          userId: id,
          status: 'ACTIVE'
        }
      });
      
      console.log(`👤 API: Found ${membershipRecords.length} membership records for user ${id}`);
      
      // For each membership, get the entity details
      for (const membership of membershipRecords) {
        let entityName = 'Unknown';
        
        try {
          if (membership.entityType === 'ARTIST') {
            const artist = await prisma.artist.findUnique({
              where: { id: membership.entityId }
            });
            if (artist) {
              entityName = artist.name;
              
              // Check if we already have this membership from ownership
              const existingMembership = memberships.find(m => 
                m.entityType === 'artist' && m.entityId === membership.entityId
              );
              
              if (!existingMembership) {
                memberships.push({
                  entityType: 'artist',
                  entityId: membership.entityId,
                  entityName: artist.name,
                  role: membership.role.toLowerCase(),
                  joinedAt: membership.joinedAt.toISOString()
                });
              }
            }
          } else if (membership.entityType === 'VENUE') {
            const venue = await prisma.venue.findUnique({
              where: { id: membership.entityId }
            });
            if (venue) {
              entityName = venue.name;
              
              // Check if we already have this membership from ownership
              const existingMembership = memberships.find(m => 
                m.entityType === 'venue' && m.entityId === membership.entityId
              );
              
              if (!existingMembership) {
                memberships.push({
                  entityType: 'venue',
                  entityId: membership.entityId,
                  entityName: venue.name,
                  role: membership.role.toLowerCase(),
                  joinedAt: membership.joinedAt.toISOString()
                });
              }
            }
          }
        } catch (entityError) {
          console.error(`👤 API: Error fetching entity ${membership.entityType} ${membership.entityId}:`, entityError);
        }
      }
    } catch (membershipError: any) {
      console.log(`👤 API: Membership table not available or error:`, membershipError.message);
    }
    
    // Determine profile type and ID based on memberships
    let profileType: 'artist' | 'venue' | undefined;
    let profileId: string | undefined;
    
    const artistMembership = memberships.find(m => m.entityType === 'artist');
    const venueMembership = memberships.find(m => m.entityType === 'venue');
    
    if (artistMembership) {
      profileType = 'artist';
      profileId = artistMembership.entityId;
    } else if (venueMembership) {
      profileType = 'venue';
      profileId = venueMembership.entityId;
    }
    
    // Build user profile response
    const userProfile: UserProfile = {
      id: user.id,
      name: user.username,
      email: user.email,
      bio: undefined,
      role: user.role.toLowerCase(),
      profileType,
      profileId,
      joinedAt: user.createdAt.toISOString(),
      memberships
    };
    
    console.log(`👤 API: Returning profile for ${userProfile.name} with ${memberships.length} memberships`);
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 
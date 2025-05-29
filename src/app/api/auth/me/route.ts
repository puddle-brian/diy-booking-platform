import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'book-yr-life-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    // Build memberships array from database relationships
    const memberships: Array<{
      entityType: 'artist' | 'venue';
      entityId: string;
      entityName: string;
      role: string;
      joinedAt: string;
    }> = [];

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
          userId: decoded.userId,
          status: 'ACTIVE'
        }
      });

      // For each membership, get the entity details
      for (const membership of membershipRecords) {
        try {
          if (membership.entityType === 'ARTIST') {
            const artist = await prisma.artist.findUnique({
              where: { id: membership.entityId }
            });
            if (artist) {
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
          console.error(`Error fetching entity ${membership.entityType} ${membership.entityId}:`, entityError);
        }
      }
    } catch (membershipError: any) {
      console.log(`Membership table not available or error:`, membershipError.message);
    }

    // Return user data (excluding password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.username,
      role: user.role.toLowerCase(),
      isVerified: user.verified,
      createdAt: user.createdAt.toISOString(),
      memberships
    };

    return NextResponse.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
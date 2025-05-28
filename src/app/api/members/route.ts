import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType'); // 'artist' or 'venue'
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    console.log(`👥 API: Fetching members for ${entityType} ${entityId}`);

    let membersWithUserData: any[] = [];

    try {
      // Try to use the new Membership table first
      const memberships = await (prisma as any).membership.findMany({
        where: {
          entityType: entityType.toUpperCase(),
          entityId: entityId,
          status: 'ACTIVE'
        },
        include: {
          user: true
        }
      });

      if (memberships.length > 0) {
        console.log(`👥 API: Found ${memberships.length} memberships in new table`);
        
        membersWithUserData = memberships.map((membership: any) => ({
          id: membership.user.id,
          membershipId: membership.id,
          name: membership.user.username,
          role: membership.role.charAt(0).toUpperCase() + membership.role.slice(1),
          email: membership.user.email,
          avatar: null,
          profileUrl: `/profile/${membership.user.id}`,
          joinedAt: membership.joinedAt.toISOString()
        }));
      } else {
        // Fallback to old ownership system
        console.log(`👥 API: No memberships found, falling back to ownership system`);
        
        if (entityType === 'artist') {
          const artist = await prisma.artist.findUnique({
            where: { id: entityId },
            include: { submittedBy: true }
          });

          if (artist && artist.submittedBy) {
            membersWithUserData.push({
              id: artist.submittedBy.id,
              membershipId: `artist-${artist.id}-owner`,
              name: artist.submittedBy.username,
              role: 'Owner',
              email: artist.submittedBy.email,
              avatar: null,
              profileUrl: `/profile/${artist.submittedBy.id}`,
              joinedAt: artist.createdAt.toISOString()
            });
          }
        } else if (entityType === 'venue') {
          const venue = await prisma.venue.findUnique({
            where: { id: entityId },
            include: { submittedBy: true }
          });

          if (venue && venue.submittedBy) {
            membersWithUserData.push({
              id: venue.submittedBy.id,
              membershipId: `venue-${venue.id}-owner`,
              name: venue.submittedBy.username,
              role: 'Owner',
              email: venue.submittedBy.email,
              avatar: null,
              profileUrl: `/profile/${venue.submittedBy.id}`,
              joinedAt: venue.createdAt.toISOString()
            });
          }
        }
      }
    } catch (membershipError) {
      // If Membership table doesn't exist yet, fall back to ownership system
      console.log(`👥 API: Membership table not available, using ownership system`);
      
      if (entityType === 'artist') {
        const artist = await prisma.artist.findUnique({
          where: { id: entityId },
          include: { submittedBy: true }
        });

        if (artist && artist.submittedBy) {
          membersWithUserData.push({
            id: artist.submittedBy.id,
            membershipId: `artist-${artist.id}-owner`,
            name: artist.submittedBy.username,
            role: 'Owner',
            email: artist.submittedBy.email,
            avatar: null,
            profileUrl: `/profile/${artist.submittedBy.id}`,
            joinedAt: artist.createdAt.toISOString()
          });
        }
      } else if (entityType === 'venue') {
        const venue = await prisma.venue.findUnique({
          where: { id: entityId },
          include: { submittedBy: true }
        });

        if (venue && venue.submittedBy) {
          membersWithUserData.push({
            id: venue.submittedBy.id,
            membershipId: `venue-${venue.id}-owner`,
            name: venue.submittedBy.username,
            role: 'Owner',
            email: venue.submittedBy.email,
            avatar: null,
            profileUrl: `/profile/${venue.submittedBy.id}`,
            joinedAt: venue.createdAt.toISOString()
          });
        }
      }
    }

    console.log(`👥 API: Found ${membersWithUserData.length} members total`);
    return NextResponse.json(membersWithUserData);
  } catch (error) {
    console.error('Failed to load members:', error);
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }
} 
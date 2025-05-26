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

    if (entityType === 'artist') {
      // Find the artist and its owner
      const artist = await prisma.artist.findUnique({
        where: { id: entityId },
        include: {
          submittedBy: true
        }
      });

      if (artist && artist.submittedBy) {
        membersWithUserData = [{
          id: artist.submittedBy.id,
          membershipId: `artist-${artist.id}-owner`,
          name: artist.submittedBy.username,
          role: 'Owner',
          email: artist.submittedBy.email,
          avatar: null,
          profileUrl: `/profile/${artist.submittedBy.id}`,
          joinedAt: artist.createdAt.toISOString()
        }];
      }
    } else if (entityType === 'venue') {
      // Find the venue and its owner
      const venue = await prisma.venue.findUnique({
        where: { id: entityId },
        include: {
          submittedBy: true
        }
      });

      if (venue && venue.submittedBy) {
        membersWithUserData = [{
          id: venue.submittedBy.id,
          membershipId: `venue-${venue.id}-owner`,
          name: venue.submittedBy.username,
          role: 'Owner',
          email: venue.submittedBy.email,
          avatar: null,
          profileUrl: `/profile/${venue.submittedBy.id}`,
          joinedAt: venue.createdAt.toISOString()
        }];
      }
    }

    console.log(`👥 API: Found ${membersWithUserData.length} members`);
    return NextResponse.json(membersWithUserData);
  } catch (error) {
    console.error('Failed to load members:', error);
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }
} 
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

    // Determine profile type and ID based on owned entities
    let profileType: 'artist' | 'venue' | undefined;
    let profileId: string | undefined;

    if (user.submittedArtists.length > 0) {
      profileType = 'artist';
      profileId = user.submittedArtists[0].id;
    } else if (user.submittedVenues.length > 0) {
      profileType = 'venue';
      profileId = user.submittedVenues[0].id;
    }

    // Return user data (excluding password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.username,
      role: user.role.toLowerCase(),
      profileId,
      profileType,
      isVerified: user.verified,
      createdAt: user.createdAt.toISOString()
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
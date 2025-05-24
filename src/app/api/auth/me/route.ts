import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'venue' | 'artist';
  profileId?: string;
  profileType?: 'venue' | 'artist';
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'book-yr-life-secret-key-change-in-production';

// Load existing users
const loadUsers = (): User[] => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

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

    // Load users and find current user
    const users = loadUsers();
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data (excluding password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profileId: user.profileId,
      profileType: user.profileType,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
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
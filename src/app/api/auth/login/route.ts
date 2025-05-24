import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'venue' | 'artist';
  profileId?: string; // Links to venue or artist ID
  profileType?: 'venue' | 'artist';
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'book-yr-life-secret-key-change-in-production';

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

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

// Save users
const saveUsers = (users: User[]) => {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Load users
    const users = loadUsers();

    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is verified
    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Account not verified. Please contact admin.' },
        { status: 403 }
      );
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    saveUsers(users);

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        profileId: user.profileId,
        profileType: user.profileType
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create response with user data (excluding password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profileId: user.profileId,
      profileType: user.profileType,
      lastLogin: user.lastLogin
    };

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userResponse
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
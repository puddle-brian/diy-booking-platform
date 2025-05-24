import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

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
    const { email, password, name, role = 'venue', profileId, profileType } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
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

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'venue', 'artist'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Load existing users
    const users = loadUsers();

    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      role,
      profileId,
      profileType,
      isVerified: role === 'admin' ? true : false, // Admin accounts are auto-verified
      createdAt: new Date().toISOString()
    };

    // Add user to array
    users.push(newUser);

    // Save to file
    saveUsers(users);

    console.log('New user created:', {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    });

    // Return success (excluding password)
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      profileId: newUser.profileId,
      profileType: newUser.profileType,
      isVerified: newUser.isVerified,
      createdAt: newUser.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
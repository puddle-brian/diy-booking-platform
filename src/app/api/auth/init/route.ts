import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

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

export async function POST() {
  try {
    const users = loadUsers();

    // Check if any users exist
    if (users.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Users already exist',
        hasUsers: true
      });
    }

    // Create default admin user
    const adminPassword = 'admin123'; // Simple default password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser: User = {
      id: '1',
      email: 'admin@bookyourlife.com',
      password: hashedPassword,
      name: 'BYOFL Admin',
      role: 'admin',
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    users.push(adminUser);
    saveUsers(users);

    console.log('Default admin user created:', {
      email: adminUser.email,
      password: adminPassword // Only log this in development
    });

    return NextResponse.json({
      success: true,
      message: 'Default admin user created',
      admin: {
        email: adminUser.email,
        defaultPassword: adminPassword, // Return this for setup
        note: 'Please change this password after first login'
      }
    });

  } catch (error) {
    console.error('Error initializing auth system:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
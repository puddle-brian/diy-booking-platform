import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Environment variable test',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'NOT_FOUND',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 'NOT_FOUND',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 'NOT_FOUND',
      DATABASE_URL: process.env.DATABASE_URL ? 'FOUND' : 'NOT_FOUND',
      // Show all environment variables that start with CLOUDINARY
      allCloudinaryVars: Object.keys(process.env)
        .filter(key => key.includes('CLOUDINARY'))
        .reduce((acc, key) => {
          acc[key] = process.env[key] || 'NOT_FOUND';
          return acc;
        }, {} as Record<string, string>)
    }
  });
} 
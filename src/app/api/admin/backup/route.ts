import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Admin backup request received');
    
    // Check if we're in a serverless environment (like Vercel)
    const isServerless = !process.env.NODE_ENV || process.env.VERCEL;
    
    if (isServerless) {
      // For serverless environments, return backup data directly
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      console.log('🔄 Creating backup data...');
      
      // Create backup data
      const backup = {
        timestamp,
        users: await prisma.user.findMany(),
        artists: await prisma.artist.findMany(),
        venues: await prisma.venue.findMany(),
        locations: await prisma.location.findMany(),
        shows: await prisma.show.findMany(),
        tourRequests: await prisma.tourRequest.findMany(),
        bids: await prisma.bid.findMany(),
        memberships: await prisma.membership.findMany(),
        conversations: await prisma.conversation.findMany(),
        messages: await prisma.message.findMany(),
        favorites: await prisma.favorite.findMany(),
        mediaEmbeds: await prisma.mediaEmbed.findMany(),
        feedback: await prisma.feedback.findMany()
      };
      
      console.log(`✅ Backup data created with ${backup.users.length} users, ${backup.artists.length} artists, ${backup.venues.length} venues`);
      
      // Return backup data as downloadable JSON
      const backupJson = JSON.stringify(backup, null, 2);
      const filename = `backup-${timestamp}.json`;
      
      return new NextResponse(backupJson, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Backup-Filename': filename,
          'X-Backup-Size': backupJson.length.toString()
        }
      });
      
    } else {
      // For local development, use the original file-based backup
      const { backupDatabase } = require('../../../../../scripts/backup-database');
      const backupFile = await backupDatabase();
      
      return NextResponse.json({
        success: true,
        message: `✅ Backup created successfully: ${backupFile}`,
        backupFile
      });
    }
    
  } catch (error) {
    console.error('❌ Admin backup failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create backup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 
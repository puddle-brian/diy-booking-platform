import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Artist thumbnail mappings (filename to cloudinary public_id)
const artistThumbnails = {
  'band.png': 'band',
  'solo.png': 'solo',
  'duo.png': 'duo',
  'collective.png': 'collective',
  'singer-songwriter.png': 'singer-songwriter',
  'rapper.png': 'rapper',
  'dj.png': 'dj',
  'comedian.png': 'comedian',
  'poet.png': 'poet',
  'storyteller.png': 'storyteller',
  'dancer.png': 'dancer',
  'magician.png': 'magician',
  'lecturer.png': 'lecturer',
  'theater-group.png': 'theater-group',
  'noise-artist.png': 'noise-artist',
  'other.png': 'other'
};

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 Starting artist thumbnail upload to Cloudinary...');

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary not configured');
      return NextResponse.json(
        { error: 'Cloudinary not configured. Please set environment variables.' },
        { status: 500 }
      );
    }

    const thumbnailsDir = path.join(process.cwd(), 'art', 'artist thumbnails');
    
    // Check if directory exists
    if (!fs.existsSync(thumbnailsDir)) {
      console.error(`❌ Artist thumbnails directory not found: ${thumbnailsDir}`);
      return NextResponse.json(
        { error: `Artist thumbnails directory not found: ${thumbnailsDir}` },
        { status: 404 }
      );
    }

    console.log(`📁 Looking for thumbnails in: ${thumbnailsDir}`);

    let uploadCount = 0;
    let errorCount = 0;
    const results = [];

    for (const [filename, publicId] of Object.entries(artistThumbnails)) {
      const filePath = path.join(thumbnailsDir, filename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filename}`);
        results.push({ filename, status: 'not_found' });
        continue;
      }

      try {
        console.log(`📤 Uploading ${filename} as ${publicId}...`);
        
        const result = await cloudinary.uploader.upload(filePath, {
          public_id: publicId,
          folder: 'diy-booking/thumbnails/artists',
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'center' },
            { quality: 'auto', format: 'auto' }
          ]
        });

        console.log(`✅ Uploaded: ${result.secure_url}`);
        uploadCount++;
        results.push({ 
          filename, 
          publicId, 
          status: 'success', 
          url: result.secure_url 
        });
        
      } catch (error) {
        console.error(`❌ Failed to upload ${filename}:`, error);
        errorCount++;
        results.push({ 
          filename, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    console.log(`🎉 Upload complete! ✅ ${uploadCount} successful, ❌ ${errorCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Upload complete! ${uploadCount} successful, ${errorCount} failed`,
      uploadCount,
      errorCount,
      results,
      cloudinaryBaseUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/diy-booking/thumbnails/artists/`
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
} 
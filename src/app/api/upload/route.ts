import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'venue'; // Default to venue for backward compatibility
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate type
    if (!['venue', 'artist'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "venue" or "artist".' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Generate unique filename based on type
    const timestamp = Date.now();
    const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const filename = `${type}-${timestamp}.webp`; // venue-123.webp or artist-123.webp
    const thumbnailFilename = `${type}-${timestamp}-thumb.webp`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process main image with Sharp (optimize and resize if too large)
    const processedImage = await sharp(buffer)
      .resize({ 
        width: 1200, 
        height: 1200, 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Generate thumbnail (300x300)
    const thumbnail = await sharp(buffer)
      .resize(300, 300, { 
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Ensure thumbnails directory exists
    const thumbnailDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails');
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    // Prepare file paths
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', filename);
    const thumbnailPath = path.join(process.cwd(), 'public', 'uploads', 'thumbnails', thumbnailFilename);

    // Save main image
    await writeFile(uploadPath, processedImage);

    // Save thumbnail
    await writeFile(thumbnailPath, thumbnail);

    // Return the public URLs
    const imageUrl = `/uploads/${filename}`;
    const thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
    
    return NextResponse.json({ 
      success: true, 
      imageUrl,
      thumbnailUrl,
      filename,
      originalName: originalName
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 });
  }
} 
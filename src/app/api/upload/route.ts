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
    
    console.log('📤 Upload request:', { fileName: file?.name, fileSize: file?.size, type });
    
    if (!file) {
      console.error('❌ No file uploaded');
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
    const originalExtension = path.extname(file.name).toLowerCase();
    
    // Use .webp if Sharp processing succeeds, otherwise use original extension
    let filename = `${type}-${timestamp}.webp`;
    let thumbnailFilename = `${type}-${timestamp}-thumb.webp`;
    
    // We'll update these after processing if Sharp fails
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process main image with Sharp (optimize and resize if too large)
    let processedImage: Buffer;
    let thumbnail: Buffer;
    
    try {
      processedImage = await sharp(buffer)
        .resize({ 
          width: 1200, 
          height: 1200, 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ quality: 85 })
        .toBuffer();

      // Generate thumbnail (300x300)
      thumbnail = await sharp(buffer)
        .resize(300, 300, { 
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toBuffer();
        
      console.log('✅ Image processing successful');
    } catch (sharpError) {
      console.warn('⚠️ Sharp processing failed, using original image:', sharpError);
      // Fallback: use original image if Sharp fails
      processedImage = buffer;
      thumbnail = buffer;
      
      // Update filenames to use original extension
      filename = `${type}-${timestamp}${originalExtension}`;
      thumbnailFilename = `${type}-${timestamp}-thumb${originalExtension}`;
    }

    // Ensure upload directories exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const thumbnailDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails');
    
    if (!fs.existsSync(uploadDir)) {
      console.log('📁 Creating uploads directory');
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    if (!fs.existsSync(thumbnailDir)) {
      console.log('📁 Creating thumbnails directory');
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    // Prepare file paths
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', filename);
    const thumbnailPath = path.join(process.cwd(), 'public', 'uploads', 'thumbnails', thumbnailFilename);

    // Save main image
    try {
      await writeFile(uploadPath, processedImage);
      console.log('✅ Saved main image:', uploadPath);
    } catch (writeError) {
      console.error('❌ Failed to save main image:', writeError);
      throw new Error(`Failed to save image: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`);
    }

    // Save thumbnail
    try {
      await writeFile(thumbnailPath, thumbnail);
      console.log('✅ Saved thumbnail:', thumbnailPath);
    } catch (writeError) {
      console.error('❌ Failed to save thumbnail:', writeError);
      // Don't fail the entire upload if thumbnail fails
      console.warn('⚠️ Continuing without thumbnail');
    }

    // Return the public URLs
    const imageUrl = `/uploads/${filename}`;
    const thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
    
    console.log('🎉 Upload successful:', { imageUrl, thumbnailUrl });
    
    return NextResponse.json({ 
      success: true, 
      imageUrl,
      thumbnailUrl,
      filename,
      originalName: originalName
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload file';
    let errorDetails: string | undefined;
    
    if (error instanceof Error) {
      errorDetails = error.message;
      if (error.message.includes('sharp')) {
        errorMessage = 'Image processing failed. Please try a different image format.';
      } else if (error.message.includes('ENOENT')) {
        errorMessage = 'Upload directory not accessible. Please try again.';
      } else if (error.message.includes('EACCES')) {
        errorMessage = 'Permission denied. Please contact support.';
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 });
  }
} 
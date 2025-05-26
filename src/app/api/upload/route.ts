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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      console.warn('❌ Invalid file type:', file.type);
      return NextResponse.json({ 
        error: `Invalid file type: ${file.type}. Only JPG, PNG, WebP, and GIF are allowed.` 
      }, { status: 400 });
    }
    
    console.log('✅ File type validation passed:', file.type);

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
    
    console.log('📦 Buffer created:', { 
      size: buffer.length, 
      firstBytes: buffer.slice(0, 8).toString('hex'),
      isValidBuffer: buffer.length > 0
    });

    // Process main image with Sharp (optimize and resize if too large)
    let processedImage: Buffer;
    let thumbnail: Buffer;
    
    try {
      // First, try to get image metadata to validate the format
      const metadata = await sharp(buffer).metadata();
      console.log('📊 Image metadata:', { 
        format: metadata.format, 
        width: metadata.width, 
        height: metadata.height,
        channels: metadata.channels
      });
      
      // Process the image
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
      
      // Try a more basic Sharp operation to see if the image is valid at all
      try {
        const basicMetadata = await sharp(buffer).metadata();
        console.log('📊 Basic metadata successful:', basicMetadata.format);
        
        // If metadata works, try without WebP conversion
        processedImage = await sharp(buffer)
          .resize({ 
            width: 1200, 
            height: 1200, 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .toBuffer();
          
        thumbnail = await sharp(buffer)
          .resize(300, 300, { 
            fit: 'cover',
            position: 'center'
          })
          .toBuffer();
          
        console.log('✅ Image processing successful without WebP conversion');
      } catch (basicError) {
        console.error('❌ Even basic Sharp processing failed:', basicError);
        // Complete fallback: use original image
        processedImage = buffer;
        thumbnail = buffer;
        
        // Update filenames to use original extension
        filename = `${type}-${timestamp}${originalExtension}`;
        thumbnailFilename = `${type}-${timestamp}-thumb${originalExtension}`;
      }
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

    // Check if we're in a serverless environment (read-only filesystem)
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;
    
    if (isServerless) {
      console.warn('🚨 Serverless environment detected - file uploads not supported');
      return NextResponse.json({ 
        error: 'File uploads are not supported in serverless environments. Please configure cloud storage (AWS S3, Cloudinary, etc.) for production use.',
        details: 'The application is running in a serverless environment where the filesystem is read-only. You need to integrate with a cloud storage service to enable file uploads.'
      }, { status: 501 });
    }

    // Save main image
    try {
      await writeFile(uploadPath, processedImage);
      console.log('✅ Saved main image:', uploadPath);
    } catch (writeError) {
      console.error('❌ Failed to save main image:', writeError);
      
      // Check if it's a read-only filesystem error
      if (writeError instanceof Error && (
        writeError.message.includes('EROFS') || 
        writeError.message.includes('read-only') ||
        writeError.message.includes('EACCES')
      )) {
        return NextResponse.json({ 
          error: 'File uploads are not supported in this environment. Please configure cloud storage for production use.',
          details: 'The filesystem is read-only. You need to integrate with a cloud storage service like AWS S3, Cloudinary, or similar.'
        }, { status: 501 });
      }
      
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
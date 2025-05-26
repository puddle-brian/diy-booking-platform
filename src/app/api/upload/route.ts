import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    // Validate file size (10MB max for Cloudinary)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary not configured');
      return NextResponse.json({ 
        error: 'Cloud storage not configured. Please set up Cloudinary environment variables.',
        details: 'Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET'
      }, { status: 500 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log('📦 Buffer created:', { 
      size: buffer.length, 
      isValidBuffer: buffer.length > 0
    });

    // Generate unique public ID
    const timestamp = Date.now();
    const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const publicId = `diy-booking/${type}s/${timestamp}-${originalName}`;

    // Upload to Cloudinary with automatic optimization
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: publicId,
          folder: `diy-booking/${type}s`,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ],
          eager: [
            { width: 300, height: 300, crop: 'fill', gravity: 'center' } // Generate thumbnail
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload successful:', result?.public_id);
            resolve(result);
          }
        }
      ).end(buffer);
    });

    const result = uploadResult as any;
    
    // Get the URLs
    const imageUrl = result.secure_url;
    const thumbnailUrl = result.eager?.[0]?.secure_url || imageUrl;
    
    console.log('🎉 Upload successful:', { imageUrl, thumbnailUrl, publicId: result.public_id });
    
    return NextResponse.json({ 
      success: true, 
      imageUrl,
      thumbnailUrl,
      filename: result.public_id,
      originalName: originalName,
      cloudinaryData: {
        publicId: result.public_id,
        version: result.version,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload file';
    let errorDetails: string | undefined;
    
    if (error instanceof Error) {
      errorDetails = error.message;
      if (error.message.includes('Invalid image file')) {
        errorMessage = 'Invalid image file. Please try a different image.';
      } else if (error.message.includes('File size too large')) {
        errorMessage = 'File too large. Please try a smaller image.';
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = 'Cloud storage authentication failed. Please contact support.';
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
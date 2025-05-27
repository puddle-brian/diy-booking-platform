import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Temporary hardcoded configuration for testing
cloudinary.config({
  cloud_name: 'dfytetsz3',
  api_key: '659739423488389',
  api_secret: 'RS5dQ8HNUGcYzjlq-6AjXn9L0EY'
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing hardcoded Cloudinary configuration');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'venue';
    
    console.log('📤 Upload request:', { fileName: file?.name, fileSize: file?.size, type });
    
    if (!file) {
      console.error('❌ No file uploaded');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    console.log('✅ File type validation passed:', file.type);

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size);
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    console.log('✅ File size validation passed:', file.size);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('🔄 Uploading to Cloudinary...');

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: `diy-booking/${type}s`,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto', format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload success:', result?.public_id);
            resolve(result);
          }
        }
      ).end(buffer);
    });

    console.log('🎉 Upload completed successfully');

    return NextResponse.json({
      success: true,
      imageUrl: (uploadResult as any).secure_url,
      url: (uploadResult as any).secure_url,
      publicId: (uploadResult as any).public_id,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
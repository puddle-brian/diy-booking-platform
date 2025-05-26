# Cloud Storage Setup for Production

## Problem
File uploads don't work in serverless environments (like Vercel) because the filesystem is read-only. You need to use cloud storage for production deployments.

## Recommended Solutions

### Option 1: Cloudinary (Easiest)
Cloudinary provides image upload, processing, and CDN services.

1. **Sign up**: Create account at [cloudinary.com](https://cloudinary.com)
2. **Get credentials**: Copy your Cloud Name, API Key, and API Secret
3. **Install SDK**: `npm install cloudinary`
4. **Environment variables**:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

5. **Update upload API** (`src/app/api/upload/route.ts`):
   ```typescript
   import { v2 as cloudinary } from 'cloudinary';

   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET,
   });

   // Replace file saving with:
   const result = await cloudinary.uploader.upload_stream(
     {
       resource_type: 'image',
       folder: `diy-booking/${type}s`,
       transformation: [
         { width: 1200, height: 1200, crop: 'limit' },
         { quality: 'auto', fetch_format: 'auto' }
       ]
     },
     (error, result) => {
       if (error) throw error;
       return result;
     }
   );
   ```

### Option 2: AWS S3
More control but requires more setup.

1. **Create S3 bucket**
2. **Install SDK**: `npm install @aws-sdk/client-s3`
3. **Environment variables**:
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   ```

### Option 3: Vercel Blob (Vercel-specific)
If deploying to Vercel specifically.

1. **Install**: `npm install @vercel/blob`
2. **Environment**: Vercel automatically provides blob storage
3. **Usage**: Replace file operations with Vercel Blob API

## Development vs Production

- **Development**: Use `npm run dev` - file uploads work locally
- **Production**: Must use cloud storage - local filesystem is read-only

## Current Status
The app currently detects serverless environments and shows a helpful error message directing users to configure cloud storage.

## Quick Fix for Testing
If you just want to test the app without uploads:
1. Use `npm run dev` for development (uploads work)
2. For production testing, uploads will show an informative error
3. All other features work normally without uploads 
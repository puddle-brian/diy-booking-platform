const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Venue thumbnail mappings (filename to cloudinary public_id)
const venueThumbnails = {
  'house-show.png': 'house-show',
  'community-space.png': 'community-space',
  'record-store.png': 'record-store',
  'vfw-hall.png': 'vfw-hall',
  'arts-center.png': 'arts-center',
  'warehouse.png': 'warehouse',
  'bar.png': 'bar',
  'club.png': 'club',
  'theater.png': 'theater',
  'coffee-shop.png': 'coffee-shop',
  'bookstore.png': 'bookstore',
  'gallery.png': 'gallery',
  'library.png': 'library',
  'park.png': 'park',
  'basement.png': 'basement',
  'loft.png': 'loft',
  'church.png': 'church',
  'brewery.png': 'brewery',
  'rooftop.png': 'rooftop',
  'restaurant.png': 'restaurant',
  'other.png': 'other'
};

async function uploadVenueThumbnails() {
  console.log('🏢 Starting venue thumbnail upload to Cloudinary...\n');

  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary not configured. Please set environment variables:');
    console.error('   CLOUDINARY_CLOUD_NAME');
    console.error('   CLOUDINARY_API_KEY');
    console.error('   CLOUDINARY_API_SECRET');
    console.error('\nSee CLOUDINARY_SETUP.md for instructions.');
    process.exit(1);
  }

  const thumbnailsDir = path.join(__dirname, '..', 'art', 'venue thumbnails');
  
  // Check if directory exists
  if (!fs.existsSync(thumbnailsDir)) {
    console.error(`❌ Venue thumbnails directory not found: ${thumbnailsDir}`);
    process.exit(1);
  }

  console.log(`📁 Looking for thumbnails in: ${thumbnailsDir}\n`);

  let uploadCount = 0;
  let errorCount = 0;

  for (const [filename, publicId] of Object.entries(venueThumbnails)) {
    const filePath = path.join(thumbnailsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filename}`);
      continue;
    }

    try {
      console.log(`📤 Uploading ${filename} as ${publicId}...`);
      
      const result = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        folder: 'diy-booking/thumbnails/venues',
        overwrite: true,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'center' },
          { quality: 'auto', format: 'auto' }
        ]
      });

      console.log(`✅ Uploaded: ${result.secure_url}`);
      uploadCount++;
      
    } catch (error) {
      console.error(`❌ Failed to upload ${filename}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n🎉 Upload complete!`);
  console.log(`✅ Successfully uploaded: ${uploadCount} thumbnails`);
  if (errorCount > 0) {
    console.log(`❌ Failed uploads: ${errorCount}`);
  }
  
  console.log(`\n🔗 Your venue thumbnails are now available at:`);
  console.log(`   https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/diy-booking/thumbnails/venues/[type]`);
  console.log(`\n🏢 Venue thumbnails are ready to use!`);
}

// Run the upload
uploadVenueThumbnails().catch(console.error); 
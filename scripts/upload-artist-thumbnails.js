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

// Artist thumbnail mappings (filename to cloudinary public_id)
const artistThumbnails = {
  'band.png': 'band',
  'solo artist.png': 'solo-artist',
  'duo.png': 'duo',
  'collective.png': 'collective',
  'singer songwriter.png': 'singer-songwriter',
  'rapper.png': 'rapper',
  'dj.png': 'dj',
  'comedian.png': 'comedian',
  'poet.png': 'poet',
  'storyteller.png': 'storyteller',
  'dancer.png': 'dancer',
  'magician.png': 'magician',
  'lecturer.png': 'lecturer',
  'theater group.png': 'theater-group',
  'noise artist.png': 'noise-artist',
  'other.png': 'other'
};

async function uploadArtistThumbnails() {
  console.log('🎵 Starting artist thumbnail upload to Cloudinary...\n');

  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary not configured. Please set environment variables:');
    console.error('   CLOUDINARY_CLOUD_NAME');
    console.error('   CLOUDINARY_API_KEY');
    console.error('   CLOUDINARY_API_SECRET');
    console.error('\nSee CLOUDINARY_SETUP.md for instructions.');
    process.exit(1);
  }

  const thumbnailsDir = path.join(__dirname, '..', 'art', 'artist thumbnails');
  
  // Check if directory exists
  if (!fs.existsSync(thumbnailsDir)) {
    console.error(`❌ Artist thumbnails directory not found: ${thumbnailsDir}`);
    process.exit(1);
  }

  console.log(`📁 Looking for thumbnails in: ${thumbnailsDir}\n`);

  let uploadCount = 0;
  let errorCount = 0;

  for (const [filename, publicId] of Object.entries(artistThumbnails)) {
    const filePath = path.join(thumbnailsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filename}`);
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
  
  console.log(`\n🔗 Your artist thumbnails are now available at:`);
  console.log(`   https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/diy-booking/thumbnails/artists/[type]`);
  console.log(`\n🎵 Artist thumbnails are ready to use!`);
}

// Run the upload
uploadArtistThumbnails().catch(console.error); 
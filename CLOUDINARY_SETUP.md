# 🚀 Cloudinary Setup Guide

## Step 1: Create Free Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up for Free"**
3. Fill out the form (no credit card required!)
4. Verify your email

## Step 2: Get Your Credentials

After signing up, you'll see your **Dashboard** with these credentials:

```
Cloud Name: your-cloud-name
API Key: 123456789012345
API Secret: your-secret-key-here
```

## Step 3: Add to Environment Variables

Create/update your `.env.local` file with:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-secret-key-here
```

## Step 4: Test Upload

1. Run `npm run dev`
2. Go to `/admin/venues` or `/admin/artists`
3. Try uploading an image!

## ✅ What You Get FREE:

- **25 GB storage** (thousands of images!)
- **25 GB bandwidth/month**
- **Automatic image optimization**
- **Global CDN delivery**
- **Automatic thumbnails**
- **WebP conversion**
- **Responsive images**

Perfect for your early-stage network building! 🎉 
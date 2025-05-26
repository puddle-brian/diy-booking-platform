#!/bin/bash

# Clean deployment script
echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building application..."
npm run build

echo "🚀 Deploying to Vercel..."
npx vercel --prod --yes 
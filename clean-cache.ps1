#!/usr/bin/env pwsh
# Next.js Cache Cleanup Script for Windows
# Run this whenever you experience cache corruption

Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Yellow

# Kill any running Node processes to release file locks
try {
    taskkill /f /im node.exe 2>$null
    Write-Host "✅ Node processes terminated" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No Node processes running" -ForegroundColor Blue
}

# Remove build artifacts
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# Remove Prisma cache (important for Neon DB)
Remove-Item -Recurse -Force node_modules/.prisma -ErrorAction SilentlyContinue

Write-Host "✅ Cache cleaned successfully!" -ForegroundColor Green

# Regenerate Prisma client for Neon
Write-Host "🔄 Regenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "🎉 Ready for development!" -ForegroundColor Green

Write-Host ""
Write-Host "💡 Tips to prevent future corruption:" -ForegroundColor Cyan
Write-Host "   • Close browser tabs when not needed" -ForegroundColor White
Write-Host "   • Don't run multiple dev servers simultaneously" -ForegroundColor White
Write-Host "   • Use 'npm run clean-start' instead of 'npm run dev'" -ForegroundColor White
Write-Host "   • Restart your computer if issues persist" -ForegroundColor White 
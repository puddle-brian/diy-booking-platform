#!/usr/bin/env pwsh
# Next.js Cache Cleanup Script for Windows
# Run this whenever you experience cache corruption

Write-Host "🧹 Starting comprehensive Next.js cache cleanup..." -ForegroundColor Cyan

# 1. Kill all Node.js processes
Write-Host "1. Killing all Node.js processes..." -ForegroundColor Yellow
try {
    taskkill /f /im node.exe 2>$null
    Write-Host "   ✅ Node processes terminated" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  No Node processes to kill" -ForegroundColor DarkYellow
}

# 2. Remove .next directory
Write-Host "2. Removing .next directory..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "   ✅ .next directory removed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .next directory not found" -ForegroundColor DarkYellow
}

# 3. Remove all cache directories
Write-Host "3. Removing additional cache files..." -ForegroundColor Yellow
$cacheDirs = @(
    "node_modules\.cache",
    ".swc",
    ".turbo",
    "tsconfig.tsbuildinfo",
    ".eslintcache"
)

foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "   ✅ Removed $dir" -ForegroundColor Green
    }
}

# 4. Clean npm cache
Write-Host "4. Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null
Write-Host "   ✅ npm cache cleaned" -ForegroundColor Green

# 5. Clean yarn cache (if exists)
if (Get-Command yarn -ErrorAction SilentlyContinue) {
    Write-Host "5. Cleaning yarn cache..." -ForegroundColor Yellow
    yarn cache clean 2>$null
    Write-Host "   ✅ yarn cache cleaned" -ForegroundColor Green
}

# 6. Clean Windows temp files
Write-Host "6. Cleaning Windows temp files..." -ForegroundColor Yellow
$tempPath = $env:TEMP
if (Test-Path "$tempPath\next-*") {
    Remove-Item -Recurse -Force "$tempPath\next-*" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Next.js temp files cleaned" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Cache cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tips to prevent future corruption:" -ForegroundColor Cyan
Write-Host "   • Close browser tabs when not needed" -ForegroundColor White
Write-Host "   • Don't run multiple dev servers simultaneously" -ForegroundColor White
Write-Host "   • Use 'npm run clean-start' instead of 'npm run dev'" -ForegroundColor White
Write-Host "   • Restart your computer if issues persist" -ForegroundColor White 
# TriniBuild Quick Start Script
# Run this after cloning the repository

Write-Host "🚀 TriniBuild Quick Start Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Step 1: Check if .env.local exists
Write-Host "📋 Step 1: Checking environment configuration..." -ForegroundColor Yellow

if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file exists" -ForegroundColor Green
    
    # Check if it has required variables
    $envContent = Get-Content ".env.local" -Raw
    $hasUrl = $envContent -match "VITE_SUPABASE_URL"
    $hasKey = $envContent -match "VITE_SUPABASE_ANON_KEY"
    
    if ($hasUrl -and $hasKey) {
        Write-Host "✅ Supabase credentials configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Missing Supabase credentials in .env.local" -ForegroundColor Yellow
        Write-Host "   Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    Write-Host "   Creating from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "✅ Created .env.local from .env.example" -ForegroundColor Green
        Write-Host "⚠️  Please edit .env.local and add your Supabase credentials" -ForegroundColor Yellow
    } else {
        Write-Host "❌ .env.example not found" -ForegroundColor Red
    }
}

Write-Host ""

# Step 2: Check node_modules
Write-Host "📦 Step 2: Checking dependencies..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Running npm install..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

Write-Host ""

# Step 3: Database setup instructions
Write-Host "🗄️  Step 3: Database Setup Required" -ForegroundColor Yellow
Write-Host "   1. Open Supabase SQL Editor:" -ForegroundColor White
Write-Host "      https://app.supabase.com/project/cdprbbyptjdntcrhmwxf/sql/new" -ForegroundColor Cyan
Write-Host "   2. Copy contents of: supabase/COMPLETE_DATABASE_SETUP.sql" -ForegroundColor White
Write-Host "   3. Paste and run in SQL Editor" -ForegroundColor White
Write-Host "   4. Wait for 'Database setup complete! ✅' message" -ForegroundColor White

Write-Host ""

# Step 4: Start dev server
Write-Host "🚀 Step 4: Starting development server..." -ForegroundColor Yellow
Write-Host "   Server will start on: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Admin dashboard: http://localhost:3000/#/admin/bypass" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Gray

# Start the server
npm run dev

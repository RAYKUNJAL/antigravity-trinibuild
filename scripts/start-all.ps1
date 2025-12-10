Write-Host "🚀 Starting TriniBuild Full Stack Environment..." -ForegroundColor Cyan

# 1. Start Frontend (Vite)
Write-Host "1️⃣  Launching Frontend (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory "$PSScriptRoot\.."

# 2. Start Backend API (Express)
if (Test-Path "$PSScriptRoot\..\backend") {
    Write-Host "2️⃣  Launching Backend API (Port 5000)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "echo 'Starting Backend...'; npm install; npm run dev" -WorkingDirectory "$PSScriptRoot\..\backend"
}
else {
    Write-Host "❌ Backend folder not found!" -ForegroundColor Red
}

# 3. Start AI Server (Python)
if (Test-Path "$PSScriptRoot\..\ai_server") {
    Write-Host "3️⃣  Launching AI Server (Port 8000)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "echo 'Starting AI Server...'; pip install -r requirements.txt; python main.py" -WorkingDirectory "$PSScriptRoot\..\ai_server"
}
else {
    Write-Host "❌ AI Server folder not found!" -ForegroundColor Red
}

Write-Host "`n✅ All services initiated in separate windows!" -ForegroundColor Yellow
Write-Host "👉 Ensure you have Node.js and Python installed."
Write-Host "👉 Monitor the new windows for startup errors."
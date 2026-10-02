Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    ADA SYSTEM v2.0 - Launching Fullstack System" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "Starting Node.js Express Backend on http://localhost:5000..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$scriptPath\backend`" && npm start"

Start-Sleep -Seconds 2

Write-Host "Starting Vue.js Vite Frontend on http://localhost:3000..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$scriptPath\frontend`" && npm run dev"

Start-Sleep -Seconds 3

Write-Host "Opening web browser at http://localhost:3000..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

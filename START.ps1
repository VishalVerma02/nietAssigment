Write-Host "====================================================`n     NIET Assignment Tracker - Startup Script`n====================================================" -ForegroundColor Cyan

Write-Host "`nStarting Backend Server on port 5000..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd backend && npm run dev"

Start-Sleep -Seconds 3

Write-Host "`nStarting Frontend Server on port 3001..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd frontend && npm run dev"

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "Both servers starting...`n" -ForegroundColor Green
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3001`n" -ForegroundColor Cyan
Write-Host "Open http://localhost:3001/login.html in your browser" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan

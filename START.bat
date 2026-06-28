@echo off
setlocal
cd /d "%~dp0"

echo ====================================================
echo  NIET Assignment Tracker - Starting All Services
echo ====================================================
echo.

REM ---- STEP 1: Check and Start MySQL ----
echo [1/3] Checking MySQL...
netstat -ano | findstr :3306 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo      MySQL is not running. Starting XAMPP MySQL...
    start "" /min cmd /c "cd /d C:\xampp && mysql\bin\mysqld --defaults-file=mysql\bin\my.ini --standalone 2>&1"
    
    echo      Waiting for MySQL to initialize...
    ping 127.0.0.1 -n 7 >nul
    
    netstat -ano | findstr :3306 | findstr LISTENING >nul 2>&1
    if errorlevel 1 (
        echo.
        echo =====================================================
        echo  WARNING: MySQL could not start automatically!
        echo  Please open XAMPP Control Panel and click
        echo  "Start" button next to MySQL.
        echo =====================================================
        ping 127.0.0.1 -n 4 >nul
    ) else (
        echo      MySQL started successfully!
    )
) else (
    echo      MySQL is already running. OK
)

echo.

REM ---- STEP 2: Kill old Node servers ----
echo [2/3] Clearing old server processes...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
ping 127.0.0.1 -n 3 >nul
echo      Done.

echo.

REM ---- STEP 3: Start Backend and Frontend in separate windows ----
echo [3/3] Starting servers...
start "NIET Backend Server (Port 5000)" cmd /k "cd backend && npm run dev"
ping 127.0.0.1 -n 4 >nul

start "NIET Frontend Server (Port 3001)" cmd /k "cd frontend && npm run dev"
ping 127.0.0.1 -n 3 >nul

echo.
echo ====================================================
echo  ALL SERVICES STARTED SUCCESSFULLY!
echo.
echo  Open in browser:
echo  http://localhost:3001/login.html
echo.
echo  Keep the two server windows open to keep the app running.
echo ====================================================
echo.
pause

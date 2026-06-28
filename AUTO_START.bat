@echo off
setlocal

REM ======================================================
REM NIET Assignment Tracker - Complete Auto Start Script
REM Starts MySQL + Backend + Frontend automatically
REM ======================================================

set PROJECT_DIR=c:\Users\visha\OneDrive\Desktop\new Project
set XAMPP_DIR=C:\xampp

echo ====================================================
echo  NIET Assignment Tracker - Starting All Services
echo ====================================================
echo.

REM ---- STEP 1: Check and Start MySQL ----
echo [1/3] Checking MySQL...
netstat -ano | findstr :3306 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo      MySQL is not running. Starting XAMPP MySQL...
    
    REM Try starting via XAMPP xampp_start or direct mysqld
    start "" /min cmd /c "cd /d %XAMPP_DIR% && mysql\bin\mysqld --defaults-file=mysql\bin\my.ini --standalone 2>&1"
    
    echo      Waiting for MySQL to initialize...
    ping 127.0.0.1 -n 7 >nul
    
    REM Check again
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

REM ---- STEP 3: Start Backend ----
echo [3/3] Starting Backend server (port 5000)...
start "" /min cmd /c "cd /d "%PROJECT_DIR%\backend" && node server.js > backend.log 2>&1"
ping 127.0.0.1 -n 4 >nul

REM ---- STEP 4: Start Frontend ----
echo      Starting Frontend server (port 3001)...
start "" /min cmd /c "cd /d "%PROJECT_DIR%\frontend" && node server.js"
ping 127.0.0.1 -n 3 >nul

echo.
echo ====================================================
echo  ALL SERVICES STARTED SUCCESSFULLY!
echo.
echo  Open in browser:
echo  http://localhost:3001/login.html
echo.
echo  Login credentials:
echo  Admin:   admin@gmail.com  /  admin@123
echo  Student: raj@niet.com     /  student@123
echo ====================================================
echo.
echo This window will close in 5 seconds...
ping 127.0.0.1 -n 6 >nul
exit

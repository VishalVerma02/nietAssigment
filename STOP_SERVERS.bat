@echo off
title STOP_SERVERS - NIET Assignment Tracker
echo ====================================================
echo Stopping NIET Assignment Tracker Servers...
echo ====================================================
echo.

REM Kill process on port 5000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Found process %%a on port 5000. Killing...
    taskkill /f /pid %%a >nul 2>&1
)

REM Kill process on port 3001 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Found process %%a on port 3001. Killing...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo ====================================================
echo Servers stopped successfully!
echo ====================================================
echo.
pause

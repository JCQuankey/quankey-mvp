@echo off
REM ===============================================================================
REM 🎥 QUANKEY INVESTOR DEMO - SCREENCAST RECORDING SCRIPT
REM ===============================================================================
REM 
REM CRITICAL: Script para grabar demo en vivo para inversores
REM 
REM Requirements:
REM - OBS Studio installed
REM - Chrome browser
REM - Node.js for demo script
REM - All Quankey services running

echo.
echo 🎬 QUANKEY INVESTOR DEMO - SCREENCAST SETUP
echo ============================================
echo.

REM Check if required services are running
echo 📋 Checking service status...

REM Check if backend is running
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend not running on localhost:5000
    echo 🚀 Starting backend...
    cd /d "%~dp0\..\backend"
    start "Backend" cmd /k "npm run dev"
    timeout /t 5 /nobreak >nul
    echo ✅ Backend started
) else (
    echo ✅ Backend running on localhost:5000
)

REM Check if frontend is running  
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Frontend not running on localhost:3001
    echo 🚀 Starting frontend...
    cd /d "%~dp0\..\frontend"
    start "Frontend" cmd /k "npm start"
    timeout /t 10 /nobreak >nul
    echo ✅ Frontend started
) else (
    echo ✅ Frontend running on localhost:3001
)

echo.
echo 📊 Opening metrics dashboard...
start "" "chrome.exe" --new-window --app="file:///%~dp0metrics-dashboard.html"
timeout /t 3 /nobreak >nul

echo.
echo 🎯 Opening demo applications...
start "" "chrome.exe" --new-tab "http://localhost:3001"
start "" "chrome.exe" --new-tab "http://localhost:3001/security"
timeout /t 3 /nobreak >nul

echo.
echo 🎥 RECORDING SETUP INSTRUCTIONS:
echo ============================================
echo.
echo 1. OBS Studio Setup:
echo    - Scene: "Quankey Demo"
echo    - Source: Display Capture (Full Screen)
echo    - Resolution: 1920x1080 60fps
echo    - Audio: Desktop Audio + Microphone
echo.
echo 2. Chrome Windows:
echo    - Window 1: Metrics Dashboard (Real-time)
echo    - Window 2: Quankey App (localhost:3001)
echo    - Window 3: Security Dashboard
echo.
echo 3. Recording Checklist:
echo    ✅ Audio levels tested
echo    ✅ Screen capture working
echo    ✅ All browser windows positioned
echo    ✅ Demo script ready
echo    ✅ Narration script prepared
echo.

pause

echo.
echo 🎬 Starting demo execution in 10 seconds...
echo ============================================
echo.
echo Get ready to start OBS recording!
echo.

REM Countdown
for /l %%i in (10,-1,1) do (
    echo Starting in %%i seconds...
    timeout /t 1 /nobreak >nul
)

echo.
echo 🚀 STARTING DEMO EXECUTION...
echo ============================================

REM Run the investor demo script
cd /d "%~dp0"
node run-investor-demo.js

echo.
echo 🎉 DEMO EXECUTION COMPLETED!
echo ============================================
echo.
echo 📁 Next steps:
echo 1. Stop OBS recording
echo 2. Review recorded video
echo 3. Edit if necessary (intro/outro)
echo 4. Export final video for investors
echo.
echo 📊 Demo results saved to: demo-results.json
echo 🎥 Video should be saved to OBS output folder
echo.

pause

echo.
echo 🔄 Cleanup: Stopping demo services...
taskkill /f /im chrome.exe >nul 2>&1
echo ✅ Chrome windows closed

echo.
echo 🎊 SCREENCAST RECORDING COMPLETE!
echo Ready for investor presentations!
echo.

pause
@echo off
title ADA System v2.0 Launcher (Vue.js + Node.js)
echo ===================================================
echo     ADA SYSTEM v2.0 - Starting Fullstack Server
echo ===================================================
echo.
echo Starting Backend (Node.js/Express on http://localhost:5000)
echo Starting Frontend (Vue.js/Vite on http://localhost:3000)
echo.

start "ADA Backend (Node.js)" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 2 /nobreak >nul

start "ADA Frontend (Vue.js)" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:3000...
start http://localhost:3000
echo.
echo ADA System v2.0 is running!

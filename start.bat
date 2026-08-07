@echo off
title VELORA Launcher

echo =====================================
echo        Starting VELORA...
echo =====================================
echo.

set ROOT=%~dp0

echo Starting API...
start "VELORA API" cmd /k "cd /d "%ROOT%apps\api" && pnpm dev"

timeout /t 3 /nobreak >nul

echo Starting Web...
start "VELORA WEB" cmd /k "cd /d "%ROOT%apps\web" && pnpm dev"

echo.
echo =====================================
echo Servers are starting...
echo.
echo API:  http://localhost:4000
echo Web:  http://localhost:3000
echo =====================================

pause
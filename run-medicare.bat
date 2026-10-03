@echo off
title MediCare Pro - Live Health Server
echo ============================================================
echo   MediCare Pro - Live Health Platform (100%% Real Data)
echo ============================================================
echo Starting local server on http://127.0.0.1:3000 ...
echo Opening Microsoft Edge browser...
timeout /t 2 /nobreak >nul
start msedge "http://127.0.0.1:3000/dashboard/dashboard.html"
python dev-server.py
pause

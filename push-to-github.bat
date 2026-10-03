
@echo off
title Push MediCare Pro to Private GitHub
echo ============================================================
echo   Pushing MediCare Pro to https://github.com/karthiGcse/MediCare-Pro
echo ============================================================
git push -u origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] MediCare Pro successfully pushed to your private GitHub repo!
) else (
    echo.
    echo [INFO] If it asks for credentials, sign in via browser or Personal Access Token.
)
echo.
pause

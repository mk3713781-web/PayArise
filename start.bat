@echo off
title PayArise Project Launcher

echo ===============================
echo    Starting PayArise System
echo ===============================
echo.

REM ---- 1) ACTIVATE BACKEND ----
echo Starting backend server...
cd backend
call venv\Scripts\activate
start cmd /k "python app.py"
cd..

echo Backend running at: http://127.0.0.1:5000/predict
echo.

REM ---- 2) START FRONTEND ----
echo Starting frontend server...
cd frontend
start cmd /k "python -m http.server 8000"
cd..

echo Frontend running at: http://127.0.0.1:8000
echo.

REM ---- 3) WAIT A MOMENT
timeout /t 2 >nul

REM ---- 4) AUTO-OPEN BROWSER ----
echo Opening PayArise in browser...
start http://127.0.0.1:8000/mobile/mobile.html

echo.
echo ===============================
echo   PayArise is Ready ✓
echo ===============================

pause

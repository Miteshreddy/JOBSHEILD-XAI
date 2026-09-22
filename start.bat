@echo off
setlocal EnableDelayedExpansion
title JobShield XAI - Starting...
cd /d "%~dp0"

echo.
echo ================================================================
echo   JobShield XAI - Explainable Fake Job Detection (FraudBERT)
echo ================================================================
echo.

:: ════════════════════════════════════════════════════════════════
:: STEP 1 — Check Python
:: ════════════════════════════════════════════════════════════════
echo [CHECK] Python...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Python not found in PATH.
    echo  Install Python 3.10+ from: https://www.python.org/downloads/
    echo  IMPORTANT: check "Add Python to PATH" during install.
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo  Found: %PYVER%

:: ════════════════════════════════════════════════════════════════
:: STEP 2 — Check Node.js / npm
:: ════════════════════════════════════════════════════════════════
echo [CHECK] Node.js and npm...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Node.js not found in PATH.
    echo  Install Node.js 20 LTS from: https://nodejs.org/en/download
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node -v 2^>^&1') do set NODEVER=%%v
for /f "tokens=*" %%v in ('npm -v 2^>^&1') do set NPMVER=%%v
echo  Found: Node.js %NODEVER%  /  npm %NPMVER%

:: ════════════════════════════════════════════════════════════════
:: STEP 3 — Python virtual environment
:: ════════════════════════════════════════════════════════════════
echo.
if not exist "ai_service\.venv\Scripts\python.exe" (
    echo [SETUP] Creating Python virtual environment...
    python -m venv ai_service\.venv
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to create Python venv. Check your Python installation.
        pause & exit /b 1
    )
    echo  [OK] Virtual environment created.
    echo.
    echo [SETUP] Installing Python dependencies (torch, fastapi, transformers...)
    echo  This takes 5-15 minutes on first run. Please wait.
    echo.
    call ai_service\.venv\Scripts\activate.bat
    python -m pip install --upgrade pip --quiet
    pip install -r ai_service\requirements.txt
    if %errorlevel% neq 0 (
        echo.
        echo  [WARN] Some packages may have failed. The AI service might not start.
        echo  You can re-run start.bat to retry.
    )
    call deactivate
    echo  [OK] Python packages installed.
) else (
    echo [CHECK] Python venv ... OK
)

:: ════════════════════════════════════════════════════════════════
:: STEP 4 — Backend npm packages
:: ════════════════════════════════════════════════════════════════
echo.
if not exist "backend\node_modules\express" (
    echo [SETUP] Installing backend npm packages...
    cd backend
    call npm install --prefer-offline 2>nul || call npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to install backend npm packages.
        cd ..
        pause & exit /b 1
    )
    cd ..
    echo  [OK] Backend packages installed.
) else (
    echo [CHECK] Backend node_modules ... OK
)

:: ════════════════════════════════════════════════════════════════
:: STEP 5 — Frontend npm packages (ensures .cmd shims are created)
:: ════════════════════════════════════════════════════════════════
echo.
if not exist "frontend\node_modules\.bin\vite.cmd" (
    echo [SETUP] Installing frontend npm packages (vite, react, tailwind...)
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to install frontend npm packages.
        cd ..
        pause & exit /b 1
    )
    cd ..
    echo  [OK] Frontend packages installed.
) else (
    echo [CHECK] Frontend node_modules ... OK
)

:: ════════════════════════════════════════════════════════════════
:: STEP 6 — .env files
:: ════════════════════════════════════════════════════════════════
echo.
echo [CHECK] Config files (.env)...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo  Created backend\.env
    )
)
if not exist "ai_service\.env" (
    if exist "ai_service\.env.example" (
        copy "ai_service\.env.example" "ai_service\.env" >nul
        echo  Created ai_service\.env
    )
)
echo  [OK] Config files ready.

:: ════════════════════════════════════════════════════════════════
:: STEP 7 — Launch all services via launch.py
:: ════════════════════════════════════════════════════════════════
echo.
echo ================================================================
echo   All checks passed. Launching services...
echo   - AI Service   : http://localhost:8000
echo   - Backend API  : http://localhost:5001
echo   - Frontend App : http://localhost:5173  (opens in browser)
echo.
echo   MongoDB must be running for login/register to work.
echo   Install from: https://www.mongodb.com/try/download/community
echo   (Install as Windows Service so it starts automatically)
echo ================================================================
echo.
echo  Press Ctrl+C at any time to stop all services.
echo.

python "%~dp0launch.py"

echo.
echo  All services have stopped.
pause
endlocal

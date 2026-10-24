@echo off
rem ================================================================
rem  JobShield - double-click this file to run.
rem  First run: installs everything (Python, Node.js, Ollama, the
rem  qwen3.5:4b reasoning model, all packages) and opens the site.
rem  Later runs: starts in seconds at http://localhost:5001
rem ================================================================
setlocal
cd /d "%~dp0"
title JobShield

if not exist ".jobshield-installed" goto :install
if not exist "ai_service\.venv\Scripts\python.exe" goto :install
if not exist "backend\node_modules\express" goto :install
if not exist "frontend\dist\index.html" goto :install

rem Installed: launch.py starts Ollama if needed and re-downloads the
rem reasoning model in the background if it has gone missing.
"ai_service\.venv\Scripts\python.exe" launch.py
if errorlevel 1 pause
exit /b %errorlevel%

:install
echo JobShield isn't fully installed on this PC yet - running setup ^(first run only^)...
echo.
call "%~dp0setup.bat"
exit /b %errorlevel%

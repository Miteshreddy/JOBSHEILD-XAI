@echo off
rem Starts JobShield after setup.bat has been run once.
cd /d "%~dp0"
if not exist "ai_service\.venv\Scripts\python.exe" (
    echo JobShield isn't installed yet - running setup first...
    call setup.bat
    exit /b %errorlevel%
)
title JobShield
"ai_service\.venv\Scripts\python.exe" launch.py

@echo off
setlocal EnableExtensions EnableDelayedExpansion
title JobShield setup
cd /d "%~dp0"

echo.
echo  ============================================================
echo    JobShield - one-click setup
echo  ============================================================
echo    Installs everything JobShield needs, then opens the site.
echo    First run downloads ~4 GB (mostly the reasoning model) and
echo    can take 10-30 minutes. Later runs start in seconds.
echo  ============================================================
echo.

set "OLLAMA_MODEL=qwen3.5:4b"
set "HAS_WINGET=0"
where winget >nul 2>nul && set "HAS_WINGET=1"

rem ------------------------------------------------------------------
rem 0. Machine checks (warnings only - setup continues either way)
rem ------------------------------------------------------------------
for /f %%G in ('powershell -NoProfile -Command "[math]::Floor((Get-PSDrive -Name ((Get-Location).Drive.Name)).Free/1GB)"') do set "FREE_GB=%%G"
if defined FREE_GB if !FREE_GB! LSS 10 (
    echo  [WARN] Only !FREE_GB! GB free on this drive. JobShield needs about 8 GB ^(packages + AI model^).
)
for /f %%G in ('powershell -NoProfile -Command "[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB)"') do set "RAM_GB=%%G"
if defined RAM_GB if !RAM_GB! LSS 8 (
    echo  [WARN] This PC has !RAM_GB! GB of RAM. The reasoning model works best with 8 GB or more;
    echo         checks will still run, just more slowly.
)

rem ------------------------------------------------------------------
rem 1. Python 3.10 - 3.13
rem ------------------------------------------------------------------
call :find_python
if not defined PY (
    echo [1/7] Python not found - installing Python 3.12...
    if "%HAS_WINGET%"=="1" (
        winget install -e --id Python.Python.3.12 --scope user --silent --accept-package-agreements --accept-source-agreements
    ) else (
        echo       Downloading the Python installer...
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing https://www.python.org/ftp/python/3.12.10/python-3.12.10-amd64.exe -OutFile $env:TEMP\python-setup.exe"
        "%TEMP%\python-setup.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_launcher=1
    )
    call :find_python
)
if not defined PY (
    echo.
    echo  [ERROR] Python could not be installed automatically.
    echo  Install Python 3.12 from https://www.python.org/downloads/ ^(tick "Add python.exe to PATH"^),
    echo  then double-click setup.bat again.
    pause
    exit /b 1
)
echo [1/7] Python ............ OK  (!PY!)

rem ------------------------------------------------------------------
rem 2. Node.js 20+
rem ------------------------------------------------------------------
call :find_node
if not defined NODE_OK (
    echo [2/7] Node.js not found - installing Node.js LTS...
    if "%HAS_WINGET%"=="1" (
        winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    ) else (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing https://nodejs.org/dist/v22.20.0/node-v22.20.0-x64.msi -OutFile $env:TEMP\node-setup.msi"
        msiexec /i "%TEMP%\node-setup.msi" /qn
    )
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    call :find_node
)
if not defined NODE_OK (
    echo.
    echo  [ERROR] Node.js could not be installed automatically.
    echo  Install Node.js 22 LTS from https://nodejs.org/ then double-click setup.bat again.
    pause
    exit /b 1
)
echo [2/7] Node.js ........... OK

rem The AI libraries (onnxruntime) need the Microsoft Visual C++ runtime.
if not exist "%SystemRoot%\System32\vcruntime140_1.dll" (
    echo       Installing the Microsoft Visual C++ runtime...
    if "%HAS_WINGET%"=="1" (
        winget install -e --id Microsoft.VCRedist.2015+.x64 --silent --accept-package-agreements --accept-source-agreements >nul 2>nul
    ) else (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing https://aka.ms/vs/17/release/vc_redist.x64.exe -OutFile $env:TEMP\vc_redist.x64.exe"
        "%TEMP%\vc_redist.x64.exe" /install /quiet /norestart
    )
)

rem ------------------------------------------------------------------
rem 3. Python packages (analysis service)
rem ------------------------------------------------------------------
if not exist "ai_service\.venv\Scripts\python.exe" (
    echo [3/7] Creating Python environment...
    !PY! -m venv ai_service\.venv
    if errorlevel 1 (
        echo  [ERROR] Could not create the Python environment.
        pause
        exit /b 1
    )
)
set "VPY=ai_service\.venv\Scripts\python.exe"
rem Slow or unstable connections: wait longer per read, retry each file, and
rem keep finished downloads in pip's cache so a retry resumes, not restarts.
set "PIP_DEFAULT_TIMEOUT=120"
set "PIP_RETRIES=10"
set "PIP_DISABLE_PIP_VERSION_CHECK=1"
echo [3/7] Installing Python packages ^(~280 MB the first time - progress is shown below^)...
call :pip_install --upgrade pip
call :pip_install -r ai_service\requirements.txt
if errorlevel 1 (
    echo.
    echo  [ERROR] Python packages could not be downloaded after 3 attempts.
    echo          Your connection to pypi.org is timing out. Check your internet
    echo          ^(or try another network / turn off VPN^), then run start.bat again -
    echo          everything already downloaded is kept, so it continues where it stopped.
    pause
    exit /b 1
)
echo       Installing the headless browser used for JavaScript-heavy job sites...
"%VPY%" -m playwright install chromium
if errorlevel 1 "%VPY%" -m playwright install chromium
if errorlevel 1 echo       [WARN] Browser download failed - most job sites still work without it.
echo [3/7] Python packages ... OK

rem ------------------------------------------------------------------
rem 4. Node packages (web app + API)
rem ------------------------------------------------------------------
echo [4/7] Installing web app packages...
pushd backend
call :npm_install
if errorlevel 1 (
    popd
    echo  [ERROR] Backend package installation failed.
    pause
    exit /b 1
)
echo       Downloading the embedded database ^(first run only^)...
call node -e "require('mongodb-memory-server').MongoBinary.getPath().then(()=>process.exit(0)).catch(()=>process.exit(0))"
popd
pushd frontend
call :npm_install
if errorlevel 1 (
    popd
    echo  [ERROR] Frontend package installation failed.
    pause
    exit /b 1
)
echo       Building the website...
call npm run build --silent
if errorlevel 1 (
    popd
    echo  [ERROR] The website failed to build.
    pause
    exit /b 1
)
popd
echo [4/7] Web app ........... OK

rem ------------------------------------------------------------------
rem 5. Ollama (local reasoning engine)
rem ------------------------------------------------------------------
call :find_ollama
if not defined OLLAMA (
    echo [5/7] Installing Ollama ^(local AI runtime^)...
    if "%HAS_WINGET%"=="1" (
        winget install -e --id Ollama.Ollama --silent --accept-package-agreements --accept-source-agreements
    )
    call :find_ollama
)
if not defined OLLAMA (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing https://ollama.com/download/OllamaSetup.exe -OutFile $env:TEMP\OllamaSetup.exe"
    "%TEMP%\OllamaSetup.exe" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART
    call :find_ollama
)
if not defined OLLAMA (
    echo  [WARN] Ollama could not be installed. JobShield will still work, without the reasoning engine.
    echo         Install it later from https://ollama.com/download and run setup.bat again.
    goto :after_ollama
)
echo [5/7] Ollama ............ OK

rem Start the Ollama server if it isn't already running.
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://localhost:11434/api/version -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    start "" /B "!OLLAMA!" serve >nul 2>nul
    timeout /t 5 /nobreak >nul
)

rem ------------------------------------------------------------------
rem 6. Reasoning model
rem ------------------------------------------------------------------
echo [6/7] Downloading the reasoning model %OLLAMA_MODEL% ^(~3 GB, first run only^)...
set "MODEL_OK="
for /L %%A in (1,1,3) do (
    if not defined MODEL_OK (
        "!OLLAMA!" pull %OLLAMA_MODEL% && set "MODEL_OK=1"
        if not defined MODEL_OK (
            echo       Download interrupted - resuming in 10 seconds ^(attempt %%A of 3^)...
            timeout /t 10 /nobreak >nul
        )
    )
)
if defined MODEL_OK (
    echo [6/7] Reasoning model ... OK
) else (
    echo  [WARN] Model download did not finish. JobShield works without it, and start.bat
    echo         will keep downloading it in the background next time.
)

:after_ollama
rem ------------------------------------------------------------------
rem 7. Launch
rem ------------------------------------------------------------------
rem start.bat skips setup on later runs once this marker exists.
echo installed> ".jobshield-installed"
echo [7/7] Starting JobShield...
echo.
"%VPY%" launch.py
exit /b %errorlevel%


rem ==================================================================
rem Helpers
rem ==================================================================
:pip_install
for /L %%A in (1,1,3) do (
    "%VPY%" -m pip install %* --prefer-binary --progress-bar on && exit /b 0
    echo       Network problem talking to pypi.org - retrying in 15 seconds ^(attempt %%A of 3^)...
    timeout /t 15 /nobreak >nul
)
exit /b 1

:npm_install
for /L %%A in (1,1,3) do (
    call npm install --no-audit --no-fund --loglevel=error --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-timeout=300000 && exit /b 0
    echo       Network problem talking to npm - retrying in 15 seconds ^(attempt %%A of 3^)...
    timeout /t 15 /nobreak >nul
)
exit /b 1

:find_python
set "PY="
for %%V in (3.12 3.13 3.11 3.10) do (
    if not defined PY (
        py -%%V -c "import sys" >nul 2>nul && set "PY=py -%%V"
    )
)
if not defined PY (
    for %%P in ("%LOCALAPPDATA%\Programs\Python\Python312\python.exe" "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" "%LOCALAPPDATA%\Programs\Python\Python311\python.exe") do (
        rem Keep the quotes: the path may contain spaces.
        if not defined PY if exist %%P set PY="%%~P"
    )
)
if not defined PY (
    python -c "import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] <= (3,13) else 1)" >nul 2>nul && set "PY=python"
)
exit /b 0

:find_node
set "NODE_OK="
node -e "process.exit(parseInt(process.versions.node) >= 20 ? 0 : 1)" >nul 2>nul && set "NODE_OK=1"
exit /b 0

:find_ollama
set "OLLAMA="
where ollama >nul 2>nul && set "OLLAMA=ollama"
if not defined OLLAMA if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "OLLAMA=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
exit /b 0

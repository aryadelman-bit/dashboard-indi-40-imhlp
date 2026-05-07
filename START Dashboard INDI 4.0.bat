@echo off
setlocal
title Dashboard INDI 4.0

cd /d "%~dp0"

set "SERVER_HOST=0.0.0.0"
set "APP_HOST=127.0.0.1"
set "PORT=5173"
set "APP_URL=http://%APP_HOST%:%PORT%/"
set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "LOCAL_PNPM=%~dp0.codex-tools\pnpm\package\bin\pnpm.cjs"
set "VITE_JS=%~dp0node_modules\vite\bin\vite.js"

echo.
echo ==================================================
echo  Dashboard Monitoring SA INDI 4.0
echo ==================================================
echo  Folder : %CD%
echo  URL Lokal    : %APP_URL%
echo  Server Host  : %SERVER_HOST%:%PORT%
echo.

if exist "%BUNDLED_NODE%" (
  set "NODE_EXE=%BUNDLED_NODE%"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo ERROR: Node.js tidak ditemukan.
    echo Install Node.js terlebih dahulu, atau jalankan dari lingkungan Codex yang memiliki bundled Node.
    echo.
    pause
    exit /b 1
  )
  set "NODE_EXE=node"
)

if not exist "%VITE_JS%" (
  echo Dependency belum terpasang. Mencoba install package...
  if exist "%LOCAL_PNPM%" (
    "%NODE_EXE%" "%LOCAL_PNPM%" install
  ) else (
    where npm >nul 2>nul
    if errorlevel 1 (
      echo ERROR: node_modules belum ada dan npm/pnpm tidak ditemukan.
      echo Jalankan npm install atau pnpm install terlebih dahulu.
      echo.
      pause
      exit /b 1
    )
    npm install
  )
)

if not exist "%VITE_JS%" (
  echo ERROR: Vite belum ditemukan setelah proses install.
  echo.
  pause
  exit /b 1
)

echo Membuka aplikasi di browser...
start "" "%APP_URL%"

echo Menjalankan server Vite. Biarkan jendela ini tetap terbuka.
echo Tekan Ctrl+C untuk menghentikan server.
echo.
"%NODE_EXE%" "%VITE_JS%" --host %SERVER_HOST% --port %PORT%

pause

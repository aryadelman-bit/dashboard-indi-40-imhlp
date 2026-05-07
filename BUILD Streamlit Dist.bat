@echo off
setlocal
title Build Dashboard INDI 4.0 untuk Streamlit

cd /d "%~dp0"

set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "LOCAL_PNPM=%~dp0.codex-tools\pnpm\package\bin\pnpm.cjs"

echo.
echo ==================================================
echo  Build Dashboard INDI 4.0 untuk Streamlit
echo ==================================================
echo.

if exist "%BUNDLED_NODE%" (
  set "NODE_EXE=%BUNDLED_NODE%"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo ERROR: Node.js tidak ditemukan.
    pause
    exit /b 1
  )
  set "NODE_EXE=node"
)

if exist "%LOCAL_PNPM%" (
  "%NODE_EXE%" "%LOCAL_PNPM%" install
  if errorlevel 1 exit /b 1
  "%NODE_EXE%" "%LOCAL_PNPM%" run build
) else (
  where npm >nul 2>nul
  if errorlevel 1 (
    echo ERROR: pnpm lokal dan npm tidak ditemukan.
    pause
    exit /b 1
  )
  npm install
  if errorlevel 1 exit /b 1
  npm run build
)

echo.
echo Build selesai. Commit folder dist/ bersama streamlit_app.py dan requirements.txt.
pause

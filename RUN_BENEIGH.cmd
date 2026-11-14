@echo off
setlocal
title Beneigh Public Preview Installer
cd /d "%~dp0"

echo ==================================================
echo   Beneigh Public Preview - Installer and Launcher
echo ==================================================
echo.
echo This window will stay open. Please do not close it.
echo.

if not exist "%~dp0scripts\start-public-preview.ps1" (
  echo ERROR: Required installer file was not found.
  echo Please extract the complete ZIP file before running this launcher.
  echo.
  pause
  exit /b 2
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-public-preview.ps1"
set "beneighExitCode=%errorlevel%"

echo.
if not "%beneighExitCode%"=="0" (
  echo Beneigh did not start successfully. Error code: %beneighExitCode%
  echo Please send Beneigh-startup.log and a screenshot of this window.
) else (
  echo Beneigh has stopped normally.
)
echo.
echo Press any key to close this window.
pause >nul
exit /b %beneighExitCode%

@echo off
setlocal
title Beneigh Cloudflare Deployment
cd /d "%~dp0"

echo ==================================================
echo   Beneigh Cloudflare Cloud Deployment
echo ==================================================
echo.
echo This uploads Beneigh to Cloudflare. It does not run the website on this PC.
echo Keep this window open until a public workers.dev address is displayed.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-beneigh-cloudflare.ps1"
set "beneighExitCode=%errorlevel%"

echo.
if not "%beneighExitCode%"=="0" (
  echo Deployment did not finish. Please send Beneigh-cloud-deploy.log and a screenshot.
) else (
  echo Beneigh was deployed successfully.
)
echo.
echo Press any key to close this window.
pause >nul
exit /b %beneighExitCode%

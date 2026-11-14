$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

try {
  Start-Transcript -Path "$projectRoot\Beneigh-startup.log" -Append | Out-Null
} catch {}

function Stop-WithMessage([string]$message) {
  Write-Host ""
  Write-Host $message -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Beneigh Local Site and Public Preview" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js was not found. Installing Node.js LTS..." -ForegroundColor Yellow
  $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
  if ($winget) {
    & winget.exe install --id OpenJS.NodeJS.LTS --exact --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
      Stop-WithMessage "Node.js installation did not complete. Allow the Windows installation prompt or install Node.js LTS manually."
    }
  } else {
    Write-Host "Windows Package Manager is unavailable. Downloading Node.js LTS directly from nodejs.org..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    try {
      $releases = Invoke-RestMethod -Uri "https://nodejs.org/dist/index.json" -UseBasicParsing
      $release = $releases | Where-Object { $_.lts -and ($_.files -contains "win-x64-msi") } | Select-Object -First 1
      if (-not $release) { throw "No Windows x64 LTS installer was found." }
      $nodeVersion = $release.version
      $nodeInstaller = Join-Path $env:TEMP "beneigh-node-lts-x64.msi"
      $nodeInstallerUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-x64.msi"
      Invoke-WebRequest -Uri $nodeInstallerUrl -OutFile $nodeInstaller -UseBasicParsing
      Write-Host "Windows may ask for permission. Select Yes to install Node.js." -ForegroundColor Yellow
      $nodeSetup = Start-Process -FilePath "msiexec.exe" -Verb RunAs -ArgumentList "/i", "`"$nodeInstaller`"", "/qn", "/norestart" -Wait -PassThru
      if (($nodeSetup.ExitCode -ne 0) -and ($nodeSetup.ExitCode -ne 3010)) {
        throw "Node.js installer returned error code $($nodeSetup.ExitCode)."
      }
    } catch {
      Start-Process "https://nodejs.org/en/download"
      Stop-WithMessage "Automatic Node.js installation failed: $($_.Exception.Message). Install Node.js LTS from the opened page, then run RUN_BENEIGH.cmd again."
    }
  }

  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machinePath;$userPath"
  if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    Stop-WithMessage "Node.js is installed, but Windows has not refreshed the environment. Close this window and run RUN_BENEIGH.cmd again."
  }
  Write-Host "Node.js LTS is ready." -ForegroundColor Green
}

if (-not (Test-Path "$projectRoot\node_modules\.bin\vite.cmd")) {
  Write-Host "Installing website components. The first run may take several minutes..." -ForegroundColor Yellow
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Website component installation failed. Check the Internet connection and try again." }
}

if (-not (Test-Path "$projectRoot\.dev.vars")) {
  $ownerPassword = "BeN-" + ([guid]::NewGuid().ToString("N").Substring(0,16)) + "!9a"
  $staffPassword = "Staff-" + ([guid]::NewGuid().ToString("N").Substring(0,14)) + "!8b"
  $sessionSecret = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
  @"
ADMIN_USERNAME=beneigh_admin
ADMIN_PASSWORD=$ownerPassword
SESSION_SECRET=$sessionSecret
STAFF_USERNAME=beneigh_staff
STAFF_PASSWORD=$staffPassword
RESEND_API_KEY=
EMAIL_FROM=
"@ | Set-Content -Path "$projectRoot\.dev.vars" -Encoding UTF8
}

Write-Host "Initializing the local database..." -ForegroundColor Yellow
$env:CI = "1"
$migrationCommand = "npx.cmd wrangler d1 migrations apply DB --local --config wrangler.local.jsonc"
$migrationProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/d", "/s", "/c", $migrationCommand -NoNewWindow -Wait -PassThru
if ($migrationProcess.ExitCode -ne 0) {
  Write-Host "An older local database was detected. It will be backed up before rebuilding the demo database..." -ForegroundColor Yellow
  if (Test-Path "$projectRoot\.wrangler\state") {
    $backupName = "state-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss")
    Move-Item "$projectRoot\.wrangler\state" "$projectRoot\.wrangler\$backupName"
  }
  $migrationRetry = Start-Process -FilePath "cmd.exe" -ArgumentList "/d", "/s", "/c", $migrationCommand -NoNewWindow -Wait -PassThru
  if ($migrationRetry.ExitCode -ne 0) { Stop-WithMessage "Local database initialization failed." }
}

$selectedPort = $null
foreach ($candidatePort in 8768..8799) {
  $portProbe = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $candidatePort)
  try {
    $portProbe.Start()
    $selectedPort = $candidatePort
    $portProbe.Stop()
    break
  } catch {
    try { $portProbe.Stop() } catch {}
  }
}

if (-not $selectedPort) {
  Stop-WithMessage "No available local port was found between 8768 and 8799. Close older Beneigh windows and try again."
}

$previewValues = @{}
Get-Content "$projectRoot\.dev.vars" | ForEach-Object {
  if ($_ -match '^([^#=]+)=(.*)$') { $previewValues[$matches[1]] = $matches[2] }
}

@"
Beneigh Local Preview Accounts

Admin portal: http://127.0.0.1:$selectedPort/manage-portal-7x
Owner username: $($previewValues['ADMIN_USERNAME'])
Owner password: $($previewValues['ADMIN_PASSWORD'])

Staff username: $($previewValues['STAFF_USERNAME'])
Staff password: $($previewValues['STAFF_PASSWORD'])

Keep these passwords private.
"@ | Set-Content -Path "$projectRoot\local-preview-accounts.txt" -Encoding UTF8
Write-Host "Local preview accounts were saved to local-preview-accounts.txt" -ForegroundColor Green
Write-Host "Using available local port: $selectedPort" -ForegroundColor Green

$serverCommand = "title Beneigh Local Website && cd /d `"$projectRoot`" && npx vite --host 127.0.0.1 --port $selectedPort --strictPort"
$server = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $serverCommand -PassThru

Write-Host "Starting the Beneigh website..." -ForegroundColor Yellow
$ready = $false
for ($attempt = 0; $attempt -lt 60; $attempt++) {
  Start-Sleep -Seconds 1
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$selectedPort/review" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { $ready = $true; break }
  } catch {}
}

if (-not $ready) {
  Stop-WithMessage "Beneigh could not start on port $selectedPort. Review the separate Beneigh Local Website window and send its complete error text."
}

Start-Process "http://127.0.0.1:$selectedPort/review"
Write-Host "Local preview is ready: http://127.0.0.1:$selectedPort/review" -ForegroundColor Green

$cloudflared = "$projectRoot\cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
  Write-Host "Downloading the Cloudflare temporary tunnel tool..." -ForegroundColor Yellow
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cloudflared -UseBasicParsing
}

Write-Host ""
Write-Host "Creating the public preview address. Please wait..." -ForegroundColor Yellow
Write-Host "Keep both windows open. Closing this window will stop public access." -ForegroundColor Yellow
$opened = $false

try {
  & $cloudflared tunnel --url "http://127.0.0.1:$selectedPort" 2>&1 | ForEach-Object {
    $line = $_.ToString()
    Write-Host $line
    if (-not $opened -and $line -match "https://[a-z0-9-]+\.trycloudflare\.com") {
      $publicUrl = $matches[0] + "/review"
      $publicUrl | Set-Content -Path "$projectRoot\public-preview-url.txt" -Encoding ASCII
      Write-Host ""
      Write-Host "PUBLIC PREVIEW URL: $publicUrl" -ForegroundColor Green
      Write-Host "The URL was saved to public-preview-url.txt" -ForegroundColor Green
      Start-Process $publicUrl
      $opened = $true
    }
  }
} finally {
  & taskkill.exe /PID $server.Id /T /F 2>$null | Out-Null
}

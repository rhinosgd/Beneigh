$ErrorActionPreference = "Stop"
$deployRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $deployRoot

try {
  Start-Transcript -Path "$deployRoot\Beneigh-cloud-deploy.log" -Append | Out-Null
} catch {}

function Stop-WithMessage([string]$message) {
  Write-Host ""
  Write-Host $message -ForegroundColor Red
  try { Stop-Transcript | Out-Null } catch {}
  exit 1
}

function Run-Cmd([string]$command, [string]$failureMessage) {
  & $env:ComSpec /d /s /c $command
  if ($LASTEXITCODE -ne 0) { Stop-WithMessage $failureMessage }
}

Write-Host "Step 1 of 6: Checking deployment tools..." -ForegroundColor Cyan
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
  Stop-WithMessage "Node.js was not found. Install Node.js LTS, then run this file again."
}

if (-not (Test-Path "$deployRoot\node_modules\.bin\wrangler.cmd")) {
  Write-Host "Installing the Cloudflare uploader. This may take a few minutes..." -ForegroundColor Yellow
  Run-Cmd "npm.cmd install" "The Cloudflare uploader could not be installed. Check the Internet connection and try again."
}

Write-Host "Step 2 of 6: Connecting to your Cloudflare account..." -ForegroundColor Cyan
Write-Host "A browser page will open. Select your Cloudflare account and approve access." -ForegroundColor Yellow
Run-Cmd "npx.cmd wrangler login" "Cloudflare login was not completed. Run this file again and approve the browser login."

Write-Host "Step 3 of 6: Preparing the cloud database..." -ForegroundColor Cyan
$configText = Get-Content "$deployRoot\wrangler.jsonc" -Raw
if ($configText -notmatch 'database_id') {
  Run-Cmd "npx.cmd wrangler d1 create beneigh-preview-db --location apac --binding DB --update-config --config wrangler.jsonc" "The Beneigh cloud database could not be created."
}

Write-Host "Step 4 of 6: Preparing optional image storage..." -ForegroundColor Cyan
$configText = Get-Content "$deployRoot\wrangler.jsonc" -Raw
if ($configText -notmatch 'bucket_name') {
  & $env:ComSpec /d /s /c "npx.cmd wrangler r2 bucket create beneigh-preview-media --location apac --binding BUCKET --update-config --config wrangler.jsonc"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Image storage was not enabled. The website, bookings, messages, and admin area can still be previewed." -ForegroundColor Yellow
  }
}

Write-Host "Step 5 of 6: Creating preview accounts and database tables..." -ForegroundColor Cyan
$ownerPassword = "BeN-" + ([guid]::NewGuid().ToString("N").Substring(0,16)) + "!9a"
$staffPassword = "Staff-" + ([guid]::NewGuid().ToString("N").Substring(0,14)) + "!8b"
$sessionSecret = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
$secrets = @{
  ADMIN_USERNAME = "beneigh_admin"
  ADMIN_PASSWORD = $ownerPassword
  STAFF_USERNAME = "beneigh_staff"
  STAFF_PASSWORD = $staffPassword
  SESSION_SECRET = $sessionSecret
} | ConvertTo-Json
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText("$deployRoot\.beneigh-secrets.json", $secrets, $utf8NoBom)
$env:CI = "1"
Run-Cmd "npx.cmd wrangler d1 migrations apply DB --remote --config wrangler.jsonc" "The cloud database tables could not be created."

Write-Host "Step 6 of 6: Uploading Beneigh to Cloudflare..." -ForegroundColor Cyan
& $env:ComSpec /d /s /c "npx.cmd wrangler deploy --config wrangler.jsonc --secrets-file .beneigh-secrets.json > deployment-output.txt 2>&1"
$deployExitCode = $LASTEXITCODE
$deployOutput = Get-Content "$deployRoot\deployment-output.txt" -Raw
Write-Host $deployOutput
if ($deployExitCode -ne 0) { Stop-WithMessage "Cloudflare could not publish Beneigh. Review the error above." }

$urlMatch = [regex]::Match($deployOutput, 'https://[a-zA-Z0-9.-]+\.workers\.dev')
if (-not $urlMatch.Success) {
  Stop-WithMessage "Cloudflare reported success, but the public address could not be detected. Send Beneigh-cloud-deploy.log for review."
}

$siteUrl = $urlMatch.Value.TrimEnd('/')
$reviewUrl = $siteUrl + "/review"
@"
Beneigh Cloud Preview

Customer review: $reviewUrl
Website: $siteUrl
Admin portal: $siteUrl/manage-portal-7x

Owner username: beneigh_admin
Owner password: $ownerPassword

Staff username: beneigh_staff
Staff password: $staffPassword

Keep these passwords private.
"@ | Set-Content -Path "$deployRoot\Beneigh-cloud-address-and-accounts.txt" -Encoding UTF8

Remove-Item "$deployRoot\.beneigh-secrets.json" -Force -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "BENEIGH PUBLIC PREVIEW: $reviewUrl" -ForegroundColor Green
Write-Host "The address and accounts were saved to Beneigh-cloud-address-and-accounts.txt" -ForegroundColor Green
Start-Process $reviewUrl
try { Stop-Transcript | Out-Null } catch {}
exit 0

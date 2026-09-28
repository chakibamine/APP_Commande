<#
  Déploie le build présent dans le dépôt (backend/dist, frontend/dist) vers
  <Root>\<Environment>\releases\<horodatage-sha>, applique les migrations Prisma,
  bascule le lien <Root>\<Environment>\current puis recharge l'application PM2.
  En cas d'échec du contrôle de santé, revient à la release précédente.
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('staging', 'prod')]
  [string]$Environment,
  [string]$Root = 'C:\apps\bgi',
  [int]$Keep = 3
)

$ErrorActionPreference = 'Stop'
if (-not $env:PM2_HOME) { $env:PM2_HOME = 'C:\ProgramData\pm2\home' }
$env:BGI_ROOT = $Root

$repo = Split-Path $PSScriptRoot -Parent
$envRoot = Join-Path $Root $Environment
$envFile = Join-Path $envRoot '.env'
$current = Join-Path $envRoot 'current'
$releases = Join-Path $envRoot 'releases'
$appName = "bgi-$Environment"
$ecosystem = Join-Path $PSScriptRoot 'ecosystem.config.js'

function Invoke-Native([string]$Label, [scriptblock]$Block) {
  Write-Host "==> $Label"
  $global:LASTEXITCODE = 0
  & $Block
  if ($LASTEXITCODE -ne 0) { throw "$Label a échoué (code $LASTEXITCODE)" }
}

function Read-EnvValue([string]$Name) {
  $line = Get-Content $envFile | Where-Object { $_ -match "^\s*$Name\s*=" } | Select-Object -First 1
  if (-not $line) { return $null }
  return ($line -replace "^\s*$Name\s*=\s*", '').Trim().Trim('"')
}

function Copy-Tree([string]$From, [string]$To) {
  robocopy $From $To /E /NFL /NDL /NJH /NJS /NP /R:2 /W:1 | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "Copie de $From impossible (robocopy $LASTEXITCODE)" }
  $global:LASTEXITCODE = 0
}

function Set-Current([string]$Target) {
  if (Test-Path $current) { cmd /c rmdir "$current" | Out-Null }
  cmd /c mklink /J "$current" "$Target" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Lien $current -> $Target impossible" }
}

function Test-Health([int]$Port) {
  for ($i = 1; $i -le 15; $i++) {
    Start-Sleep -Seconds 2
    try {
      $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/produits?limit=1" -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -eq 200) { return $true }
    } catch {
      Write-Host "   santé $i/15 : $($_.Exception.Message)"
    }
  }
  return $false
}

if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
  throw 'pm2 introuvable dans le PATH du runner (voir deploy/README.md).'
}
if (-not (Test-Path $envFile)) { throw "Fichier $envFile manquant sur le serveur." }
foreach ($required in 'backend\dist\src\main.js', 'frontend\dist\index.html') {
  if (-not (Test-Path (Join-Path $repo $required))) { throw "$required absent : lancer le build avant." }
}

$databaseUrl = Read-EnvValue 'DATABASE_URL'
if (-not $databaseUrl) { throw "DATABASE_URL absent de $envFile" }
$port = [int](Read-EnvValue 'PORT')
if (-not $port) { throw "PORT absent de $envFile" }

$sha = (git -C $repo rev-parse --short HEAD).Trim()
$release = Join-Path $releases ("{0}-{1}" -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $sha)
$previous = if (Test-Path $current) { (Get-Item $current).Target | Select-Object -First 1 } else { $null }

New-Item -ItemType Directory -Force -Path $release, (Join-Path $envRoot 'logs') | Out-Null

Invoke-Native 'Migrations Prisma' {
  Push-Location (Join-Path $repo 'backend')
  try {
    $env:DATABASE_URL = $databaseUrl
    npx prisma migrate deploy
  } finally {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    Pop-Location
  }
}

Write-Host "==> Copie vers $release"
Copy-Tree (Join-Path $repo 'backend\dist') (Join-Path $release 'dist')
Copy-Tree (Join-Path $repo 'backend\node_modules') (Join-Path $release 'node_modules')
Copy-Tree (Join-Path $repo 'backend\prisma') (Join-Path $release 'prisma')
Copy-Tree (Join-Path $repo 'frontend\dist') (Join-Path $release 'public')
Copy-Item (Join-Path $repo 'backend\package.json') $release
Copy-Item $envFile (Join-Path $release '.env')

Write-Host "==> Bascule $current"
Set-Current $release
Invoke-Native "PM2 $appName" { pm2 startOrReload $ecosystem --only $appName --update-env }

Write-Host "==> Contrôle de santé sur le port $port"
if (-not (Test-Health $port)) {
  if ($previous) {
    Write-Warning "Échec : retour à $previous"
    Set-Current $previous
    pm2 startOrReload $ecosystem --only $appName --update-env | Out-Null
  }
  throw "L'application $appName ne répond pas sur le port $port."
}

pm2 save | Out-Null

Get-ChildItem $releases -Directory |
  Sort-Object Name -Descending |
  Select-Object -Skip $Keep |
  Where-Object { $_.FullName -ne $release } |
  ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }

Write-Host "Déployé : $appName ($sha) sur http://localhost:$port"

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$zipPath = Join-Path $env:USERPROFILE 'Desktop\InOut-deploy.zip'

Set-Location $root
npm run build
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$root\build\*" -DestinationPath $zipPath -Force
Write-Host "Created $zipPath"

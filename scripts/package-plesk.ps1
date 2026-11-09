param([string]$OutputPath)
$ErrorActionPreference = 'Stop'
$sourceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputRoot = Split-Path $sourceRoot
if (-not $OutputPath) { $OutputPath = Join-Path $outputRoot 'sael-site-cms-ai-plesk.zip' }
$zipPath = [System.IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $zipPath) { throw "Archive already exists. Choose a new OutputPath: $zipPath" }
$buildRoot = Join-Path $outputRoot ('sael-cms-package-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$appRoot = Join-Path $buildRoot 'sael-site'
$publicRoot = Join-Path $appRoot 'public'
New-Item -ItemType Directory -Path (Join-Path $publicRoot 'admin') -Force | Out-Null
$privateFiles = @('server.js','cms-server.js','cms-setup.js','cms-seed.json','assistant-server.js','assistant-ai.js','assistant-knowledge.js','assistant-config.js','package.json','package-lock.json','.env.example','README.md','DEPLOY_PLESK.md','RELEASE_CHECK.md','ADMIN_GUIDE.md','ASSISTANT_GUIDE.md')
$publicFiles = @('index.html','about.html','service.html','page.html','styles.css','about.css','service-details.css','cms-public.css','app.js','about-content.js','service-content.js','price-translations.js','cms-client.js','assistant-client.js','assistant.css')
foreach ($file in $privateFiles) { Copy-Item -LiteralPath (Join-Path $sourceRoot $file) -Destination (Join-Path $appRoot $file) }
foreach ($file in $publicFiles) { Copy-Item -LiteralPath (Join-Path $sourceRoot $file) -Destination (Join-Path $publicRoot $file) }
Copy-Item -LiteralPath (Join-Path $sourceRoot 'admin.html') -Destination (Join-Path $publicRoot 'admin/index.html')
Copy-Item -LiteralPath (Join-Path $sourceRoot 'admin.css') -Destination (Join-Path $publicRoot 'admin/admin.css')
Copy-Item -LiteralPath (Join-Path $sourceRoot 'admin.js') -Destination (Join-Path $publicRoot 'admin/admin.js')
Copy-Item -LiteralPath (Join-Path $sourceRoot 'assets') -Destination $publicRoot -Recurse
Copy-Item -LiteralPath (Join-Path $sourceRoot 'tests') -Destination $appRoot -Recurse
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($appRoot,$zipPath,[System.IO.Compression.CompressionLevel]::Optimal,$true)
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try { $entries = @($archive.Entries | ForEach-Object { $_.FullName }) } finally { $archive.Dispose() }
if ($entries | Where-Object { $_ -match '(^|/)(node_modules|\.git|data|\.env)(/|$)' }) { throw 'Unexpected runtime/private data in archive' }
if (-not ($entries -contains 'sael-site/.env.example')) { throw 'Missing environment example' }
if ($entries | Where-Object { $_ -match '^sael-site/public/(cms-server\.js|cms-seed\.json|server\.js|package\.json|\.env)' }) { throw 'Server configuration under public' }
[PSCustomObject]@{Zip=$zipPath;Stage=$appRoot;Entries=$entries.Count;Bytes=(Get-Item -LiteralPath $zipPath).Length;SHA256=(Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash} | ConvertTo-Json

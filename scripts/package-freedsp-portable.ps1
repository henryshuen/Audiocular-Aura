param([string]$OutputDirectory = '../AuraPEQ-FreeDSP-releases', [switch]$SkipFrontendBuild)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repo
$version = 'v0.1.1'
$name = "AuraPEQ-FreeDSP-$version-win-x64"
$out = if ([IO.Path]::IsPathRooted($OutputDirectory)) { [IO.Path]::GetFullPath($OutputDirectory) } else { [IO.Path]::GetFullPath((Join-Path $repo $OutputDirectory)) }
if ($out -eq $repo -or $out -eq [IO.Path]::GetPathRoot($out)) { throw 'Use a separate artifact output directory.' }
New-Item -ItemType Directory -Path $out -Force | Out-Null
$stage = Join-Path $out ('.build-' + [Guid]::NewGuid().ToString('N'))
$package = Join-Path $stage $name
New-Item -ItemType Directory -Path $package -Force | Out-Null
try {
    if (-not $SkipFrontendBuild) {
        & npm.cmd ci --ignore-scripts --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
    }
    if (-not [IO.File]::ReadAllText((Join-Path $repo 'dist/assets/index.js')).Contains('__AURAPEQ_PORTABLE__')) { throw 'Rebuild the frontend; portable cache isolation marker is missing.' }
    & dotnet publish tools/freedsp-portable/AuraPEQ.Portable.csproj -c Release -r win-x64 --self-contained true --source https://api.nuget.org/v3/index.json --artifacts-path (Join-Path $stage 'build') -o (Join-Path $stage 'publish') -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:PublishTrimmed=false -p:EnableSingleFileAnalyzer=false -p:DebugType=None -p:DebugSymbols=false -p:RuntimeFrameworkVersion=10.0.12 --nologo
    if ($LASTEXITCODE -ne 0) { throw 'Self-contained Windows publish failed.' }
    Copy-Item -LiteralPath (Join-Path $stage 'publish/AuraPEQ.Portable.exe') -Destination (Join-Path $package 'Start AuraPEQ FreeDSP Edition.exe')
    $www = Join-Path $package 'www'
    New-Item -ItemType Directory -Path $www | Out-Null
    Copy-Item -LiteralPath 'dist/assets' -Destination $www -Recurse
    Copy-Item -LiteralPath 'dist/index.html' -Destination $www
    foreach ($file in @('manifest.json','icon-192.png','icon-512.png')) { Copy-Item -LiteralPath (Join-Path 'dist' $file) -Destination $www }
    # Production-only edition marker. Keep existing presets/settings at the same origin.
    $html = [IO.File]::ReadAllText((Join-Path $www 'index.html'))
    $bootstrap = '<script>window.__AURAPEQ_PORTABLE__="v0.1.1";if(!localStorage.getItem("aura_lang"))localStorage.setItem("aura_lang","en");if("serviceWorker" in navigator)navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.filter(r=>r.scope===location.origin+"/").map(r=>r.unregister()))).catch(console.error);</script>'
    [IO.File]::WriteAllText((Join-Path $www 'index.html'), $html.Replace('<head>', '<head>' + $bootstrap), [Text.UTF8Encoding]::new($false))
    # Retire the old cache worker on this loopback origin without clearing localStorage.
    [IO.File]::WriteAllText((Join-Path $www 'sw.js'), "self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil((async()=>{await self.clients.claim();for(const k of await caches.keys())if(k.startsWith('aurapeq-cache-'))await caches.delete(k);await self.registration.unregister();for(const c of await self.clients.matchAll({type:'window'}))await c.navigate(c.url);})()));", [Text.UTF8Encoding]::new($false))
    Copy-Item -LiteralPath 'README.md' -Destination (Join-Path $package 'USER_GUIDE.md')
    New-Item -ItemType Directory -Path (Join-Path $package 'docs') | Out-Null
    Copy-Item -LiteralPath 'docs/images' -Destination (Join-Path $package 'docs') -Recurse
    Copy-Item -LiteralPath 'LICENSE' -Destination (Join-Path $package 'LICENSE')
    Copy-Item -LiteralPath 'docs/PORTABLE_QUICK_START.md' -Destination (Join-Path $package 'README.md')
    Copy-Item -LiteralPath 'docs/PORTABLE_ACKNOWLEDGMENTS.md' -Destination (Join-Path $package 'ACKNOWLEDGMENTS.md')
    Copy-Item -LiteralPath 'docs/RELEASE_NOTES_FREEDSP_V0_1_1.md' -Destination (Join-Path $package 'RELEASE_NOTES.md')
    Copy-Item -LiteralPath 'LICENSE' -Destination (Join-Path $package 'LICENSE.txt')
    $globalPackages = ((& dotnet nuget locals global-packages --list) -replace '^global-packages:\s*','').Trim()
    $notices = Join-Path $package 'RUNTIME-NOTICES'
    New-Item -ItemType Directory -Path $notices | Out-Null
    foreach ($runtime in @('microsoft.netcore.app.runtime.win-x64','microsoft.aspnetcore.app.runtime.win-x64')) {
        foreach ($notice in @('LICENSE.txt','THIRD-PARTY-NOTICES.TXT')) {
            Copy-Item -LiteralPath (Join-Path $globalPackages "$runtime/10.0.12/$notice") -Destination (Join-Path $notices "$runtime-$notice")
        }
    }
    # Include corresponding buildable source rather than relying on a future source URL.
    $source = Join-Path $stage 'source'
    New-Item -ItemType Directory -Path $source | Out-Null
    # SOURCE.zip must itself be buildable without .git metadata or Git installed.
    $paths = Get-Content -LiteralPath 'scripts/freedsp/source-files.txt' | Where-Object { $_ -and -not $_.StartsWith('#') }
    foreach ($path in $paths) {
        if ($path -match '\.(?:log|bundle)$|(?:JOURNAL|ProvenancePrivate)|(?:^|/)(?:DECISIONS|DONE|GENERAL|ROADMAP)\.md$') { throw "Private packaging input: $path" }
        if ($path -notmatch '^(src/|scripts/|tests/|public/|tools/freedsp-native/|tools/freedsp-portable/|docs/images/|docs/PORTABLE_|docs/RELEASE_NOTES_FREEDSP_|package(?:-lock)?\.json$|tsconfig.*\.json$|vitest\.config\.ts$|vite\.config\.ts$|index\.html$|LICENSE$|README\.md$|\.gitignore$)') { continue }
        if ($path -match '(^|/)\.\.?/|^[A-Za-z]:|^/') { throw "Unsafe source path: $path" }
        $dest = Join-Path $source $path
        New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force | Out-Null
        Copy-Item -LiteralPath $path -Destination $dest
    }
    Compress-Archive -Path (Join-Path $source '*') -DestinationPath (Join-Path $package 'SOURCE.zip') -CompressionLevel Optimal
    $assets = [ordered]@{}
    Get-ChildItem -LiteralPath $www -Recurse -File | Sort-Object FullName | ForEach-Object {
        $relative = $_.FullName.Substring($www.Length + 1).Replace('\','/')
        $assets[$relative] = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    }
    $baseline = 'corresponding source archive'
    if ((Test-Path -LiteralPath '.git') -and (Get-Command git -ErrorAction SilentlyContinue)) { $baseline = & git rev-parse HEAD }
    $manifest = [ordered]@{version=$version;runtime='win-x64';dotnet='10.0.12';sdk=(& dotnet --version);baseline=$baseline;assets=$assets}
    [IO.File]::WriteAllText((Join-Path $package 'package-manifest.json'), ($manifest | ConvertTo-Json -Depth 4), [Text.UTF8Encoding]::new($false))
    $zip = Join-Path $out ($name + '.zip')
    Compress-Archive -LiteralPath $package -DestinationPath $zip -CompressionLevel Optimal -Force
    $hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
    [IO.File]::WriteAllText(($zip + '.sha256'), "$hash  $([IO.Path]::GetFileName($zip))`n", [Text.UTF8Encoding]::new($false))
    Write-Host "ZIP: $zip"
    Write-Host "SHA256: $hash"
} finally {
    $resolved = [IO.Path]::GetFullPath($stage)
    if (-not $resolved.StartsWith($out + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFileName($resolved) -notlike '.build-*') { throw 'Unexpected build path; cleanup stopped.' }
    Remove-Item -LiteralPath $resolved -Recurse -Force
}

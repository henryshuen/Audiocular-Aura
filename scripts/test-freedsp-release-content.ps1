param([string]$Zip = '../AuraPEQ-FreeDSP-releases/AuraPEQ-FreeDSP-v0.1.0-freedsp-preview-win-x64.zip')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$repo = (Get-Location).Path
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Zip).Path)
$checks = 0
function Assert($value, $message) { if (-not $value) { throw $message }; $script:checks++; Write-Host "[PASS] $message" }
function Bytes($entry) {
    if (-not $entry) { throw 'Required archive entry missing.' }
    $stream = $entry.Open(); $memory = [IO.MemoryStream]::new()
    try { $stream.CopyTo($memory); return ,$memory.ToArray() } finally { $stream.Dispose(); $memory.Dispose() }
}
function Hash([byte[]]$data) { return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($data)) }
try {
    $prefix = 'AuraPEQ-FreeDSP-v0.1.0-freedsp-preview-win-x64/'
    $entries = @{}; foreach ($entry in $archive.Entries) { $entries[$entry.FullName.Replace('\','/')] = $entry }
    $manifest = [Text.Encoding]::UTF8.GetString((Bytes $entries[($prefix + 'package-manifest.json')])) | ConvertFrom-Json
    Assert ($manifest.baseline -eq (& git rev-parse HEAD)) 'Manifest targets final committed HEAD.'
    Assert (-not (& git status --porcelain --untracked-files=normal)) 'Source worktree is clean before final artifact audit.'
    foreach ($pair in @(@('README.md','docs/PORTABLE_QUICK_START.md'), @('USER_GUIDE.md','README.md'), @('LICENSE','LICENSE'), @('LICENSE.txt','LICENSE'), @('ACKNOWLEDGMENTS.md','docs/PORTABLE_ACKNOWLEDGMENTS.md'), @('RELEASE_NOTES.md','docs/RELEASE_NOTES_FREEDSP_PREVIEW.md'))) {
        Assert ((Hash (Bytes $entries[($prefix + $pair[0])])) -eq (Get-FileHash -LiteralPath $pair[1]).Hash) "Packaged $($pair[0]) matches source."
    }
    foreach ($name in @('freedsp-origin.png','freedsp-eq-a.png','freedsp-eq-b.png')) {
        Assert ((Hash (Bytes $entries[($prefix + 'docs/images/' + $name)])) -eq (Get-FileHash -LiteralPath ('docs/images/' + $name)).Hash) "Approved screenshot $name matches."
    }
    foreach ($runtime in @('microsoft.netcore.app.runtime.win-x64','microsoft.aspnetcore.app.runtime.win-x64')) {
        foreach ($notice in @('LICENSE.txt','THIRD-PARTY-NOTICES.TXT')) {
            Assert ((Bytes $entries[($prefix + "RUNTIME-NOTICES/$runtime-$notice")]).Length -gt 100) "$runtime $notice included."
        }
    }
    $sourceData = [IO.MemoryStream]::new((Bytes $entries[($prefix + 'SOURCE.zip')]))
    $source = [IO.Compression.ZipArchive]::new($sourceData,[IO.Compression.ZipArchiveMode]::Read)
    try {
        $sourcePaths = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
        foreach ($entry in $source.Entries) {
            $path = $entry.FullName.Replace('\','/'); if ($path.EndsWith('/')) { continue }
            Assert (-not ($path -match '(^|/)\.\.?/|^/|^[A-Za-z]:')) "Safe source path $path."
            $file = Join-Path $repo $path
            Assert ((Test-Path -LiteralPath $file -PathType Leaf) -and (Hash (Bytes $entry)) -eq (Get-FileHash -LiteralPath $file).Hash) "Corresponding source $path matches HEAD worktree."
            $sourcePaths.Add($path) | Out-Null
        }
        foreach ($directory in @('src','scripts','tests','public','tools/freedsp-native','tools/freedsp-portable','docs/images')) {
            foreach ($file in Get-ChildItem -LiteralPath $directory -File -Recurse) {
                $relative = $file.FullName.Substring($repo.Length + 1).Replace('\','/')
                if ($relative -match '/(?:bin|obj)/|\.(?:exe|dll|pdb|nupkg)$') { continue }
                Assert ($sourcePaths.Contains($relative)) "Source archive includes $relative."
            }
        }
        Assert ($sourcePaths.Contains('README.md') -and $sourcePaths.Contains('LICENSE') -and $sourcePaths.Contains('package-lock.json')) 'Source includes build inputs and GPL license.'
    } finally { $source.Dispose(); $sourceData.Dispose() }
    $readme = [IO.File]::ReadAllText((Join-Path $repo 'README.md'))
    foreach ($m in [regex]::Matches($readme, '(?:src="|\]\()([^"\)]+)')) {
        $link = $m.Groups[1].Value; if ($link -match '^https?://|^#') { continue }
        Assert (Test-Path -LiteralPath (Join-Path $repo $link)) "Local README link $link exists."
    }
    foreach ($line in [IO.File]::ReadAllLines((Join-Path $repo 'tests/freedsp/fixtures/freeDspReleasePreset.txt'))) {
        Assert ($readme.Contains($line)) 'README exact reference preset line matches tested fixture.'
    }
    $actualHash = (Get-FileHash -LiteralPath $Zip).Hash
    $checksum = [IO.File]::ReadAllText((Resolve-Path -LiteralPath ($Zip + '.sha256')).Path).Split(' ')[0]
    Assert ($actualHash -eq $checksum) 'ZIP SHA-256 matches accompanying checksum.'
    $receipt = [ordered]@{commit=$manifest.baseline;zip=(Resolve-Path -LiteralPath $Zip).Path;sha256=$actualHash;checks=$checks;sourceFiles=$sourcePaths.Count;hardwareOperations='NONE';publication='NOT EXECUTED'}
    [IO.File]::WriteAllText((Join-Path (Split-Path -Parent $receipt.zip) 'release-content-audit.json'), ($receipt | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
    Write-Host "Release content checks: $checks PASS. No hardware operations."
} finally { $archive.Dispose() }

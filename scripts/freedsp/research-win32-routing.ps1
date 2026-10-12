param([switch]$QueryWire2)
$ErrorActionPreference = 'Stop'
if ($args.Count) { throw 'Only -QueryWire2 is accepted; default is offline tests.' }
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$captureDir = Join-Path $projectRoot ('.tmp/architecture-routing-' + [guid]::NewGuid().ToString('N'))
$artifacts = Join-Path $captureDir 'build'
New-Item -ItemType Directory -Path $captureDir -Force | Out-Null
$dotnetPath = (Get-Command dotnet.exe -ErrorAction Stop).Source
& $dotnetPath build (Join-Path $projectRoot 'tools/freedsp-transport-research/TransportResearch.csproj') -c Release --artifacts-path $artifacts --nologo --verbosity quiet
if ($LASTEXITCODE) { throw 'Build failed; no device access.' }
$dll = Join-Path $artifacts 'bin/TransportResearch/release/TransportResearch.dll'
if (-not $QueryWire2) {
    Push-Location $projectRoot
    try { & $dotnetPath $dll offline-tests; if ($LASTEXITCODE) { throw 'Offline research checks failed.' } }
    finally { Pop-Location }
    return
}
# This opt-in branch is a native control experiment, NEVER browser-only proof.
# Do not run concurrently with the dev bridge or another CAF diagnostic.
if (Get-NetTCPConnection -LocalPort 5174 -State Listen -ErrorAction SilentlyContinue) {
    throw 'Bridge is active; STOP. No device query started.'
}
Write-Host 'NATIVE CONTROL ONLY: one fixed446/path0/wire2 Output, prearmed ReadFile; one control GET only after stream timeout. No EQ writes or retry.'
$info = New-Object Diagnostics.ProcessStartInfo
$info.FileName = $dotnetPath
$info.Arguments = '"' + $dll + '" fixed446Wire2'
$info.WorkingDirectory = $projectRoot
$info.UseShellExecute = $false
$info.CreateNoWindow = $true
$info.RedirectStandardOutput = $true
$info.RedirectStandardError = $true
$child = New-Object Diagnostics.Process
$child.StartInfo = $info
$started = $false
try {
    $started = $child.Start()
    if (-not $started) { throw 'Owned research child did not start.' }
    $stdout = $child.StandardOutput.ReadToEndAsync()
    $stderr = $child.StandardError.ReadToEndAsync()
    if (-not $child.WaitForExit(10000)) {
        $child.Kill() # Only this exact Process object, never a process-name sweep.
        $child.WaitForExit(2000) | Out-Null
        [IO.File]::WriteAllText((Join-Path $captureDir 'timeout.txt'), 'HARD DEADLINE: completion unknown; no retry. Not browser PASS.')
        throw '10-second owned-process deadline; synchronous control GET may be incomplete. No retry.'
    }
    [IO.File]::WriteAllText((Join-Path $captureDir 'routing.json'), $stdout.GetAwaiter().GetResult())
    [IO.File]::WriteAllText((Join-Path $captureDir 'routing.stderr'), $stderr.GetAwaiter().GetResult())
    Write-Host ('Native evidence only: ' + $captureDir)
    if ($child.ExitCode) { throw ('Research STOP; exit=' + $child.ExitCode) }
}
finally {
    if ($started -and -not $child.HasExited) { $child.Kill(); $child.WaitForExit(2000) | Out-Null }
    $child.Dispose()
}

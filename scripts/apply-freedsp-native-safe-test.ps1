$ErrorActionPreference = 'Stop'
if ($args.Count -ne 0) { throw 'No parameters allowed; this script exposes ApplySafeRamTest only.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
$project = Join-Path $projectRoot 'tools\freedsp-native\FreeDspQuery.csproj'
$dll = Join-Path $projectRoot 'tools\freedsp-native\bin\Release\net10.0\FreeDspQuery.dll'
$dotnetCommand = Get-Command dotnet.exe -ErrorAction Stop
Write-Host 'Building FreeDSP native ApplySafeRamTest (.NET 10 SDK required; no external packages)...'
& $dotnetCommand.Source build $project --configuration Release --nologo --verbosity quiet
if ($LASTEXITCODE -ne 0) { throw 'Native build failed; no hardware query started.' }
$start = New-Object System.Diagnostics.ProcessStartInfo
$start.FileName = $dotnetCommand.Source
$start.Arguments = '"' + $dll + '" ApplySafeRamTest'
$start.WorkingDirectory = $projectRoot
$start.UseShellExecute = $false
$start.CreateNoWindow = $true
$start.RedirectStandardOutput = $true
$start.RedirectStandardError = $true
$child = New-Object System.Diagnostics.Process
$child.StartInfo = $start
$childStarted = $false
try {
    $childStarted = $child.Start()
    if (-not $childStarted) { throw 'Could not start ApplySafeRamTest.' }
    $clock = [System.Diagnostics.Stopwatch]::StartNew()
    $stdoutLine = $child.StandardOutput.ReadLineAsync()
    $stderrLine = $child.StandardError.ReadLineAsync()
    $timedOut = $false
    # Pump logs only. The helper is launched once; this loop sends no reports.
    while ($true) {
        if ($null -ne $stdoutLine -and $stdoutLine.IsCompleted) {
            $line = $stdoutLine.GetAwaiter().GetResult()
            if ($null -eq $line) { $stdoutLine = $null }
            else { Write-Host $line; $stdoutLine = $child.StandardOutput.ReadLineAsync() }
        }
        if ($null -ne $stderrLine -and $stderrLine.IsCompleted) {
            $line = $stderrLine.GetAwaiter().GetResult()
            if ($null -eq $line) { $stderrLine = $null }
            else { Write-Host $line; $stderrLine = $child.StandardError.ReadLineAsync() }
        }
        if (-not $timedOut -and $clock.ElapsedMilliseconds -ge 30000 -and -not $child.HasExited) {
            $timedOut = $true
            try { $child.Kill() } catch { if (-not $child.HasExited) { throw } }
            $child.WaitForExit(2000) | Out-Null
        }
        if ($child.HasExited -and $null -eq $stdoutLine -and $null -eq $stderrLine) { break }
        if ($timedOut -and $clock.ElapsedMilliseconds -ge 32000) { break }
        Start-Sleep -Milliseconds 10
    }
    if ($timedOut) {
        Write-Host 'RESULT: NATIVE CALL TIMEOUT / COMPLETION UNKNOWN; process stopped, no retry.'
        Write-Host 'Paste ALL output above; timeout does not prove DSP rejection.'
        exit 6
    }
    $resultCode = $child.ExitCode
    Write-Host 'Paste the ENTIRE output from Building/FreeDSP Native CAF Query through RESULT.'
    exit $resultCode
} finally {
    if ($childStarted -and -not $child.HasExited) { $child.Kill() }
    $child.Dispose()
}

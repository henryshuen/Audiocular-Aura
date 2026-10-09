$ErrorActionPreference = 'Stop'
if ($args.Count -ne 0) { throw 'No parameters: fixed read-only evidence queries only.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
$captureDir = Join-Path ([IO.Path]::GetTempPath()) ('AuraPEQ\readback-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $captureDir -Force | Out-Null
$buildDir = Join-Path $captureDir 'helper'
$logPath = Join-Path $captureDir 'readback.log'
$jsonPath = Join-Path $captureDir 'readback.json'
$dotnetPath = (Get-Command dotnet.exe -ErrorAction Stop).Source
Write-Host 'Stop the AuraPEQ dev server and close other CAF diagnostics before running this capture.'
Write-Host 'READ ONLY: 346[62],477[wire1..9],446[path0,wire1..9]. No EQ/mode/reset writes.'
& $dotnetPath build (Join-Path $projectRoot 'tools\freedsp-native\FreeDspQuery.csproj') -c Release -o $buildDir --nologo --verbosity quiet
if ($LASTEXITCODE -ne 0) { throw 'Build failed; no device query started.' }
$info = New-Object System.Diagnostics.ProcessStartInfo
$info.FileName = $dotnetPath
$info.Arguments = '"' + (Join-Path $buildDir 'FreeDspQuery.dll') + '" readEqEvidence'
$info.WorkingDirectory = $projectRoot
$info.UseShellExecute = $false
$info.CreateNoWindow = $true
$info.RedirectStandardOutput = $true
$info.RedirectStandardError = $true
$child = New-Object System.Diagnostics.Process
$child.StartInfo = $info
$started = $false
$lines = New-Object 'System.Collections.Generic.List[string]'
$resultCode = 6
try {
    $started = $child.Start()
    if (-not $started) { throw 'Could not start owned readback process.' }
    $clock = [Diagnostics.Stopwatch]::StartNew()
    $stdout = $child.StandardOutput.ReadLineAsync()
    $stderr = $child.StandardError.ReadLineAsync()
    while ($true) {
        foreach ($streamName in @('stdout', 'stderr')) {
            $pending = Get-Variable -Name $streamName -ValueOnly
            if ($null -ne $pending -and $pending.IsCompleted) {
                $line = $pending.GetAwaiter().GetResult()
                if ($null -eq $line) { Set-Variable -Name $streamName -Value $null }
                else {
                    Write-Host $line
                    $lines.Add($line)
                    if ($line.StartsWith('READBACK_EVIDENCE_JSON=')) {
                        [IO.File]::WriteAllText($jsonPath, $line.Substring('READBACK_EVIDENCE_JSON='.Length))
                    }
                    $reader = if ($streamName -eq 'stdout') { $child.StandardOutput } else { $child.StandardError }
                    Set-Variable -Name $streamName -Value ($reader.ReadLineAsync())
                }
            }
        }
        if ($child.HasExited -and $null -eq $stdout -and $null -eq $stderr) { $resultCode = $child.ExitCode; break }
        if ($clock.ElapsedMilliseconds -ge 30000) {
            if (-not $child.HasExited) { $child.Kill(); $child.WaitForExit(2000) | Out-Null }
            $lines.Add('TIMEOUT: completion unknown; no retry. Capture may be partial; no JSON means incomplete.')
            break
        }
        Start-Sleep -Milliseconds 5
    }
} finally {
    if ($started -and -not $child.HasExited) { $child.Kill() }
    $child.Dispose()
    [IO.File]::WriteAllLines($logPath, $lines)
    Write-Host "Full log: $logPath"
    if (Test-Path -LiteralPath $jsonPath) { Write-Host "Evidence JSON: $jsonPath" }
    Write-Host 'Query completion is NOT verified Device EQ; preserve both files and compare with the official App.'
}
exit $resultCode

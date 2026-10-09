$ErrorActionPreference = 'Stop'
if ($args.Count -ne 0) { throw 'No parameters: fixed nine446/path0 plus nine477 only.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
$captureDir = Join-Path ([IO.Path]::GetTempPath()) ('AuraPEQ\nine-eq-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $captureDir -Force | Out-Null
$buildDir = Join-Path $captureDir 'helper'
$logPath = Join-Path $captureDir 'nine-eq.log'
$jsonPath = Join-Path $captureDir 'nine-eq.json'
$dotnetPath = (Get-Command dotnet.exe -ErrorAction Stop).Source
Write-Host 'Stop the AuraPEQ dev server and close other CAF diagnostics before running this capture.'
Write-Host 'READ ONLY: 446 path0/wire1..9 then477 band1..9; max18 SET; bounded GET-only waiting. No EQ/mode/reset writes.'
& $dotnetPath build (Join-Path $projectRoot 'tools\freedsp-native\FreeDspQuery.csproj') -c Release -o $buildDir --nologo --verbosity quiet
if ($LASTEXITCODE -ne 0) { throw 'Build failed; no device query started.' }
$info = New-Object System.Diagnostics.ProcessStartInfo
$info.FileName = $dotnetPath
$info.Arguments = '"' + (Join-Path $buildDir 'FreeDspQuery.dll') + '" pollNineEq'
$info.WorkingDirectory = $projectRoot
$info.UseShellExecute = $false
$info.CreateNoWindow = $true
$info.RedirectStandardOutput = $true
$info.RedirectStandardError = $true
$child = New-Object System.Diagnostics.Process
$child.StartInfo = $info
$started = $false
$resultCode = 6
$partialPath = Join-Path $captureDir 'nine-eq.partial.json'
$records = New-Object 'System.Collections.Generic.List[object]'
$queryContext = $null
$observations = New-Object 'System.Collections.Generic.List[object]'
$logWriter = New-Object IO.StreamWriter($logPath, $false)
$logWriter.AutoFlush = $true
try {
    $started = $child.Start()
    if (-not $started) { throw 'Could not start owned readback process.' }
    $clock = [Diagnostics.Stopwatch]::StartNew()
    $stdout = $child.StandardOutput.ReadLineAsync()
    $stderr = $child.StandardError.ReadLineAsync()
    while ($true) {
        foreach ($streamName in @('stdout', 'stderr')) {
            $pending = Get-Variable -Name $streamName -ValueOnly
            $drained = 0
            while ($null -ne $pending -and $pending.IsCompleted -and $drained -lt 64) {
                $drained++
                $line = $pending.GetAwaiter().GetResult()
                if ($null -eq $line) { Set-Variable -Name $streamName -Value $null }
                else {
                    Write-Host $line
                    $logWriter.WriteLine($line)
                    if ($line.StartsWith('NINE_QUERY_JSON=')) { $queryContext = $line.Substring('NINE_QUERY_JSON='.Length) | ConvertFrom-Json }
                    if ($line.StartsWith('NINE_RECORD_JSON=')) { $records.Add(($line.Substring('NINE_RECORD_JSON='.Length) | ConvertFrom-Json)) }
                    if ($line.StartsWith('WIRE2_OBSERVATION_JSON=')) {
                        $observations.Add(@{ query = $queryContext; observation = ($line.Substring('WIRE2_OBSERVATION_JSON='.Length) | ConvertFrom-Json) })
                        $partial = @{ schemaVersion = 1; outcome = 'INCOMPLETE'; freshnessVerified = $false; productionEligible = $false; records = @($records.ToArray()); observations = @($observations.ToArray()) }
                        [IO.File]::WriteAllText($partialPath, ($partial | ConvertTo-Json -Depth 10))
                    }
                    if ($line.StartsWith('NINE_POLL_JSON=')) {
                        [IO.File]::WriteAllText($jsonPath, $line.Substring('NINE_POLL_JSON='.Length))
                    }
                    $reader = if ($streamName -eq 'stdout') { $child.StandardOutput } else { $child.StandardError }
                    Set-Variable -Name $streamName -Value ($reader.ReadLineAsync())
                }
                $pending = Get-Variable -Name $streamName -ValueOnly
            }
        }
        if ($child.HasExited -and $null -eq $stdout -and $null -eq $stderr) { $resultCode = $child.ExitCode; break }
        if ($clock.ElapsedMilliseconds -ge 45000) {
            if (-not $child.HasExited) { $child.Kill(); $child.WaitForExit(2000) | Out-Null }
            $logWriter.WriteLine('TIMEOUT: completion unknown; owned child stopped, no SET retry; JSON may be partial.')
            break
        }
        Start-Sleep -Milliseconds 5
    }
} finally {
    if ($started -and -not $child.HasExited) { $child.Kill() }
    $child.Dispose()
    $logWriter.Dispose()
    Write-Host "Full log: $logPath"
    if (Test-Path -LiteralPath $partialPath) { Write-Host "Partial observations (never PASS): $partialPath" }
    if (Test-Path -LiteralPath $jsonPath) { Write-Host "Evidence JSON: $jsonPath" }
    Write-Host 'A matching frame is NOT freshness/source/full Readback PASS. Preserve log, final/partial JSON; do not automatically repeat.'
}
exit $resultCode

Set-StrictMode -Version Latest

function Read-FreeDspChoice {
    param([scriptblock]$ReadAnswer, [scriptblock]$Emit, [string]$Prompt, [string[]]$Allowed)
    while ($true) {
        & $Emit ('PROMPT: ' + $Prompt)
        $answer = (& $ReadAnswer $Prompt)
        if ($null -eq $answer) { $answer = 'Q' } # EOF/cancel is never an implicit ENTER.
        $answer = ([string]$answer).Trim().ToUpperInvariant()
        & $Emit ('ANSWER: ' + $(if ($answer -eq '') { '<ENTER>' } else { $answer }))
        if ($answer -in $Allowed) { return $answer }
        & $Emit 'Invalid choice; no command sent. Use the displayed choices.'
    }
}

function Get-FreeDspSummary {
    param($Results, [string]$LogPath, [string]$StopReason, [int]$ActiveBand)
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('==================================================')
    $lines.Add('M2L BAND MAP SUMMARY')
    $lines.Add('Filter: PK400Hz / -12dB / Q1.0; selector0; current rate from matching346')
    $lines.Add('SDK0 -> wire5: PREVIOUSLY VERIFIED (M2K), not retested')
    foreach ($r in $Results) {
        $lines.Add('')
        $lines.Add(('SDK{0} -> wire{1}:' -f $r.SdkBand, $r.Wire))
        $lines.Add('Protocol Apply: ' + $r.ProtocolApply)
        $lines.Add('Audible Apply: ' + $r.AudibleApply)
        $lines.Add('Protocol Restore: ' + $r.ProtocolRestore)
        $lines.Add('Audible Restore: ' + $r.AudibleRestore)
        $classification = 'NOT TESTED / PENDING'
        if ($r.ProtocolApply -eq 'FAIL' -or $r.ProtocolRestore -eq 'FAIL') { $classification = 'FAILED / REVIEW REQUIRED' }
        elseif ($r.ProtocolApply -eq 'PASS' -and $r.ProtocolRestore -eq 'PASS') {
            if ($r.AudibleApply -eq 'YES' -and $r.AudibleRestore -eq 'YES') { $classification = 'VERIFIED' }
            elseif ($r.AudibleApply -eq 'NO') { $classification = 'PROTOCOL-ONLY / NO AUDIBLE CHANGE / REVIEW REQUIRED' }
            else { $classification = 'PROTOCOL-ONLY / AUDIBLE UNCONFIRMED / REVIEW REQUIRED' }
        }
        elseif ($r.ProtocolApply -eq 'PASS') { $classification = 'APPLIED / RESTORE UNCONFIRMED / REVIEW REQUIRED' }
        $lines.Add(('RESULT wire{0}: {1}' -f $r.Wire, $classification))
    }
    $lines.Add('')
    $lines.Add('RESULT: ' + $(if ($StopReason) { 'STOPPED FOR REVIEW: ' + $StopReason } else { 'COMPLETED' }))
    if ($ActiveBand -gt 0) { $lines.Add("WARNING: wire$ActiveBand may still have the test filter; no automatic restore or retry was sent.") }
    $allClear = @($Results | Where-Object {
        $_.ProtocolApply -ne 'PASS' -or $_.ProtocolRestore -ne 'PASS' -or $_.AudibleApply -ne 'YES' -or $_.AudibleRestore -ne 'YES'
    }).Count -eq 0
    $lines.Add($(if ($allClear) { 'Paste only this summary; all four bands passed protocol and audible reversal.' }
        else { 'Paste this summary plus relevant SDK/wire APPLY/RESTORE log sections for failed, uncertain, contradictory or differing results.' }))
    $lines.Add('Full log saved to:')
    $lines.Add($LogPath)
    $lines.Add('==================================================')
    return $lines.ToArray()
}

# RunProtocol and ReadAnswer are dependency seams for offline mocks, not script/CLI parameters.
function Invoke-FreeDspBandValidation {
    param([scriptblock]$RunProtocol, [scriptblock]$ReadAnswer, [scriptblock]$Emit, [string]$LogPath)
    $results = @(1..4 | ForEach-Object { [pscustomobject]@{
        SdkBand = $_; Wire = $_ + 5; ProtocolApply = 'NOT RUN'; AudibleApply = 'NOT TESTED';
        ProtocolRestore = 'NOT RUN'; AudibleRestore = 'NOT TESTED'
    } })
    $stopReason = ''; $activeBand = 0
    try {
        & $Emit 'FreeDSP M2L Remaining Band Validation; SDK0/wire5 VERIFIED in M2K, not retested.'
        & $Emit 'Testing SDK1/wire6, SDK2/wire7, SDK3/wire8, SDK4/wire9, one at a time.'
        & $Emit 'Safety: APO OFF; Windows output=FreeDSP; initial volume1-2/100; FIRST APPLY with IEM OUT OF EARS.'
        & $Emit 'Familiar music, no tone; SAME song and SAME comparison volume; no Flash/90/220.'
        & $Emit 'Sudden loudness/noise/distortion/imbalance/disconnect: STOP immediately. Q at prompts; Ctrl+C during a command.'
        & $Emit 'Q never auto-restores; if already applied, the test band may remain active. Do not retry or test later bands.'
        foreach ($r in $results) {
            & $Emit ("=== Test {0}/4: SDK{0} -> wire{1} ===" -f $r.SdkBand, $r.Wire)
            $answer = Read-FreeDspChoice $ReadAnswer $Emit 'Press ENTER to APPLY (Q to abort).' @('', 'Q')
            if ($answer -eq 'Q') { $stopReason = "Aborted before SDK$($r.SdkBand) Apply"; break }
            $activeBand = $r.Wire # A partial/failed write cannot be assumed harmless.
            $marker = "SDK$($r.SdkBand) / wire$($r.Wire) APPLY"
            & $Emit "===== $marker BEGIN ====="
            try {
                $code = & $RunProtocol $r.SdkBand $false $Emit
                if ($null -eq $code -or $code -isnot [int]) { throw 'Protocol runner returned no valid exit code' }
                $r.ProtocolApply = $(if ($code -eq 0) { 'PASS' } else { 'FAIL' })
            } catch { $r.ProtocolApply = 'FAIL'; & $Emit ('ERROR: ' + $_.Exception.Message) }
            finally { & $Emit "===== $marker END =====" }
            if ($r.ProtocolApply -ne 'PASS') { $stopReason = "Apply protocol failure: $marker; do not listen, restore or continue"; break }
            if ($r.SdkBand -eq 1) { & $Emit 'Protocol success: only if no abnormal output, wear IEM and listen at low volume; adjust slightly if needed, then keep comparison volume fixed.' }
            $answer = Read-FreeDspChoice $ReadAnswer $Emit 'Listen: did sound clearly change? ENTER=yes; N=no; S=subtle/uncertain; Q=abort.' @('', 'N', 'S', 'Q')
            $r.AudibleApply = switch ($answer) { '' { 'YES' } 'N' { 'NO' } 'S' { 'UNCERTAIN' } 'Q' { 'ABORTED' } }
            if ($answer -eq 'Q') { $stopReason = "Aborted after wire$($r.Wire) Apply; include both log sections, especially for abnormal audio"; break }
            $answer = Read-FreeDspChoice $ReadAnswer $Emit 'Press ENTER to RESTORE the SAME band (Q to abort).' @('', 'Q')
            if ($answer -eq 'Q') { $stopReason = "Aborted before wire$($r.Wire) Restore"; break }
            $marker = "SDK$($r.SdkBand) / wire$($r.Wire) RESTORE"
            & $Emit "===== $marker BEGIN ====="
            try {
                $code = & $RunProtocol $r.SdkBand $true $Emit
                if ($null -eq $code -or $code -isnot [int]) { throw 'Protocol runner returned no valid exit code' }
                $r.ProtocolRestore = $(if ($code -eq 0) { 'PASS' } else { 'FAIL' })
            } catch { $r.ProtocolRestore = 'FAIL'; & $Emit ('ERROR: ' + $_.Exception.Message) }
            finally { & $Emit "===== $marker END =====" }
            if ($r.ProtocolRestore -ne 'PASS') { $stopReason = "Restore protocol failure: $marker; do not continue"; break }
            $activeBand = 0
            $answer = Read-FreeDspChoice $ReadAnswer $Emit 'SAME song/volume: did sound return? ENTER=yes; N=no; P=partial/uncertain; Q=abort.' @('', 'N', 'P', 'Q')
            $r.AudibleRestore = switch ($answer) { '' { 'YES' } 'N' { 'NO' } 'P' { 'PARTIAL/UNCERTAIN' } 'Q' { 'ABORTED' } }
            if ($answer -ne '') { $stopReason = "wire$($r.Wire) audible restoration not confirmed; stop before next band"; break }
        }
    } catch { $stopReason = 'Interrupted/error: ' + $_.Exception.Message }
    finally {
        foreach ($line in (Get-FreeDspSummary $results $LogPath $stopReason $activeBand)) { & $Emit $line }
    }
    return [pscustomobject]@{ Results = $results; StopReason = $stopReason; ActiveBand = $activeBand }
}

function Invoke-FreeDspNativeCommand {
    param([string]$Dotnet, [string]$Dll,
        [ValidateSet('ApplyRemainingBand1','RestoreRemainingBand1','ApplyRemainingBand2','RestoreRemainingBand2',
            'ApplyRemainingBand3','RestoreRemainingBand3','ApplyRemainingBand4','RestoreRemainingBand4')][string]$Operation,
        [scriptblock]$Emit)
    $start = [System.Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $Dotnet; $start.Arguments = '"' + $Dll + '" ' + $Operation
    $start.UseShellExecute = $false; $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true; $start.RedirectStandardError = $true
    $child = [System.Diagnostics.Process]::new(); $child.StartInfo = $start
    $started = $false
    try {
        $started = $child.Start()
        if (-not $started) { throw 'Native helper failed to start' }
        $clock = [System.Diagnostics.Stopwatch]::StartNew()
        $stdout = $child.StandardOutput.ReadLineAsync(); $stderr = $child.StandardError.ReadLineAsync()
        $timeout = $false
        while ($true) {
            if ($null -ne $stdout -and $stdout.IsCompleted) {
                $line = $stdout.GetAwaiter().GetResult()
                if ($null -eq $line) { $stdout = $null }
                else { & $Emit $line; $stdout = $child.StandardOutput.ReadLineAsync() }
            }
            if ($null -ne $stderr -and $stderr.IsCompleted) {
                $line = $stderr.GetAwaiter().GetResult()
                if ($null -eq $line) { $stderr = $null }
                else { & $Emit ('STDERR: ' + $line); $stderr = $child.StandardError.ReadLineAsync() }
            }
            if (-not $timeout -and $clock.ElapsedMilliseconds -ge 30000 -and -not $child.HasExited) {
                $timeout = $true
                try { $child.Kill() } catch { if (-not $child.HasExited) { throw } }
                $null = $child.WaitForExit(2000)
            }
            if ($child.HasExited -and $null -eq $stdout -and $null -eq $stderr) { break }
            if ($timeout -and $clock.ElapsedMilliseconds -ge 32000) { break }
            Start-Sleep -Milliseconds 5
        }
        if ($timeout) { & $Emit 'RESULT: NATIVE CALL TIMEOUT / COMPLETION UNKNOWN; no retry'; return 6 }
        return [int]$child.ExitCode
    } finally {
        if ($started -and -not $child.HasExited) { $child.Kill() }
        $child.Dispose()
    }
}

Export-ModuleMember -Function Invoke-FreeDspBandValidation, Get-FreeDspSummary, Invoke-FreeDspNativeCommand
